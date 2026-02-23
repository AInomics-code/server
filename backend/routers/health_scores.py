from fastapi import APIRouter, HTTPException, Depends, Response
from pydantic import BaseModel
from datetime import datetime, timedelta, date
import asyncio
import json
import asyncpg
import redis.asyncio as aioredis

from auth.dependencies import get_current_user
from models.user import UserResponse
from config import get_settings

router = APIRouter()
settings = get_settings()

CACHE_KEY = "health_scores:latest"
CACHE_TTL = 6 * 60 * 60  # 6 hours

# ---------------------------------------------------------------------------
# Singleton pool and Redis client — created once, reused across all requests
# ---------------------------------------------------------------------------

_db_pool: asyncpg.Pool | None = None
_redis_client: aioredis.Redis | None = None


async def _get_db_pool() -> asyncpg.Pool:
    global _db_pool
    if _db_pool is None or _db_pool._closed:
        _db_pool = await asyncpg.create_pool(
            host=settings.client_data_host,
            port=settings.client_data_port,
            user=settings.client_data_user,
            password=settings.client_data_password,
            database=settings.client_data_db,
            min_size=2,
            max_size=10,
        )
    return _db_pool


async def _get_redis() -> aioredis.Redis:
    global _redis_client
    if _redis_client is None:
        url = f"redis://{settings.redis_host}:{settings.redis_port}"
        kwargs: dict = {"decode_responses": True}
        if settings.redis_password:
            kwargs["password"] = settings.redis_password
        _redis_client = await aioredis.from_url(url, **kwargs)
    return _redis_client


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class InventoryScoreBreakdown(BaseModel):
    stock_availability: float       # D1 – 30% weight
    rotation_quality: float         # D2 – 25% weight
    reorder_management: float       # D3 – 20% weight
    profitability: float            # D4 – 15% weight
    active_product_coverage: float  # D5 – 10% weight


class SalesScoreBreakdown(BaseModel):
    seller_goal_attainment: float   # D1 – 30% weight
    client_portfolio_rfm: float     # D2 – 25% weight
    fulfillment_efficiency: float   # D3 – 20% weight
    product_dynamics_bcg: float     # D4 – 15% weight
    overall_profitability: float    # D5 – 10% weight


class InventoryHealthScore(BaseModel):
    score: float
    label: str
    period: str
    breakdown: InventoryScoreBreakdown
    inputs: dict


class SalesHealthScore(BaseModel):
    score: float
    label: str
    period: str
    breakdown: SalesScoreBreakdown
    inputs: dict


class HealthScoresResponse(BaseModel):
    period: str
    inventory: InventoryHealthScore
    sales: SalesHealthScore
    computed_at: str


# ---------------------------------------------------------------------------
# SQL queries – lightweight aggregates only (no full row-level fetching)
# ---------------------------------------------------------------------------

