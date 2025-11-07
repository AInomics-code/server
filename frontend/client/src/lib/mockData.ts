// mockData.ts

export interface KpiData {
  title: string;
  description: string;
  value: string;
}

export interface PromptData {
  title: string;
  description: string;
}

export const kpiData: KpiData[] = [
  {
    title: "Performance Score",
    description: "82% of sales target achieved",
    value: "88",
  },
  {
    title: "Risk Zones",
    description: "Chiriquí, Colón, San Miguelito",
    value: "3 Zones",
  },
  {
    title: "Product Opportunity",
    description: "High potential · Weak: Condimento Cebolla",
    value: "Sazón sin Sal",
  },
];

export const promptData: PromptData[] = [
  {
    title: "Calculate estimated backorder loss",
    description: "Predicted $527K in July - analyze actual vs forecast with recovery plan",
  },
  {
    title: "Analyze regional performance",
    description: "Get a breakdown of sales performance by region",
  },
  {
    title: "Identify underperforming areas",
    description: "Show KPIs not meeting targets with action plans",
  },
  {
    title: "Review slow-moving inventory",
    description: "Analyze products with low turnover rates",
  },
  {
    title: "Generate quarterly forecast",
    description: "Predict performance based on current trends",
  },
  {
    title: "Budget variance analysis",
    description: "Compare actual vs planned spending across departments",
  },
  {
    title: "Channel performance review",
    description: "Evaluate distribution channels and identify opportunities",
  },
];