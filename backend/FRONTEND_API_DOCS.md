# API Response Documentation for Frontend

## Overview

The AI agents return **structured responses** consisting of an array of components. Each component represents a piece of content that the frontend should render in order.

---

## Response Structure

### Base Response Format

```json
{
  "message": [
    {
      "type": "component_type",
      "data": {}
    }
  ],
  "metadata": {
    "session_id": "string",
    "query_type": "simple" | "dynamic",
    "latency_ms": number,
    "type": "simple_agent" | "dynamic"
  }
}
```

### Fields

- **`message`**: Array of component objects (ordered)
- **`metadata`**: Information about the request
  - `session_id`: Unique session identifier
  - `query_type`: Which routing was used (`simple` or `dynamic`)
  - `latency_ms`: Response time in milliseconds
  - `type`: Which agent processed the request

---

## Component Types

### 1. Text Component

Markdown-formatted text content for display.

**Type**: `text`

**Structure**:
```json
{
  "type": "text",
  "data": "Markdown formatted string"
}
```

**Example**:
```json
{
  "type": "text",
  "data": "## Ventas Totales\n\nEl total es **$1,234,567.89**\n\n- Enero: **$120,000**\n- Febrero: **$135,000**"
}
```

#### Markdown Features Supported

The `data` field contains markdown with the following features:

##### Headers
```markdown
## Main Title
### Subtitle
```

##### Bold (for emphasis on numbers/values)
```markdown
**$1,234,567.89**
**25.5%**
**1,234 unidades**
```

##### Lists

Bullet lists:
```markdown
- Item 1
- Item 2
- Item 3
```

Numbered lists:
```markdown
1. First item
2. Second item
3. Third item
```

##### Tables
```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value 1  | Value 2  | Value 3  |
| Value 4  | Value 5  | Value 6  |
```

##### Line Breaks
```markdown
Line 1\n\nLine 2\n\nLine 3
```

Use `\n` for single line break, `\n\n` for paragraph separation.

##### Inline Code (rarely used)
```markdown
Use `code` for inline code
```

**Rendering Recommendation**: Use a markdown library like:
- React: `react-markdown` with `remark-gfm`
- Vue: `vue-markdown-render`
- Vanilla JS: `marked` library

---

### 2. Bar Chart

Vertical bar chart for category comparisons.

**Type**: `bar_chart`

**Structure**:
```typescript
{
  "type": "bar_chart",
  "data": {
    "title": string,
    "x_axis_label": string,
    "y_axis_label": string,
    "datasets": [
      {
        "label": string,
        "data": [
          { "x": string, "y": number }
        ]
      }
    ]
  }
}
```

**Example**:
```json
{
  "type": "bar_chart",
  "data": {
    "title": "Ventas Mensuales 2025",
    "x_axis_label": "Mes",
    "y_axis_label": "Ventas (USD)",
    "datasets": [
      {
        "label": "Ventas",
        "data": [
          {"x": "Enero", "y": 120000},
          {"x": "Febrero", "y": 135000},
          {"x": "Marzo", "y": 128000}
        ]
      }
    ]
  }
}
```

**Use Cases**: Monthly data, category comparisons, rankings

---

### 3. Line Chart

Line chart with points, ideal for trends over time.

**Type**: `line_chart`

**Structure**:
```typescript
{
  "type": "line_chart",
  "data": {
    "title": string,
    "x_axis_label": string,
    "y_axis_label": string,
    "datasets": [
      {
        "label": string,
        "data": [
          { "x": string, "y": number }
        ]
      }
    ]
  }
}
```

**Example** (Multiple datasets for comparison):
```json
{
  "type": "line_chart",
  "data": {
    "title": "Comparativo Ventas 2024 vs 2025",
    "x_axis_label": "Mes",
    "y_axis_label": "Ventas (USD)",
    "datasets": [
      {
        "label": "2024",
        "data": [
          {"x": "Ene", "y": 100000},
          {"x": "Feb", "y": 110000}
        ]
      },
      {
        "label": "2025",
        "data": [
          {"x": "Ene", "y": 120000},
          {"x": "Feb", "y": 135000}
        ]
      }
    ]
  }
}
```

**Use Cases**: Time series, trend analysis, year-over-year comparisons

---

### 4. Area Chart

Filled area chart for cumulative or volume data.

**Type**: `area_chart`

**Structure**:
```typescript
{
  "type": "area_chart",
  "data": {
    "title": string,
    "x_axis_label": string,
    "y_axis_label": string,
    "datasets": [
      {
        "label": string,
        "data": [
          { "x": string, "y": number }
        ]
      }
    ]
  }
}
```

