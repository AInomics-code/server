/**
 * Mock service for frontend design development
 * Generates realistic mock responses without backend
 */

import { QueryResponse, Component } from './agentService';

// ============================================================================
// MOCK MODE FLAG - Set to true to use mock responses
// ============================================================================
export const MOCK_MODE = false; // Set to true for mock responses during development

/**
 * Generate a mock response based on the query
 */
export function generateMockResponse(query: string): QueryResponse {
  const queryLower = query.toLowerCase();
  
  // Generate session ID
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Different responses based on query keywords
  if (queryLower.includes('backorder') || queryLower.includes('back order')) {
    return generateBackorderResponse(sessionId);
  } else if (queryLower.includes('sales') || queryLower.includes('venta')) {
    return generateSalesResponse(sessionId);
  } else if (queryLower.includes('health') || queryLower.includes('salud')) {
    return generateHealthResponse(sessionId);
  } else if (queryLower.includes('inventory') || queryLower.includes('inventario')) {
    return generateInventoryResponse(sessionId);
  } else if (queryLower.includes('report') || queryLower.includes('reporte')) {
    return generateReportResponse(sessionId);
  } else {
    return generateGenericResponse(query, sessionId);
  }
}

function generateBackorderResponse(sessionId: string): QueryResponse {
  return {
    message: [
      {
        type: 'text',
        data: `## Backorder Health Report - January 2026\n\nTotal Backorder Quantity: **54,032 units**\n\nTotal Backorder Value: **$571,928.16**\n\nUnique Products: **159**\n\nUnique Clients: **1,883**\n\nTotal Orders: **10,042**\n\nAverage Delay: **0 days** (all orders within expected delivery window)`
      },
      {
        type: 'text',
        data: `### Comparisons to Previous Month (December 2025)\n\n- **Quantity**: ↑ +79.76% (from 30,058 to 54,032 units)\n- **Value**: ↓ -2.74% (from $588,046 to $571,928)`
      },
      {
        type: 'bar_chart',
        data: {
          title: 'Backorder by Month',
          x_axis_label: 'Month',
          y_axis_label: 'Backorder (USD)',
          datasets: [
            {
              label: 'Backorder',
              data: [
                { x: 'Jan', y: 120000 },
                { x: 'Feb', y: 135000 },
                { x: 'Mar', y: 128000 },
                { x: 'Apr', y: 142500 },
                { x: 'May', y: 155000 },
                { x: 'Jun', y: 124590 }
              ]
            }
          ]
        }
      },
      {
        type: 'text',
        data: `### Top 5 Products by Backorder Value\n\n1. **Product A**: $45,230 (234 units)\n2. **Product B**: $38,450 (189 units)\n3. **Product C**: $32,100 (156 units)\n4. **Product D**: $28,900 (142 units)\n5. **Product E**: $25,600 (128 units)`
      }
    ],
    metadata: {
      session_id: sessionId,
      query_type: 'simple',
      latency_ms: 1234.56,
      type: 'simple_agent'
    }
  };
}

function generateSalesResponse(sessionId: string): QueryResponse {
  return {
    message: [
      {
        type: 'text',
        data: `## Sales Analysis - January 2026\n\nTotal Sales: **$1,245,890.50**\n\nGrowth: **+8.5%** compared to December 2024\n\nTop Performing Category: **Electronics** with $450,000`
      },
      {
        type: 'line_chart',
        data: {
          title: 'Sales Trend - Last 6 Months',
          x_axis_label: 'Month',
          y_axis_label: 'Sales (USD)',
          datasets: [
            {
              label: 'Sales',
              data: [
                { x: 'Aug', y: 1150000 },
                { x: 'Sep', y: 1210000 },
                { x: 'Oct', y: 1175000 },
                { x: 'Nov', y: 1280000 },
                { x: 'Dec', y: 1245000 },
                { x: 'Jan', y: 1245890 }
              ]
            }
          ]
        }
      },
      {
        type: 'pie_chart',
        data: {
          title: 'Sales by Category',
          datasets: [
            {
              label: 'Categories',
              data: [
                { label: 'Electronics', value: 450000 },
                { label: 'Clothing', value: 320000 },
                { label: 'Food', value: 230000 },
                { label: 'Other', value: 245890 }
              ]
            }
          ]
        }
      }
    ],
    metadata: {
      session_id: sessionId,
      query_type: 'dynamic',
      latency_ms: 2345.67,
      type: 'dynamic'
    }
  };
}