SQL_INVENTORY_SCORE = """
WITH month_sales AS (
    SELECT location_id, product_id,
           AVG(unit_cost)    AS avg_unit_cost,
           SUM(net_amount)   AS sum_net_amount,
           SUM(quantity)     AS sum_quantity
    FROM transactions
    WHERE date BETWEEN $1 AND $2 AND transaction_type = 'SALE'
    GROUP BY location_id, product_id
),
daily_demand AS (
    SELECT location_id, product_id, AVG(dq) AS avg_daily_sales
    FROM (
        SELECT location_id, product_id, date, SUM(quantity) AS dq
        FROM transactions
        WHERE date BETWEEN $1 AND $2
        GROUP BY location_id, product_id, date
    ) d
    GROUP BY location_id, product_id
),
classified AS (
    SELECT
        CASE
            WHEN dd.avg_daily_sales IS NULL OR dd.avg_daily_sales = 0 THEN 'SIN_VENTAS'
            WHEN inv.inventory_qty / dd.avg_daily_sales < 7  THEN 'CRITICO'
            WHEN inv.inventory_qty / dd.avg_daily_sales < 15 THEN 'BAJO'
            WHEN inv.inventory_qty / dd.avg_daily_sales < 30 THEN 'NORMAL'
            ELSE 'ALTO'
        END AS riesgo_backorder,
        CASE
            WHEN dd.avg_daily_sales > 0 AND dd.avg_daily_sales < 1 AND inv.inventory_qty > 50
                THEN 'POSIBLE_OBSOLETO'
            WHEN dd.avg_daily_sales IS NULL OR dd.avg_daily_sales = 0
                THEN 'SIN_VENTAS_RECIENTES'
            ELSE 'NORMAL'
        END AS alerta_rotacion,
        CASE
            WHEN dd.avg_daily_sales > 0 AND inv.inventory_qty <= ROUND(dd.avg_daily_sales * 12, 0)
                THEN true
            ELSE false
        END AS requiere_reorden,
        ms.sum_net_amount,
        ms.avg_unit_cost,
        ms.sum_quantity
    FROM inventory inv
    INNER JOIN month_sales ms
        ON ms.location_id = inv.location_id AND ms.product_id = inv.product_id
    LEFT JOIN daily_demand dd
        ON dd.location_id = inv.location_id AND dd.product_id = inv.product_id
)
SELECT
    COUNT(*)                                                                    AS total_products,
    SUM(CASE WHEN riesgo_backorder = 'CRITICO'         THEN 1 ELSE 0 END)      AS critico,
    SUM(CASE WHEN riesgo_backorder = 'BAJO'            THEN 1 ELSE 0 END)      AS bajo,
    SUM(CASE WHEN riesgo_backorder = 'ALTO'            THEN 1 ELSE 0 END)      AS alto,
    SUM(CASE WHEN alerta_rotacion  = 'POSIBLE_OBSOLETO' THEN 1 ELSE 0 END)     AS posible_obsoleto,
    SUM(CASE WHEN alerta_rotacion  = 'BAJA_ROTACION'   THEN 1 ELSE 0 END)      AS baja_rotacion,
    SUM(CASE WHEN requiere_reorden                     THEN 1 ELSE 0 END)      AS products_requiring_reorder,
    CASE WHEN SUM(sum_net_amount) > 0
         THEN ROUND(
             SUM(sum_net_amount - (avg_unit_cost * sum_quantity)) /
             SUM(sum_net_amount) * 100, 2)
         ELSE 0 END                                                             AS avg_profit_margin_pct
FROM classified
"""

SQL_SELLERS_SCORE = """
WITH v AS (
    SELECT seller_code,
           SUM(net_amount)                               AS total_vendido,
           SUM(net_amount - (unit_cost * quantity))      AS utilidad
    FROM transactions
    WHERE date BETWEEN $1 AND $2 AND transaction_type = 'SALE'
    GROUP BY seller_code
),
metas AS (
    SELECT commercial_id, SUM(goal) AS meta
    FROM commercial_goals
    WHERE date BETWEEN $1 AND $2
    GROUP BY commercial_id
)
SELECT
    COUNT(*)                                                                     AS total_sellers,
    SUM(CASE WHEN m.meta IS NULL OR m.meta = 0 THEN 1 ELSE 0 END)              AS sin_meta,
    SUM(CASE WHEN m.meta > 0 AND v.total_vendido / m.meta >= 1.10 THEN 1 ELSE 0 END)                                AS excelente,
    SUM(CASE WHEN m.meta > 0 AND v.total_vendido / m.meta >= 0.90 AND v.total_vendido / m.meta < 1.10 THEN 1 ELSE 0 END) AS bueno,
    SUM(CASE WHEN m.meta > 0 AND v.total_vendido / m.meta >= 0.70 AND v.total_vendido / m.meta < 0.90 THEN 1 ELSE 0 END) AS regular,
    SUM(CASE WHEN m.meta > 0 AND v.total_vendido / m.meta < 0.70  THEN 1 ELSE 0 END)                                AS bajo,
    CASE WHEN SUM(v.total_vendido) > 0
         THEN ROUND(SUM(v.utilidad) / SUM(v.total_vendido) * 100, 2)
         ELSE 0 END                                                              AS avg_profit_margin_pct
FROM v
LEFT JOIN metas m ON m.commercial_id = v.seller_code
"""

SQL_RFM_SCORE = """
WITH rfm AS (
    SELECT
        client_id,
        ntile(5) OVER (ORDER BY MAX(date) DESC)          AS score_r,
        ntile(5) OVER (ORDER BY COUNT(*) DESC)           AS score_f,
        ntile(5) OVER (ORDER BY SUM(net_amount) DESC)    AS score_m,
        MAX(date)                                        AS ultima_compra
    FROM transactions
    WHERE transaction_type = 'SALE'
    GROUP BY client_id
)
SELECT
    COUNT(*)                                                                         AS total_clients,
    SUM(CASE WHEN score_r >= 4 AND score_f >= 4 AND score_m >= 4 THEN 1 ELSE 0 END) AS vip,
    SUM(CASE WHEN score_r >= 3 AND score_f >= 3 AND score_m >= 3
              AND NOT (score_r >= 4 AND score_f >= 4 AND score_m >= 4) THEN 1 ELSE 0 END) AS leal,
    SUM(CASE WHEN score_r <= 2 AND score_f >= 3 AND score_m >= 3 THEN 1 ELSE 0 END) AS en_riesgo,
    SUM(CASE WHEN score_r <= 2 AND score_f <= 2 THEN 1 ELSE 0 END)                  AS dormido,
    SUM(CASE WHEN (current_date - ultima_compra) > 180 THEN 1 ELSE 0 END)           AS perdido
FROM rfm
"""

