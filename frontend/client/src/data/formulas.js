/**
 * Business Intelligence Formulas - Pure, deterministic calculations
 * All functions accept simple inputs and return numbers/series without UI logic
 */

/**
 * Forecasts demand based on historical series and growth percentage
 * @param {Array} baseSeries - Array of {date, value} objects
 * @param {number} growthPct - Growth percentage (e.g., 0.15 for 15% growth)
 * @returns {Array} Forecasted series with future periods multiplied by growth factor
 */
export function forecastDemand(baseSeries, growthPct) {
  if (!baseSeries || baseSeries.length === 0) return [];
  
  const growthFactor = 1 + growthPct;
  return baseSeries.map(point => ({
    ...point,
    value: point.value * growthFactor
  }));
}

/**
 * Calculates demand impact based on price elasticity
 * @param {number} demand - Base demand value
 * @param {number} priceChangePct - Price change percentage (e.g., 0.10 for 10% increase)
 * @param {number} elasticity - Price elasticity coefficient (default: -1.3)
 * @returns {number} Adjusted demand after price change
 */
export function priceElasticity(demand, priceChangePct, elasticity = -1.3) {
  return demand * (1 + elasticity * priceChangePct);
}

/**
 * Calculates promotional uplift on demand
 * @param {number} demand - Base demand value
 * @param {number} promoMultiplier - Promotional multiplier (e.g., 1.8 for 80% uplift)
 * @returns {number} Demand after promotional uplift
 */
export function promoUplift(demand, promoMultiplier) {
  return demand * promoMultiplier;
}

/**
 * Calculates inventory coverage in days/weeks
 * @param {Array} demandSeries - Array of {date, value} demand projections
 * @param {number} stockOnHand - Current stock available
 * @returns {number} Days of coverage based on average demand
 */
export function inventoryCoverage(demandSeries, stockOnHand) {
  if (!demandSeries || demandSeries.length === 0) return 0;
  
  const avgDailyDemand = demandSeries.reduce((sum, point) => sum + point.value, 0) / demandSeries.length;
  return avgDailyDemand > 0 ? stockOnHand / avgDailyDemand : 0;
}

/**
 * Calculates lead time impact on availability and stockouts
 * @param {Array} demandSeries - Array of {date, value} demand projections
 * @param {number} leadTimeDays - Lead time in days
 * @returns {Object} Impact analysis with stockout risk and availability shifts
 */
export function leadTimeImpact(demandSeries, leadTimeDays) {
  if (!demandSeries || demandSeries.length === 0) {
    return { stockoutRisk: 0, availabilityShift: 0, impactedPeriods: 0 };
  }
  
  const totalDemand = demandSeries.reduce((sum, point) => sum + point.value, 0);
  const stockoutRisk = Math.min(leadTimeDays / 30, 1); // Risk increases with lead time
  const impactedPeriods = Math.ceil(leadTimeDays / 7); // Number of weeks affected
  
  return {
    stockoutRisk: stockoutRisk * 100, // Percentage
    availabilityShift: leadTimeDays,
    impactedPeriods,
    demandAtRisk: totalDemand * stockoutRisk
  };
}

/**
 * Calculates revenue from demand series and unit price
 * @param {Array} demandSeries - Array of {date, value} demand values
 * @param {number} unitPrice - Price per unit
 * @returns {number} Total revenue
 */
export function revenue(demandSeries, unitPrice) {
  if (!demandSeries || demandSeries.length === 0) return 0;
  
  const totalUnits = demandSeries.reduce((sum, point) => sum + point.value, 0);
  return totalUnits * unitPrice;
}

/**
 * Calculates margin from revenue and COGS percentage
 * @param {number} revenue - Total revenue
 * @param {number} cogsPct - Cost of goods sold as percentage (e.g., 0.65 for 65%)
 * @returns {number} Gross margin
 */
export function margin(revenue, cogsPct) {
  return revenue * (1 - cogsPct);
}

/**
 * Orchestrates scenario simulation by combining all formulas
 * @param {Object} inputs - Scenario inputs
 * @param {Object} inputs.entity - Selected entity (KPI/Product/Zone)
 * @param {number} inputs.demandGrowth - Demand growth percentage
 * @param {number} inputs.priceChange - Price change percentage
 * @param {number} inputs.promoMultiplier - Promotional multiplier
 * @param {number} inputs.leadTime - Lead time in days
 * @param {number} inputs.stockAvailable - Available stock units
 * @returns {Object} Scenario results with current and simulated metrics
 */
export function simulateScenario(inputs) {
  const {
    entity,
    demandGrowth = 0,
    priceChange = 0,
    promoMultiplier = 1,
    leadTime = 7,
    stockAvailable = 1000
  } = inputs;

  if (!entity || !entity.series) {
    return {
      current: { revenue: 0, units: 0, margin: 0, serviceLevel: 100 },
      simulated: { revenue: 0, units: 0, margin: 0, serviceLevel: 100 }
    };
  }

  // Current metrics calculation
  const currentDemand = entity.series.reduce((sum, point) => sum + point.value, 0);
  const currentRevenue = revenue(entity.series, entity.price || 12.50);
  const currentMargin = margin(currentRevenue, entity.cogs || 0.65);
  const currentCoverage = inventoryCoverage(entity.series, stockAvailable);
  
  // Simulated metrics calculation
  let simulatedSeries = [...entity.series];
  
  // Apply demand growth
  if (demandGrowth !== 0) {
    simulatedSeries = forecastDemand(simulatedSeries, demandGrowth);
  }
  
  // Apply promotional uplift
  if (promoMultiplier !== 1) {
    simulatedSeries = simulatedSeries.map(point => ({
      ...point,
      value: promoUplift(point.value, promoMultiplier)
    }));
  }
  
  // Apply price elasticity
  let adjustedPrice = entity.price || 12.50;
  if (priceChange !== 0) {
    adjustedPrice = adjustedPrice * (1 + priceChange);
    simulatedSeries = simulatedSeries.map(point => ({
      ...point,
      value: priceElasticity(point.value, priceChange)
    }));
  }
  
  // Calculate simulated metrics
  const simulatedDemand = simulatedSeries.reduce((sum, point) => sum + point.value, 0);
  const simulatedRevenue = revenue(simulatedSeries, adjustedPrice);
  const simulatedMargin = margin(simulatedRevenue, entity.cogs || 0.65);
  const simulatedCoverage = inventoryCoverage(simulatedSeries, stockAvailable);
  const leadTimeAnalysis = leadTimeImpact(simulatedSeries, leadTime);
  
  // Service level calculation based on coverage and lead time
  const currentServiceLevel = Math.min(100, currentCoverage * 10);
  const simulatedServiceLevel = Math.max(0, Math.min(100, simulatedCoverage * 10 - leadTimeAnalysis.stockoutRisk));

  return {
    current: {
      revenue: Math.round(currentRevenue),
      units: Math.round(currentDemand),
      margin: Math.round(currentMargin),
      serviceLevel: Math.round(currentServiceLevel),
      series: entity.series
    },
    simulated: {
      revenue: Math.round(simulatedRevenue),
      units: Math.round(simulatedDemand),
      margin: Math.round(simulatedMargin),
      serviceLevel: Math.round(simulatedServiceLevel),
      series: simulatedSeries,
      priceChange: ((adjustedPrice / (entity.price || 12.50)) - 1) * 100,
      leadTimeImpact: leadTimeAnalysis
    }
  };
}