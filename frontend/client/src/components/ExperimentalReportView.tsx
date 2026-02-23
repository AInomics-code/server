/**
 * Experimental Report View Component
 * STEP 4: Top KPI / Health score block only (no other sections yet)
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Asterisk, Download, ChevronDown, Check, X, FileText, Copy, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import { Chart as ChartJS, ArcElement, DoughnutController } from 'chart.js';

import { Component } from '../services/agentService';
import { parseComponentsToReport } from '../utils/reportParser';
import { VortaStarIcon } from '../pages/LLMChatPage';
import { type HealthScoresResponse } from '../services/healthScoresService';

ChartJS.register(ArcElement, DoughnutController);

// Product data structure expected from backend
export interface ProductData {
  product: string;
  location: string;
  daysLeft: number;
  monthlySales: number;
}

// Decision details structure expected from backend
export interface DecisionDetails {
  skusBelowThreshold: number;
  stockoutHours: number;
  backorderQuantity: number;
  dailyRevenue: number;
  backorderIncrease: number;
}

// Report data structure expected from backend
export interface ReportData {
  // Summary metrics
  totalUnits?: number;
  costValue?: number;
  saleValue?: number;
  revenueAtRisk?: number;
  topSellingSKUs?: number;
  
  // Product lists
  criticalRiskProducts?: ProductData[];
  reorderRequiredProducts?: ProductData[];
  lowRotationProducts?: ProductData[];
  
  // Decision details
  criticalRiskDetails?: DecisionDetails;
  reorderRequiredDetails?: DecisionDetails;
  lowRotationDetails?: DecisionDetails;
}

interface ExperimentalReportViewProps {
  components: Component[];
  conversationHistory?: Array<{ role: string; content?: string }>;
  messageIdx?: number;
  healthScoresData?: HealthScoresResponse;
  reportData?: ReportData; // Backend report data
  onQuestionClick?: (question: string) => void;
  onQuestionSelect?: (question: string) => void;
}

export default function ExperimentalReportView({ components, conversationHistory, messageIdx, healthScoresData, reportData, onQuestionClick, onQuestionSelect }: ExperimentalReportViewProps) {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [isAccordion2Open, setIsAccordion2Open] = useState(false);
  const [isAccordion3Open, setIsAccordion3Open] = useState(false);
  const accordionContentRef = useRef<HTMLDivElement>(null);
  const accordionInnerRef = useRef<HTMLDivElement>(null);
  const accordionContainerRef = useRef<HTMLDivElement>(null);
  const accordion2ContentRef = useRef<HTMLDivElement>(null);
  const accordion2InnerRef = useRef<HTMLDivElement>(null);
  const accordion3ContentRef = useRef<HTMLDivElement>(null);
  const accordion3InnerRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const [contentHeight2, setContentHeight2] = useState<number>(0);
  const [contentHeight3, setContentHeight3] = useState<number>(0);
  const scrollPositionRef = useRef<number>(0);
  const scrollLockIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const parsed = useMemo(() => parseComponentsToReport(components), [components]);

  // Use API data if available, otherwise fall back to parsed or default
  const score = healthScoresData?.inventory?.score ?? parsed.healthScore?.value ?? 84;
  const color = parsed.healthScore?.color ?? (score >= 70 ? '#33C481' : score >= 40 ? '#C48333' : '#DC2626');
  
  // Determine health status - use API label if available
  const healthStatus = healthScoresData?.inventory?.label ?? (score >= 70 ? 'Healthy' : score >= 40 ? 'At Risk' : 'Critical');
  const statusColor = score >= 70 ? '#33C481' : score >= 40 ? '#C48333' : '#DC2626';
  
  // Determine title based on user's question
  const title = useMemo(() => {
    if (conversationHistory && messageIdx !== undefined && messageIdx > 0) {
      const userMessage = conversationHistory[messageIdx - 1];
      const userQuestion = userMessage?.content?.toLowerCase() || '';
      if (userQuestion.includes('sales health') || userQuestion === 'sales health') {
        return 'Sales health score';
      }
    }
    return 'Inventory health score';
  }, [conversationHistory, messageIdx]);


  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const safeScore = Math.max(0, Math.min(100, score));
    const remainder = Math.max(0, 100 - safeScore);

    chartRef.current = new ChartJS(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Health', 'Remaining'],
        datasets: [
          {
            label: 'Health Score',
            data: [safeScore, remainder],
            backgroundColor: [color, '#2B3037'],
            borderColor: ['transparent', 'transparent'],
            borderWidth: 0,
            spacing: 6,
            borderRadius: 8,
            hoverOffset: 0,
          } as any,
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 650,
          easing: 'easeOutCubic' as any,
        },
        cutout: '74%',
        rotation: -45,
        circumference: 360,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
      } as any,
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [score, color]);

  // Generate summary data - use API data when available
  const summaryData = useMemo(() => {
    // If we have report data from backend, use it
    if (reportData) {
      const inv = healthScoresData?.inventory;
      const inputs = inv?.inputs as any;
      
      // Get counts from product arrays or calculate from health scores
      const criticalRisk = reportData.criticalRiskProducts?.length ?? 
        (inputs?.total_products && inputs?.pct_critico 
          ? Math.round(inputs.total_products * (inputs.pct_critico / 100)) 
          : 0);
      const reorderRequired = reportData.reorderRequiredProducts?.length ?? 
        (inputs?.total_products && inputs?.pct_requiring_reorder 
          ? Math.round(inputs.total_products * (inputs.pct_requiring_reorder / 100)) 
          : 0);
      const lowRotation = reportData.lowRotationProducts?.length ?? 
        (inputs?.total_products && inputs?.pct_baja_rotacion 
          ? Math.round(inputs.total_products * (inputs.pct_baja_rotacion / 100)) 
          : 0);
      
      return {
        revenueAtRisk: reportData.revenueAtRisk ?? 0,
        topSellingSKUs: reportData.topSellingSKUs ?? 0,
        totalUnits: reportData.totalUnits ?? 0,
        costValue: reportData.costValue ?? 0,
        saleValue: reportData.saleValue ?? 0,
        criticalRisk,
        reorderRequired,
        lowRotation,
        profitMargin: inputs?.avg_profit_margin_pct ?? 0,
      };
    }
    
    // If we have health scores API data, calculate from inputs
    if (healthScoresData?.inventory) {
      const inv = healthScoresData.inventory;
      const inputs = inv.inputs as any;
      
      const totalProducts = inputs.total_products || 0;
      const pctCritico = inputs.pct_critico || 0;
      const pctRequiringReorder = inputs.pct_requiring_reorder || 0;
      const pctBajaRotacion = inputs.pct_baja_rotacion || 0;
      const avgProfitMargin = inputs.avg_profit_margin_pct || 0;
      
      // Calculate actual numbers from percentages
      const criticalRisk = Math.round(totalProducts * (pctCritico / 100));
      const reorderRequired = Math.round(totalProducts * (pctRequiringReorder / 100));
      const lowRotation = Math.round(totalProducts * (pctBajaRotacion / 100));
      
      return {
        revenueAtRisk: 0,
        topSellingSKUs: 0,
        totalUnits: 0,
        costValue: 0,
        saleValue: 0,
        criticalRisk,
        reorderRequired,
        lowRotation,
        profitMargin: avgProfitMargin,
      };
    }
    
    // No data available - return empty structure
    return {
      revenueAtRisk: 0,
      topSellingSKUs: 0,
      totalUnits: 0,
      costValue: 0,
      saleValue: 0,
      criticalRisk: 0,
      reorderRequired: 0,
      lowRotation: 0,
      profitMargin: 0,
    };
  }, [score, healthScoresData, reportData]);

  // Get product data from backend report data
  const productData = useMemo(() => {
    return reportData?.criticalRiskProducts?.slice(0, 4) ?? [];
  }, [reportData]);

  const productData2 = useMemo(() => {
    return reportData?.reorderRequiredProducts?.slice(0, 4) ?? [];
  }, [reportData]);

  const productData3 = useMemo(() => {
    return reportData?.lowRotationProducts?.slice(0, 4) ?? [];
  }, [reportData]);

  // Get decision details from backend report data
  const decisionDetails = useMemo(() => {
    return reportData?.criticalRiskDetails ?? {
      skusBelowThreshold: 0,
      stockoutHours: 0,
      backorderQuantity: 0,
      dailyRevenue: 0,
      backorderIncrease: 0,
    };
  }, [reportData]);

  const decisionDetails2 = useMemo(() => {
    return reportData?.reorderRequiredDetails ?? {
      skusBelowThreshold: 0,
      stockoutHours: 0,
      backorderQuantity: 0,
      dailyRevenue: 0,
      backorderIncrease: 0,
    };
  }, [reportData]);

  const decisionDetails3 = useMemo(() => {
    return reportData?.lowRotationDetails ?? {
      skusBelowThreshold: 0,
      stockoutHours: 0,
      backorderQuantity: 0,
      dailyRevenue: 0,
      backorderIncrease: 0,
    };
  }, [reportData]);

  // Generate first/most important decision based on health score
  const firstDecision = useMemo(() => {
    return {
      number: summaryData.criticalRisk,
      action: 'Issue PO for',
      description: 'Top Revenue Drivers at Risk',
      department: 'Procurement',
    };
  }, [summaryData]);

  // Generate second decision
  const secondDecision = useMemo(() => {
    return {
      number: summaryData.reorderRequired,
      action: 'Replenish',
      description: 'Products Below Safety Stock',
      department: 'Warehouse',
    };
  }, [summaryData]);

  // Generate third decision
  const thirdDecision = useMemo(() => {
    return {
      number: summaryData.lowRotation,
      action: 'Review and Optimize',
      description: 'Slow-Moving Inventory Items',
      department: 'Sales',
    };
  }, [summaryData]);

  // Measure accordion content height for smooth animation
  useEffect(() => {
    if (accordionInnerRef.current) {
      const measureHeight = () => {
        if (accordionInnerRef.current) {
          const height = accordionInnerRef.current.scrollHeight;
          if (height > 0) {
            setContentHeight(height);
          }
        }
      };
      
      // Measure immediately and after a frame for accuracy
      measureHeight();
      requestAnimationFrame(measureHeight);
    }
  }, [productData, decisionDetails, summaryData, isAccordionOpen]);

  // Measure accordion 2 content height
  useEffect(() => {
    if (accordion2InnerRef.current) {
      const measureHeight = () => {
        if (accordion2InnerRef.current) {
          const height = accordion2InnerRef.current.scrollHeight;
          if (height > 0) {
            setContentHeight2(height);
          }
        }
      };
      measureHeight();
      requestAnimationFrame(measureHeight);
    }
  }, [productData2, decisionDetails2, isAccordion2Open]);

  // Measure accordion 3 content height
  useEffect(() => {
    if (accordion3InnerRef.current) {
      const measureHeight = () => {
        if (accordion3InnerRef.current) {
          const height = accordion3InnerRef.current.scrollHeight;
          if (height > 0) {
            setContentHeight3(height);
          }
        }
      };
      measureHeight();
      requestAnimationFrame(measureHeight);
    }
  }, [productData3, decisionDetails3, isAccordion3Open]);

  // Cleanup scroll lock on unmount
  useEffect(() => {
    return () => {
      if (scrollLockIntervalRef.current) {
        clearInterval(scrollLockIntervalRef.current);
        scrollLockIntervalRef.current = null;
      }
    };
  }, []);

  // Get full product data for Excel export from backend
  const fullProductData = useMemo(() => {
    return reportData?.criticalRiskProducts ?? [];
  }, [reportData]);

  const fullProductData2 = useMemo(() => {
    return reportData?.reorderRequiredProducts ?? [];
  }, [reportData]);

  const fullProductData3 = useMemo(() => {
    return reportData?.lowRotationProducts ?? [];
  }, [reportData]);


  // Get current month and year for report title
  const reportDate = useMemo(() => {
    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'long' });
    const year = now.getFullYear();
    return `${month} ${year}`;
  }, []);

  return (
    <div style={{ width: '100%', paddingTop: '40px', position: 'relative', zIndex: 1 }}>
      {/* Single row: Aragon icon, pie chart with 84 inside, Healthy and title to the right */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          marginTop: '0px',
        }}
      >
        {/* Aragon icon on left - bigger square */}
        <div style={{
          width: '48px',
          height: '48px',
          minWidth: '48px',
          maxWidth: '48px',
          minHeight: '48px',
          maxHeight: '48px',
          backgroundColor: '#32373F',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxSizing: 'border-box',
          padding: 0,
          margin: 0,
          border: 'none',
        }}>
          <div style={{ lineHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <VortaStarIcon size={28} color="#5ca2f9" />
          </div>
        </div>

        {/* Pie chart with ONLY 84 inside - smaller size, top aligned with Aragon icon */}
        <div style={{ 
          flexShrink: 0,
          position: 'relative',
          width: 160,
          height: 160,
        }}>
          <canvas ref={canvasRef} width={160} height={160} style={{ width: '160px', height: '160px' }} />
          {/* Only 84 inside pie chart - same size */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '34px',
            fontWeight: 500,
            color,
            lineHeight: 1,
            letterSpacing: -0.8,
            pointerEvents: 'none',
          }}>
            {score}
          </div>
        </div>

        {/* Healthy and title to the RIGHT, vertically centered with pie middle, moved more to right */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          flexShrink: 0,
          justifyContent: 'center',
          height: '160px', // Same height as pie to center vertically
          marginLeft: '8px', // Move a bit more to the right
        }}>
          {/* Healthy - bigger and slightly bolder if green */}
          <div style={{
            fontSize: '22px',
            fontWeight: statusColor === '#33C481' ? 700 : 600,
            color: statusColor,
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.2,
          }}>
            {healthStatus}
          </div>
          {/* Inventory health score - faded */}
          <div style={{
            fontSize: '16px',
            fontWeight: 400,
            color: 'rgba(230, 234, 241, 0.5)',
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.2,
          }}>
            {title}
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div style={{
        marginTop: '32px',
        width: '100%',
      }}>
        {/* Report Title - whiter */}
        <div style={{
          fontSize: '20px',
          fontWeight: 600,
          color: '#FFFFFF',
          fontFamily: 'Inter, sans-serif',
          marginBottom: '16px',
          lineHeight: 1.3,
        }}>
          {title === 'Sales health score' ? `Sales Health Report - ${reportDate}` : `Inventory Health Report - ${reportDate}`}
        </div>

        {/* Key Summary Statement - whiter */}
        <div style={{
          fontSize: '15px',
          fontWeight: 500,
          color: '#FFFFFF',
          fontFamily: 'Inter, sans-serif',
          marginBottom: '20px',
          lineHeight: 1.5,
        }}>
          ${(summaryData.revenueAtRisk / 1000).toFixed(0)}K revenue at risk from {summaryData.topSellingSKUs} top-selling SKUs with &lt;5 days inventory.
        </div>

        {/* Bulleted List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {/* Total Inventory */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.6,
          }}>
            <span style={{ color: '#9CA3AF', marginTop: '2px' }}>•</span>
            <span style={{ color: '#D1D5DB' }}>
              <strong style={{ fontWeight: 500, color: '#FFFFFF' }}>Total Inventory:</strong> <span style={{ color: '#9CA3AF' }}>{summaryData.totalUnits.toLocaleString()} units valued at ${summaryData.costValue.toFixed(2)}M (cost) / ${summaryData.saleValue.toFixed(2)}M (sale)</span>
            </span>
          </div>

          {/* Critical Risk */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.6,
          }}>
            <span style={{ color: '#9CA3AF', marginTop: '2px' }}>•</span>
            <span style={{ color: '#D1D5DB' }}>
              <strong style={{ fontWeight: 500, color: '#FFFFFF' }}>Critical Risk:</strong> <span style={{ color: '#9CA3AF' }}>{summaryData.criticalRisk} products with &lt;7 days inventory</span>
            </span>
          </div>

          {/* Reorder Required */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.6,
          }}>
            <span style={{ color: '#9CA3AF', marginTop: '2px' }}>•</span>
            <span style={{ color: '#D1D5DB' }}>
              <strong style={{ fontWeight: 500, color: '#FFFFFF' }}>Reorder Required:</strong> <span style={{ color: '#9CA3AF' }}>{summaryData.reorderRequired} products below safety stock</span>
            </span>
          </div>

          {/* Low Rotation */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.6,
          }}>
            <span style={{ color: '#9CA3AF', marginTop: '2px' }}>•</span>
            <span style={{ color: '#D1D5DB' }}>
              <strong style={{ fontWeight: 500, color: '#FFFFFF' }}>Low Rotation:</strong> <span style={{ color: '#9CA3AF' }}>{summaryData.lowRotation} products with slow movement</span>
            </span>
          </div>

          {/* Profit Margin */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.6,
          }}>
            <span style={{ color: '#9CA3AF', marginTop: '2px' }}>•</span>
            <span style={{ color: '#D1D5DB' }}>
              <strong style={{ fontWeight: 500, color: '#FFFFFF' }}>Profit Margin:</strong> <span style={{ color: '#9CA3AF' }}>{summaryData.profitMargin.toFixed(1)}% average</span>
            </span>
          </div>
        </div>
      </div>

      {/* Thin Line Separator */}
      <div style={{
        width: '100%',
        height: '1px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginTop: '32px',
        marginBottom: '32px',
      }} />

      {/* What To Do Section */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <div style={{
          fontSize: '16px',
          fontWeight: 500,
          color: '#FFFFFF',
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '0.5px',
        }}>
          WHAT TO DO (DECISIONS)
        </div>
      </div>

      {/* First Accordion - Most Important Decision */}
      <div 
        ref={accordionContainerRef}
        style={{
          backgroundColor: '#2F343B',
          borderRadius: '12px',
          padding: '14px',
          marginBottom: '12px',
          overflow: 'visible',
          transition: 'all 0.3s ease',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Accordion Header */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            marginBottom: isAccordionOpen ? '20px' : '0',
            transition: 'margin-bottom 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Capture and lock scroll position BEFORE any state change
            const currentScroll = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
            scrollPositionRef.current = currentScroll;
            
            // Capture current height before opening/closing
            if (accordionInnerRef.current) {
              const height = accordionInnerRef.current.scrollHeight;
              if (height > 0) {
                setContentHeight(height);
              }
            }
            
            // Clear any existing scroll lock interval
            if (scrollLockIntervalRef.current) {
              clearInterval(scrollLockIntervalRef.current);
            }
            
            // Immediately lock scroll position multiple times
            window.scrollTo(0, currentScroll);
            document.documentElement.scrollTop = currentScroll;
            document.body.scrollTop = currentScroll;
            
            setIsAccordionOpen(!isAccordionOpen);
            
            // Aggressively maintain scroll position during animation
            scrollLockIntervalRef.current = setInterval(() => {
              if (scrollPositionRef.current > 0) {
                window.scrollTo(0, scrollPositionRef.current);
                document.documentElement.scrollTop = scrollPositionRef.current;
                document.body.scrollTop = scrollPositionRef.current;
              }
            }, 16); // Every frame (~60fps)
            
            // Clear interval after animation completes
            setTimeout(() => {
              if (scrollLockIntervalRef.current) {
                clearInterval(scrollLockIntervalRef.current);
                scrollLockIntervalRef.current = null;
              }
              scrollPositionRef.current = 0;
            }, 600); // Slightly longer than max animation duration
          }}
        >
          {/* Decision Text */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flex: 1,
            fontFamily: 'Inter, sans-serif',
            fontSize: '15px',
            color: '#FFFFFF',
          }}>
            <span style={{ color: '#D1D5DB' }}>1.</span>
            <span style={{ color: '#D1D5DB' }}>{firstDecision.action}</span>
            <span style={{ color: '#6496E2', fontWeight: 600 }}>
              {firstDecision.number}
            </span>
            <span style={{ color: '#D1D5DB' }}>{firstDecision.description}</span>
          </div>

          {/* Arrow and Department Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexShrink: 0,
          }}>
            {/* Department Badge */}
            <div style={{
              backgroundColor: 'rgba(100, 150, 226, 0.5)',
              border: '1px solid #6496E2',
              borderRadius: '6px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}>
              <span style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                color: '#FFFFFF',
              }}>
                {firstDecision.department}
              </span>
            </div>

            {/* Arrow Icon */}
            <motion.div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
              }}
              animate={{ rotate: isAccordionOpen ? 180 : 0 }}
              transition={{ 
                duration: 0.4, 
                ease: [0.25, 0.46, 0.45, 0.94] 
              }}
            >
              <ChevronDown size={18} color="#9CA3AF" />
            </motion.div>
          </div>
        </div>

        {/* Accordion Content */}
        <motion.div
          ref={accordionContentRef}
          initial={false}
          animate={{
            height: isAccordionOpen ? (contentHeight > 0 ? contentHeight : undefined) : 0,
            opacity: isAccordionOpen ? 1 : 0,
          }}
          transition={{
            height: {
              duration: isAccordionOpen ? 0.5 : 0.3,
              ease: isAccordionOpen 
                ? [0.16, 1, 0.3, 1] // Elegant ease-out for opening
                : [0.4, 0, 0.2, 1], // Smooth cubic-bezier for closing
            },
            opacity: {
              duration: isAccordionOpen ? 0.4 : 0.2,
              ease: [0.4, 0, 0.2, 1],
              delay: isAccordionOpen ? 0 : 0,
            },
          }}
          onAnimationStart={() => {
            // Lock scroll position at animation start
            if (scrollPositionRef.current > 0) {
              window.scrollTo(0, scrollPositionRef.current);
              document.documentElement.scrollTop = scrollPositionRef.current;
              document.body.scrollTop = scrollPositionRef.current;
            }
          }}
          onUpdate={() => {
            // Continuously maintain scroll position during animation
            if (scrollPositionRef.current > 0) {
              window.scrollTo(0, scrollPositionRef.current);
              document.documentElement.scrollTop = scrollPositionRef.current;
              document.body.scrollTop = scrollPositionRef.current;
            }
          }}
          onAnimationComplete={() => {
            // Release scroll lock after animation completes
            if (scrollLockIntervalRef.current) {
              clearInterval(scrollLockIntervalRef.current);
              scrollLockIntervalRef.current = null;
            }
            scrollPositionRef.current = 0;
          }}
          style={{
            overflow: 'hidden',
            willChange: 'height, opacity',
            contain: 'layout style paint',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
            WebkitTransform: 'translateZ(0)',
          }}
        >
          <div ref={accordionInnerRef}>
        {/* Impact Section */}
        <div style={{
          marginBottom: '24px',
        }}>
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: '#D1D5DB',
            lineHeight: 1.6,
          }}>
            <strong style={{ color: '#FFFFFF', fontWeight: 600 }}>Impact:</strong> ~${(summaryData.revenueAtRisk / 1000).toFixed(0)}K revenue at risk. These A-class SKUs have &lt;7 days inventory and drive the most sales.
          </div>
        </div>

        {/* Product Table */}
        <div style={{
          marginBottom: '24px',
          overflowX: 'auto',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#9CA3AF' }}>Product</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#9CA3AF' }}>Location</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#9CA3AF' }}>Days Left</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#9CA3AF' }}>Monthly Sales</th>
              </tr>
            </thead>
            <tbody>
              {(productData && productData.length > 0) ? productData.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: idx < productData.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none' }}>
                  <td style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#FFFFFF' }}>{item.product}</td>
                  <td style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#D1D5DB' }}>{item.location}</td>
                  <td style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#D1D5DB' }}>{item.daysLeft.toFixed(1)}</td>
                  <td style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#D1D5DB' }}>${item.monthlySales.toLocaleString()}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9CA3AF', textAlign: 'center' }}>
                    No product data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Why Section */}
        <div style={{
          backgroundColor: '#3A3F47',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '16px',
        }}>
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            color: '#FFFFFF',
            marginBottom: '12px',
          }}>
            Why
          </div>
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            color: '#D1D5DB',
            lineHeight: 1.8,
          }}>
            <div><strong style={{ color: '#6496E2', textDecoration: 'underline' }}>{decisionDetails.skusBelowThreshold} SKUs</strong> are already below reorder threshold</div>
            <div>Confirmed stockout within {decisionDetails.stockoutHours} hours</div>
            <div>Total backorder quantity: {decisionDetails.backorderQuantity.toLocaleString()} units</div>
            <div>Part of the <strong style={{ color: '#6496E2', textDecoration: 'underline' }}>{summaryData.criticalRisk} SKUs</strong> at critical risk (&lt; 7 days coverage)</div>
          </div>
        </div>

        {/* If Executed Section */}
        <div style={{
          backgroundColor: '#3A3F47',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '16px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            color: '#FFFFFF',
            marginBottom: '12px',
          }}>
            <Check size={16} color="#33C481" />
            If Executed
          </div>
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            color: '#D1D5DB',
            lineHeight: 1.8,
          }}>
            <div>Prevents stockout for {decisionDetails.skusBelowThreshold} critical SKUs</div>
            <div>Protects ${decisionDetails.dailyRevenue} daily revenue</div>
            <div>Reduces backorder pressure by {decisionDetails.backorderQuantity.toLocaleString()} units</div>
          </div>
        </div>

        {/* If Ignored Section */}
        <div style={{
          backgroundColor: '#3A3F47',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '16px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 600,
            color: '#FFFFFF',
            marginBottom: '12px',
          }}>
            <X size={16} color="#F87171" />
            If Ignored
          </div>
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            color: '#D1D5DB',
            lineHeight: 1.8,
          }}>
            <div>Stockout within {decisionDetails.stockoutHours} hours</div>
            <div>${decisionDetails.dailyRevenue} daily revenue loss</div>
            <div>Backorder backlog increases by {decisionDetails.backorderIncrease.toFixed(2)} units/day</div>
            <div>Customer service impact: {decisionDetails.backorderQuantity.toLocaleString()} pending orders at risk</div>
          </div>
        </div>

        {/* Download Section */}
        <div style={{
          backgroundColor: '#3A3F47',
          borderRadius: '6px',
          padding: '16px',
        }}>
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            color: '#D1D5DB',
            marginBottom: '8px',
          }}>
            View emergency products data (&lt;1 day):
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Download size={16} color="#6496E2" />
            <a href="#" style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              color: '#6496E2',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}>
              inventory_health_{new Date().toISOString().split('T')[0].replace(/-/g, '_')}_emergency_products.xlsx
            </a>
          </div>
        </div>
          </div>
        </motion.div>
      </div>

      {/* Second Accordion */}
      <div style={{
        backgroundColor: '#2F343B',
        borderRadius: '12px',
        padding: '14px',
        marginBottom: '12px',
        overflow: 'visible',
        transition: 'all 0.3s ease',
        position: 'relative',
        zIndex: 1,
      }}>
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            marginBottom: isAccordion2Open ? '20px' : '0',
            transition: 'margin-bottom 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const currentScroll = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
            scrollPositionRef.current = currentScroll;
            if (accordion2InnerRef.current) {
              const height = accordion2InnerRef.current.scrollHeight;
              if (height > 0) setContentHeight2(height);
            }
            if (scrollLockIntervalRef.current) clearInterval(scrollLockIntervalRef.current);
            window.scrollTo(0, currentScroll);
            setIsAccordion2Open(!isAccordion2Open);
            scrollLockIntervalRef.current = setInterval(() => {
              if (scrollPositionRef.current > 0) {
                window.scrollTo(0, scrollPositionRef.current);
              }
            }, 16);
            setTimeout(() => {
              if (scrollLockIntervalRef.current) {
                clearInterval(scrollLockIntervalRef.current);
                scrollLockIntervalRef.current = null;
              }
              scrollPositionRef.current = 0;
            }, 600);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#FFFFFF' }}>
            <span style={{ color: '#D1D5DB' }}>2.</span>
            <span style={{ color: '#D1D5DB' }}>{secondDecision.action}</span>
            <span style={{ color: '#6496E2', fontWeight: 600 }}>
              {secondDecision.number}
            </span>
            <span style={{ color: '#D1D5DB' }}>{secondDecision.description}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <div style={{ backgroundColor: 'rgba(100, 150, 226, 0.5)', border: '1px solid #6496E2', borderRadius: '6px', padding: '6px 12px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#FFFFFF' }}>{secondDecision.department}</span>
            </div>
            <motion.div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px' }} animate={{ rotate: isAccordion2Open ? 180 : 0 }} transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}>
              <ChevronDown size={18} color="#9CA3AF" />
            </motion.div>
          </div>
        </div>
        <motion.div
          ref={accordion2ContentRef}
          initial={false}
          animate={{ height: isAccordion2Open ? (contentHeight2 > 0 ? contentHeight2 : undefined) : 0, opacity: isAccordion2Open ? 1 : 0 }}
          transition={{ height: { duration: isAccordion2Open ? 0.5 : 0.3, ease: isAccordion2Open ? [0.16, 1, 0.3, 1] : [0.4, 0, 0.2, 1] }, opacity: { duration: isAccordion2Open ? 0.4 : 0.2, ease: [0.4, 0, 0.2, 1] } }}
          style={{ overflow: 'hidden', willChange: 'height, opacity', contain: 'layout style paint', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)' }}
          onAnimationStart={() => { if (scrollPositionRef.current > 0) { window.scrollTo(0, scrollPositionRef.current); } }}
          onUpdate={() => { if (scrollPositionRef.current > 0) { window.scrollTo(0, scrollPositionRef.current); } }}
          onAnimationComplete={() => { if (scrollLockIntervalRef.current) { clearInterval(scrollLockIntervalRef.current); scrollLockIntervalRef.current = null; } scrollPositionRef.current = 0; }}
        >
          <div ref={accordion2InnerRef}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#D1D5DB', lineHeight: 1.6 }}>
                <div>Prevents stockout for {decisionDetails2.skusBelowThreshold} SKUs below safety threshold</div>
                <div>Protects ${decisionDetails2.dailyRevenue.toLocaleString()} daily revenue at risk</div>
                <div>Reduces backorder pressure by {decisionDetails2.backorderQuantity.toLocaleString()} units</div>
              </div>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#D1D5DB' }}>Product</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#D1D5DB' }}>Location</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#D1D5DB' }}>Days Left</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#D1D5DB' }}>Monthly Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {(productData2 && productData2.length > 0) ? productData2.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#FFFFFF' }}>{item.product}</td>
                      <td style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#D1D5DB' }}>{item.location}</td>
                      <td style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#D1D5DB' }}>{item.daysLeft.toFixed(1)}</td>
                      <td style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#D1D5DB' }}>${item.monthlySales.toLocaleString()}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9CA3AF', textAlign: 'center' }}>
                        No product data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ backgroundColor: '#3A3F47', borderRadius: '6px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '12px' }}>Why</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#D1D5DB', lineHeight: 1.8 }}>
                <div><strong style={{ color: '#6496E2', textDecoration: 'underline' }}>{decisionDetails2.skusBelowThreshold} SKUs</strong> are below safety stock threshold</div>
                <div>Risk of stockout within {decisionDetails2.stockoutHours} hours</div>
                <div>Total backorder quantity: {decisionDetails2.backorderQuantity.toLocaleString()} units</div>
              </div>
            </div>
            <div style={{ backgroundColor: '#3A3F47', borderRadius: '6px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '12px' }}>
                <Check size={16} color="#33C481" />
                If Executed
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#D1D5DB', lineHeight: 1.8 }}>
                <div>Prevents stockout for {decisionDetails2.skusBelowThreshold} SKUs</div>
                <div>Protects ${decisionDetails2.dailyRevenue.toLocaleString()} daily revenue</div>
                <div>Reduces backorder pressure by {decisionDetails2.backorderQuantity.toLocaleString()} units</div>
              </div>
            </div>
            <div style={{ backgroundColor: '#3A3F47', borderRadius: '6px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '12px' }}>
                <X size={16} color="#F87171" />
                If Ignored
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#D1D5DB', lineHeight: 1.8 }}>
                <div>Stockout within {decisionDetails2.stockoutHours} hours</div>
                <div>${decisionDetails2.dailyRevenue} daily revenue loss</div>
                <div>Backorder backlog increases by {decisionDetails2.backorderIncrease.toFixed(2)} units/day</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Third Accordion */}
      <div style={{
        backgroundColor: '#2F343B',
        borderRadius: '12px',
        padding: '14px',
        marginBottom: '12px',
        overflow: 'visible',
        transition: 'all 0.3s ease',
        position: 'relative',
        zIndex: 1,
      }}>
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            marginBottom: isAccordion3Open ? '20px' : '0',
            transition: 'margin-bottom 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const currentScroll = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
            scrollPositionRef.current = currentScroll;
            if (accordion3InnerRef.current) {
              const height = accordion3InnerRef.current.scrollHeight;
              if (height > 0) setContentHeight3(height);
            }
            if (scrollLockIntervalRef.current) clearInterval(scrollLockIntervalRef.current);
            window.scrollTo(0, currentScroll);
            setIsAccordion3Open(!isAccordion3Open);
            scrollLockIntervalRef.current = setInterval(() => {
              if (scrollPositionRef.current > 0) {
                window.scrollTo(0, scrollPositionRef.current);
              }
            }, 16);
            setTimeout(() => {
              if (scrollLockIntervalRef.current) {
                clearInterval(scrollLockIntervalRef.current);
                scrollLockIntervalRef.current = null;
              }
              scrollPositionRef.current = 0;
            }, 600);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#FFFFFF' }}>
            <span style={{ color: '#D1D5DB' }}>3.</span>
            <span style={{ color: '#D1D5DB' }}>{thirdDecision.action}</span>
            <span style={{ color: '#6496E2', fontWeight: 600 }}>
              {thirdDecision.number}
            </span>
            <span style={{ color: '#D1D5DB' }}>{thirdDecision.description}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <div style={{ backgroundColor: 'rgba(100, 150, 226, 0.5)', border: '1px solid #6496E2', borderRadius: '6px', padding: '6px 12px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#FFFFFF' }}>{thirdDecision.department}</span>
            </div>
            <motion.div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px' }} animate={{ rotate: isAccordion3Open ? 180 : 0 }} transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}>
              <ChevronDown size={18} color="#9CA3AF" />
            </motion.div>
          </div>
        </div>
        <motion.div
          ref={accordion3ContentRef}
          initial={false}
          animate={{ height: isAccordion3Open ? (contentHeight3 > 0 ? contentHeight3 : undefined) : 0, opacity: isAccordion3Open ? 1 : 0 }}
          transition={{ height: { duration: isAccordion3Open ? 0.5 : 0.3, ease: isAccordion3Open ? [0.16, 1, 0.3, 1] : [0.4, 0, 0.2, 1] }, opacity: { duration: isAccordion3Open ? 0.4 : 0.2, ease: [0.4, 0, 0.2, 1] } }}
          style={{ overflow: 'hidden', willChange: 'height, opacity', contain: 'layout style paint', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)' }}
          onAnimationStart={() => { if (scrollPositionRef.current > 0) { window.scrollTo(0, scrollPositionRef.current); } }}
          onUpdate={() => { if (scrollPositionRef.current > 0) { window.scrollTo(0, scrollPositionRef.current); } }}
          onAnimationComplete={() => { if (scrollLockIntervalRef.current) { clearInterval(scrollLockIntervalRef.current); scrollLockIntervalRef.current = null; } scrollPositionRef.current = 0; }}
        >
          <div ref={accordion3InnerRef}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#D1D5DB', lineHeight: 1.6 }}>
                <div>Identifies {decisionDetails3.skusBelowThreshold} slow-moving products requiring optimization</div>
                <div>Potential revenue recovery: ${decisionDetails3.dailyRevenue.toLocaleString()} daily</div>
                <div>Reduces inventory carrying costs by {decisionDetails3.backorderQuantity.toLocaleString()} units</div>
              </div>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#D1D5DB' }}>Product</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#D1D5DB' }}>Location</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#D1D5DB' }}>Days Left</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: '#D1D5DB' }}>Monthly Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {(productData3 && productData3.length > 0) ? productData3.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#FFFFFF' }}>{item.product}</td>
                      <td style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#D1D5DB' }}>{item.location}</td>
                      <td style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#D1D5DB' }}>{item.daysLeft.toFixed(1)}</td>
                      <td style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#D1D5DB' }}>${item.monthlySales.toLocaleString()}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#9CA3AF', textAlign: 'center' }}>
                        No product data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ backgroundColor: '#3A3F47', borderRadius: '6px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '12px' }}>Why</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#D1D5DB', lineHeight: 1.8 }}>
                <div><strong style={{ color: '#6496E2', textDecoration: 'underline' }}>{decisionDetails3.skusBelowThreshold} SKUs</strong> have low rotation rates</div>
                <div>High inventory carrying costs with {decisionDetails3.stockoutHours} days coverage</div>
                <div>Opportunity to optimize space and capital: {decisionDetails3.backorderQuantity.toLocaleString()} units</div>
              </div>
            </div>
            <div style={{ backgroundColor: '#3A3F47', borderRadius: '6px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '12px' }}>
                <Check size={16} color="#33C481" />
                If Executed
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#D1D5DB', lineHeight: 1.8 }}>
                <div>Optimizes {decisionDetails3.skusBelowThreshold} slow-moving products</div>
                <div>Recovers ${decisionDetails3.dailyRevenue.toLocaleString()} daily revenue potential</div>
                <div>Reduces carrying costs by {decisionDetails3.backorderQuantity.toLocaleString()} units</div>
              </div>
            </div>
            <div style={{ backgroundColor: '#3A3F47', borderRadius: '6px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '12px' }}>
                <X size={16} color="#F87171" />
                If Ignored
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#D1D5DB', lineHeight: 1.8 }}>
                <div>Continued low rotation for {decisionDetails3.stockoutHours} days</div>
                <div>${decisionDetails3.dailyRevenue} daily revenue opportunity loss</div>
                <div>Carrying costs increase by {decisionDetails3.backorderIncrease.toFixed(2)} units/day</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Divider Line */}
      <div style={{
        marginTop: '32px',
        marginBottom: '24px',
        height: '1px',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        width: '100%',
      }} />

      {/* Follow-up Questions */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <div style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
          fontWeight: 500,
          color: '#9CA3AF',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Follow-up Questions
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
        }}>
          {[
            'Top 10 products at critical risk?',
            'ABC classification analysis',
            'Next month\'s inventory forecast?',
            'Suppliers with longest lead times?'
          ].map((question, idx) => (
            <motion.button
              key={idx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                if (onQuestionSelect) {
                  onQuestionSelect(question);
                }
              }}
              style={{
                padding: '12px 16px',
                backgroundColor: 'transparent',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                color: '#E6EAF1',
                fontWeight: 400,
                lineHeight: 1.5,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              }}
            >
              {question}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Divider Line */}
      <div style={{
        marginTop: '32px',
        marginBottom: '24px',
        height: '1px',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        width: '100%',
      }} />

      {/* Excel Download Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <motion.button
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => {
            // Generate Excel/CSV data from all product data from backend
            const allProducts = [
              ...(fullProductData || []).map(p => ({
                Product: p.product,
                Location: p.location,
                'Days Left': p.daysLeft.toFixed(1),
                'Monthly Sales ($)': p.monthlySales.toLocaleString(),
                Category: 'Critical Risk'
              })),
              ...(fullProductData2 || []).map(p => ({
                Product: p.product,
                Location: p.location,
                'Days Left': p.daysLeft.toFixed(1),
                'Monthly Sales ($)': p.monthlySales.toLocaleString(),
                Category: 'Below Safety Stock'
              })),
              ...(fullProductData3 || []).map(p => ({
                Product: p.product,
                Location: p.location,
                'Days Left': p.daysLeft.toFixed(1),
                'Monthly Sales ($)': p.monthlySales.toLocaleString(),
                Category: 'Slow-Moving'
              }))
            ];
            
            if (allProducts.length === 0) {
              console.warn('No product data available for export');
              return;
            }

            // Convert to CSV
            const headers = ['Product', 'Location', 'Days Left', 'Monthly Sales ($)', 'Category'];
            const csvRows = [
              headers.join(','),
              ...allProducts.map(row => 
                headers.map(header => {
                  const value = row[header as keyof typeof row];
                  // Escape commas and quotes in CSV
                  if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                  }
                  return value;
                }).join(',')
              )
            ];
            const csvContent = csvRows.join('\n');

            // Add BOM for Excel compatibility
            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `inventory_report_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }}
          style={{
            padding: '12px 16px',
            backgroundColor: '#2F343B',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: 'fit-content',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#3A4149';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2F343B';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
          }}
        >
          <FileText size={20} color="#33C481" strokeWidth={2} />
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            color: '#E6EAF1',
            flex: 1,
          }}>
            Download Excel Report
          </span>
        </motion.button>
        <div style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '12px',
          color: '#9CA3AF',
          lineHeight: 1.5,
        }}>
          Full data for all products · Link valid 7 days
        </div>
      </div>

      {/* Action Bar */}
      <div style={{
        marginTop: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        {/* Copy Action */}
        <button
          onClick={() => {
            // Copy report summary to clipboard
            const summary = `Inventory Health Report\n\nTotal Inventory: ${summaryData.totalUnits.toLocaleString()} units\nCritical Risk: ${summaryData.criticalRisk} products\nReorder Required: ${summaryData.reorderRequired} products\nLow Rotation: ${summaryData.lowRotation} products\nProfit Margin: ${summaryData.profitMargin.toFixed(1)}%`;
            navigator.clipboard.writeText(summary);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: '#9CA3AF',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#E6EAF1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#9CA3AF';
          }}
        >
          <Copy size={16} />
          <span>Copy</span>
        </button>

        {/* Vertical Separator */}
        <div style={{
          width: '1px',
          height: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        }} />

        {/* Sources Button */}
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: '#2F343B',
            borderRadius: '20px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: '#E6EAF1',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#3A4149';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2F343B';
          }}
        >
          <RefreshCw size={16} />
          <span>Sources</span>
          <span style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#E6EAF1',
          }}>4</span>
        </button>

        {/* Like Action */}
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: '#9CA3AF',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#E6EAF1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#9CA3AF';
          }}
        >
          <ThumbsUp size={18} strokeWidth={2} />
        </button>

        {/* Dislike Action */}
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: '#9CA3AF',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#E6EAF1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#9CA3AF';
          }}
        >
          <ThumbsDown size={18} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
