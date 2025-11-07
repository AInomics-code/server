// Business Context Data for La Doña AI
export interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  barcode: string;
  currentStock: number;
  targetStock: number;
  margin: number;
  salesTrend: number;
  backorders?: number;
  unitCost: number;
  sellingPrice: number;
  profitability: number;
  channel: string;
  visualArt: string;
  isMaquila: boolean;
}

export interface SalesData {
  date: string;
  product: string;
  store: string;
  chain: string;
  quantity: number;
  revenue: number;
  promotion?: string;
}

export interface ClientData {
  id: string;
  name: string;
  type: 'national' | 'export' | 'epa';
  chain: string;
  region: string;
  monthlyVolume: number;
  paymentTerms: string;
  lastOrder: string;
  riskLevel: 'low' | 'medium' | 'high';
  overdueDays: number;
  overdueAmount: number;
  latitude: number;
  longitude: number;
  isActive: boolean;
  lastVisit: string;
  billingToday: number;
}

export interface Region {
  name: string;
  target: number;
  current: number;
  salesRep: string;
  keyClients: string[];
  performance: number;
}

export interface Client {
  name: string;
  region: string;
  monthlyVolume: number;
  paymentTerms: string;
  lastOrder: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface SalesRep {
  id: string;
  name: string;
  region: string;
  target: number;
  achieved: number;
  performance: number;
  phone: string;
  email: string;
  extension: string;
  dailyRoute: string[];
  lateArrivals: number;
  visitedToday: string[];
  missedVisits: string[];
  clientsWithoutOrders: Array<{client: string, reason: string}>;
}

export interface PromotionData {
  id: string;
  name: string;
  product: string;
  type: 'scanner' | 'display' | 'discount' | 'bundle';
  startDate: string;
  endDate: string;
  investment: number;
  totalSales: number;
  roi: number;
  stores: string[];
}

export interface StockData {
  product: string;
  store: string;
  currentStock: number;
  isOutOfStock: boolean;
  lastRestockDate: string;
  reorderPoint: number;
}

export interface InvoiceData {
  id: string;
  date: string;
  client: string;
  amount: number;
  products: Array<{sku: string, quantity: number, unitPrice: number}>;
  status: 'pending' | 'paid' | 'overdue';
}

export interface ChannelData {
  name: string;
  totalSKUs: number;
  activeClients: number;
  branches: number;
}

// Business data - represents real business metrics
export const products: Product[] = [
  {
    id: "VP001",
    name: "Vinagre Premium",
    category: "Vinegars",
    sku: "VP-500ML",
    barcode: "7891234567890",
    currentStock: 450,
    targetStock: 600,
    margin: 32.5,
    salesTrend: 47,
    backorders: 0,
    unitCost: 1.85,
    sellingPrice: 2.75,
    profitability: 0.90,
    channel: "retail",
    visualArt: "/assets/vinagre-premium.jpg",
    isMaquila: false
  },
  {
    id: "STO001",
    name: "Salsa de Tomate Original",
    category: "Sauces",
    sku: "STO-400G",
    barcode: "7891234567891",
    currentStock: 280,
    targetStock: 400,
    margin: 28.0,
    salesTrend: 12,
    backorders: 15,
    unitCost: 1.20,
    sellingPrice: 1.68,
    profitability: 0.48,
    channel: "retail",
    visualArt: "/assets/salsa-tomate.jpg",
    isMaquila: false
  },
  {
    id: "MSV001",
    name: "Mango Salsa Verde",
    category: "Specialty Sauces",
    sku: "MSV-350ML",
    barcode: "7891234567892",
    currentStock: 120,
    targetStock: 200,
    margin: 18.5,
    salesTrend: -23,
    backorders: 8,
    unitCost: 2.10,
    sellingPrice: 2.58,
    profitability: 0.48,
    channel: "gourmet",
    visualArt: "/assets/mango-salsa.jpg",
    isMaquila: true
  },
  {
    id: "CSX001",
    name: "Condimento Super Xtra",
    category: "Seasonings",
    sku: "CSX-250G",
    barcode: "7891234567893",
    currentStock: 90,
    targetStock: 300,
    margin: 35.0,
    salesTrend: 8,
    backorders: 12,
    unitCost: 0.95,
    sellingPrice: 1.46,
    profitability: 0.51,
    channel: "retail",
    visualArt: "/assets/condimento-xtra.jpg",
    isMaquila: false
  },
  {
    id: "AER001",
    name: "Aderezo El Rey",
    category: "Dressings",
    sku: "AER-300ML",
    barcode: "7891234567894",
    currentStock: 180,
    targetStock: 250,
    margin: 25.5,
    salesTrend: 5,
    backorders: 8,
    unitCost: 1.45,
    sellingPrice: 1.95,
    profitability: 0.50,
    channel: "retail",
    visualArt: "/assets/aderezo-rey.jpg",
    isMaquila: false
  },
  {
    id: "MAY001",
    name: "Mayonesa 400g",
    category: "Condiments",
    sku: "MAY-400G",
    barcode: "7891234567895",
    currentStock: 340,
    targetStock: 500,
    margin: 24.0,
    salesTrend: -25,
    backorders: 22,
    unitCost: 1.15,
    sellingPrice: 1.52,
    profitability: 0.37,
    channel: "retail",
    visualArt: "/assets/mayonesa.jpg",
    isMaquila: false
  },
  {
    id: "STY001",
    name: "Salsa Teriyaki 300ml",
    category: "Specialty Sauces",
    sku: "STY-300ML",
    barcode: "7891234567896",
    currentStock: 85,
    targetStock: 150,
    margin: 31.5,
    salesTrend: -15,
    backorders: 0,
    unitCost: 1.80,
    sellingPrice: 2.65,
    profitability: 0.85,
    channel: "gourmet",
    visualArt: "/assets/teriyaki.jpg",
    isMaquila: true
  }
];

export const regions: Region[] = [
  {
    name: "Chiriquí",
    target: 150000,
    current: 125000,
    salesRep: "María González",
    keyClients: ["Supermercados Rey David", "Mini Super Chiriquí"],
    performance: 83.3
  },
  {
    name: "Colón",
    target: 120000,
    current: 80000,
    salesRep: "Carlos Mendoza",
    keyClients: ["El Extra Colón", "Distribuidora Atlántico"],
    performance: 66.7
  },
  {
    name: "San Miguelito",
    target: 100000,
    current: 95000,
    salesRep: "Ana Patricia Ruiz",
    keyClients: ["Super 99", "Metro Plus"],
    performance: 95.0
  },
  {
    name: "Santiago",
    target: 80000,
    current: 78000,
    salesRep: "José Luis Vargas",
    keyClients: ["Rey Santiago", "Supermercado Central"],
    performance: 97.5
  }
];

export const clients: Client[] = [
  {
    name: "Supermercados Rey",
    region: "Chiriquí",
    monthlyVolume: 45000,
    paymentTerms: "30 days",
    lastOrder: "2024-06-03",
    riskLevel: "low"
  },
  {
    name: "El Extra",
    region: "Colón",
    monthlyVolume: 35000,
    paymentTerms: "45 days",
    lastOrder: "2024-06-01",
    riskLevel: "medium"
  },
  {
    name: "Mini Super",
    region: "Santiago",
    monthlyVolume: 28000,
    paymentTerms: "15 days",
    lastOrder: "2024-06-04",
    riskLevel: "low"
  },
  {
    name: "Distribuidora Atlántico",
    region: "Colón",
    monthlyVolume: 22000,
    paymentTerms: "60 days",
    lastOrder: "2024-05-28",
    riskLevel: "high"
  },
  {
    name: "Super99",
    region: "San Miguelito",
    monthlyVolume: 38000,
    paymentTerms: "30 days",
    lastOrder: "2024-06-04",
    riskLevel: "medium"
  },
  {
    name: "El Machetazo",
    region: "La Chorrera",
    monthlyVolume: 15000,
    paymentTerms: "15 days",
    lastOrder: "2024-06-03",
    riskLevel: "low"
  }
];

export interface StoreData {
  storeName: string;
  chain: string;
  location: string;
  monthlyTarget: number;
  currentPerformance: number;
  lastStockout: string;
  topProducts: string[];
  competitorActivity: string;
}

export const storePerformance: StoreData[] = [
  {
    storeName: "Super99 San Miguelito",
    chain: "Super99",
    location: "San Miguelito",
    monthlyTarget: 12000,
    currentPerformance: 9840, // 82% of target
    lastStockout: "2024-06-01",
    topProducts: ["Vinagre Premium", "Salsa de Tomate Original"],
    competitorActivity: "Kraft sauce promotion launched May 2"
  },
  {
    storeName: "Super99 Tocumen",
    chain: "Super99", 
    location: "Tocumen",
    monthlyTarget: 10000,
    currentPerformance: 8200,
    lastStockout: "2024-05-30",
    topProducts: ["Mayonesa 400g", "Aderezo El Rey"],
    competitorActivity: "Maggi display expansion"
  },
  {
    storeName: "El Machetazo La Chorrera",
    chain: "El Machetazo",
    location: "La Chorrera", 
    monthlyTarget: 8000,
    currentPerformance: 7200,
    lastStockout: "2024-06-02",
    topProducts: ["Condimento Super Xtra"],
    competitorActivity: "Local brand promotion active"
  }
];

export const salesReps: SalesRep[] = [
  {
    id: "REP001",
    name: "María González",
    region: "Chiriquí",
    target: 150000,
    achieved: 125000,
    performance: 83.3,
    phone: "+507 6789-1234",
    email: "maria.gonzalez@ladona.com",
    extension: "1234",
    dailyRoute: ["Rey David", "Mini Super Chiriquí", "Distribuidora Oeste"],
    lateArrivals: 3,
    visitedToday: ["Rey David", "Mini Super Chiriquí"],
    missedVisits: ["Distribuidora Oeste"],
    clientsWithoutOrders: [{client: "Mini Super Chiriquí", reason: "Budget constraints"}]
  },
  {
    id: "REP002",
    name: "Carlos Mendoza",
    region: "Colón",
    target: 120000,
    achieved: 80000,
    performance: 66.7,
    phone: "+507 6789-5678",
    email: "carlos.mendoza@ladona.com",
    extension: "1235",
    dailyRoute: ["El Extra Colón", "Distribuidora Atlántico", "Super Central"],
    lateArrivals: 7,
    visitedToday: ["El Extra Colón"],
    missedVisits: ["Distribuidora Atlántico", "Super Central"],
    clientsWithoutOrders: [{client: "El Extra Colón", reason: "Inventory full"}, {client: "Distribuidora Atlántico", reason: "Payment delay"}]
  },
  {
    id: "REP003",
    name: "Ana Patricia Ruiz",
    region: "San Miguelito",
    target: 100000,
    achieved: 95000,
    performance: 95.0,
    phone: "+507 6789-9012",
    email: "ana.ruiz@ladona.com",
    extension: "1236",
    dailyRoute: ["Super99", "Metro Plus", "Supermercado Nacional"],
    lateArrivals: 1,
    visitedToday: ["Super99", "Metro Plus", "Supermercado Nacional"],
    missedVisits: [],
    clientsWithoutOrders: []
  },
  {
    id: "REP004",
    name: "José Luis Vargas",
    region: "Santiago",
    target: 80000,
    achieved: 78000,
    performance: 97.5,
    phone: "+507 6789-3456",
    email: "jose.vargas@ladona.com",
    extension: "1237",
    dailyRoute: ["Rey Santiago", "Supermercado Central", "Mini Market"],
    lateArrivals: 0,
    visitedToday: ["Rey Santiago", "Supermercado Central"],
    missedVisits: ["Mini Market"],
    clientsWithoutOrders: [{client: "Mini Market", reason: "Competitor exclusive deal"}]
  }
];

export const marketIntelligence = {
  competitors: {
    maggi: {
      marketShare: 28,
      recentActions: "Launched new packaging campaign",
      strengths: ["Brand recognition", "Distribution network"],
      weaknesses: ["Higher pricing", "Limited local flavors"]
    },
    knorr: {
      marketShare: 22,
      recentActions: "Price reduction on core products",
      strengths: ["Product variety", "Quality perception"],
      weaknesses: ["Complex SKU portfolio", "Slow innovation"]
    },
    localBrands: {
      marketShare: 15,
      recentActions: "Increased presence in rural areas",
      strengths: ["Local taste preferences", "Competitive pricing"],
      weaknesses: ["Limited marketing budget", "Quality inconsistency"]
    }
  },
  economicFactors: {
    gdpGrowth: 3.8,
    inflation: 2.1,
    currencyStability: "Stable USD peg",
    consumerConfidence: 72
  },
  industryTrends: {
    organicGrowth: 12,
    foodServiceRecovery: 8,
    digitalizationAdoption: 25,
    packagingCostIncrease: 5
  }
};

// Historical performance data for forecasting
export const historicalData = {
  promotionPerformance: [
    { product: "Vinagre Premium", store: "Super99", promoType: "15% discount", lift: 23, duration: "1 week", date: "2024-04-15" },
    { product: "Salsa de Tomate Original", store: "Rey", promoType: "Bundle offer", lift: 18, duration: "2 weeks", date: "2024-04-01" },
    { product: "Mayonesa 400g", store: "Super99", promoType: "Buy 2 get 1", lift: 31, duration: "1 week", date: "2024-03-20" },
    { product: "BBQ Sauce", store: "Super99", promoType: "End cap display", lift: 11, duration: "1 week", date: "2024-03-10" },
    { product: "Chimichurri", store: "Rey David", promoType: "Price reduction", lift: 6, duration: "2 weeks", date: "2024-02-28" }
  ],
  seasonalTrends: {
    "Vinagre Premium": { q1: 1.2, q2: 0.9, q3: 0.8, q4: 1.1 },
    "BBQ Sauce": { q1: 0.8, q2: 1.3, q3: 1.4, q4: 0.9 },
    "Mayonesa 400g": { q1: 1.0, q2: 1.1, q3: 1.0, q4: 1.2 },
    "Chimichurri": { q1: 0.9, q2: 1.0, q3: 1.1, q4: 1.0 }
  },
  competitorImpact: [
    { competitor: "Kraft", action: "promotion", impactOnLaDona: -8, recoveryDays: 14 },
    { competitor: "Maggi", action: "new product launch", impactOnLaDona: -5, recoveryDays: 21 },
    { competitor: "Knorr", action: "price reduction", impactOnLaDona: -12, recoveryDays: 10 }
  ]
};

// Comprehensive sales data for analytics
export const salesData: SalesData[] = [
  { date: "2024-06-04", product: "Vinagre Premium", store: "Super99 San Miguelito", chain: "Super99", quantity: 18, revenue: 49.50, promotion: "15% discount" },
  { date: "2024-06-04", product: "Mayonesa 400g", store: "Rey David", chain: "Rey", quantity: 24, revenue: 36.48 },
  { date: "2024-06-04", product: "Salsa Teriyaki 300ml", store: "Super99 San Miguelito", chain: "Super99", quantity: 0, revenue: 0 },
  { date: "2024-06-04", product: "Salsa Teriyaki 300ml", store: "Super99 Tocumen", chain: "Super99", quantity: 0, revenue: 0 },
  { date: "2024-06-04", product: "Condimento Super Xtra", store: "El Extra Colón", chain: "El Extra", quantity: 12, revenue: 17.52 },
  { date: "2024-06-03", product: "Vinagre Premium", store: "Rey Santiago", chain: "Rey", quantity: 22, revenue: 60.50 },
  { date: "2024-06-03", product: "Mango Salsa Verde", store: "Gourmet Market", chain: "Independent", quantity: 8, revenue: 20.64, promotion: "bundle offer" }
];

export const promotions: PromotionData[] = [
  {
    id: "PROMO001",
    name: "Scanner Vinagre Premium May",
    product: "Vinagre Premium",
    type: "scanner",
    startDate: "2024-05-01",
    endDate: "2024-05-31",
    investment: 2500,
    totalSales: 15800,
    roi: 532,
    stores: ["Super99", "Rey", "El Extra"]
  },
  {
    id: "PROMO002", 
    name: "BBQ Display Campaign",
    product: "BBQ Sauce",
    type: "display",
    startDate: "2024-05-15",
    endDate: "2024-05-29",
    investment: 1800,
    totalSales: 8950,
    roi: 397,
    stores: ["Super99"]
  },
  {
    id: "PROMO003",
    name: "Mayonesa Bundle Offer",
    product: "Mayonesa 400g",
    type: "bundle",
    startDate: "2024-04-01",
    endDate: "2024-04-30",
    investment: 3200,
    totalSales: 21450,
    roi: 570,
    stores: ["Rey", "Mini Super", "El Extra"]
  }
];

export const stockStatus: StockData[] = [
  { product: "Mayonesa 400g", store: "Rey David", currentStock: 0, isOutOfStock: true, lastRestockDate: "2024-05-28", reorderPoint: 50 },
  { product: "Mayonesa 400g", store: "Rey Bugaba", currentStock: 0, isOutOfStock: true, lastRestockDate: "2024-05-30", reorderPoint: 30 },
  { product: "Condimento Super Xtra", store: "El Extra Colón", currentStock: 0, isOutOfStock: true, lastRestockDate: "2024-06-01", reorderPoint: 25 },
  { product: "Salsa Teriyaki 300ml", store: "Super99 San Miguelito", currentStock: 12, isOutOfStock: false, lastRestockDate: "2024-05-25", reorderPoint: 10 },
  { product: "Vinagre Premium", store: "Rey Santiago", currentStock: 45, isOutOfStock: false, lastRestockDate: "2024-06-02", reorderPoint: 30 }
];

export const todayInvoices: InvoiceData[] = [
  {
    id: "INV-20240605-001",
    date: "2024-06-05",
    client: "Super99",
    amount: 4580.50,
    products: [
      { sku: "VP-500ML", quantity: 48, unitPrice: 2.75 },
      { sku: "STO-400G", quantity: 72, unitPrice: 1.68 },
      { sku: "MAY-400G", quantity: 96, unitPrice: 1.52 }
    ],
    status: "pending"
  },
  {
    id: "INV-20240605-002",
    date: "2024-06-05",
    client: "Rey David",
    amount: 2340.80,
    products: [
      { sku: "AER-300ML", quantity: 60, unitPrice: 1.95 },
      { sku: "CSX-250G", quantity: 84, unitPrice: 1.46 }
    ],
    status: "pending"
  }
];

export const channels: ChannelData[] = [
  { name: "Retail", totalSKUs: 24, activeClients: 156, branches: 89 },
  { name: "Gourmet", totalSKUs: 8, activeClients: 34, branches: 12 },
  { name: "Export", totalSKUs: 15, activeClients: 8, branches: 0 },
  { name: "EPA", totalSKUs: 12, activeClients: 23, branches: 15 }
];

// Daily sales activity tracking
export const recentActivity = {
  yesterdaySales: [
    { product: "Salsa Teriyaki 300ml", store: "Super99 San Miguelito", sales: 0, inventory: 12 },
    { product: "Salsa Teriyaki 300ml", store: "Super99 Tocumen", sales: 0, inventory: 8 },
    { product: "Lime Juice 250ml", store: "El Machetazo La Chorrera", sales: 0, inventory: 15 },
    { product: "Mayonesa 400g", store: "Super99 San Miguelito", sales: 24, inventory: 45 },
    { product: "Vinagre Premium", store: "Supermercados Rey David", sales: 18, inventory: 32 }
  ],
  stockoutAlerts: [
    { product: "Mayonesa 400g", stores: ["Rey David", "Rey Bugaba"], lastBackorder: "2024-06-01", daysOut: 4 },
    { product: "Condimento Super Xtra", stores: ["El Extra Colón", "Mini Super Santiago"], lastBackorder: "2024-06-02", daysOut: 3 }
  ],
  competitorActivity: [
    { competitor: "Kraft", action: "Sauce promotion launch", date: "2024-05-02", impact: "Potential shelf space cannibalization" },
    { competitor: "Maggi", action: "Display expansion", date: "2024-05-28", stores: ["Super99 network"] },
    { competitor: "Knorr", action: "Price reduction on core products", date: "2024-05-25", impact: "5-8% price pressure" }
  ]
};

// Extended client data with full analytics support
export const extendedClients: ClientData[] = [
  {
    id: "CLI001",
    name: "Super99",
    type: "national",
    chain: "Super99",
    region: "San Miguelito",
    monthlyVolume: 38000,
    paymentTerms: "30 days",
    lastOrder: "2024-06-04",
    riskLevel: "medium",
    overdueDays: 45,
    overdueAmount: 12500,
    latitude: 9.0333,
    longitude: -79.5167,
    isActive: true,
    lastVisit: "2024-06-05",
    billingToday: 4580.50
  },
  {
    id: "CLI002",
    name: "Rey David",
    type: "national",
    chain: "Rey",
    region: "Chiriquí",
    monthlyVolume: 45000,
    paymentTerms: "30 days",
    lastOrder: "2024-06-03",
    riskLevel: "low",
    overdueDays: 0,
    overdueAmount: 0,
    latitude: 8.4177,
    longitude: -82.4333,
    isActive: true,
    lastVisit: "2024-06-05",
    billingToday: 2340.80
  },
  {
    id: "CLI003",
    name: "Distribuidora Atlántico",
    type: "national",
    chain: "El Extra",
    region: "Colón",
    monthlyVolume: 22000,
    paymentTerms: "60 days",
    lastOrder: "2024-05-28",
    riskLevel: "high",
    overdueDays: 135,
    overdueAmount: 24300,
    latitude: 9.3547,
    longitude: -79.9000,
    isActive: true,
    lastVisit: "2024-06-02",
    billingToday: 0
  },
  {
    id: "CLI004",
    name: "Exportadora Panama Inc",
    type: "export",
    chain: "Export",
    region: "Panama City",
    monthlyVolume: 15000,
    paymentTerms: "15 days",
    lastOrder: "2024-06-04",
    riskLevel: "low",
    overdueDays: 0,
    overdueAmount: 0,
    latitude: 8.9833,
    longitude: -79.5167,
    isActive: true,
    lastVisit: "2024-06-04",
    billingToday: 0
  },
  {
    id: "CLI005",
    name: "EPA Chiriquí",
    type: "epa",
    chain: "EPA",
    region: "Chiriquí",
    monthlyVolume: 8500,
    paymentTerms: "45 days",
    lastOrder: "2024-06-03",
    riskLevel: "medium",
    overdueDays: 20,
    overdueAmount: 3200,
    latitude: 8.4333,
    longitude: -82.4167,
    isActive: true,
    lastVisit: "2024-06-03",
    billingToday: 0
  }
];

export function buildBusinessContext() {
  const currentDate = new Date().toISOString().split('T')[0];
  const totalBilling = todayInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalBackorders = products.reduce((sum, p) => sum + (p.backorders || 0), 0);
  const outOfStockCount = stockStatus.filter(s => s.isOutOfStock).length;
  
  return {
    products,
    regions,
    clients,
    extendedClients,
    salesReps,
    storePerformance,
    salesData,
    promotions,
    stockStatus,
    todayInvoices,
    channels,
    historicalData,
    recentActivity,
    marketIntelligence,
    keyMetrics: {
      totalBackorders,
      totalBillingToday: totalBilling,
      outOfStockProducts: outOfStockCount,
      averageMargin: products.reduce((sum, p) => sum + p.margin, 0) / products.length,
      underperformingRegions: regions.filter(r => r.performance < 80).length,
      underperformingStores: storePerformance.filter(s => (s.currentPerformance / s.monthlyTarget) < 0.9).length,
      highRiskClients: extendedClients.filter(c => c.riskLevel === 'high').length,
      overdueClients: extendedClients.filter(c => c.overdueDays > 120).length,
      zeroSalesProducts: recentActivity.yesterdaySales.filter(s => s.sales === 0 && s.inventory > 0).length,
      totalActiveClients: extendedClients.filter(c => c.isActive).length,
      totalSKUs: channels.reduce((sum, ch) => sum + ch.totalSKUs, 0),
      lateArrivalsThisMonth: salesReps.reduce((sum, rep) => sum + rep.lateArrivals, 0)
    },
    
    // Enhanced data for suggested prompts coverage
    cashFlowAnalysis: {
      totalOutstanding: 127850.30,
      overdueAccounts: [
        {client: "Super99", amount: 14580.50, daysPastDue: 45, riskLevel: "high", lastPayment: "2024-11-15"},
        {client: "El Machetazo", amount: 8240.80, daysPastDue: 32, riskLevel: "medium", lastPayment: "2024-12-01"},
        {client: "Xtra", amount: 5680.20, daysPastDue: 28, riskLevel: "medium", lastPayment: "2024-12-05"}
      ],
      cashPosition: 89340.75,
      creditUtilization: 0.51,
      collectionsTarget: 95000.00
    },
    
    stockoutAnalysis: {
      criticalStockouts: [
        {product: "Mayonesa Clásica 500ml", sku: "SKU001", revenueImpact: 12500.00, affectedStores: 8, priority: "critical"},
        {product: "Vinagre Blanco 750ml", sku: "SKU045", revenueImpact: 8750.00, affectedStores: 5, priority: "high"},
        {product: "Salsa Picante Premium", sku: "SKU078", revenueImpact: 6200.00, affectedStores: 12, priority: "high"}
      ],
      totalRevenueAtRisk: 36650.00,
      restockTimeline: "3-5 days",
      alternativeProducts: ["Mayonesa Premium 500ml", "Vinagre Premium 750ml"]
    },
    
    regionalActionPlan: {
      underperformingAnalysis: [
        {
          region: "Colón", 
          currentPerformance: 67, 
          target: 85, 
          gap: -18,
          revenueShortfall: 28050.00,
          rootCauses: ["Limited store coverage", "Competitor promotions", "Route optimization needed"],
          immediateActions: ["Deploy promotional support", "Increase visit frequency", "Territory restructure"],
          timeline: "30 days",
          expectedImpact: "+12% performance"
        },
        {
          region: "Coclé", 
          currentPerformance: 85, 
          target: 92, 
          gap: -7,
          revenueShortfall: 10800.00,
          rootCauses: ["Product mix suboptimal", "New competitor entry"],
          immediateActions: ["Focus on high-margin products", "Client relationship strengthening"],
          timeline: "15 days",
          expectedImpact: "+5% performance"
        }
      ]
    },
    
    topPerformerInsights: {
      salesRepLeaders: salesReps.filter(rep => rep.performance > 100).sort((a, b) => b.performance - a.performance),
      productStars: products.filter(p => p.salesTrend > 15).sort((a, b) => b.margin - a.margin),
      regionChampions: regions.filter(r => r.performance > 90).sort((a, b) => b.performance - a.performance),
      successFactors: ["Premium product focus", "Strong client relationships", "Consistent territory coverage"]
    },
    
    clientGrowthOpportunities: {
      topClients: extendedClients
        .filter(c => c.isActive)
        .sort((a, b) => b.monthlyVolume - a.monthlyVolume)
        .slice(0, 5)
        .map(client => ({
          ...client,
          growthPotential: client.monthlyVolume * 0.25,
          recommendedActions: ["Introduce premium lines", "Increase visit frequency", "Promotional support"],
          expectedGrowth: "15-25%"
        }))
    },
    
    promotionalPerformance: {
      activeROIAnalysis: promotions.map(promo => ({
        ...promo,
        efficiency: promo.roi > 200 ? "excellent" : promo.roi > 150 ? "good" : "needs improvement",
        recommendedAction: promo.roi > 200 ? "expand" : promo.roi > 150 ? "optimize" : "review/discontinue"
      })),
      bestPerformers: promotions.filter(p => p.roi > 200),
      improvementNeeded: promotions.filter(p => p.roi < 150)
    },
    
    territoryOptimization: {
      routeEfficiency: salesReps.map(rep => ({
        name: rep.name,
        region: rep.region,
        dailyRoute: rep.dailyRoute,
        efficiency: rep.dailyRoute.length / 8, // clients per hour
        optimizationPotential: rep.missedVisits.length > 0 ? "high" : "medium",
        suggestedImprovements: [
          "Cluster visits by geography",
          "Prioritize high-value clients",
          "Reduce travel time between stops"
        ]
      }))
    },
    
    competitiveIntelligence: {
      marketPosition: "Strong regional leader in condiments",
      mainCompetitors: ["Heinz", "Hellmann's", "Local brands"],
      competitiveAdvantages: ["Local production", "Price positioning", "Distribution network"],
      marketThreats: ["Import competition", "Price pressure", "Retail consolidation"],
      marketShare: 0.34,
      growthRate: "+12.5% YoY"
    },
    
    dailyBusinessSummary: {
      todayHighlights: [
        `Revenue: $${totalBilling.toLocaleString()} (${totalBilling > 25000 ? "Above" : "Below"} target)`,
        `Active invoices: ${todayInvoices.length}`,
        `Stock alerts: ${outOfStockCount} products`,
        `Risk clients: ${extendedClients.filter(c => c.riskLevel === 'high').length}`,
        `Top performer: ${salesReps.sort((a, b) => b.performance - a.performance)[0]?.name || 'N/A'}`
      ],
      keyActions: [
        "Follow up on overdue accounts",
        "Restock critical products",
        "Support underperforming regions",
        "Capitalize on promotional opportunities"
      ]
    },
    currentDate,
    timestamp: new Date().toISOString()
  };
}