SQL_BACKORDER_SCORE = """
SELECT
    COUNT(DISTINCT client_id)                                                              AS total_clients,
    ROUND(AVG(ratio_cumplimiento) * 100, 2)                                                AS avg_fulfillment_pct,
    COUNT(DISTINCT CASE WHEN dias_max > 30 THEN client_id END)                             AS clientes_30plus_dias
FROM (
    SELECT
        client_id,
        SUM(delivery_qty)::numeric / NULLIF(SUM(order_qty), 0)   AS ratio_cumplimiento,
        (current_date - MIN(date))                                AS dias_max
    FROM backorder
    GROUP BY client_id
) bc
"""

SQL_BCG_SCORE = """
WITH ventas AS (
    SELECT product_id,
           SUM(net_amount)  AS valor_neto,
           SUM(quantity)    AS unidades,
           AVG(CASE WHEN unit_price > 0
               THEN ((unit_price - unit_cost) / NULLIF(unit_price, 0)) * 100
               ELSE 0 END) AS margen
    FROM transactions
    WHERE date BETWEEN $1 AND $2 AND transaction_type = 'SALE'
    GROUP BY product_id
),
devoluciones AS (
    SELECT product_id, ABS(SUM(quantity)) AS devueltas
    FROM transactions
    WHERE date BETWEEN $1 AND $2 AND transaction_type_raw = 'NOTA DE CREDITO'
    GROUP BY product_id
),
combined AS (
    SELECT v.product_id, v.valor_neto, v.margen,
           COALESCE(d.devueltas::numeric, 0) / NULLIF(v.unidades, 0) * 100 AS pct_devolucion
    FROM ventas v
    LEFT JOIN devoluciones d ON d.product_id = v.product_id
),
avgs AS (
    SELECT AVG(valor_neto) AS avg_ventas, AVG(margen) AS avg_margen FROM combined
)
SELECT
    COUNT(*)                                                                                  AS total_products,
    SUM(CASE WHEN c.valor_neto >  a.avg_ventas AND c.margen >  a.avg_margen THEN 1 ELSE 0 END) AS estrella,
    SUM(CASE WHEN c.valor_neto >  a.avg_ventas AND c.margen <= a.avg_margen THEN 1 ELSE 0 END) AS vaca_lechera,
    SUM(CASE WHEN c.valor_neto <= a.avg_ventas AND c.margen >  a.avg_margen THEN 1 ELSE 0 END) AS interrogante,
    SUM(CASE WHEN c.valor_neto <= a.avg_ventas AND c.margen <= a.avg_margen THEN 1 ELSE 0 END) AS perro,
    ROUND(AVG(c.pct_devolucion), 2)                                                            AS avg_devolucion_pct
FROM combined c, avgs a
"""


# ---------------------------------------------------------------------------
# Score calculation helpers
# ---------------------------------------------------------------------------

def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def _score_label(score: float) -> str:
    if score >= 85:
        return "Excellent"
    elif score >= 70:
        return "Healthy"
    elif score >= 50:
        return "Needs Attention"
    return "Critical"


