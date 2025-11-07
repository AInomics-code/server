/**
 * Data Registry - Realistic mock data for La Doña business entities
 * Provides KPIs, Products, Zones, and Reports with authentic business metrics
 */

// Generate realistic time series data
function generateSeries(baseValue, periods = 12, volatility = 0.1) {
  const series = [];
  const today = new Date();
  
  for (let i = periods; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - (i * 7)); // Weekly data points
    
    const variation = (Math.random() - 0.5) * volatility * baseValue;
    const value = Math.max(0, baseValue + variation);
    
    series.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value)
    });
  }
  
  return series;
}

// KPI Registry
export const kpis = {
  performanceScore: {
    id: 'performance-score',
    title: 'Performance Score',
    unit: 'points',
    currentValue: 78.5,
    target: 85,
    series: generateSeries(78, 12, 0.08),
    description: 'Composite performance metric across all business units'
  },
  inventoryTurnover: {
    id: 'inventory-turnover',
    title: 'Inventory Turnover',
    unit: 'turns/year',
    currentValue: 6.2,
    target: 8.0,
    series: generateSeries(6.2, 12, 0.15),
    description: 'Rate at which inventory is sold and replaced over a period'
  },
  serviceLevel: {
    id: 'service-level',
    title: 'Service Level',
    unit: '%',
    currentValue: 94.2,
    target: 98.0,
    series: generateSeries(94, 12, 0.03),
    description: 'Percentage of customer demand met from available inventory'
  },
  grossMargin: {
    id: 'gross-margin',
    title: 'Gross Margin',
    unit: '%',
    currentValue: 35.8,
    target: 40.0,
    series: generateSeries(36, 12, 0.05),
    description: 'Revenue minus cost of goods sold as percentage of revenue'
  }
};

// Product Registry
export const products = {
  mangoSalsa: {
    id: 'mango-salsa',
    name: 'Mango Salsa Premium',
    category: 'Condiments',
    price: 12.50,
    cogs: 0.65, // 65% cost of goods sold
    demandSeries: generateSeries(1200, 12, 0.12),
    series: generateSeries(1200, 12, 0.12), // Alias for compatibility
    stockOnHand: 4800,
    leadTime: 14,
    description: 'Premium mango salsa with authentic tropical flavors',
    zones: ['chiriqui', 'panama', 'colon']
  },
  premiumVinegar: {
    id: 'premium-vinegar',
    name: 'Vinagre Artesanal Premium',
    category: 'Vinegars',
    price: 8.75,
    cogs: 0.58,
    demandSeries: generateSeries(850, 12, 0.15),
    series: generateSeries(850, 12, 0.15),
    stockOnHand: 3200,
    leadTime: 10,
    description: 'Artisanal vinegar with traditional fermentation process',
    zones: ['chiriqui', 'panama']
  },
  spicyMustard: {
    id: 'spicy-mustard',
    name: 'Mostaza Picante Especial',
    category: 'Condiments',
    price: 6.25,
    cogs: 0.52,
    demandSeries: generateSeries(2100, 12, 0.18),
    series: generateSeries(2100, 12, 0.18),
    stockOnHand: 6400,
    leadTime: 7,
    description: 'Special spicy mustard blend with local pepper varieties',
    zones: ['chiriqui', 'panama', 'colon', 'veraguas']
  }
};

// Zone Registry
export const zones = {
  chiriqui: {
    id: 'chiriqui',
    name: 'Chiriquí Central',
    region: 'Chiriquí',
    demandDistribution: {
      mangoSalsa: 0.35,
      premiumVinegar: 0.28,
      spicyMustard: 0.42
    },
    series: generateSeries(3200, 12, 0.14),
    population: 185000,
    marketPenetration: 0.68,
    description: 'Primary distribution hub for western Panama'
  },
  panama: {
    id: 'panama',
    name: 'Panamá Metropolitana',
    region: 'Panamá',
    demandDistribution: {
      mangoSalsa: 0.45,
      premiumVinegar: 0.38,
      spicyMustard: 0.52
    },
    series: generateSeries(5800, 12, 0.10),
    population: 1200000,
    marketPenetration: 0.34,
    description: 'Metropolitan Panama City market with highest volume potential'
  },
  colon: {
    id: 'colon',
    name: 'Colón Atlántico',
    region: 'Colón',
    demandDistribution: {
      mangoSalsa: 0.22,
      premiumVinegar: 0.15,
      spicyMustard: 0.35
    },
    series: generateSeries(1400, 12, 0.20),
    population: 95000,
    marketPenetration: 0.45,
    description: 'Atlantic coast market with growing demand potential'
  },
  veraguas: {
    id: 'veraguas',
    name: 'Veraguas Interior',
    region: 'Veraguas',
    demandDistribution: {
      mangoSalsa: 0.18,
      premiumVinegar: 0.12,
      spicyMustard: 0.28
    },
    series: generateSeries(890, 12, 0.25),
    population: 68000,
    marketPenetration: 0.52,
    description: 'Interior market with seasonal demand variations'
  }
};

