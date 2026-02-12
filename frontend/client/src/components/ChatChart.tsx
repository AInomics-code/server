import { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Import controllers (Chart.js v4)
import {
  BarController,
  LineController,
  DoughnutController,
  PieController,
  PolarAreaController,
  RadarController,
  BubbleController,
  ScatterController,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  ArcElement,
  DoughnutController,
  PieController,
  PolarAreaController,
  RadarController,
  BubbleController,
  ScatterController,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'scatter' | 'bubble' | 'radar' | 'polarArea' | 'mixed';
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[] | Array<{ x: number; y: number; r?: number }>;
    type?: 'bar' | 'line'; // For mixed charts
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean; // For area charts
  }>;
  title?: string;
}

interface ChatChartProps {
  chartData: ChartData;
}

export function ChatChart({ chartData }: ChatChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !chartData) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Dark theme colors - light blue/neonish lines/bars on dark background
    // Slightly darker blue to better match the page
    const lightBlue = '#3B82F6';
    const darkThemeColors = {
      bar: {
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: lightBlue,
      },
      line: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: lightBlue,
        pointBackgroundColor: lightBlue,
        pointBorderColor: '#32373F',
      },
      area: {
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderColor: lightBlue,
        pointBackgroundColor: lightBlue,
        pointBorderColor: '#32373F',
      },
      scatter: {
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: lightBlue,
      },
      bubble: {
        backgroundColor: 'rgba(59, 130, 246, 0.4)',
        borderColor: lightBlue,
      },
      radar: {
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderColor: lightBlue,
        pointBackgroundColor: lightBlue,
        pointBorderColor: '#32373F',
      },
      pie: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(59, 130, 246, 0.6)',
        'rgba(59, 130, 246, 0.4)',
        'rgba(59, 130, 246, 0.7)',
        'rgba(59, 130, 246, 0.5)',
        'rgba(59, 130, 246, 0.9)',
      ],
    };

    // Prepare datasets with dark theme colors
    const datasets = chartData.datasets.map((dataset, index) => {
      const baseConfig = { ...dataset };

      if (chartData.type === 'bar' || (chartData.type === 'mixed' && dataset.type === 'bar')) {
        return {
          ...baseConfig,
          backgroundColor: dataset.backgroundColor || darkThemeColors.bar.backgroundColor,
          borderColor: dataset.borderColor || darkThemeColors.bar.borderColor,
          borderWidth: dataset.borderWidth || 2,
        };
      }

      if (chartData.type === 'line' || (chartData.type === 'mixed' && dataset.type === 'line')) {
        return {
          ...baseConfig,
          backgroundColor: dataset.backgroundColor || darkThemeColors.line.backgroundColor,
          borderColor: dataset.borderColor || darkThemeColors.line.borderColor,
          borderWidth: dataset.borderWidth || 2.5,
          fill: chartData.type === 'area' ? true : (dataset.fill !== undefined ? dataset.fill : false),
          tension: 0.4,
          pointBackgroundColor: darkThemeColors.line.pointBackgroundColor,
          pointBorderColor: darkThemeColors.line.pointBorderColor,
          pointRadius: 5,
          pointHoverRadius: 7,
        };
      }

      if (chartData.type === 'area') {
        return {
          ...baseConfig,
          backgroundColor: dataset.backgroundColor || darkThemeColors.area.backgroundColor,
          borderColor: dataset.borderColor || darkThemeColors.area.borderColor,
          borderWidth: dataset.borderWidth || 2.5,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: darkThemeColors.area.pointBackgroundColor,
          pointBorderColor: darkThemeColors.area.pointBorderColor,
          pointRadius: 5,
          pointHoverRadius: 7,
        };
      }

      if (chartData.type === 'scatter') {
        return {
          ...baseConfig,
          backgroundColor: dataset.backgroundColor || darkThemeColors.scatter.backgroundColor,
          borderColor: dataset.borderColor || darkThemeColors.scatter.borderColor,
          borderWidth: dataset.borderWidth || 1,
          pointRadius: 5,
          pointHoverRadius: 7,
        };
      }

      if (chartData.type === 'bubble') {
        return {
          ...baseConfig,
          backgroundColor: dataset.backgroundColor || darkThemeColors.bubble.backgroundColor,
          borderColor: dataset.borderColor || darkThemeColors.bubble.borderColor,
          borderWidth: dataset.borderWidth || 1,
        };
      }

      if (chartData.type === 'radar') {
        return {
          ...baseConfig,
          backgroundColor: dataset.backgroundColor || darkThemeColors.radar.backgroundColor,
          borderColor: dataset.borderColor || darkThemeColors.radar.borderColor,
          borderWidth: dataset.borderWidth || 2,
          pointBackgroundColor: darkThemeColors.radar.pointBackgroundColor,
          pointBorderColor: darkThemeColors.radar.pointBorderColor,
          pointRadius: 4,
          pointHoverRadius: 6,
        };
      }

      if (chartData.type === 'pie' || chartData.type === 'doughnut' || chartData.type === 'polarArea') {
        return {
          ...baseConfig,
          backgroundColor: dataset.backgroundColor || darkThemeColors.pie,
          borderColor: '#32373F',
          borderWidth: 2,
        };
      }

      return baseConfig;
    });

    // Map chart type - 'area' uses 'line' controller in Chart.js
    let chartType: any = chartData.type;
    if (chartType === 'area') {
      chartType = 'line';
    }
    
    // Create chart configuration
    const config: any = {
      type: chartType,
      data: {
        labels: chartData.labels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        backgroundColor: '#32373F',
        animation: {
          duration: 0, // Disable animations to prevent lag
        },
        interaction: {
          intersect: false,
          mode: 'index' as const,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top' as const,
            labels: {
              color: '#9CA5B5',
              font: {
                family: '"Inter", sans-serif',
                size: 12,
              },
              padding: 15,
            },
          },
          title: {
            display: !!chartData.title,
            text: chartData.title,
            color: '#E6EAF1',
            font: {
              family: '"Inter", sans-serif',
              size: 16,
              weight: '500',
            },
            padding: {
              top: 10,
              bottom: 20,
            },
          },
          tooltip: {
            backgroundColor: '#202A37',
            titleColor: '#E6EAF1',
            bodyColor: '#9CA5B5',
            borderColor: '#324053',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            displayColors: true,
          },
        },
        scales: chartData.type !== 'pie' && chartData.type !== 'doughnut' && chartData.type !== 'polarArea' && chartData.type !== 'radar' ? {
          x: {
            grid: {
              color: '#5F6672',
              drawBorder: false,
            },
            ticks: {
              color: '#9CA5B5',
              font: {
                family: '"Inter", sans-serif',
                size: 11,
              },
            },
          },
          y: {
            grid: {
              color: '#5F6672',
              drawBorder: false,
            },
            ticks: {
              color: '#9CA5B5',
              font: {
                family: '"Inter", sans-serif',
                size: 11,
              },
            },
            beginAtZero: true,
          },
        } : undefined,
      },
    };

    // Create new chart instance
    chartInstanceRef.current = new ChartJS(ctx, config);

    // Cleanup function
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [chartData]);

  if (!chartData) return null;

  return (
    <div style={{
      marginTop: '20px',
      marginBottom: '16px',
      padding: '20px',
      backgroundColor: '#32373F',
      borderRadius: '12px',
      border: '1px solid rgba(95, 102, 114, 0.2)',
      willChange: 'auto',
      contain: 'layout style paint',
    }}>
      <div style={{ 
        position: 'relative', 
        height: '400px', 
        width: '100%',
        willChange: 'auto',
        transform: 'translateZ(0)',
      }}>
        <canvas 
          ref={canvasRef}
          style={{
            willChange: 'auto',
          }}
        />
      </div>
    </div>
  );
}