**Example**:
```json
{
  "type": "area_chart",
  "data": {
    "title": "Ingresos Acumulados 2025",
    "x_axis_label": "Mes",
    "y_axis_label": "Ingresos Acumulados (USD)",
    "datasets": [
      {
        "label": "Acumulado",
        "data": [
          {"x": "Ene", "y": 120000},
          {"x": "Feb", "y": 255000},
          {"x": "Mar", "y": 383000}
        ]
      }
    ]
  }
}
```

**Use Cases**: Cumulative data, volume over time, stacked trends

---

### 5. Pie Chart

Circular chart showing proportions and percentages.

**Type**: `pie_chart`

**Structure**:
```typescript
{
  "type": "pie_chart",
  "data": {
    "title": string,
    "datasets": [
      {
        "label": string,
        "data": [
          { "label": string, "value": number }
        ]
      }
    ]
  }
}
```

**Note**: Pie charts use `label` and `value` instead of `x` and `y`.

**Example**:
```json
{
  "type": "pie_chart",
  "data": {
    "title": "Distribución de Ventas por Categoría",
    "datasets": [
      {
        "label": "Categorías",
        "data": [
          {"label": "Electrónicos", "value": 450000},
          {"label": "Ropa", "value": 320000},
          {"label": "Alimentos", "value": 230000}
        ]
      }
    ]
  }
}
```

**Use Cases**: Market share, category distribution, percentages

---

### 6. Bubble Chart

3-dimensional data visualization with x, y, and size (radius).

**Type**: `bubble_chart`

**Structure**:
```typescript
{
  "type": "bubble_chart",
  "data": {
    "title": string,
    "x_axis_label": string,
    "y_axis_label": string,
    "datasets": [
      {
        "label": string,
        "data": [
          { 
            "x": number, 
            "y": number, 
            "r": number,
            "label"?: string 
          }
        ]
      }
    ]
  }
}
```

**Note**: 
- `r` represents the bubble size (radius)
- Optional `label` for individual bubble labels

**Example**:
```json
{
  "type": "bubble_chart",
  "data": {
    "title": "Performance de Productos",
    "x_axis_label": "Volumen de Ventas",
    "y_axis_label": "Margen (%)",
    "datasets": [
      {
        "label": "Productos",
        "data": [
          {"x": 15000, "y": 35.5, "r": 120000, "label": "Laptop HP"},
          {"x": 8500, "y": 42.8, "r": 95000, "label": "iPhone 15"}
        ]
      }
    ]
  }
}
```

**Use Cases**: 3-dimensional analysis, product performance matrices

---

### 7. Radar Chart

Multi-axis chart for comparing multiple metrics.

**Type**: `radar_chart`

**Structure**:
```typescript
{
  "type": "radar_chart",
  "data": {
    "title": string,
    "datasets": [
      {
        "label": string,
        "data": [
          { "axis": string, "value": number }
        ]
      }
    ]
  }
}
```

**Note**: Uses `axis` and `value` instead of `x` and `y`.

**Example**:
```json
{
  "type": "radar_chart",
  "data": {
    "title": "Performance de Grupos de Clientes",
    "datasets": [
      {
        "label": "Grupo Premium",
        "data": [
          {"axis": "Ventas", "value": 85},
          {"axis": "Frecuencia", "value": 92},
          {"axis": "Margen", "value": 78}
        ]
      },
      {
        "label": "Grupo Estándar",
        "data": [
          {"axis": "Ventas", "value": 65},
          {"axis": "Frecuencia", "value": 70},
          {"axis": "Margen", "value": 82}
        ]
      }
    ]
  }
}
```

**Use Cases**: Multi-dimensional comparisons, performance metrics

---

### 8. Scatter Chart

Scatter plot for showing correlations and distributions.

**Type**: `scatter_chart`

**Structure**:
```typescript
{
  "type": "scatter_chart",
  "data": {
    "title": string,
    "x_axis_label": string,
    "y_axis_label": string,
    "datasets": [
      {
        "label": string,
        "data": [
          { "x": number, "y": number }
        ]
      }
    ]
  }
}
```

**Example**:
```json
{
  "type": "scatter_chart",
  "data": {
    "title": "Correlación Precio vs Demanda",
    "x_axis_label": "Precio (USD)",
    "y_axis_label": "Unidades Vendidas",
    "datasets": [
      {
        "label": "Productos",
        "data": [
          {"x": 15.50, "y": 8500},
          {"x": 29.99, "y": 6200},
          {"x": 49.99, "y": 3800}
        ]
      }
    ]
  }
}
```