// Team Members Registry
export const teamMembers = [
  {
    id: 'sofia-chen',
    name: 'Sofia Chen',
    role: 'Analytics Manager',
    avatar: 'SC',
    department: 'Analytics',
    online: true
  },
  {
    id: 'miguel-santos', 
    name: 'Miguel Santos',
    role: 'Operations Director',
    avatar: 'MS',
    department: 'Operations', 
    online: true
  },
  {
    id: 'elena-rodriguez',
    name: 'Elena Rodriguez', 
    role: 'Sales Manager',
    avatar: 'ER',
    department: 'Sales',
    online: false
  },
  {
    id: 'carlos-mendez',
    name: 'Carlos Mendez',
    role: 'Business Development',
    avatar: 'CM', 
    department: 'Business Development',
    online: true
  },
  {
    id: 'ana-gutierrez',
    name: 'Ana Gutierrez',
    role: 'Supply Chain Analyst',
    avatar: 'AG',
    department: 'Operations',
    online: false
  }
];

// Report Registry
export const reports = {
  q3Forecast: {
    id: 'q3-forecast',
    title: 'Q3 2025 Demand Forecast',
    type: 'forecast',
    summary: 'Comprehensive demand projections for Q3 showing 12% growth in premium products with seasonal adjustments for mango salsa and promotional calendar integration.',
    generatedDate: '2025-08-01',
    author: 'Sofia Chen',
    department: 'Analytics',
    tags: ['forecast', 'demand', 'seasonal', 'growth'],
    keyMetrics: {
      totalDemandGrowth: 12.3,
      premiumCategoryGrowth: 18.7,
      seasonalityFactor: 1.15,
      confidenceLevel: 87
    }
  },
  stockoutAnalysis: {
    id: 'stockout-analysis',
    title: 'Stockout Risk Analysis - August 2025',
    type: 'risk-assessment',
    summary: 'Analysis of current inventory levels versus projected demand identifying critical stockout risks for Mango Salsa in Chiriquí Central and recommended emergency transfers.',
    generatedDate: '2025-08-10',
    author: 'Miguel Santos',
    department: 'Operations',
    tags: ['inventory', 'stockout', 'risk', 'transfer'],
    keyMetrics: {
      criticalItems: 3,
      stockoutRisk: 23.5,
      daysOfCoverage: 8.2,
      emergencyTransferValue: 48500
    }
  },
  performanceReview: {
    id: 'performance-review',
    title: 'Monthly Performance Review - July 2025',
    type: 'performance',
    summary: 'Comprehensive review of operational performance metrics showing service level improvements and margin optimization opportunities across all product categories.',
    generatedDate: '2025-08-05',
    author: 'Elena Rodriguez',
    department: 'Sales',
    tags: ['performance', 'kpi', 'optimization', 'monthly'],
    keyMetrics: {
      overallPerformance: 78.5,
      serviceLevel: 94.2,
      marginImprovement: 2.3,
      targetAchievement: 87.2
    }
  },
  marketAnalysis: {
    id: 'market-analysis',
    title: 'Market Expansion Analysis - Pacific Coast',
    type: 'market-research',
    summary: 'Detailed analysis of market expansion opportunities in Pacific coast regions with demographic data, competitive landscape, and revenue projections.',
    generatedDate: '2025-08-08',
    author: 'Carlos Mendez',
    department: 'Business Development',
    tags: ['market', 'expansion', 'pacific', 'opportunity'],
    keyMetrics: {
      marketPotential: 234000,
      competitorShare: 15.2,
      projectedRevenue: 156000,
      investmentRequired: 45000
    }
  }
};

// Utility functions for data access
export function getEntityById(type, id) {
  const registries = { kpis, products, zones, reports };
  return registries[type]?.[id] || null;
}

export function getEntitiesByType(type) {
  const registries = { kpis, products, zones, reports };
  return registries[type] || {};
}

export function getAllEntities() {
  return {
    kpis: Object.values(kpis),
    products: Object.values(products),
    zones: Object.values(zones),
    reports: Object.values(reports)
  };
}

export function searchEntities(query, type = null) {
  const allEntities = getAllEntities();
  const searchTargets = type ? [type] : Object.keys(allEntities);
  
  const results = [];
  searchTargets.forEach(entityType => {
    allEntities[entityType].forEach(entity => {
      if (
        entity.name?.toLowerCase().includes(query.toLowerCase()) ||
        entity.title?.toLowerCase().includes(query.toLowerCase()) ||
        entity.description?.toLowerCase().includes(query.toLowerCase())
      ) {
        results.push({ ...entity, entityType });
      }
    });
  });
  
  return results;
}