def _compute_inventory_score(row: dict) -> InventoryHealthScore:
    total = int(row["total_products"] or 1)

    pct_critico  = (int(row["critico"] or 0)                       / total) * 100
    pct_bajo     = (int(row["bajo"] or 0)                          / total) * 100
    pct_alto     = (int(row["alto"] or 0)                          / total) * 100
    pct_obsoleto = (int(row["posible_obsoleto"] or 0)              / total) * 100
    pct_baja_rot = (int(row["baja_rotacion"] or 0)                 / total) * 100
    pct_reorden  = (int(row["products_requiring_reorder"] or 0)    / total) * 100
    avg_margin   = float(row["avg_profit_margin_pct"] or 0)

    d1 = _clamp(100 - (pct_critico * 2.5) - (pct_bajo * 1.0))
    d2 = _clamp(100 - (pct_obsoleto * 2.0) - (pct_baja_rot * 1.0))
    d3 = _clamp(100 - pct_reorden)
    d4 = _clamp((avg_margin / 35) * 100)
    d5 = _clamp(pct_alto * 2.5)

    score = round(max(1.0, d1 * 0.30 + d2 * 0.25 + d3 * 0.20 + d4 * 0.15 + d5 * 0.10), 1)

    return InventoryHealthScore(
        score=score,
        label=_score_label(score),
        period="",
        breakdown=InventoryScoreBreakdown(
            stock_availability=round(d1, 1),
            rotation_quality=round(d2, 1),
            reorder_management=round(d3, 1),
            profitability=round(d4, 1),
            active_product_coverage=round(d5, 1),
        ),
        inputs={
            "total_products": total,
            "pct_critico": round(pct_critico, 2),
            "pct_bajo": round(pct_bajo, 2),
            "pct_alto": round(pct_alto, 2),
            "pct_posible_obsoleto": round(pct_obsoleto, 2),
            "pct_baja_rotacion": round(pct_baja_rot, 2),
            "pct_requiring_reorder": round(pct_reorden, 2),
            "avg_profit_margin_pct": round(avg_margin, 2),
        },
    )


