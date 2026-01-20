# Chart.js Integration Guide

This guide explains how to integrate Chart.js chart generation into your LLM chat responses.

## Installation

First, install Chart.js and the React wrapper:

```bash
npm install chart.js react-chartjs-2
```

## How It Works

The chart component is already integrated into `LLMChatPage.tsx`. When your backend returns chart data in the response, it will automatically render a chart below the message text.

## Backend Response Format

Your backend should return chart data in the `data` field of the `QueryResponse`. The component supports multiple formats:

### Format 1: Direct Chart.js Format (Recommended)

```json
{
  "message": "Here's the sales data for Q1",
  "data": {
    "type": "bar",
    "labels": ["Jan", "Feb", "Mar"],
    "datasets": [{
      "label": "Sales",
      "data": [12000, 19000, 15000]
    }],
    "title": "Q1 Sales Performance"
  }
}
```

### Format 2: Alternative Format

```json
{
  "message": "Here's the sales data for Q1",
  "data": {
    "chartType": "bar",
    "labels": ["Jan", "Feb", "Mar"],
    "datasets": [{
      "label": "Sales",
      "data": [12000, 19000, 15000]
    }],
    "title": "Q1 Sales Performance"
  }
}
```

## Chart Types

Supported chart types:
- `bar` - Bar chart
- `line` - Line chart
- `pie` - Pie chart
- `doughnut` - Doughnut chart

## Example Backend Implementation

Here's how you might structure your backend response in Python/Node.js:

### Python Example

```python
def generate_response_with_chart(question: str):
    # Your logic to generate chart data
    chart_data = {
        "type": "bar",
        "labels": ["Product A", "Product B", "Product C"],
        "datasets": [{
            "label": "Revenue",
            "data": [50000, 75000, 45000]
        }],
        "title": "Product Revenue Comparison"
    }
    
    return {
        "message": "Here's the revenue breakdown by product:",
        "data": chart_data
    }
```

### Node.js/TypeScript Example

```typescript
interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
  }>;
  title?: string;
}

function generateResponseWithChart(question: string) {
  const chartData: ChartData = {
    type: 'bar',
    labels: ['Product A', 'Product B', 'Product C'],
    datasets: [{
      label: 'Revenue',
      data: [50000, 75000, 45000]
    }],
    title: 'Product Revenue Comparison'
  };

  return {
    message: "Here's the revenue breakdown by product:",
    data: chartData
  };
}
```

## Multiple Datasets

You can include multiple datasets for comparison:

```json
{
  "data": {
    "type": "bar",
    "labels": ["Jan", "Feb", "Mar"],
    "datasets": [
      {
        "label": "2023 Sales",
        "data": [12000, 19000, 15000]
      },
      {
        "label": "2024 Sales",
        "data": [15000, 22000, 18000]
      }
    ],
    "title": "Year-over-Year Sales Comparison"
  }
}
```

## Custom Colors

The component uses a dark theme by default with colors matching your design system:
- Primary: `#5B9EFF` (Blue)
- Success: `#4ADE80` (Green)
- Warning: `#FBBF24` (Yellow)
- Danger: `#F87171` (Red)

You can customize colors by including them in the dataset:

```json
{
  "datasets": [{
    "label": "Sales",
    "data": [12000, 19000, 15000],
    "backgroundColor": "rgba(91, 158, 255, 0.2)",
    "borderColor": "#5B9EFF"
  }]
}
```

## Testing

To test chart rendering, you can modify your backend to return chart data for specific queries. For example:

```python
if "chart" in question.lower() or "graph" in question.lower():
    return generate_response_with_chart(question)
else:
    return generate_text_only_response(question)
```

## References

- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- [Chart.js React Wrapper](https://react-chartjs-2.js.org/)
- Component location: `client/src/components/ChatChart.tsx`
- Integration: `client/src/pages/LLMChatPage.tsx`