**Use Cases**: Correlations, price analysis, distributions

---

### 9. Polar Chart

Polar area chart for cyclical data with magnitude.

**Type**: `polar_chart`

**Structure**:
```typescript
{
  "type": "polar_chart",
  "data": {
    "title": string,
    "datasets": [
      {
        "label": string,
        "data": [
          { "label": string, "value": number }
        ]
      }
    ]
  }
}
```

**Note**: Uses `label` and `value` like pie charts.

**Example**:
```json
{
  "type": "polar_chart",
  "data": {
    "title": "Ventas Trimestrales 2025",
    "datasets": [
      {
        "label": "Trimestres",
        "data": [
          {"label": "Q1", "value": 3800000},
          {"label": "Q2", "value": 4200000},
          {"label": "Q3", "value": 4500000},
          {"label": "Q4", "value": 5100000}
        ]
      }
    ]
  }
}
```

**Use Cases**: Quarterly data, cyclical patterns, proportions with magnitude

---

### 10. Mixed Chart

Combined bar and line chart for comparing different metric types.

**Type**: `mixed_chart`

**Structure**:
```typescript
{
  "type": "mixed_chart",
  "data": {
    "title": string,
    "x_axis_label": string,
    "y_axis_label": string,
    "datasets": [
      {
        "label": string,
        "type": "bar" | "line",
        "data": [
          { "x": string, "y": number }
        ]
      }
    ]
  }
}
```

**Note**: Each dataset has a `type` field specifying `"bar"` or `"line"`.

**Example**:
```json
{
  "type": "mixed_chart",
  "data": {
    "title": "Ventas y Crecimiento",
    "x_axis_label": "Mes",
    "y_axis_label": "Monto (USD) / Porcentaje (%)",
    "datasets": [
      {
        "label": "Ventas",
        "type": "bar",
        "data": [
          {"x": "Ene", "y": 120000},
          {"x": "Feb", "y": 135000}
        ]
      },
      {
        "label": "Crecimiento %",
        "type": "line",
        "data": [
          {"x": "Ene", "y": 8.5},
          {"x": "Feb", "y": 12.3}
        ]
      }
    ]
  }
}
```

**Use Cases**: Comparing different metrics, sales vs growth rate, volume vs percentage

---

## Complete Response Examples

### Example 1: Simple Query

**Request**:
```json
{
  "query": "Cuál fue el total de ventas en enero 2025?",
  "user_id": "user_123",
  "session_id": "session_001"
}
```

**Response**:
```json
{
  "message": [
    {
      "type": "text",
      "data": "El total de ventas en enero 2025 fue de **$1,245,890.50**, representando un incremento de **+8.5%** comparado con diciembre 2024."
    }
  ],
  "metadata": {
    "session_id": "session_001",
    "query_type": "simple",
    "latency_ms": 1234.56,
    "type": "simple_agent"
  }
}
```

### Example 2: Time Series Query with Chart

**Request**:
```json
{
  "query": "Dame el backorder mes a mes de 2025",
  "user_id": "user_123",
  "session_id": "session_002"
}
```

**Response**:
```json
{
  "message": [
    {
      "type": "text",
      "data": "## Backorder Mensual 2025\n\nTotal anual: **$1,696,840** con **16,968** unidades\n\nPromedio mensual: **$141,403** con **1,414** unidades"
    },
    {
      "type": "bar_chart",
      "data": {
        "title": "Backorder Mensual 2025",
        "x_axis_label": "Mes",
        "y_axis_label": "Backorder (USD)",
        "datasets": [
          {
            "label": "Backorder",
            "data": [
              {"x": "Ene", "y": 120000},
              {"x": "Feb", "y": 135000},
              {"x": "Mar", "y": 128000},
              {"x": "Abr", "y": 142500},
              {"x": "May", "y": 155000},
              {"x": "Jun", "y": 124590},
              {"x": "Jul", "y": 118750},
              {"x": "Ago", "y": 130000},
              {"x": "Sep", "y": 145000},
              {"x": "Oct", "y": 152000},
              {"x": "Nov", "y": 160000},
              {"x": "Dic", "y": 185000}
            ]
          }
        ]
      }
    },
    {
      "type": "text",
      "data": "### Observaciones\n\n- **Diciembre** registró el backorder más alto (**$185,000**)\n- **Julio** tuvo el backorder más bajo (**$118,750**)\n- Tendencia creciente en el último trimestre del año"
    }
  ],
  "metadata": {
    "session_id": "session_002",
    "query_type": "simple",
    "latency_ms": 4523.12,
    "type": "simple_agent"
  }
}
```