def _compute_sales_score(
    sellers: dict,
    rfm: dict,
    backorder: dict,
    bcg: dict,
) -> SalesHealthScore:
    excelente        = int(sellers.get("excelente", 0) or 0)
    bueno            = int(sellers.get("bueno", 0) or 0)
    regular          = int(sellers.get("regular", 0) or 0)
    bajo             = int(sellers.get("bajo", 0) or 0)
    sin_meta         = int(sellers.get("sin_meta", 0) or 0)
    sellers_with_goal = excelente + bueno + regular + bajo
    d1 = _clamp(
        (excelente * 100 + bueno * 80 + regular * 50 + bajo * 15) / sellers_with_goal
        if sellers_with_goal > 0 else 50.0
    )

    rfm_weights   = {"vip": 100, "leal": 85, "en_riesgo": 30, "dormido": 15, "perdido": 5}
    total_clients = int(rfm.get("total_clients", 0) or 0)
    if total_clients > 0:
        weighted_sum  = sum(int(rfm.get(k, 0) or 0) * w for k, w in rfm_weights.items())
        accounted     = sum(int(rfm.get(k, 0) or 0) for k in rfm_weights)
        weighted_sum += max(0, total_clients - accounted) * 60
        d2 = _clamp(weighted_sum / total_clients)
    else:
        d2 = 50.0

    avg_fulfillment  = float(backorder.get("avg_fulfillment_pct", 100) or 100)
    total_bo_clients = int(backorder.get("total_clients", 0) or 0)
    clientes_30plus  = int(backorder.get("clientes_30plus_dias", 0) or 0)
    pct_critico_bo   = (clientes_30plus / total_bo_clients * 100) if total_bo_clients > 0 else 0
    d3 = _clamp(avg_fulfillment - (pct_critico_bo * 0.30))

    bcg_weights    = {"estrella": 100, "vaca_lechera": 70, "interrogante": 45, "perro": 10}
    total_products = int(bcg.get("total_products", 0) or 0)
    avg_devolucion = float(bcg.get("avg_devolucion_pct", 0) or 0)
    if total_products > 0:
        bcg_weighted = sum(int(bcg.get(k, 0) or 0) * w for k, w in bcg_weights.items())
        d4 = _clamp(bcg_weighted / total_products - avg_devolucion)
    else:
        d4 = 50.0

    avg_margin = float(sellers.get("avg_profit_margin_pct", 0) or 0)
    d5 = _clamp((avg_margin / 40) * 100)

    score = round(max(1.0, d1 * 0.30 + d2 * 0.25 + d3 * 0.20 + d4 * 0.15 + d5 * 0.10), 1)

    return SalesHealthScore(
        score=score,
        label=_score_label(score),
        period="",
        breakdown=SalesScoreBreakdown(
            seller_goal_attainment=round(d1, 1),
            client_portfolio_rfm=round(d2, 1),
            fulfillment_efficiency=round(d3, 1),
            product_dynamics_bcg=round(d4, 1),
            overall_profitability=round(d5, 1),
        ),
        inputs={
            "sellers": {
                "total": int(sellers.get("total_sellers", 0) or 0),
                "excelente": excelente,
                "bueno": bueno,
                "regular": regular,
                "bajo": bajo,
                "sin_meta": sin_meta,
                "avg_profit_margin_pct": round(avg_margin, 2),
            },
            "rfm": {
                "total_clients": total_clients,
                "vip": int(rfm.get("vip", 0) or 0),
                "leal": int(rfm.get("leal", 0) or 0),
                "en_riesgo": int(rfm.get("en_riesgo", 0) or 0),
                "dormido": int(rfm.get("dormido", 0) or 0),
                "perdido": int(rfm.get("perdido", 0) or 0),
            },
            "backorder": {
                "total_clients": total_bo_clients,
                "avg_fulfillment_pct": round(avg_fulfillment, 2),
                "clientes_30plus_dias": clientes_30plus,
            },
            "bcg": {
                "total_products": total_products,
                "estrella": int(bcg.get("estrella", 0) or 0),
                "vaca_lechera": int(bcg.get("vaca_lechera", 0) or 0),
                "interrogante": int(bcg.get("interrogante", 0) or 0),
                "perro": int(bcg.get("perro", 0) or 0),
                "avg_devolucion_pct": round(avg_devolucion, 2),
            },
        },
    )


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.get("/health-scores", response_model=HealthScoresResponse)
async def get_health_scores(
    response: Response,
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Returns the Inventory Health Score and Sales Health Score for the most
    recent month with sales data.

    Results are cached in Redis for 6 hours. The X-Cache response header
    indicates whether the result came from cache (HIT) or was freshly computed (MISS).
    """
    redis = await _get_redis()

    cached = await redis.get(CACHE_KEY)
    if cached:
        response.headers["X-Cache"] = "HIT"
        print("[HEALTH SCORES] ✅ Cache HIT — returning cached result")
        return HealthScoresResponse(**json.loads(cached))

    response.headers["X-Cache"] = "MISS"
    print("[HEALTH SCORES] Cache MISS — computing scores...")

    pool = await _get_db_pool()
    try:
        # Resolve the most recent month with sales data
        async with pool.acquire() as conn:
            latest = await conn.fetchrow("""
                SELECT EXTRACT(YEAR  FROM MAX(date))::int AS latest_year,
                       EXTRACT(MONTH FROM MAX(date))::int AS latest_month
                FROM transactions
                WHERE transaction_type = 'SALE'
            """)

        if not latest or not latest["latest_year"]:
            raise HTTPException(status_code=404, detail="No sales data found in the database.")

        target_year  = int(latest["latest_year"])
        target_month = int(latest["latest_month"])
        month_start  = date(target_year, target_month, 1)
        month_end    = (
            date(target_year + 1, 1, 1) - timedelta(days=1)
            if target_month == 12
            else date(target_year, target_month + 1, 1) - timedelta(days=1)
        )
        period_str = f"{target_year}-{target_month:02d}"

        print(f"[HEALTH SCORES] Period {period_str} ({month_start} → {month_end})")

        # Run all 5 queries in parallel — each gets its own connection from the pool
        async def fetch(query: str, *args):
            async with pool.acquire() as conn:
                return dict(await conn.fetchrow(query, *args))

        inv_row, sellers_row, rfm_row, bo_row, bcg_row = await asyncio.gather(
            fetch(SQL_INVENTORY_SCORE, month_start, month_end),
            fetch(SQL_SELLERS_SCORE,   month_start, month_end),
            fetch(SQL_RFM_SCORE),
            fetch(SQL_BACKORDER_SCORE),
            fetch(SQL_BCG_SCORE,       month_start, month_end),
        )

        inventory_score        = _compute_inventory_score(inv_row)
        inventory_score.period = period_str

        sales_score        = _compute_sales_score(sellers=sellers_row, rfm=rfm_row, backorder=bo_row, bcg=bcg_row)
        sales_score.period = period_str

        result = HealthScoresResponse(
            period=period_str,
            inventory=inventory_score,
            sales=sales_score,
            computed_at=datetime.utcnow().isoformat() + "Z",
        )

        await redis.setex(CACHE_KEY, CACHE_TTL, result.model_dump_json())
        print(f"[HEALTH SCORES] ✅ Cached 6h. inventory={inventory_score.score} sales={sales_score.score}")

        return result

    except HTTPException:
        raise
    except Exception as exc:
        print(f"[HEALTH SCORES] ERROR: {exc}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Score computation failed: {str(exc)}")
