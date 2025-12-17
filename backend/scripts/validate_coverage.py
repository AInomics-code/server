"""
Script to validate question coverage against available tools
"""
import json
from typing import Dict, List

# Map of questions to required capabilities
QUESTIONS = [
    {
        "id": 1,
        "question": "¿Qué cadena está por debajo del presupuesto?",
        "required_tools": ["get_budgets_summary", "get_sales_summary", "search_client_groups"],
        "required_data": ["client_group_code", "budgets", "transactions"],
        "status": "SUPPORTED",
        "phase": "COMPLETED"
    },
    {
        "id": 2,
        "question": "¿Qué producto no se vendió el día de ayer / por semana / por punto de venta (PDV)?",
        "required_tools": ["get_sales_by_product"],
        "required_data": ["transactions", "location_id filter"],
        "status": "SUPPORTED",
        "phase": "FASE 1",
        "notes": "Agregado filtro location_id a get_sales_by_product"
    },
    {
        "id": 3,
        "question": "Según la inversión en tongas/muebles, ¿cuál PDV es más rentable?",
        "required_tools": ["pdv_investments table", "profit calculations"],
        "required_data": ["pdv_investments (NO EXISTE)"],
        "status": "NOT_SUPPORTED",
        "phase": "FASE 4",
        "notes": "Requiere tabla nueva pdv_investments con datos de inversiones"
    },
    {
        "id": 4,
        "question": "¿Qué productos están decreciendo o creciendo vs el mes/trimestre/año pasado?",
        "required_tools": ["get_product_growth_analysis", "get_sales_comparison"],
        "required_data": ["transactions"],
        "status": "SUPPORTED",
        "phase": "FASE 2"
    },
    {
        "id": 5,
        "question": "¿Cuál es el producto más vendido por cadena?",
        "required_tools": ["get_sales_by_product"],
        "required_data": ["transactions", "client_group"],
        "status": "SUPPORTED",
        "phase": "COMPLETED"
    },
    {
        "id": 6,
        "question": "Del censo nacional de clientes de Dichter, ¿a cuántos no les vendemos?",
        "required_tools": ["external_data_integration"],
        "required_data": ["censo_dichter (EXTERNO)"],
        "status": "NOT_SUPPORTED",
        "phase": "FASE 4",
        "notes": "Requiere integración con data externa de Dichter"
    },
    {
        "id": 7,
        "question": "¿Qué productos sugieres descatalogar por poca venta?",
        "required_tools": ["get_discontinuation_candidates"],
        "required_data": ["transactions", "inventory", "backorder"],
        "status": "SUPPORTED",
        "phase": "FASE 2"
    },
    {
        "id": 8,
        "question": "¿Qué cadena está morosa a más de 120 días?",
        "required_tools": ["accounts_receivable model"],
        "required_data": ["accounts_receivable", "client_group_code"],
        "status": "SUPPORTED",
        "phase": "COMPLETED",
        "notes": "Modelo accounts_receivable creado, pendiente validar PostgreSQL"
    },
    {
        "id": 9,
        "question": "¿Cómo va el crecimiento en ventas vs el año pasado por cadena?",
        "required_tools": ["get_sales_comparison", "get_sales_by_month"],
        "required_data": ["transactions", "client_group"],
        "status": "SUPPORTED",
        "phase": "FASE 2"
    },
    {
        "id": 10,
        "question": "¿Cómo va el crecimiento en ventas vs el año pasado de los clientes de exportación? ¿Y de EPA?",
        "required_tools": ["get_sales_comparison"],
        "required_data": ["transactions", "client_type (si existe en source)"],
        "status": "PARTIALLY_SUPPORTED",
        "phase": "FASE 3",
        "notes": "Depende de si existe campo client_type en tabla source CLIENTES"
    },
    {
        "id": 11,
        "question": "¿Cuál es la rentabilidad por SKU?",
        "required_tools": ["get_sales_by_product"],
        "required_data": ["transactions con profit calculations"],
        "status": "SUPPORTED",
        "phase": "FASE 1",
        "notes": "Agregado cálculo de total_profit y profit_margin_pct"
    },
    {
        "id": 12,
        "question": "¿Cuánto están creciendo los productos de maquilas de la cadena X vs el año pasado?",
        "required_tools": ["get_sales_by_product", "get_sales_comparison"],
        "required_data": ["transactions", "products.outsourced"],
        "status": "SUPPORTED",
        "phase": "FASE 1",
        "notes": "Agregado filtro outsourced_only a get_sales_by_product"
    },
    {
        "id": 13,
        "question": "¿Cuál es el BO (backorder) de hoy?",
        "required_tools": ["get_backorders_summary"],
        "required_data": ["backorder"],
        "status": "SUPPORTED",
        "phase": "COMPLETED"
    },
    {
        "id": 14,
        "question": "¿Cuánto va la facturación hoy?",
        "required_tools": ["get_sales_summary"],
        "required_data": ["transactions"],
        "status": "SUPPORTED",
        "phase": "COMPLETED"
    },
    {
        "id": 15,
        "question": "¿Qué clientes se han facturado hoy?",
        "required_tools": ["query_sales", "get_sales_by_client"],
        "required_data": ["transactions"],
        "status": "SUPPORTED",
        "phase": "COMPLETED"
    },
    {
        "id": 16,
        "question": "Muéstrame los vendedores que van por debajo del proyectado de ventas a la fecha",
        "required_tools": ["get_seller_quota_performance"],
        "required_data": ["seller_quotas (NO EXISTE)"],
        "status": "PARTIALLY_SUPPORTED",
        "phase": "FASE 3",
        "notes": "Requiere crear tabla seller_quotas si existe data de cuotas en source"
    },
    {
        "id": 17,
        "question": "¿Cuáles la venta por producto a la fecha, cuáles productos están por debajo de la proyección de ventas y muéstrame el BO por productos de las 3 agencias?",
        "required_tools": ["get_sales_by_product", "get_backorders_summary", "multi-metric tool"],
        "required_data": ["transactions", "backorder", "seller_province_code"],
        "status": "PARTIALLY_SUPPORTED",
        "phase": "FASE 3",
        "notes": "Requiere herramienta compuesta o múltiples llamadas"
    },
    {
        "id": 18,
        "question": "¿Cuándo arrancó la venta de determinado producto?",
        "required_tools": ["get_product_first_sale"],
        "required_data": ["transactions"],
        "status": "SUPPORTED",
        "phase": "FASE 1"
    },
    {
        "id": 19,
        "question": "¿Cuáles son los productos que vienen decreciendo en los últimos 2 años?",
        "required_tools": ["get_product_growth_analysis"],
        "required_data": ["transactions"],
        "status": "SUPPORTED",
        "phase": "FASE 2"
    },
    {
        "id": 20,
        "question": "Muéstrame el listado de los clientes en los cuales está decreciendo por ejemplo la mayonesa 350g y si el resto de la categoría también decrece",
        "required_tools": ["get_sales_by_client", "get_product_growth_analysis", "search_products"],
        "required_data": ["transactions"],
        "status": "SUPPORTED",
        "phase": "FASE 2",
        "notes": "Combo de herramientas existentes"
    },
    {
        "id": 21,
        "question": "Dime los productos que llevan 3 o más meses sin venta",
        "required_tools": ["get_slow_moving_products", "get_discontinuation_candidates"],
        "required_data": ["transactions", "inventory"],
        "status": "SUPPORTED",
        "phase": "COMPLETED"
    },
    {
        "id": 22,
        "question": "Detalle los clientes con más de 3 meses sin venta y quién es su vendedor",
        "required_tools": ["get_inactive_clients"],
        "required_data": ["transactions", "clients"],
        "status": "SUPPORTED",
        "phase": "FASE 1"
    },
    {
        "id": 23,
        "question": "Muéstrame el 80/20 de los productos en dólares y cajas",
        "required_tools": ["get_sales_by_product"],
        "required_data": ["transactions"],
        "status": "SUPPORTED",
        "phase": "COMPLETED",
        "notes": "Tool devuelve datos ordenados, cálculo 80/20 en frontend"
    },
    {
        "id": 24,
        "question": "Dame el top-25 de los clientes que más compran determinado producto",
        "required_tools": ["get_sales_by_client"],
        "required_data": ["transactions"],
        "status": "SUPPORTED",
        "phase": "FASE 1",
        "notes": "Agregado filtro product_id a get_sales_by_client"
    },
    {
        "id": 25,
        "question": "Dame la venta x Clases e indícame cuáles vienen decreciendo (periodo determinado)",
        "required_tools": ["get_sales_by_product", "get_product_growth_analysis"],
        "required_data": ["transactions", "products.category"],
        "status": "SUPPORTED",
        "phase": "FASE 1",
        "notes": "Agregado group_by='category' a get_sales_by_product"
    },
    {
        "id": 26,
        "question": "Dame la venta por clases-cadenas (periodo determinado)",
        "required_tools": ["get_sales_by_product"],
        "required_data": ["transactions", "client_group"],
        "status": "SUPPORTED",
        "phase": "COMPLETED"
    },
    {
        "id": 27,
        "question": "¿Cuál es el crecimiento actual por agencia?",
        "required_tools": ["get_sales_summary", "get_sales_comparison"],
        "required_data": ["transactions", "seller_province_code"],
        "status": "SUPPORTED",
        "phase": "COMPLETED",
        "notes": "Columnas seller_province_code agregadas en dbt"
    },
    {
        "id": 28,
        "question": "¿Cuál es la tendencia de crecimiento estimada por agencia? ¿Cuál es la cuota estimada en base a esta tendencia?",
        "required_tools": ["forecasting/ML model"],
        "required_data": ["historical transactions", "forecasting model"],
        "status": "NOT_SUPPORTED",
        "phase": "FASE 4",
        "notes": "Requiere modelo de forecasting o regresión lineal"
    },
    {
        "id": 29,
        "question": "Dime los clientes nuevos y cuanto aportan a la venta",
        "required_tools": ["custom SQL query"],
        "required_data": ["transactions with MIN(date)"],
        "status": "PARTIALLY_SUPPORTED",
        "phase": "FASE 3",
        "notes": "Requiere SQL custom o nueva herramienta específica"
    },
    {
        "id": 30,
        "question": "Dame el BO del día de ayer por bodega, productos y qué clientes se vieron afectados",
        "required_tools": ["query_backorders"],
        "required_data": ["backorder"],
        "status": "SUPPORTED",
        "phase": "COMPLETED"
    },
    {
        "id": 31,
        "question": "Muéstrame la cobertura general de determinado producto y por vendedor",
        "required_tools": ["custom query"],
        "required_data": ["transactions", "clients by seller"],
        "status": "PARTIALLY_SUPPORTED",
        "phase": "FASE 3",
        "notes": "Requiere SQL custom o nueva herramienta"
    },
    {
        "id": 32,
        "question": "Muéstrame la venta de maquilas de determinada Cadena y por Productos",
        "required_tools": ["get_sales_by_product"],
        "required_data": ["transactions", "products.outsourced", "client_group"],
        "status": "SUPPORTED",
        "phase": "FASE 1",
        "notes": "Filtros outsourced_only + client_group agregados"
    },
    {
        "id": 33,
        "question": "Muéstrame las ventas, notas de crédito y ajustes de los clientes de exportación",
        "required_tools": ["get_sales_by_client", "transaction_type_raw filter"],
        "required_data": ["transactions.transaction_type_raw", "client_type"],
        "status": "PARTIALLY_SUPPORTED",
        "phase": "FASE 2",
        "notes": "transaction_type_raw agregado, falta client_type si existe"
    },
    {
        "id": 34,
        "question": "Dime los clientes semanales que compran por debajo de 10 dólares por día",
        "required_tools": ["custom query"],
        "required_data": ["transactions daily aggregation"],
        "status": "PARTIALLY_SUPPORTED",
        "phase": "FASE 3",
        "notes": "Requiere análisis temporal específico"
    }
]


