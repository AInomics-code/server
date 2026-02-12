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
        data: `## Backorder Health Report - January 2026\n\n### Executive Summary\n\nThe backorder situation has shown significant changes this month. While the total quantity of backordered items has increased substantially, the overall value has decreased slightly, indicating a shift toward lower-value items. The system is operating within acceptable parameters, with all orders remaining within expected delivery windows.\n\n### Key Metrics\n\n**Total Backorder Quantity**: **54,032 units**\n\n**Total Backorder Value**: **$571,928.16**\n\n**Unique Products Affected**: **159** (representing 6.5% of total product catalog)\n\n**Unique Clients Impacted**: **1,883** (representing 12.3% of active client base)\n\n**Total Orders in Backorder Status**: **10,042**\n\n**Average Delay**: **0 days** (all orders within expected delivery window)\n\n**Average Order Value**: **$56.95** per backordered unit`
      },
      {
        type: 'text',
        data: `### Month-over-Month Analysis (December 2025 → January 2026)\n\n**Quantity Changes**:\n- **Current Month**: 54,032 units\n- **Previous Month**: 30,058 units\n- **Change**: ↑ **+79.76%** (+23,974 units)\n- **Insight**: The significant increase in quantity suggests either increased demand or supply chain disruptions affecting multiple product lines.\n\n**Value Changes**:\n- **Current Month**: $571,928.16\n- **Previous Month**: $588,046.00\n- **Change**: ↓ **-2.74%** (-$16,117.84)\n- **Insight**: Despite the quantity increase, the value decrease indicates a shift toward lower-margin or lower-priced items, which may actually be a positive sign for inventory management.\n\n**Product Diversity**:\n- **Current**: 159 unique products\n- **Previous**: 142 unique products\n- **Change**: ↑ +12.0% (17 additional products)\n- **Insight**: The expansion of affected products suggests broader supply chain challenges rather than isolated product issues.`
      },
      {
        type: 'bar_chart',
        data: {
          title: 'Backorder Value Trend - Last 6 Months',
          x_axis_label: 'Month',
          y_axis_label: 'Backorder Value (USD)',
          datasets: [
            {
              label: 'Backorder Value',
              data: [
                { x: 'Aug', y: 118000 },
                { x: 'Sep', y: 128000 },
                { x: 'Oct', y: 124000 },
                { x: 'Nov', y: 132000 },
                { x: 'Dec', y: 170000 },
                { x: 'Jan', y: 124590 }
              ]
            }
          ]
        }
      },
      {
        type: 'text',
        data: `### Top 5 Products by Backorder Value\n\nThese products represent **$170,280** (29.8% of total backorder value) and require immediate attention:\n\n1. **Product A** (SKU: PROD-A-2024)\n   - Backorder Value: **$45,230**\n   - Units: **234**\n   - Average Unit Price: **$193.29**\n   - Expected Resolution: 5-7 business days\n   - Impact: High - affects 12 major clients\n\n2. **Product B** (SKU: PROD-B-2024)\n   - Backorder Value: **$38,450**\n   - Units: **189**\n   - Average Unit Price: **$203.44**\n   - Expected Resolution: 3-5 business days\n   - Impact: Medium - affects 8 major clients\n\n3. **Product C** (SKU: PROD-C-2024)\n   - Backorder Value: **$32,100**\n   - Units: **156**\n   - Average Unit Price: **$205.77**\n   - Expected Resolution: 7-10 business days\n   - Impact: High - affects 15 major clients\n\n4. **Product D** (SKU: PROD-D-2024)\n   - Backorder Value: **$28,900**\n   - Units: **142**\n   - Average Unit Price: **$203.52**\n   - Expected Resolution: 2-4 business days\n   - Impact: Low - affects 5 major clients\n\n5. **Product E** (SKU: PROD-E-2024)\n   - Backorder Value: **$25,600**\n   - Units: **128**\n   - Average Unit Price: **$200.00**\n   - Expected Resolution: 4-6 business days\n   - Impact: Medium - affects 9 major clients`
      },
      {
        type: 'text',
        data: `### Client Impact Analysis\n\n**Distribution by Client Size**:\n- **Enterprise Clients** (100+ orders): 23 clients affected, representing $245,000 (42.8% of total value)\n- **Mid-Market Clients** (20-99 orders): 156 clients affected, representing $198,500 (34.7% of total value)\n- **Small Business Clients** (<20 orders): 1,704 clients affected, representing $128,428 (22.5% of total value)\n\n**Geographic Distribution**:\n- **North America**: 45% of backorder value ($257,367)\n- **Europe**: 32% of backorder value ($183,017)\n- **Asia-Pacific**: 18% of backorder value ($102,947)\n- **Other Regions**: 5% of backorder value ($28,597)\n\n### Recommendations\n\n1. **Immediate Actions**:\n   - Prioritize restocking for Products A, B, and C (top 3 by value)\n   - Contact suppliers for expedited shipping on high-impact items\n   - Implement automated alerts for products approaching backorder thresholds\n\n2. **Short-term Strategy** (Next 30 days):\n   - Review inventory forecasting models for the 159 affected products\n   - Negotiate better terms with suppliers for high-volume backorder items\n   - Consider alternative suppliers for products with recurring backorder issues\n\n3. **Long-term Strategy** (Next Quarter):\n   - Analyze root causes of the 79.76% quantity increase\n   - Implement predictive analytics to anticipate demand spikes\n   - Develop contingency plans for supply chain disruptions\n\n### Risk Assessment\n\n**Current Risk Level**: **Medium**\n\n- **Positive Factors**: All orders within delivery windows, value decrease despite quantity increase\n- **Concerns**: Significant quantity increase, expansion to more product lines, potential client satisfaction impact\n- **Monitoring Required**: Daily tracking of top 10 products by backorder value`
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
        data: `## Sales Performance Analysis - January 2026\n\n### Executive Summary\n\nJanuary 2026 demonstrates strong sales performance with consistent growth across multiple categories. The month closed with **$1,245,890.50** in total sales, representing an **8.5% increase** compared to December 2024 and a **12.3% increase** compared to January 2025. The Electronics category continues to lead performance, while emerging categories show promising growth trajectories.\n\n### Key Performance Indicators\n\n**Total Sales Revenue**: **$1,245,890.50**\n\n**Month-over-Month Growth**: **+8.5%** (vs. December 2024: $1,147,890)\n\n**Year-over-Year Growth**: **+12.3%** (vs. January 2025: $1,109,450)\n\n**Average Order Value**: **$156.23**\n\n**Total Transactions**: **7,974**\n\n**Top Performing Category**: **Electronics** - $450,000 (36.1% of total sales)\n\n**Fastest Growing Category**: **Clothing** - +15.2% MoM growth\n\n**Customer Acquisition**: **342 new customers** this month`
      },
      {
        type: 'text',
        data: `### Detailed Category Breakdown\n\n**1. Electronics** - $450,000 (36.1% of total)\n   - Growth: +6.8% MoM\n   - Top Products: Smart devices, accessories, computing equipment\n   - Average Order Value: $187.50\n   - Customer Segment: Primarily B2B (68% of sales)\n   - Market Position: Strong, maintaining category leadership\n\n**2. Clothing** - $320,000 (25.7% of total)\n   - Growth: +15.2% MoM (fastest growing)\n   - Top Products: Seasonal collections, professional wear\n   - Average Order Value: $142.30\n   - Customer Segment: Mixed B2B/B2C (45% B2B, 55% B2C)\n   - Market Position: Expanding rapidly, capitalizing on seasonal trends\n\n**3. Food** - $230,000 (18.5% of total)\n   - Growth: +4.2% MoM\n   - Top Products: Premium food items, specialty products\n   - Average Order Value: $98.75\n   - Customer Segment: Primarily B2C (72% of sales)\n   - Market Position: Stable, consistent performance\n\n**4. Other Categories** - $245,890.50 (19.7% of total)\n   - Growth: +9.1% MoM\n   - Includes: Home goods, accessories, miscellaneous items\n   - Average Order Value: $134.20\n   - Customer Segment: Diverse mix\n   - Market Position: Diversified portfolio showing healthy growth`
      },
      {
        type: 'line_chart',
        data: {
          title: 'Sales Trend Analysis - Last 6 Months',
          x_axis_label: 'Month',
          y_axis_label: 'Sales Revenue (USD)',
          datasets: [
            {
              label: 'Total Sales',
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
          title: 'Sales Distribution by Category',
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
      },
      {
        type: 'text',
        data: `### Regional Performance Analysis\n\n**North America**: $498,356 (40.0% of total)\n- Growth: +7.2% MoM\n- Key Markets: United States (75%), Canada (25%)\n- Top Category: Electronics (42% of regional sales)\n\n**Europe**: $373,767 (30.0% of total)\n- Growth: +9.8% MoM\n- Key Markets: UK (35%), Germany (28%), France (22%), Others (15%)\n- Top Category: Clothing (38% of regional sales)\n\n**Asia-Pacific**: $249,178 (20.0% of total)\n- Growth: +11.5% MoM (fastest growing region)\n- Key Markets: Australia (40%), Japan (30%), Singapore (30%)\n- Top Category: Electronics (45% of regional sales)\n\n**Latin America**: $87,212 (7.0% of total)\n- Growth: +5.4% MoM\n- Key Markets: Brazil (50%), Mexico (35%), Argentina (15%)\n- Top Category: Food (48% of regional sales)\n\n**Other Regions**: $37,377 (3.0% of total)\n- Growth: +3.1% MoM\n- Diverse market presence`
      },
      {
        type: 'text',
        data: `### Top Performing Products\n\n**Top 5 Products by Revenue**:\n\n1. **Premium Smart Device Pro** - $89,450 (7.2% of total sales)\n   - Units Sold: 478\n   - Average Price: $187.13\n   - Category: Electronics\n   - Growth: +12.5% MoM\n\n2. **Professional Collection Suite** - $67,890 (5.4% of total sales)\n   - Units Sold: 523\n   - Average Price: $129.85\n   - Category: Clothing\n   - Growth: +18.3% MoM\n\n3. **Enterprise Computing Package** - $54,230 (4.4% of total sales)\n   - Units Sold: 145\n   - Average Price: $373.79\n   - Category: Electronics\n   - Growth: +8.7% MoM\n\n4. **Seasonal Premium Collection** - $48,670 (3.9% of total sales)\n   - Units Sold: 389\n   - Average Price: $125.12\n   - Category: Clothing\n   - Growth: +22.1% MoM\n\n5. **Specialty Food Bundle** - $42,150 (3.4% of total sales)\n   - Units Sold: 427\n   - Average Price: $98.71\n   - Category: Food\n   - Growth: +6.2% MoM\n\n### Customer Insights\n\n**Customer Segmentation**:\n- **Enterprise Clients**: 234 clients, $623,445 revenue (50.0%)\n- **Mid-Market Clients**: 1,456 clients, $436,062 revenue (35.0%)\n- **Small Business**: 3,245 clients, $186,384 revenue (15.0%)\n\n**Repeat Customer Rate**: 68.5% (strong customer loyalty)\n\n**New Customer Acquisition**: 342 new customers (4.3% of total transactions)\n\n**Average Customer Lifetime Value**: $2,345 (increasing 5.2% YoY)`
      },
      {
        type: 'text',
        data: `### Strategic Recommendations\n\n**Immediate Opportunities** (Next 30 days):\n1. **Capitalize on Clothing Growth**: The 15.2% MoM growth in Clothing suggests strong market demand. Consider increasing inventory and marketing investment.\n2. **Leverage Electronics Leadership**: Maintain category dominance through strategic partnerships and exclusive product offerings.\n3. **Expand Asia-Pacific Presence**: With 11.5% MoM growth, this region shows exceptional potential for increased investment.\n\n**Short-term Strategy** (Next Quarter):\n1. **Product Portfolio Optimization**: Focus on top 5 products which represent 24.3% of total revenue. Consider expanding successful product lines.\n2. **Regional Expansion**: Latin America shows steady growth - explore opportunities in emerging markets.\n3. **Customer Retention Programs**: With 68.5% repeat customer rate, implement loyalty programs to further increase retention.\n\n**Long-term Vision** (Next 6-12 months):\n1. **Diversification**: While Electronics leads, the strong performance in Clothing suggests opportunities for category expansion.\n2. **Technology Investment**: Consider e-commerce platform enhancements to support continued growth.\n3. **Supply Chain Optimization**: With consistent growth, ensure supply chain can scale to meet increasing demand.\n\n### Risk Factors & Mitigation\n\n**Identified Risks**:\n- **Category Concentration**: 36.1% reliance on Electronics - consider diversification\n- **Regional Dependence**: 40% of sales from North America - explore global expansion\n- **Seasonal Variations**: Monitor for potential seasonal downturns\n\n**Mitigation Strategies**:\n- Maintain diversified product portfolio\n- Continue regional expansion initiatives\n- Implement predictive analytics for demand forecasting`
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
        data: `## Daily Health Check - System Status Report\n\n### Overall System Status: ✅ **HEALTHY**\n\nThe system is operating within optimal parameters across all monitored metrics. All critical services are functioning normally, and performance indicators remain stable. No immediate action required.\n\n### Core System Metrics\n\n**System Uptime**: **99.8%** (Target: >99.5%)\n- Status: ✅ Exceeding target\n- Downtime: 2.88 hours this month (0.2% of total time)\n- Last Incident: 3 days ago (minor maintenance window)\n\n**Active Users**: **1,234 concurrent users**\n- Peak Concurrent Users: 1,567 (yesterday at 2:34 PM)\n- Average Concurrent Users: 1,089\n- User Growth Trend: +5.2% week-over-week\n\n**API Response Time**: **245ms average** (Target: <300ms)\n- P50 (Median): 198ms\n- P95: 412ms\n- P99: 678ms\n- Status: ✅ Within acceptable range\n\n**Database Performance**: **Optimal**\n- Query Response Time: 45ms average\n- Connection Pool Utilization: 68%\n- Cache Hit Rate: 94.2%\n- Status: ✅ Excellent performance`
      },
      {
        type: 'bar_chart',
        data: {
          title: 'System Uptime Trend - Last 7 Days',
          x_axis_label: 'Day',
          y_axis_label: 'Uptime Percentage (%)',
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
      },
      {
        type: 'text',
        data: `### Detailed Performance Analysis\n\n**API Endpoints Performance**:\n- **Query Endpoint**: 245ms avg (Target: <300ms) ✅\n- **Authentication Endpoint**: 89ms avg (Target: <150ms) ✅\n- **Data Export Endpoint**: 1,234ms avg (Target: <2000ms) ✅\n- **Report Generation**: 3,456ms avg (Target: <5000ms) ✅\n\n**Database Health**:\n- **Active Connections**: 45 / 100 (45% utilization)\n- **Query Queue Length**: 2 (normal)\n- **Slow Query Count**: 0 (excellent)\n- **Replication Lag**: <1ms (optimal)\n- **Backup Status**: Last successful backup 2 hours ago ✅\n\n**Infrastructure Metrics**:\n- **CPU Utilization**: 42% average (Target: <70%)\n- **Memory Usage**: 68% (Target: <80%)\n- **Disk I/O**: 234 MB/s (Target: <500 MB/s)\n- **Network Latency**: 12ms average (Target: <50ms)\n- **Storage Capacity**: 68% used (Target: <85%)`
      },
      {
        type: 'text',
        data: `### Service-Specific Health Status\n\n**Core Services**:\n1. **Authentication Service**: ✅ Healthy\n   - Response Time: 89ms\n   - Error Rate: 0.02%\n   - Last Incident: None in past 30 days\n\n2. **Data Processing Service**: ✅ Healthy\n   - Processing Queue: 234 items\n   - Average Processing Time: 1.2s\n   - Error Rate: 0.05%\n\n3. **Report Generation Service**: ✅ Healthy\n   - Active Reports: 12\n   - Average Generation Time: 3.5s\n   - Success Rate: 99.8%\n\n4. **Analytics Service**: ✅ Healthy\n   - Data Points Processed: 2.4M today\n   - Processing Rate: 1,200 points/second\n   - Latency: 145ms average\n\n5. **Notification Service**: ✅ Healthy\n   - Messages Sent: 45,678 today\n   - Delivery Rate: 99.7%\n   - Average Delivery Time: 234ms`
      },
      {
        type: 'text',
        data: `### Security & Compliance Status\n\n**Security Metrics**:\n- **Failed Login Attempts**: 23 (down 15% from last week)\n- **Active Security Threats**: 0 ✅\n- **SSL Certificate Status**: Valid (expires in 87 days)\n- **Firewall Status**: Active and updated ✅\n- **Intrusion Detection**: No threats detected ✅\n\n**Compliance Status**:\n- **Data Privacy Compliance**: ✅ Compliant\n- **GDPR Compliance**: ✅ Compliant\n- **SOC 2 Compliance**: ✅ Compliant\n- **Last Audit**: 15 days ago (passed)\n\n**Backup & Recovery**:\n- **Last Full Backup**: 2 hours ago ✅\n- **Backup Success Rate**: 100% (last 30 days)\n- **Recovery Time Objective (RTO)**: <4 hours (Target: <4 hours) ✅\n- **Recovery Point Objective (RPO)**: <1 hour (Target: <1 hour) ✅`
      },
      {
        type: 'text',
        data: `### User Activity & Engagement\n\n**User Metrics**:\n- **Daily Active Users**: 3,456 (up 8.2% from last week)\n- **Weekly Active Users**: 12,345 (up 5.7% from last week)\n- **Monthly Active Users**: 45,678 (up 4.3% from last month)\n- **New User Registrations**: 234 today (up 12% from last week)\n\n**Session Metrics**:\n- **Average Session Duration**: 18.5 minutes\n- **Pages per Session**: 4.2\n- **Bounce Rate**: 12.3% (down 2.1% from last week)\n- **Return User Rate**: 68.5%\n\n**Feature Usage**:\n- **Query Feature**: 2,345 queries today (most used)\n- **Report Generation**: 234 reports generated\n- **Data Export**: 89 exports completed\n- **Dashboard Views**: 1,567 views`
      },
      {
        type: 'text',
        data: `### Alerts & Notifications\n\n**Current Alerts**: 0 (All systems normal) ✅\n\n**Recent Resolved Issues**:\n1. **Database Connection Pool** (Resolved 2 days ago)\n   - Issue: Temporary connection pool exhaustion\n   - Resolution: Increased pool size from 80 to 100\n   - Impact: Minimal (5-minute service degradation)\n\n2. **API Rate Limiting** (Resolved 5 days ago)\n   - Issue: Temporary rate limit threshold reached\n   - Resolution: Adjusted rate limits for peak hours\n   - Impact: None (preventive action)\n\n**Scheduled Maintenance**:\n- **Next Maintenance Window**: February 15, 2026 (2:00 AM - 4:00 AM UTC)\n- **Expected Downtime**: <30 minutes\n- **Services Affected**: Report generation (read-only mode during maintenance)`
      },
      {
        type: 'text',
        data: `### Recommendations & Action Items\n\n**Immediate Actions** (Next 24 hours):\n- ✅ No immediate actions required - all systems healthy\n\n**Short-term Improvements** (Next 7 days):\n1. **Monitor Memory Usage**: Currently at 68%, approaching 80% threshold. Consider optimization or scaling.\n2. **Review API Response Times**: P99 at 678ms is approaching threshold. Investigate optimization opportunities.\n3. **Database Connection Pool**: Monitor utilization trends as user base grows.\n\n**Long-term Strategy** (Next 30 days):\n1. **Capacity Planning**: With 5.2% week-over-week user growth, plan for infrastructure scaling.\n2. **Performance Optimization**: Review and optimize slowest API endpoints (P95 >400ms).\n3. **Security Hardening**: Continue monitoring failed login attempts and implement additional security measures if needed.\n4. **Backup Strategy Review**: Ensure backup frequency aligns with business requirements.\n\n### Summary\n\nAll systems are operating within optimal parameters. The infrastructure is stable, secure, and performing well under current load. Continued monitoring is recommended, particularly for memory usage and API response times as the user base continues to grow.`
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
        data: `## Inventory Checkup - Comprehensive Analysis\n\n### Executive Summary\n\nThe inventory system is operating efficiently with **2,456 active SKUs** across all categories. Overall stock levels are healthy at **85% average**, with only **0.9% of items** requiring attention due to low stock levels. The system has identified **5 critical items** that are completely out of stock and require immediate action.\n\n### Overall Inventory Metrics\n\n**Total SKUs**: **2,456** (across all categories)\n\n**Low Stock Items**: **23** (0.9% of total inventory)\n- Items below 20% of optimal stock level\n- Estimated value: $45,230\n\n**Out of Stock Items**: **5** (0.2% of total inventory)\n- Critical items requiring immediate restocking\n- Estimated value: $12,450\n\n**Average Stock Level**: **85%** (Target: 80-90%)\n- Status: ✅ Within optimal range\n\n**Total Inventory Value**: **$12,456,789**\n\n**Inventory Turnover Rate**: **6.2 times per year** (Industry average: 5-7)\n\n**Days of Inventory on Hand**: **58.8 days** (Target: 45-60 days)`
      },
      {
        type: 'text',
        data: `### Critical Alerts - Immediate Action Required\n\n⚠️ **5 items** are completely out of stock and require immediate restocking:\n\n1. **Product X** (SKU: INV-X-2024)\n   - Current Stock: **0 units**\n   - Optimal Stock Level: 150 units\n   - Average Monthly Demand: 45 units\n   - Estimated Restock Time: 5-7 business days\n   - Impact: High - affects 12 active orders\n   - Estimated Lost Revenue: $3,450\n   - Priority: **CRITICAL**\n\n2. **Product Y** (SKU: INV-Y-2024)\n   - Current Stock: **2 units** (98.7% below optimal)\n   - Optimal Stock Level: 200 units\n   - Average Monthly Demand: 67 units\n   - Estimated Restock Time: 3-5 business days\n   - Impact: Medium - affects 8 active orders\n   - Estimated Lost Revenue: $2,890\n   - Priority: **HIGH**\n\n3. **Product Z** (SKU: INV-Z-2024)\n   - Current Stock: **1 unit** (99.2% below optimal)\n   - Optimal Stock Level: 125 units\n   - Average Monthly Demand: 38 units\n   - Estimated Restock Time: 4-6 business days\n   - Impact: Medium - affects 6 active orders\n   - Estimated Lost Revenue: $1,980\n   - Priority: **HIGH**\n\n4. **Product Alpha** (SKU: INV-ALPHA-2024)\n   - Current Stock: **0 units**\n   - Optimal Stock Level: 80 units\n   - Average Monthly Demand: 25 units\n   - Estimated Restock Time: 7-10 business days\n   - Impact: Low - affects 3 active orders\n   - Estimated Lost Revenue: $1,230\n   - Priority: **MEDIUM**\n\n5. **Product Beta** (SKU: INV-BETA-2024)\n   - Current Stock: **0 units**\n   - Optimal Stock Level: 95 units\n   - Average Monthly Demand: 30 units\n   - Estimated Restock Time: 6-8 business days\n   - Impact: Low - affects 4 active orders\n   - Estimated Lost Revenue: $2,900\n   - Priority: **MEDIUM**`
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
      },
      {
        type: 'text',
        data: `### Category-Level Analysis\n\n**1. Electronics** - 92% Stock Level (1,234 SKUs)\n   - Status: ✅ Excellent\n   - Low Stock Items: 3 (0.2% of category)\n   - Out of Stock: 0\n   - Total Value: $5,678,900\n   - Turnover Rate: 7.2x per year\n   - Recommendation: Maintain current levels, monitor fast-moving items\n\n**2. Clothing** - 78% Stock Level (567 SKUs)\n   - Status: ⚠️ Below Optimal (Target: 80-90%)\n   - Low Stock Items: 12 (2.1% of category)\n   - Out of Stock: 2\n   - Total Value: $3,456,700\n   - Turnover Rate: 5.8x per year\n   - Recommendation: Increase stock levels for seasonal items, review forecasting\n\n**3. Food** - 85% Stock Level (423 SKUs)\n   - Status: ✅ Optimal\n   - Low Stock Items: 5 (1.2% of category)\n   - Out of Stock: 2\n   - Total Value: $2,123,450\n   - Turnover Rate: 8.5x per year (highest)\n   - Recommendation: Continue current strategy, high turnover requires frequent restocking\n\n**4. Other Categories** - 88% Stock Level (232 SKUs)\n   - Status: ✅ Good\n   - Low Stock Items: 3 (1.3% of category)\n   - Out of Stock: 1\n   - Total Value: $1,197,739\n   - Turnover Rate: 4.2x per year\n   - Recommendation: Monitor low-turnover items for potential discontinuation`
      },
      {
        type: 'text',
        data: `### Low Stock Items (Below 20% of Optimal)\n\n**Total Low Stock Items**: 23\n\n**By Priority**:\n- **Critical** (0-5% of optimal): 5 items\n- **High** (5-10% of optimal): 8 items\n- **Medium** (10-15% of optimal): 6 items\n- **Low** (15-20% of optimal): 4 items\n\n**Top 10 Low Stock Items by Value**:\n1. Product X - $3,450 (0% stock)\n2. Product Y - $2,890 (1% stock)\n3. Product Z - $1,980 (0.8% stock)\n4. Product A - $1,750 (12% stock)\n5. Product B - $1,650 (8% stock)\n6. Product C - $1,450 (15% stock)\n7. Product D - $1,320 (6% stock)\n8. Product E - $1,200 (18% stock)\n9. Product F - $1,100 (11% stock)\n10. Product G - $980 (14% stock)`
      },
      {
        type: 'text',
        data: `### Inventory Performance Metrics\n\n**Efficiency Metrics**:\n- **Inventory Accuracy**: 98.5% (Target: >98%)\n- **Stock-Out Rate**: 0.2% (Target: <0.5%)\n- **Overstock Rate**: 2.3% (Target: <3%)\n- **Dead Stock Value**: $234,567 (1.9% of total inventory)\n\n**Financial Metrics**:\n- **Inventory Carrying Cost**: $623,400 annually (5% of inventory value)\n- **Cost of Stock-Outs**: $12,450 (estimated lost revenue from out-of-stock items)\n- **Inventory ROI**: 18.5% (Target: >15%)\n\n**Operational Metrics**:\n- **Average Restock Time**: 5.2 days\n- **Supplier Reliability**: 94.2% on-time delivery\n- **Warehouse Utilization**: 78% (Target: 75-85%)\n- **Order Fulfillment Rate**: 99.2% (Target: >99%)`
      },
      {
        type: 'text',
        data: `### Recommendations & Action Plan\n\n**Immediate Actions** (Next 24 hours):\n1. **Restock Critical Items**: Place orders for 5 out-of-stock items immediately\n   - Estimated total order value: $12,450\n   - Expected delivery: 5-7 business days\n   - Priority: CRITICAL\n\n2. **Review Low Stock Items**: Assess 23 low stock items for restocking needs\n   - Focus on high-value items first\n   - Consider bulk ordering for items with consistent demand\n\n**Short-term Strategy** (Next 7 days):\n1. **Improve Clothing Category**: Increase stock levels from 78% to 85%\n   - Focus on seasonal items and fast-moving products\n   - Review forecasting models for this category\n\n2. **Optimize Food Category**: Maintain high turnover while reducing stock-outs\n   - Implement more frequent restocking cycles\n   - Consider safety stock adjustments for high-demand items\n\n3. **Dead Stock Review**: Analyze $234,567 in dead stock\n   - Identify items for clearance or discontinuation\n   - Develop strategy to reduce dead stock by 30% in next quarter\n\n**Long-term Strategy** (Next 30-90 days):\n1. **Forecasting Improvement**: Enhance demand forecasting for low stock items\n   - Implement machine learning models for demand prediction\n   - Review historical data for seasonal patterns\n\n2. **Supplier Relationship Management**: Improve supplier reliability\n   - Negotiate better terms for critical items\n   - Develop backup suppliers for high-risk items\n\n3. **Inventory Optimization**: Target 88% average stock level\n   - Balance between stock-out risk and carrying costs\n   - Implement automated reorder points\n\n4. **Technology Enhancement**: Consider inventory management system upgrades\n   - Real-time tracking capabilities\n   - Automated alert systems for low stock items`
      },
      {
        type: 'text',
        data: `### Risk Assessment\n\n**Current Risk Level**: **LOW-MEDIUM**\n\n**Risk Factors**:\n- **Low Stock Concentration**: 23 items (0.9%) require attention\n- **Category Imbalance**: Clothing category at 78% (below optimal)\n- **Dead Stock**: $234,567 tied up in non-moving inventory\n\n**Mitigation Strategies**:\n- Proactive restocking for critical items\n- Enhanced monitoring for low stock items\n- Regular review of dead stock items\n- Supplier diversification for critical products\n\n**Monitoring Required**:\n- Daily tracking of out-of-stock items\n- Weekly review of low stock items\n- Monthly analysis of category performance\n- Quarterly dead stock assessment`
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
        data: `## Analysis: "${query}"\n\n### Overview\n\nThis comprehensive analysis addresses your query about **"${query}"**. The following report provides detailed insights, metrics, and recommendations based on current system data and historical trends.\n\n**Analysis Date**: January 29, 2026\n\n**Data Source**: Integrated business intelligence platform\n\n**Analysis Type**: Multi-dimensional data analysis`
      },
      {
        type: 'text',
        data: `### Key Findings\n\n**Primary Metrics**:\n- **Total Items Analyzed**: **1,234**\n- **Status**: **Active and Operational**\n- **Last Updated**: **January 29, 2026**\n- **Data Completeness**: **98.5%**\n- **Confidence Level**: **High**\n\n**Performance Indicators**:\n- **Overall Performance**: **Above Average**\n- **Trend Direction**: **Positive** (+5.2% month-over-month)\n- **Risk Level**: **Low**\n- **Recommendation Priority**: **Medium**`
      },
      {
        type: 'text',
        data: `### Detailed Analysis\n\n**Category Breakdown**:\n1. **Primary Category**: Represents 45% of total volume\n   - Current Value: $556,500\n   - Growth Rate: +6.8% MoM\n   - Status: Healthy\n\n2. **Secondary Category**: Represents 32% of total volume\n   - Current Value: $395,200\n   - Growth Rate: +4.2% MoM\n   - Status: Stable\n\n3. **Tertiary Category**: Represents 18% of total volume\n   - Current Value: $222,300\n   - Growth Rate: +8.1% MoM\n   - Status: Growing\n\n4. **Other Categories**: Represents 5% of total volume\n   - Current Value: $60,900\n   - Growth Rate: +2.5% MoM\n   - Status: Stable`
      },
      {
        type: 'bar_chart',
        data: {
          title: 'Performance Analysis by Category',
          x_axis_label: 'Category',
          y_axis_label: 'Value',
          datasets: [
            {
              label: 'Current Value',
              data: [
                { x: 'Primary', y: 556500 },
                { x: 'Secondary', y: 395200 },
                { x: 'Tertiary', y: 222300 },
                { x: 'Other', y: 60900 }
              ]
            }
          ]
        }
      },
      {
        type: 'text',
        data: `### Temporal Trends\n\n**Last 6 Months Performance**:\n- **August 2025**: $1,100,000\n- **September 2025**: $1,150,000 (+4.5%)\n- **October 2025**: $1,120,000 (-2.6%)\n- **November 2025**: $1,180,000 (+5.4%)\n- **December 2025**: $1,145,000 (-3.0%)\n- **January 2026**: $1,235,900 (+7.9%)\n\n**Key Observations**:\n- Strong recovery in January after December dip\n- Consistent positive trend over 6-month period\n- Average monthly growth: +4.2%\n- Volatility: Low (stable performance)`
      },
      {
        type: 'text',
        data: `### Regional Distribution\n\n**Geographic Performance**:\n- **North America**: 42% ($518,900)\n  - Growth: +6.2% MoM\n  - Status: Leading region\n\n- **Europe**: 31% ($383,100)\n  - Growth: +5.8% MoM\n  - Status: Strong performance\n\n- **Asia-Pacific**: 20% ($247,200)\n  - Growth: +9.1% MoM (fastest growing)\n  - Status: Expanding rapidly\n\n- **Latin America**: 5% ($61,800)\n  - Growth: +3.5% MoM\n  - Status: Steady growth\n\n- **Other Regions**: 2% ($24,900)\n  - Growth: +1.8% MoM\n  - Status: Emerging markets`
      },
      {
        type: 'text',
        data: `### Recommendations\n\n**Immediate Actions** (Next 7 days):\n1. **Monitor Primary Category**: Continue tracking performance trends\n2. **Leverage Asia-Pacific Growth**: Consider increased investment in fastest-growing region\n3. **Review Secondary Category**: Assess opportunities for growth acceleration\n\n**Short-term Strategy** (Next 30 days):\n1. **Optimize Top Performers**: Focus resources on categories showing strongest growth\n2. **Address Underperformers**: Develop improvement plans for slower-growing segments\n3. **Regional Expansion**: Explore opportunities in high-growth regions\n\n**Long-term Vision** (Next 90 days):\n1. **Strategic Planning**: Develop comprehensive strategy based on current trends\n2. **Resource Allocation**: Optimize distribution of resources across categories\n3. **Performance Monitoring**: Implement enhanced tracking and analytics\n\n### Conclusion\n\nThe analysis of "${query}" reveals a generally positive performance with room for strategic optimization. The system is operating effectively, and the data suggests continued growth potential. Regular monitoring and strategic adjustments will help maintain and accelerate current positive trends.`
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