### Example 3: Complex Analysis with Multiple Charts

**Request**:
```json
{
  "query": "Compara las ventas de 2024 vs 2025 y muéstrame la distribución por categoría",
  "user_id": "user_123",
  "session_id": "session_003"
}
```

**Response**:
```json
{
  "message": [
    {
      "type": "text",
      "data": "## Análisis Comparativo: 2024 vs 2025\n\n| Periodo | Total Ventas | Crecimiento |\n|---------|--------------|-------------|\n| 2024 | $5,950,000 | - |\n| 2025 | $6,894,730 | **+15.8%** |\n\n**Incremento absoluto**: **$944,730**"
    },
    {
      "type": "line_chart",
      "data": {
        "title": "Comparativo Mensual 2024 vs 2025",
        "x_axis_label": "Mes",
        "y_axis_label": "Ventas (USD)",
        "datasets": [
          {
            "label": "2024",
            "data": [
              {"x": "Ene", "y": 1150000},
              {"x": "Feb", "y": 1210000},
              {"x": "Mar", "y": 1175000}
            ]
          },
          {
            "label": "2025",
            "data": [
              {"x": "Ene", "y": 1245890},
              {"x": "Feb", "y": 1356782},
              {"x": "Mar", "y": 1289456}
            ]
          }
        ]
      }
    },
    {
      "type": "text",
      "data": "### Distribución por Categoría (2025)"
    },
    {
      "type": "pie_chart",
      "data": {
        "title": "Ventas por Categoría - 2025",
        "datasets": [
          {
            "label": "Categorías",
            "data": [
              {"label": "Electrónicos", "value": 2450890},
              {"label": "Ropa", "value": 1876543},
              {"label": "Alimentos", "value": 1234567}
            ]
          }
        ]
      }
    },
    {
      "type": "text",
      "data": "### Conclusiones\n\n1. Crecimiento sostenido en todos los meses de 2025\n2. **Electrónicos** lidera con **35.5%** del mercado\n3. La tendencia indica superación del objetivo anual"
    }
  ],
  "metadata": {
    "session_id": "session_003",
    "query_type": "dynamic",
    "latency_ms": 6789.45,
    "type": "dynamic"
  }
}
```

---

## Frontend Implementation Guide

### 1. Component Rendering

Iterate through the `message` array and render each component based on its `type`:

```typescript
interface Component {
  type: 'text' | 'bar_chart' | 'line_chart' | 'area_chart' | 'pie_chart' | 
        'bubble_chart' | 'radar_chart' | 'scatter_chart' | 'polar_chart' | 'mixed_chart';
  data: any;
}

function renderMessage(components: Component[]) {
  return components.map((component, index) => {
    switch (component.type) {
      case 'text':
        return <MarkdownRenderer key={index} content={component.data} />;
      case 'bar_chart':
        return <BarChart key={index} data={component.data} />;
      case 'line_chart':
        return <LineChart key={index} data={component.data} />;
      // ... other chart types
      default:
        return null;
    }
  });
}
```

### 2. Markdown Rendering

Use a markdown library to render text components:

**React Example**:
```bash
npm install react-markdown remark-gfm
```

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]}
      components={{
        strong: ({children}) => (
          <strong className="font-bold text-primary">{children}</strong>
        ),
        table: ({children}) => (
          <table className="table-auto border-collapse">{children}</table>
        )
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

### 3. Chart.js Integration

All charts are designed for Chart.js:

```bash
npm install chart.js react-chartjs-2
```

**Bar Chart Example**:
```tsx
import { Bar } from 'react-chartjs-2';

function BarChart({ data }: { data: any }) {
  const chartData = {
    labels: data.datasets[0].data.map((d: any) => d.x),
    datasets: data.datasets.map((dataset: any) => ({
      label: dataset.label,
      data: dataset.data.map((d: any) => d.y),
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }))
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: data.title
      }
    },
    scales: {
      x: { title: { display: true, text: data.x_axis_label } },
      y: { title: { display: true, text: data.y_axis_label } }
    }
  };

  return <Bar data={chartData} options={options} />;
}
```

### 4. Styling Guidelines

- **NO colors are specified in the data** - Apply your theme colors
- Charts should be responsive
- Use consistent spacing between components
- Consider mobile layouts (stack vertically)

### 5. Order Matters

Components are ordered intentionally:
1. Summary text
2. Main visualization(s)
3. Supporting insights

**Maintain this order** when rendering.

---

## TypeScript Definitions

```typescript
// Component Types
type ComponentType = 
  | 'text'
  | 'bar_chart'
  | 'line_chart'
  | 'area_chart'
  | 'pie_chart'
  | 'bubble_chart'
  | 'radar_chart'
  | 'scatter_chart'
  | 'polar_chart'
  | 'mixed_chart';

// Base Component
interface BaseComponent {
  type: ComponentType;
  data: any;
}

// Text Component
interface TextComponent extends BaseComponent {
  type: 'text';
  data: string; // Markdown string
}

// Standard Chart (bar, line, area, scatter)
interface StandardChartData {
  x: string | number;
  y: number;
}

interface StandardChartDataset {
  label: string;
  data: StandardChartData[];
}

interface StandardChartComponent extends BaseComponent {
  type: 'bar_chart' | 'line_chart' | 'area_chart' | 'scatter_chart';
  data: {
    title: string;
    x_axis_label: string;
    y_axis_label: string;
    datasets: StandardChartDataset[];
  };
}

// Pie/Polar Chart
interface PieChartData {
  label: string;
  value: number;
}

interface PieChartDataset {
  label: string;
  data: PieChartData[];
}

interface PieChartComponent extends BaseComponent {
  type: 'pie_chart' | 'polar_chart';
  data: {
    title: string;
    datasets: PieChartDataset[];
  };
}

// Bubble Chart
interface BubbleChartData {
  x: number;
  y: number;
  r: number;
  label?: string;
}

interface BubbleChartDataset {
  label: string;
  data: BubbleChartData[];
}

interface BubbleChartComponent extends BaseComponent {
  type: 'bubble_chart';
  data: {
    title: string;
    x_axis_label: string;
    y_axis_label: string;
    datasets: BubbleChartDataset[];
  };
}

// Radar Chart
interface RadarChartData {
  axis: string;
  value: number;
}

interface RadarChartDataset {
  label: string;
  data: RadarChartData[];
}

interface RadarChartComponent extends BaseComponent {
  type: 'radar_chart';
  data: {
    title: string;
    datasets: RadarChartDataset[];
  };
}

// Mixed Chart
interface MixedChartDataset {
  label: string;
  type: 'bar' | 'line';
  data: StandardChartData[];
}

interface MixedChartComponent extends BaseComponent {
  type: 'mixed_chart';
  data: {
    title: string;
    x_axis_label: string;
    y_axis_label: string;
    datasets: MixedChartDataset[];
  };
}

// Union type for all components
type Component = 
  | TextComponent
  | StandardChartComponent
  | PieChartComponent
  | BubbleChartComponent
  | RadarChartComponent
  | MixedChartComponent;

// API Response
interface QueryResponse {
  message: Component[];
  metadata: {
    session_id: string;
    query_type: 'simple' | 'dynamic';
    latency_ms: number;
    type: 'simple_agent' | 'dynamic';
  };
}
```

---

## Error Handling

### Fallback Rendering

If a component type is unknown or data is malformed, fallback to text rendering:

```typescript
function renderComponent(component: Component) {
  try {
    switch (component.type) {
      case 'text':
        return <MarkdownRenderer content={component.data} />;
      // ... other cases
      default:
        console.warn('Unknown component type:', component.type);
        return <div>Unsupported component type</div>;
    }
  } catch (error) {
    console.error('Error rendering component:', error);
    return <div>Error rendering component</div>;
  }
}
```

### Validation

Validate component structure before rendering:

```typescript
function isValidComponent(component: any): component is Component {
  return (
    component &&
    typeof component === 'object' &&
    'type' in component &&
    'data' in component
  );
}
```

---

## Best Practices

1. **Responsive Design**: All charts should be responsive
2. **Loading States**: Show skeletons while charts render
3. **Theme Integration**: Apply consistent colors from your theme
4. **Accessibility**: Add ARIA labels to charts
5. **Error Boundaries**: Wrap chart components in error boundaries
6. **Performance**: Lazy load chart libraries if needed
7. **Mobile**: Ensure charts are touch-friendly and scrollable

---

## Chart.js Resources

- Documentation: https://www.chartjs.org
- React wrapper: https://react-chartjs-2.js.org
- Vue wrapper: https://vue-chartjs.org
- Available chart types match the components in this API

---

## Support

For questions or issues with the API response format, refer to the backend documentation or contact the development team.