function generateHealthResponse(sessionId: string): QueryResponse {
  return {
    message: [
      {
        type: 'text',
        data: `## Daily Health Check\n\n**Overall Status**: ✅ Healthy\n\n- **System Uptime**: 99.8%\n- **Active Users**: 1,234\n- **API Response Time**: 245ms average\n- **Database Performance**: Optimal`
      },
      {
        type: 'bar_chart',
        data: {
          title: 'System Metrics - Last 7 Days',
          x_axis_label: 'Day',
          y_axis_label: 'Uptime (%)',
          datasets: [
            {
              label: 'Uptime',
              data: [
                { x: 'Mon', y: 99.9 },
                { x: 'Tue', y: 99.8 },
                { x: 'Wed', y: 99.7 },
                { x: 'Thu', y: 99.9 },
                { x: 'Fri', y: 99.8 },
                { x: 'Sat', y: 99.6 },
                { x: 'Sun', y: 99.9 }
              ]
            }
          ]
        }
      }
    ],
    metadata: {
      session_id: sessionId,
      query_type: 'simple',
      latency_ms: 890.12,
      type: 'simple_agent'
    }
  };
}

function generateInventoryResponse(sessionId: string): QueryResponse {
  return {
    message: [
      {
        type: 'text',
        data: `## Inventory Checkup\n\n**Total SKUs**: 2,456\n\n**Low Stock Items**: 23 (0.9%)\n\n**Out of Stock**: 5 (0.2%)\n\n**Average Stock Level**: 85%`
      },
      {
        type: 'text',
        data: `### Alerts\n\n⚠️ **5 items** need immediate restocking:\n\n1. Product X - 0 units remaining\n2. Product Y - 2 units remaining\n3. Product Z - 1 unit remaining`
      },
      {
        type: 'bar_chart',
        data: {
          title: 'Inventory Levels by Category',
          x_axis_label: 'Category',
          y_axis_label: 'Stock Level (%)',
          datasets: [
            {
              label: 'Stock Level',
              data: [
                { x: 'Electronics', y: 92 },
                { x: 'Clothing', y: 78 },
                { x: 'Food', y: 85 },
                { x: 'Other', y: 88 }
              ]
            }
          ]
        }
      }
    ],
    metadata: {
      session_id: sessionId,
      query_type: 'simple',
      latency_ms: 1567.89,
      type: 'simple_agent'
    }
  };
}

function generateReportResponse(sessionId: string): QueryResponse {
  return {
    message: [
      {
        type: 'text',
        data: `## Generate Reports\n\n**Available Reports**:\n\n1. **Sales Report** - Monthly sales analysis\n2. **Inventory Report** - Stock levels and alerts\n3. **Backorder Report** - Pending orders analysis\n4. **Health Report** - System performance metrics`
      },
      {
        type: 'text',
        data: `### Report Generation\n\nSelect a report type to generate a detailed PDF export.`
      }
    ],
    metadata: {
      session_id: sessionId,
      query_type: 'simple',
      latency_ms: 567.34,
      type: 'simple_agent'
    }
  };
}

function generateGenericResponse(query: string, sessionId: string): QueryResponse {
  return {
    message: [
      {
        type: 'text',
        data: `## Response to: "${query}"\n\nThis is a **mock response** for design purposes.\n\nThe actual response will be generated by the backend AI agent when the system is fully operational.\n\n**Mock Data**:\n- Total Items: **1,234**\n- Status: **Active**\n- Last Updated: **January 2026**`
      },
      {
        type: 'text',
        data: `### Sample Chart Data\n\nThis chart demonstrates how data visualizations will appear in the final system.`
      },
      {
        type: 'bar_chart',
        data: {
          title: 'Sample Data Visualization',
          x_axis_label: 'Category',
          y_axis_label: 'Value',
          datasets: [
            {
              label: 'Sample',
              data: [
                { x: 'A', y: 100 },
                { x: 'B', y: 150 },
                { x: 'C', y: 120 },
                { x: 'D', y: 180 }
              ]
            }
          ]
        }
      }
    ],
    metadata: {
      session_id: sessionId,
      query_type: 'simple',
      latency_ms: 1234.56,
      type: 'simple_agent'
    }
  };
}

/**
 * Simulate API delay
 */
export function simulateApiDelay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000)); // 1-3 seconds
}
