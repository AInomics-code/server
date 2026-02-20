import { ENV_CONFIG } from '@/config/env';
import { getAuthHeaders } from '@/utils/auth';

export interface ScoreBreakdown {
  stock_availability?: number;
  rotation_quality?: number;
  reorder_management?: number;
  profitability?: number;
  active_product_coverage?: number;
  seller_goal_attainment?: number;
  client_portfolio_rfm?: number;
  fulfillment_efficiency?: number;
  product_dynamics_bcg?: number;
  overall_profitability?: number;
}

export interface HealthScore {
  score: number;
  label: "Excellent" | "Healthy" | "Needs Attention" | "Critical";
  period: string;
  breakdown: ScoreBreakdown;
  inputs: Record<string, unknown>;
}

export interface HealthScoresResponse {
  period: string;
  computed_at: string;
  inventory: HealthScore;
  sales: HealthScore;
}

export async function fetchHealthScores(): Promise<HealthScoresResponse> {
  // Use same pattern as agentService - empty string in dev uses Vite proxy
  const API_BASE = ENV_CONFIG.API_URL || '';
  const endpoint = API_BASE ? `${API_BASE}/api/health-scores` : '/api/health-scores';
  
  console.log('Fetching health scores from:', endpoint); // Debug log
  
  const res = await fetch(endpoint, {
    headers: getAuthHeaders(),
    method: 'GET',
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    console.error('Health scores API error:', res.status, errorText);
    
    if (res.status === 401) {
      throw new Error('Not authenticated');
    }
    if (res.status === 404) {
      throw new Error('No sales data found in the database.');
    }
    throw new Error(`Health scores error: ${res.status} - ${errorText}`);
  }
  
  const data = await res.json();
  console.log('Health scores response:', data); // Debug log
  return data;
}
