/**
 * Experimental Report View Component
 * STEP 4: Top KPI / Health score block only (no other sections yet)
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Asterisk, ExternalLink, Download, ChevronDown, Check, X, Copy, X as XIcon } from 'lucide-react';
import { Chart as ChartJS, ArcElement, DoughnutController } from 'chart.js';

import { Component } from '../services/agentService';
import { parseComponentsToReport } from '../utils/reportParser';
import { VortaStarIcon } from '../pages/LLMChatPage';

ChartJS.register(ArcElement, DoughnutController);

interface ExperimentalReportViewProps {
  components: Component[];
  conversationHistory?: Array<{ role: string; content?: string }>;
  messageIdx?: number;
  onModalStateChange?: (isOpen: boolean) => void;
}

export default function ExperimentalReportView({ components, conversationHistory, messageIdx, onModalStateChange }: ExperimentalReportViewProps) {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [isAccordion2Open, setIsAccordion2Open] = useState(false);
  const [isAccordion3Open, setIsAccordion3Open] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{ title: string; products: Array<{ product: string; location: string; daysLeft: number; monthlySales: number }> } | null>(null);
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

  // Mock-first behavior for design: default to 84 if not detected
  const score = parsed.healthScore?.value ?? 84;
  const color = parsed.healthScore?.color ?? (score >= 70 ? '#33C481' : score >= 40 ? '#C48333' : '#DC2626');
  
  // Determine health status
  const healthStatus = score >= 70 ? 'Healthy' : score >= 40 ? 'At Risk' : 'Critical';
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

  // Generate mock summary data based on health score
  const summaryData = useMemo(() => {
    const isHealthy = score >= 70;
    const isAtRisk = score >= 40 && score < 70;
    
    // Adjust values based on health score
    const revenueAtRisk = isHealthy ? 125000 : isAtRisk ? 365000 : 565000;
    const topSellingSKUs = isHealthy ? 2 : isAtRisk ? 3 : 4;
    const totalUnits = isHealthy ? 425000 : isAtRisk ? 400000 : 375246;
    const costValue = isHealthy ? 2.85 : isAtRisk ? 2.52 : 2.22;
    const saleValue = isHealthy ? 4.95 : isAtRisk ? 4.38 : 3.84;
    const criticalRisk = isHealthy ? 185 : isAtRisk ? 310 : 435;
    const reorderRequired = isHealthy ? 298 : isAtRisk ? 448 : 598;
    const lowRotation = isHealthy ? 253 : isAtRisk ? 403 : 553;
    const profitMargin = isHealthy ? 42.3 : isAtRisk ? 41.2 : 40.1;
    
    return {
      revenueAtRisk,
      topSellingSKUs,
      totalUnits,
      costValue,
      saleValue,
      criticalRisk,
      reorderRequired,
      lowRotation,
      profitMargin,
    };
  }, [score]);

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

  // Generate mock product data for the table
  const productData = useMemo(() => {
    const isHealthy = score >= 70;
    const isAtRisk = score >= 40 && score < 70;
    
    if (isHealthy) {
      return [
        { product: 'MAYONESA 350 GRS/ 24 UDS', location: 'BODEGA CENTRAL', daysLeft: 4.2, monthlySales: 185420 },
        { product: 'MAYONESA 200 GRS/ 24 UDS', location: 'BODEGA CENTRAL', daysLeft: 5.1, monthlySales: 102340 },
        { product: 'KETCHUP GALON/ 4085 ML/ 6 UDS', location: 'BODEGA CENTRAL', daysLeft: 6.3, monthlySales: 98560 },
        { product: 'SALSA TOMATE 350 GRS/ 24 UDS', location: 'BODEGA NORTE', daysLeft: 4.8, monthlySales: 87230 },
      ];
    } else if (isAtRisk) {
      return [
        { product: 'MAYONESA 350 GRS/ 24 UDS', location: 'BODEGA CENTRAL', daysLeft: 3.1, monthlySales: 214580 },
        { product: 'MAYONESA 200 GRS/ 24 UDS', location: 'BODEGA CENTRAL', daysLeft: 3.8, monthlySales: 118920 },
        { product: 'MAYONESA GALON 3.79 L/ 4 UDS', location: 'BODEGA CENTRAL', daysLeft: 5.2, monthlySales: 112450 },
        { product: 'KETCHUP GALON/ 4085 ML/ 6 UDS', location: 'BODEGA HTZANETATOS', daysLeft: 2.1, monthlySales: 67890 },
      ];
    } else {
      return [
        { product: 'MAYONESA 350 GRS/ 24 UDS', location: 'BODEGA CENTRAL', daysLeft: 2.4, monthlySales: 243810 },
        { product: 'MAYONESA 200 GRS/ 24 UDS', location: 'BODEGA CENTRAL', daysLeft: 3.4, monthlySales: 134467 },
        { product: 'MAYONESA GALON 3.79 L/ 4 UDS', location: 'BODEGA CENTRAL', daysLeft: 5.4, monthlySales: 132854 },
        { product: 'KETCHUP GALON/ 4085 ML/ 6 UDS', location: 'BODEGA HTZANETATOS', daysLeft: 0.9, monthlySales: 53550 },
      ];
    }
  }, [score]);

  // Generate impact and decision details for first decision
  const decisionDetails = useMemo(() => {
    const isHealthy = score >= 70;
    const isAtRisk = score >= 40 && score < 70;
    
    return {
      skusBelowThreshold: isHealthy ? 8 : isAtRisk ? 12 : 10,
      stockoutHours: isHealthy ? 48 : isAtRisk ? 12 : 5,
      backorderQuantity: isHealthy ? 5420 : isAtRisk ? 8920 : 11389.92,
      dailyRevenue: isHealthy ? 285 : isAtRisk ? 425 : 568,
      backorderIncrease: isHealthy ? 185.3 : isAtRisk ? 298.5 : 410.62,
    };
  }, [score]);

  // Generate mock product data for second accordion (reorder required)
  const productData2 = useMemo(() => {
    const isHealthy = score >= 70;
    const isAtRisk = score >= 40 && score < 70;
    
    if (isHealthy) {
      return [
        { product: 'ACEITE VEGETAL 1L/ 12 UDS', location: 'BODEGA CENTRAL', daysLeft: 6.5, monthlySales: 145230 },
        { product: 'ARROZ EXTRA 1KG/ 20 UDS', location: 'BODEGA NORTE', daysLeft: 7.2, monthlySales: 128450 },
        { product: 'AZUCAR BLANCA 1KG/ 20 UDS', location: 'BODEGA CENTRAL', daysLeft: 5.8, monthlySales: 112340 },
        { product: 'FRIJOLES NEGROS 1KG/ 20 UDS', location: 'BODEGA SUR', daysLeft: 6.1, monthlySales: 98560 },
      ];
    } else if (isAtRisk) {
      return [
        { product: 'ACEITE VEGETAL 1L/ 12 UDS', location: 'BODEGA CENTRAL', daysLeft: 4.2, monthlySales: 168920 },
        { product: 'ARROZ EXTRA 1KG/ 20 UDS', location: 'BODEGA NORTE', daysLeft: 4.8, monthlySales: 152340 },
        { product: 'AZUCAR BLANCA 1KG/ 20 UDS', location: 'BODEGA CENTRAL', daysLeft: 3.5, monthlySales: 135670 },
        { product: 'FRIJOLES NEGROS 1KG/ 20 UDS', location: 'BODEGA SUR', daysLeft: 3.9, monthlySales: 112450 },
      ];
    } else {
      return [
        { product: 'ACEITE VEGETAL 1L/ 12 UDS', location: 'BODEGA CENTRAL', daysLeft: 2.8, monthlySales: 192450 },
        { product: 'ARROZ EXTRA 1KG/ 20 UDS', location: 'BODEGA NORTE', daysLeft: 3.1, monthlySales: 178920 },
        { product: 'AZUCAR BLANCA 1KG/ 20 UDS', location: 'BODEGA CENTRAL', daysLeft: 2.2, monthlySales: 158340 },
        { product: 'FRIJOLES NEGROS 1KG/ 20 UDS', location: 'BODEGA SUR', daysLeft: 2.5, monthlySales: 128560 },
      ];
    }
  }, [score]);

  // Generate mock product data for third accordion (low rotation)
  const productData3 = useMemo(() => {
    const isHealthy = score >= 70;
    const isAtRisk = score >= 40 && score < 70;
    
    if (isHealthy) {
      return [
        { product: 'SALSA BBQ 500ML/ 12 UDS', location: 'BODEGA CENTRAL', daysLeft: 45, monthlySales: 12500 },
        { product: 'MOSTAZA DIJON 250ML/ 24 UDS', location: 'BODEGA NORTE', daysLeft: 52, monthlySales: 8900 },
        { product: 'SALSA WORCESTERSHIRE 150ML/ 24 UDS', location: 'BODEGA SUR', daysLeft: 38, monthlySales: 6700 },
        { product: 'VINAGRE BALSAMICO 250ML/ 12 UDS', location: 'BODEGA CENTRAL', daysLeft: 41, monthlySales: 5400 },
      ];
    } else if (isAtRisk) {
      return [
        { product: 'SALSA BBQ 500ML/ 12 UDS', location: 'BODEGA CENTRAL', daysLeft: 38, monthlySales: 15200 },
        { product: 'MOSTAZA DIJON 250ML/ 24 UDS', location: 'BODEGA NORTE', daysLeft: 44, monthlySales: 11200 },
        { product: 'SALSA WORCESTERSHIRE 150ML/ 24 UDS', location: 'BODEGA SUR', daysLeft: 32, monthlySales: 8900 },
        { product: 'VINAGRE BALSAMICO 250ML/ 12 UDS', location: 'BODEGA CENTRAL', daysLeft: 35, monthlySales: 7200 },
      ];
    } else {
      return [
        { product: 'SALSA BBQ 500ML/ 12 UDS', location: 'BODEGA CENTRAL', daysLeft: 28, monthlySales: 18200 },
        { product: 'MOSTAZA DIJON 250ML/ 24 UDS', location: 'BODEGA NORTE', daysLeft: 32, monthlySales: 13400 },
        { product: 'SALSA WORCESTERSHIRE 150ML/ 24 UDS', location: 'BODEGA SUR', daysLeft: 24, monthlySales: 10200 },
        { product: 'VINAGRE BALSAMICO 250ML/ 12 UDS', location: 'BODEGA CENTRAL', daysLeft: 26, monthlySales: 8900 },
      ];
    }
  }, [score]);

  // Generate details for second decision (reorder required)
  const decisionDetails2 = useMemo(() => {
    const isHealthy = score >= 70;
    const isAtRisk = score >= 40 && score < 70;
    
    return {
      skusBelowThreshold: isHealthy ? 15 : isAtRisk ? 22 : 28,
      stockoutHours: isHealthy ? 72 : isAtRisk ? 36 : 18,
      backorderQuantity: isHealthy ? 3200 : isAtRisk ? 5600 : 7800,
      dailyRevenue: isHealthy ? 185 : isAtRisk ? 285 : 385,
      backorderIncrease: isHealthy ? 120.5 : isAtRisk ? 195.2 : 275.8,
    };
  }, [score]);

  // Generate details for third decision (low rotation)
  const decisionDetails3 = useMemo(() => {
    const isHealthy = score >= 70;
    const isAtRisk = score >= 40 && score < 70;
    
    return {
      skusBelowThreshold: isHealthy ? 45 : isAtRisk ? 68 : 92,
      stockoutHours: isHealthy ? 120 : isAtRisk ? 96 : 72,
      backorderQuantity: isHealthy ? 1200 : isAtRisk ? 2100 : 3200,
      dailyRevenue: isHealthy ? 95 : isAtRisk ? 145 : 195,
      backorderIncrease: isHealthy ? 45.2 : isAtRisk ? 78.5 : 112.3,
    };
  }, [score]);

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

  // Generate full product data for modals (many more products)
  const fullProductData = useMemo(() => {
    const isHealthy = score >= 70;
    const isAtRisk = score >= 40 && score < 70;
    
    const baseProducts = [
      { product: 'AMERICAN BEST GALON 3.79 L/4 UDS', location: 'BODEGA MAQUILA', daysLeft: 0.1, monthlySales: 12876 },
      { product: 'PIMIENTA MOLIDA 454GRS (LIBRA)', location: 'BODEGA CENTRAL', daysLeft: 0.1, monthlySales: 1558 },
      { product: 'AVENA CANELA 320 GRS/24 UDS', location: 'BODEGA DE CHIRIQUI', daysLeft: 0.1, monthlySales: 1199 },
      { product: 'SIROPE 6 OZ (177 ML)/24 UDS', location: 'BODEGA DE CHIRIQUI', daysLeft: 0.1, monthlySales: 710 },
      { product: 'CALDITO ACHIOTE/CULANTRO 175 GRS/12 UDS', location: 'BODEGA CENTRAL', daysLeft: 0.1, monthlySales: 607 },
      { product: 'SALSA DE OSTION 200 GRS/24 UDS', location: 'BODEGA DE CHIRIQUI', daysLeft: 0.1, monthlySales: 350 },
      { product: 'CONDIMENTE CLAVOS ENTEROS 18GR/48 UDS', location: 'BODEGA CENTRAL', daysLeft: 0.2, monthlySales: 4038 },
      { product: 'SANDWICH SPREAD 350 GRS/24 UDS', location: 'BOD. EXPORTACION', daysLeft: 0.2, monthlySales: 3339 },
      { product: 'CHIA EN GRANO 150 GRS/12 UDS', location: 'BODEGA DE CHIRIQUI', daysLeft: 0.2, monthlySales: 1367 },
      { product: 'CARTON DE ARROCERO/20 UDS', location: 'BODEGA MAQUILA', daysLeft: 0.2, monthlySales: 1260 },
      { product: 'CARTON SAZON CON ACHIOTE/20 UDS', location: 'BODEGA MAQUILA', daysLeft: 0.2, monthlySales: 812 },
      { product: 'VINAGRE DULCE GALON PARA SUSHI/4 UDS', location: 'BODEGA HTZANETATOS', daysLeft: 0.2, monthlySales: 280 },
      { product: 'SAZONADOR COMPLETO+CURCUMA FC G/770 GR/6 UDS', location: 'BODEGA CENTRAL', daysLeft: 0.3, monthlySales: 2807 },
      { product: 'AJO EN POLVO 454 GRS (LIBRA)', location: 'BODEGA CENTRAL', daysLeft: 0.3, monthlySales: 2703 },
      { product: 'CHILI EN POLVO 454 GRS (LIBRA)', location: 'BODEGA CENTRAL', daysLeft: 0.3, monthlySales: 347 },
      { product: 'ADOBO PARA TODO 454 GRS (LIBRA)', location: 'BODEGA CENTRAL', daysLeft: 0.3, monthlySales: 210 },
      { product: 'KETCHUP XTRA 500 GRS/24 UDS', location: 'BODEGA MAQUILA', daysLeft: 0.4, monthlySales: 4509 },
      { product: 'SALSA CHINA GALON 3.79 L/4 UDS', location: 'BODEGA HTZANETATOS', daysLeft: 0.4, monthlySales: 2291 },
      { product: 'MAYONESA 350 GRS/ 24 UDS', location: 'BODEGA CENTRAL', daysLeft: isHealthy ? 4.2 : isAtRisk ? 3.1 : 2.4, monthlySales: isHealthy ? 185420 : isAtRisk ? 214580 : 243810 },
      { product: 'MAYONESA 200 GRS/ 24 UDS', location: 'BODEGA CENTRAL', daysLeft: isHealthy ? 5.1 : isAtRisk ? 3.8 : 3.4, monthlySales: isHealthy ? 102340 : isAtRisk ? 118920 : 134467 },
      { product: 'KETCHUP GALON/ 4085 ML/ 6 UDS', location: 'BODEGA CENTRAL', daysLeft: isHealthy ? 6.3 : isAtRisk ? 2.1 : 0.9, monthlySales: isHealthy ? 98560 : isAtRisk ? 67890 : 53550 },
    ];
    
    // Generate more products to reach the number
    const additionalProducts = Array.from({ length: summaryData.criticalRisk - baseProducts.length }, (_, i) => ({
      product: `PRODUCT ${i + 1} - CRITICAL RISK`,
      location: ['BODEGA CENTRAL', 'BODEGA NORTE', 'BODEGA SUR', 'BODEGA MAQUILA', 'BODEGA DE CHIRIQUI', 'BODEGA HTZANETATOS'][i % 6],
      daysLeft: Math.random() * 0.5 + 0.1,
      monthlySales: Math.floor(Math.random() * 5000) + 200,
    }));
    
    return [...baseProducts, ...additionalProducts].slice(0, summaryData.criticalRisk);
  }, [score, summaryData]);

  const fullProductData2 = useMemo(() => {
    const isHealthy = score >= 70;
    const isAtRisk = score >= 40 && score < 70;
    
    const baseProducts = [
      { product: 'ACEITE VEGETAL 1L/ 12 UDS', location: 'BODEGA CENTRAL', daysLeft: isHealthy ? 6.5 : isAtRisk ? 4.2 : 2.8, monthlySales: isHealthy ? 145230 : isAtRisk ? 168920 : 192450 },
      { product: 'ARROZ EXTRA 1KG/ 20 UDS', location: 'BODEGA NORTE', daysLeft: isHealthy ? 7.2 : isAtRisk ? 4.8 : 3.1, monthlySales: isHealthy ? 128450 : isAtRisk ? 152340 : 178920 },
      { product: 'AZUCAR BLANCA 1KG/ 20 UDS', location: 'BODEGA CENTRAL', daysLeft: isHealthy ? 5.8 : isAtRisk ? 3.5 : 2.2, monthlySales: isHealthy ? 112340 : isAtRisk ? 135670 : 158340 },
      { product: 'FRIJOLES NEGROS 1KG/ 20 UDS', location: 'BODEGA SUR', daysLeft: isHealthy ? 6.1 : isAtRisk ? 3.9 : 2.5, monthlySales: isHealthy ? 98560 : isAtRisk ? 112450 : 128560 },
    ];
    
    const additionalProducts = Array.from({ length: summaryData.reorderRequired - baseProducts.length }, (_, i) => ({
      product: `REORDER PRODUCT ${i + 1}`,
      location: ['BODEGA CENTRAL', 'BODEGA NORTE', 'BODEGA SUR', 'BODEGA MAQUILA'][i % 4],
      daysLeft: Math.random() * 3 + 3,
      monthlySales: Math.floor(Math.random() * 50000) + 5000,
    }));
    
    return [...baseProducts, ...additionalProducts].slice(0, summaryData.reorderRequired);
  }, [score, summaryData]);

  const fullProductData3 = useMemo(() => {
    const isHealthy = score >= 70;
    const isAtRisk = score >= 40 && score < 70;
    
    const baseProducts = [
      { product: 'SALSA BBQ 500ML/ 12 UDS', location: 'BODEGA CENTRAL', daysLeft: isHealthy ? 45 : isAtRisk ? 38 : 28, monthlySales: isHealthy ? 12500 : isAtRisk ? 15200 : 18200 },
      { product: 'MOSTAZA DIJON 250ML/ 24 UDS', location: 'BODEGA NORTE', daysLeft: isHealthy ? 52 : isAtRisk ? 44 : 32, monthlySales: isHealthy ? 8900 : isAtRisk ? 11200 : 13400 },
      { product: 'SALSA WORCESTERSHIRE 150ML/ 24 UDS', location: 'BODEGA SUR', daysLeft: isHealthy ? 38 : isAtRisk ? 32 : 24, monthlySales: isHealthy ? 6700 : isAtRisk ? 8900 : 10200 },
      { product: 'VINAGRE BALSAMICO 250ML/ 12 UDS', location: 'BODEGA CENTRAL', daysLeft: isHealthy ? 41 : isAtRisk ? 35 : 26, monthlySales: isHealthy ? 5400 : isAtRisk ? 7200 : 8900 },
    ];
    
    const additionalProducts = Array.from({ length: summaryData.lowRotation - baseProducts.length }, (_, i) => ({
      product: `SLOW MOVING PRODUCT ${i + 1}`,
      location: ['BODEGA CENTRAL', 'BODEGA NORTE', 'BODEGA SUR'][i % 3],
      daysLeft: Math.random() * 30 + 30,
      monthlySales: Math.floor(Math.random() * 5000) + 1000,
    }));
    
    return [...baseProducts, ...additionalProducts].slice(0, summaryData.lowRotation);
  }, [score, summaryData]);

  // Function to open modal with product data
  const openProductModal = (title: string, products: Array<{ product: string; location: string; daysLeft: number; monthlySales: number }>) => {
    setModalData({ title, products });
    setIsModalOpen(true);
    onModalStateChange?.(true);
  };

  // Handle modal close
  const closeModal = () => {
    setIsModalOpen(false);
    onModalStateChange?.(false);
  };

  // Function to copy table data to clipboard (Excel format)
  const copyToClipboard = () => {
    if (!modalData) return;
    
    const headers = ['Product', 'Location', 'Days Left', 'Monthly Sales ($)'];
    const rows = modalData.products.map(p => [
      p.product,
      p.location,
      p.daysLeft.toFixed(1),
      p.monthlySales.toLocaleString()
    ]);
    
    const csv = [
      headers.join('\t'),
      ...rows.map(row => row.join('\t'))
    ].join('\n');
    
    navigator.clipboard.writeText(csv).then(() => {
      // Visual feedback could be added here
    });
  };

  // Get current month and year for report title
  const reportDate = useMemo(() => {
    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'long' });
    const year = now.getFullYear();
    return `${month} ${year}`;
  }, []);

  return (
    <div style={{ width: '100%', paddingTop: '0px', position: 'relative', zIndex: 1 }}>
      {/* Single row: Aragon icon, pie chart with 84 inside, Healthy and title to the right */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          marginTop: '6px', // Tiny bit lower to align better with user message
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
          width: 200,
          height: 200,
        }}>
          <canvas ref={canvasRef} width={200} height={200} style={{ width: '200px', height: '200px' }} />
          {/* Only 84 inside pie chart - same size */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '42px',
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
          height: '200px', // Same height as pie to center vertically
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
          borderRadius: '16px',
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
        {/* View All Button */}
        <div style={{ marginBottom: '24px' }}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              openProductModal(`All products at critical risk (<7 days inventory)`, fullProductData);
            }}
            style={{
              backgroundColor: '#6496E2',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              color: '#FFFFFF',
            }}
          >
            View all {firstDecision.number} products
            <ExternalLink size={14} />
          </button>
        </div>

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
              {productData.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: idx < productData.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none' }}>
                  <td style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#FFFFFF' }}>{item.product}</td>
                  <td style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#D1D5DB' }}>{item.location}</td>
                  <td style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#D1D5DB' }}>{item.daysLeft}</td>
                  <td style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#D1D5DB' }}>${item.monthlySales.toLocaleString()}</td>
                </tr>
              ))}
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
        borderRadius: '16px',
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
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  openProductModal(`All products below safety stock`, fullProductData2);
                }}
                style={{ backgroundColor: '#6496E2', border: 'none', borderRadius: '6px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#FFFFFF' }}
              >
                View all {secondDecision.number} products
                <ExternalLink size={14} />
              </button>
            </div>
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
                  {productData2.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#FFFFFF' }}>{item.product}</td>
                      <td style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#D1D5DB' }}>{item.location}</td>
                      <td style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#D1D5DB' }}>{item.daysLeft}</td>
                      <td style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#D1D5DB' }}>${item.monthlySales.toLocaleString()}</td>
                    </tr>
                  ))}
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
        borderRadius: '16px',
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
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  openProductModal(`All slow-moving inventory items`, fullProductData3);
                }}
                style={{ backgroundColor: '#6496E2', border: 'none', borderRadius: '6px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#FFFFFF' }}
              >
                View all {thirdDecision.number} products
                <ExternalLink size={14} />
              </button>
            </div>
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
                  {productData3.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#FFFFFF' }}>{item.product}</td>
                      <td style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#D1D5DB' }}>{item.location}</td>
                      <td style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#D1D5DB' }}>{item.daysLeft}</td>
                      <td style={{ padding: '12px 8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#D1D5DB' }}>${item.monthlySales.toLocaleString()}</td>
                    </tr>
                  ))}
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

      {/* Product Modal */}
      <AnimatePresence>
        {isModalOpen && modalData && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
              }}
              onClick={closeModal}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  backgroundColor: '#2F343B',
                  borderRadius: '12px',
                  width: '100%',
                  maxWidth: '1200px',
                  maxHeight: '90vh',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                  position: 'relative',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '20px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                  <h2 style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    margin: 0,
                  }}>
                    {modalData.title}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={copyToClipboard}
                      style={{
                        backgroundColor: '#6496E2',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#FFFFFF',
                      }}
                    >
                      <Copy size={16} />
                      Copy to paste
                    </button>
                    <button
                      onClick={closeModal}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <XIcon size={20} color="#D1D5DB" />
                    </button>
                  </div>
                </div>

                {/* Modal Content - Scrollable Table */}
                <div style={{
                  overflowY: 'auto',
                  flex: 1,
                  padding: '20px',
                }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                  }}>
                    <thead style={{
                      position: 'sticky',
                      top: 0,
                      backgroundColor: '#2F343B',
                      zIndex: 10,
                    }}>
                      <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.2)' }}>
                        <th style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#D1D5DB',
                        }}>
                          Product
                        </th>
                        <th style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#D1D5DB',
                        }}>
                          Location
                        </th>
                        <th style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#D1D5DB',
                        }}>
                          Days Left
                        </th>
                        <th style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#D1D5DB',
                        }}>
                          Monthly Sales ($)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalData.products.map((item, idx) => (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          <td style={{
                            padding: '12px 16px',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '13px',
                            color: '#FFFFFF',
                          }}>
                            {item.product}
                          </td>
                          <td style={{
                            padding: '12px 16px',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '13px',
                            color: '#D1D5DB',
                          }}>
                            {item.location}
                          </td>
                          <td style={{
                            padding: '12px 16px',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '13px',
                            color: '#D1D5DB',
                          }}>
                            {item.daysLeft.toFixed(1)}
                          </td>
                          <td style={{
                            padding: '12px 16px',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '13px',
                            color: '#D1D5DB',
                          }}>
                            ${item.monthlySales.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