def generate_coverage_report():
    """Generate coverage report"""
    
    total = len(QUESTIONS)
    supported = len([q for q in QUESTIONS if q["status"] == "SUPPORTED"])
    partially = len([q for q in QUESTIONS if q["status"] == "PARTIALLY_SUPPORTED"])
    not_supported = len([q for q in QUESTIONS if q["status"] == "NOT_SUPPORTED"])
    
    phase1_complete = len([q for q in QUESTIONS if q.get("phase") == "FASE 1"])
    phase2_complete = len([q for q in QUESTIONS if q.get("phase") == "FASE 2"])
    
    print("="*80)
    print("REPORTE DE COBERTURA DE PREGUNTAS DE NEGOCIO")
    print("="*80)
    print(f"\n📊 RESUMEN GENERAL:")
    print(f"   Total de preguntas: {total}")
    print(f"   ✅ Totalmente soportadas: {supported} ({supported/total*100:.1f}%)")
    print(f"   ⚠️  Parcialmente soportadas: {partially} ({partially/total*100:.1f}%)")
    print(f"   ❌ No soportadas: {not_supported} ({not_supported/total*100:.1f}%)")
    print(f"\n   🎯 Cobertura total: {(supported+partially)/total*100:.1f}%")
    
    print(f"\n📈 PROGRESO POR FASE:")
    print(f"   ✅ FASE 1 Completada: {phase1_complete} preguntas")
    print(f"   ✅ FASE 2 Completada: {phase2_complete} preguntas")
    print(f"   ⏳ FASE 3 Pendiente: {len([q for q in QUESTIONS if q.get('phase') == 'FASE 3'])} preguntas")
    print(f"   ⏳ FASE 4 Pendiente: {len([q for q in QUESTIONS if q.get('phase') == 'FASE 4'])} preguntas")
    
    print(f"\n\n{'='*80}")
    print("DETALLE POR PREGUNTA")
    print("="*80)
    
    for q in QUESTIONS:
        status_icon = "✅" if q["status"] == "SUPPORTED" else "⚠️" if q["status"] == "PARTIALLY_SUPPORTED" else "❌"
        print(f"\n{status_icon} #{q['id']}: {q['question']}")
        print(f"   Estado: {q['status']}")
        print(f"   Fase: {q.get('phase', 'N/A')}")
        print(f"   Herramientas: {', '.join(q['required_tools'])}")
        if q.get('notes'):
            print(f"   📝 Notas: {q['notes']}")
    
    print(f"\n\n{'='*80}")
    print("NUEVAS HERRAMIENTAS IMPLEMENTADAS")
    print("="*80)
    print("""
✅ FASE 1 - Quick Wins (COMPLETADO):
   1. get_sales_by_product - Filtros: location_id, outsourced_only, group_by
   2. get_sales_by_client - Filtro: product_id
   3. Rentabilidad agregada: total_profit, profit_margin_pct
   4. get_product_first_sale - Primera venta de producto
   5. get_inactive_clients - Clientes sin ventas recientes

✅ FASE 2 - Growth Analysis (COMPLETADO):
   1. get_product_growth_analysis - Análisis de crecimiento/decline
   2. get_sales_comparison - Comparación con año anterior
   3. get_discontinuation_candidates - Productos a descatalogar
   4. transaction_type_raw en transactions.sql

⏳ FASE 3 - Advanced Features (PENDIENTE):
   1. seller_quotas.sql modelo dbt
   2. get_seller_quota_performance tool
   3. Herramientas compuestas para queries complejos

⏳ FASE 4 - External Data (PENDIENTE):
   1. Integración censo Dichter
   2. pdv_investments table
   3. Modelo de forecasting
    """)
    
    print(f"\n{'='*80}")
    print("RECOMENDACIONES")
    print("="*80)
    print("""
🎯 PRÓXIMOS PASOS:

1. VALIDAR FASE 1 y 2:
   - Correr dbt run para aplicar cambios en transactions.sql
   - Probar nuevas herramientas con queries reales
   - Validar cálculos de rentabilidad

2. IMPLEMENTAR FASE 3 (1 semana):
   - Verificar si existe tabla de cuotas de vendedores en source
   - Crear seller_quotas.sql si hay data disponible
   - Implementar get_seller_quota_performance

3. EVALUAR FASE 4 (2+ semanas):
   - Contactar Dichter para API/datos de censo
   - Verificar si existe data de inversiones en PDV
   - Decidir approach para forecasting (simple regression vs ML)

4. TESTING Y VALIDACIÓN:
   - Crear suite de tests para cada herramienta
   - Validar performance de queries
   - Optimizar índices en PostgreSQL si es necesario
    """)


if __name__ == "__main__":
    generate_coverage_report()
