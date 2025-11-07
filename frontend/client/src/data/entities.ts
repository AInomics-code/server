// Mock data for entities referenced in collaboration comments
export interface EntityData {
  id: string;
  title: string;
  type: 'kpi' | 'zone' | 'product' | 'report';
  description: string;
  value?: string;
  trend?: number[];
  lastUpdated: string;
}

export const entitiesData: Record<string, EntityData> = {
  'performance-score': {
    id: 'performance-score',
    title: 'Performance Score',
    type: 'kpi',
    description: 'Overall business performance index based on sales, efficiency, and customer satisfaction metrics.',
    value: '87.3%',
    trend: [82, 85, 89, 87, 91, 88, 87],
    lastUpdated: '2025-08-12T10:30:00Z'
  },
  'chiriqui': {
    id: 'chiriqui',
    title: 'Chiriquí Central',
    type: 'zone',
    description: 'Primary distribution zone covering central Chiriquí province with 15 active retail partners.',
    value: 'Active',
    trend: [95, 92, 88, 85, 87, 89, 91],
    lastUpdated: '2025-08-12T09:15:00Z'
  },
  'mango-salsa': {
    id: 'mango-salsa',
    title: 'Mango Salsa Verde',
    type: 'product',
    description: 'Premium artisanal mango salsa, top performer in condiment category.',
    value: '$12,450',
    trend: [8500, 9200, 10100, 11800, 12100, 12800, 12450],
    lastUpdated: '2025-08-12T08:45:00Z'
  },
  'q3-forecast': {
    id: 'q3-forecast',
    title: 'Q3 Sales Forecast',
    type: 'report',
    description: 'Quarterly sales projection analysis with market trends and growth opportunities.',
    value: '+15.2%',
    trend: [100, 105, 108, 112, 115, 118, 115],
    lastUpdated: '2025-08-12T07:30:00Z'
  },
  'inventory-turnover': {
    id: 'inventory-turnover',
    title: 'Inventory Turnover',
    type: 'kpi',
    description: 'Rate at which inventory is sold and replaced over time period.',
    value: '6.2x',
    trend: [5.8, 6.0, 6.1, 5.9, 6.3, 6.4, 6.2],
    lastUpdated: '2025-08-12T11:00:00Z'
  }
};

export const teamMembers = [
  { id: 'elena', name: 'Elena Rodriguez', role: 'Sales Director', avatar: 'ER', online: true },
  { id: 'miguel', name: 'Miguel Santos', role: 'Operations Manager', avatar: 'MS', online: true },
  { id: 'sofia', name: 'Sofia Chen', role: 'Analytics Lead', avatar: 'SC', online: false },
  { id: 'carlos', name: 'Carlos Mendez', role: 'Regional Manager', avatar: 'CM', online: true },
  { id: 'lucia', name: 'Lucia Morales', role: 'Data Scientist', avatar: 'LM', online: false }
];

export function getEntityById(id: string): EntityData | undefined {
  return entitiesData[id];
}

export function parseChips(text: string): Array<{type: string, value: string, id: string}> {
  const chipPattern = /#(kpi|zone|product|report):([^#\s,]+)/g;
  const chips: Array<{type: string, value: string, id: string}> = [];
  let match;
  
  while ((match = chipPattern.exec(text)) !== null) {
    const [, type, value] = match;
    const id = value.toLowerCase().replace(/\s+/g, '-');
    chips.push({ type, value, id });
  }
  
  return chips;
}