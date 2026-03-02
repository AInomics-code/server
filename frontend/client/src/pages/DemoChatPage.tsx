/**
 * DEMO CHAT PAGE - Completely separate from LLMChatPage
 * Uses mock data only - no API calls, no shared state
 * Accessible at /demo route
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DemoGlobalSidebar } from '@/components/DemoGlobalSidebar';
import { ChatChart } from '@/components/ChatChart';
import { LLMMarkdownRenderer } from '@/components/LLMMarkdownRenderer';
// GetStartedCards removed - using file upload instead
import ExperimentalReportView from '@/components/ExperimentalReportView';
import { t, getCurrentLanguage, setCurrentLanguage, type Language } from '@/config/i18n';
import { USE_EXPERIMENTAL_REPORT_LAYOUT } from '@/config/features';
import { 
  Component,
  ChartComponent,
  PieChartComponent,
  BubbleChartComponent,
  RadarChartComponent,
} from '@/services/agentService';
import { type HealthScoresResponse } from '@/services/healthScoresService';
import { type ReportData, type ProductData, type DecisionDetails } from '@/components/ExperimentalReportView';
import { 
  ArrowRight, 
  X, 
  Copy,
  Download,
  Check,
  ChevronDown,
  ChevronUp,
  Star,
  Pencil,
  Folder,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Upload,
  Plus,
  FileText,
  Circle,
  Wrench,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
// ChatInput will be defined in this file for complete separation

// ========== MOCK DATA - Completely isolated ==========
const MOCK_HEALTH_SCORES: HealthScoresResponse = {
  period: "2024-01",
  computed_at: new Date().toISOString(),
  inventory: {
    score: 72,
    label: "Healthy",
    period: "2024-01",
    breakdown: {
      stock_availability: 85,
      rotation_quality: 70,
      reorder_management: 65,
      profitability: 75,
    },
    inputs: {
      total_products: 320,
      pct_critico: 4.69,
      pct_requiring_reorder: 35.00,
      pct_baja_rotacion: 5.00,
      avg_profit_margin_pct: 22.40,
    }
  },
  sales: {
    score: 68,
    label: "Healthy",
    period: "2024-01",
    breakdown: {
      seller_goal_attainment: 72,
      client_portfolio_rfm: 65,
      fulfillment_efficiency: 70,
    },
    inputs: {}
  }
};

const MOCK_REPORT_DATA: ReportData = {
  totalUnits: 425000,
  costValue: 2.85,
  saleValue: 4.95,
  revenueAtRisk: 125000,
  topSellingSKUs: 2,
  criticalRiskProducts: [
    { product: "Premium Product A", location: "Warehouse North", daysLeft: 2.5, monthlySales: 15000 },
    { product: "Premium Product B", location: "Warehouse South", daysLeft: 3.2, monthlySales: 12000 },
    { product: "Standard Product C", location: "Warehouse East", daysLeft: 1.8, monthlySales: 18000 },
    { product: "Premium Product D", location: "Warehouse West", daysLeft: 4.1, monthlySales: 11000 },
  ],
  reorderRequiredProducts: [
    { product: "Product X", location: "Warehouse North", daysLeft: 8.5, monthlySales: 22000 },
    { product: "Product Y", location: "Warehouse South", daysLeft: 9.2, monthlySales: 19000 },
    { product: "Product Z", location: "Warehouse East", daysLeft: 7.8, monthlySales: 25000 },
  ],
  lowRotationProducts: [
    { product: "Slow Product 1", location: "Warehouse North", daysLeft: 45.2, monthlySales: 5000 },
    { product: "Slow Product 2", location: "Warehouse South", daysLeft: 52.1, monthlySales: 3200 },
  ],
  criticalRiskDetails: {
    skusBelowThreshold: 15,
    stockoutHours: 48,
    backorderQuantity: 1250,
    dailyRevenue: 8500,
    backorderIncrease: 12.5,
  },
  reorderRequiredDetails: {
    skusBelowThreshold: 28,
    stockoutHours: 0,
    backorderQuantity: 0,
    dailyRevenue: 12000,
    backorderIncrease: 0,
  },
  lowRotationDetails: {
    skusBelowThreshold: 8,
    stockoutHours: 0,
    backorderQuantity: 0,
    dailyRevenue: 2500,
    backorderIncrease: 0,
  },
};

// Mock API response for demo
const MOCK_API_RESPONSE: Component[] = [
  {
    type: 'text',
    data: '## Inventory Health Analysis\n\nYour inventory health score is **72/100**, indicating a **Healthy** status. The system has identified several key areas requiring attention to maintain optimal inventory levels and prevent stockouts.\n\n### Key Findings\n\n- **15 products** are at critical risk of stockout within the next 3 days\n- **28 products** require immediate reorder to maintain service levels\n- **8 products** show low rotation and may need promotional support\n\n### Recommended Actions\n\n1. **Immediate Replenishment**: Prioritize the 15 critical products for urgent restocking\n2. **Reorder Planning**: Review and process reorder requests for the 28 products identified\n3. **Promotion Strategy**: Consider promotional campaigns for low-rotation items to improve turnover\n\n[Download Excel Report](#download-excel)',
  }
];

// ========== TYPES ==========
interface Message {
  role: 'user' | 'assistant';
  content: string;
  components?: Component[];
  chartData?: any;
}

// ========== VORTA STAR ICON (Standalone) ==========
const VortaStarIcon = ({ size = 64, color = '#5B9EFF' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <path 
      d="M32 8L32 56" 
      stroke={color} 
      strokeWidth="8" 
      strokeLinecap="square"
    />
    <path 
      d="M32 8L32 56" 
      stroke={color} 
      strokeWidth="8" 
      strokeLinecap="square"
      transform="rotate(60 32 32)"
    />
    <path 
      d="M32 8L32 56" 
      stroke={color} 
      strokeWidth="8" 
      strokeLinecap="square"
      transform="rotate(120 32 32)"
    />
  </svg>
);

// ========== HELPER FUNCTION ==========
function convertComponentToChartData(component: Component): any | null {
  if (!component || !component.data) return null;
  
  const { type, data } = component;
  
  if (type === 'bar_chart' || type === 'line_chart' || type === 'area_chart' || type === 'scatter_chart' || type === 'mixed_chart') {
    const chartData = data as ChartComponent['data'];
    return {
      type: type === 'bar_chart' ? 'bar' : 
            type === 'line_chart' ? 'line' : 
            type === 'area_chart' ? 'line' :
            type === 'scatter_chart' ? 'scatter' :
            'bar',
      labels: chartData.datasets[0]?.data.map((d: any) => d.x) || [],
      datasets: chartData.datasets.map((dataset: any) => ({
        label: dataset.label,
        data: dataset.data.map((d: any) => d.y),
        type: dataset.type || (type === 'mixed_chart' ? 'bar' : undefined),
      })),
      title: chartData.title,
    };
  }
  
  if (type === 'pie_chart' || type === 'polar_chart') {
    const chartData = data as PieChartComponent['data'];
    return {
      type: type === 'pie_chart' ? 'pie' : 'polarArea',
      labels: chartData.datasets[0]?.data.map((d: any) => d.label) || [],
      datasets: chartData.datasets.map((dataset: any) => ({
        label: dataset.label,
        data: dataset.data.map((d: any) => d.value),
      })),
      title: chartData.title,
    };
  }
  
  if (type === 'bubble_chart') {
    const chartData = data as BubbleChartComponent['data'];
    return {
      type: 'bubble',
      labels: chartData.datasets[0]?.data.map((d: any) => d.label || '') || [],
      datasets: chartData.datasets.map((dataset: any) => ({
        label: dataset.label,
        data: dataset.data.map((d: any) => ({
          x: d.x,
          y: d.y,
          r: d.r,
        })),
      })),
      title: chartData.title,
    };
  }
  
  if (type === 'radar_chart') {
    const chartData = data as RadarChartComponent['data'];
    return {
      type: 'radar',
      labels: chartData.datasets[0]?.data.map((d: any) => d.axis) || [],
      datasets: chartData.datasets.map((dataset: any) => ({
        label: dataset.label,
        data: dataset.data.map((d: any) => d.value),
      })),
      title: chartData.title,
    };
  }
  
  return null;
}

// ========== MAIN COMPONENT ==========
export function DemoChatPage() {
  // ========== STATE MANAGEMENT (Isolated) ==========
  const [language, setLanguage] = useState<Language>(getCurrentLanguage());
  const [showGetStarted, setShowGetStarted] = useState(true);
  const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false);
  const [healthScores] = useState<HealthScoresResponse | null>(MOCK_HEALTH_SCORES);
  const [healthScoresLoading] = useState(false); // Always false in demo
  const [chatInputValue, setChatInputValue] = useState<string | undefined>(undefined);
  
  // Chat mode state
  const [chatMode, setChatMode] = useState(false);
  const [submittedQuestion, setSubmittedQuestion] = useState('');
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  
  // Conversation history for multi-turn chat
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  
  // UI state
  const [copiedMessageIdx, setCopiedMessageIdx] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Demo mode - no backend needed
  const [sessionId] = useState<string | null>('demo-session-123');
  const [userId] = useState(() => 'demo-user');
  const currentRequestIdRef = useRef(0);
  const chatContentRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement | null>(null);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);
  const titleDropdownRef = useRef<HTMLDivElement>(null);
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isHoveringUpload, setIsHoveringUpload] = useState(false);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setCurrentLanguage(lang);
  };

  const scrollToLatestMessageTop = () => {
    if (lastMessageRef.current && chatContentRef.current) {
      const element = lastMessageRef.current;
      const container = chatContentRef.current;
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const relativeTop = elementRect.top - containerRect.top + container.scrollTop;
      container.scrollTo({
        top: relativeTop - 20,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const chatContent = chatContentRef.current;
    if (!chatContent) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContent;
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
      setShowNewMessageButton(isScrolledUp);
    };

    chatContent.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      chatContent.removeEventListener('scroll', handleScroll);
    };
  }, [conversationHistory, chatMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (titleDropdownRef.current && !titleDropdownRef.current.contains(event.target as Node)) {
        setIsTitleDropdownOpen(false);
      }
    };

    if (isTitleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTitleDropdownOpen]);

  // ========== HANDLERS (Mock only) ==========
  
  const handleQuestionSubmit = async (rawQuestion: string) => {
    const question = rawQuestion.trim();
    if (!question) return;
    
    setConversationHistory(prev => [...prev, { role: 'user', content: question }]);
    setSubmittedQuestion(question);
    setChatMode(true);
    setIsWaitingForResponse(true);
    setShowGetStarted(false);
    
    // Simulate API delay with mock response
    setTimeout(() => {
      setIsWaitingForResponse(false);
      setConversationHistory(prev => [...prev, { 
        role: 'assistant', 
        content: '',
        components: MOCK_API_RESPONSE,
      }]);
    }, 1500);
  };

  // handleCardClick removed - no longer using cards

  const handleCopyMessage = (content: string, idx: number) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageIdx(idx);
    setTimeout(() => setCopiedMessageIdx(null), 2000);
  };

  const handleDownloadText = (content: string, components?: Component[]) => {
    // Demo download functionality
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demo-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBackToHome = () => {
    setChatMode(false);
    setConversationHistory([]);
    setShowGetStarted(true);
    setSubmittedQuestion('');
  };

  // Cards removed - using file upload instead

  // ========== RENDER ==========
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#1F2227',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      {/* Default Sidebar - icon rail only */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100%',
          width: '60px',
          backgroundColor: '#32373F',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 0',
          zIndex: 50,
        }}
      >
        <DemoGlobalSidebar 
          activePage="llm" 
          onHomeClick={handleBackToHome}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isCompact={true}
          isExpanded={false}
        />
      </div>
      
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        marginLeft: '60px',
      }}>
        <AnimatePresence mode="wait">
          {!chatMode && conversationHistory.length === 0 && !isWaitingForResponse ? (
            // ========== EMPTY STATE ==========
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: 1,
                paddingTop: uploadedFile ? '0px' : '100px',
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                opacity: {
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1],
                },
                paddingTop: {
                  duration: 0.6,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  delay: uploadedFile ? 0.2 : 0,
                }
              }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
              }}
            >
              {/* Logo */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  position: 'relative',
                  overflow: 'hidden',
                  width: '100%',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <VortaStarIcon size={48} color="#5ca2f9" />
                  <motion.span
                    initial={{ opacity: 0, x: -50, width: 0 }}
                    animate={{ opacity: 1, x: 0, width: 'auto' }}
                    transition={{ 
                      duration: 0.8, 
                      delay: 1,
                      ease: [0.2, 0.8, 0.2, 1]
                    }}
                    style={{
                      fontSize: '44px',
                      fontWeight: 450,
                      color: '#AFB6C0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      fontFamily: '"SF Pro", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif',
                      letterSpacing: '-0.02em',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    Hi Emilio
                  </motion.span>
                </div>
              </div>

              {/* Chat Input Bar */}
              <div style={{
                width: '100%',
                maxWidth: '800px',
                marginBottom: '28px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}>
                <div style={{ width: '100%' }}>
                  <ChatInput
                    onSend={handleQuestionSubmit}
                    isLoading={isWaitingForResponse}
                    placeholder={t('chat.input.placeholder', language)}
                    language={language}
                    onLanguageChange={handleLanguageChange}
                    externalValue={chatInputValue}
                    onExternalValueSet={() => setChatInputValue(undefined)}
                    uploadedFile={uploadedFile}
                    onRemoveFile={() => {
                      setUploadedFile(null);
                    }}
                  />
                </div>
              </div>

              {/* File Upload Section */}
              <AnimatePresence>
                {!uploadedFile && (
                  <motion.div
                    initial={{ opacity: 1, y: 0, scale: 1, height: 'auto' }}
                    exit={{ 
                      opacity: 0, 
                      y: -20,
                      scale: 0.98,
                      height: 0,
                      marginBottom: 0,
                    }}
                    transition={{ 
                      duration: 0.5,
                      ease: [0.25, 0.46, 0.45, 0.94],
                      height: {
                        duration: 0.5,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      },
                      opacity: {
                        duration: 0.4,
                        ease: [0.4, 0, 0.2, 1],
                      },
                    }}
                    style={{
                      width: '100%',
                      maxWidth: '800px',
                      marginBottom: '40px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      overflow: 'hidden',
                    }}
                  >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  onMouseEnter={(e) => {
                    setIsHoveringUpload(true);
                    e.currentTarget.style.borderColor = 'rgba(92, 162, 249, 0.15)';
                    e.currentTarget.style.backgroundColor = '#25282E';
                  }}
                  onMouseLeave={(e) => {
                    setIsHoveringUpload(false);
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.backgroundColor = '#22252B';
                  }}
                  style={{
                    backgroundColor: '#22252B',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '16px 50px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    width: 'fit-content',
                    minWidth: '500px',
                  }}
                  onClick={() => {
                    // Handle file upload click
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.csv,.xlsx,.xls,.xlsm';
                    input.onchange = (e: any) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setIsUploading(true);
                        // Simulate upload process
                        setTimeout(() => {
                          setUploadedFile(file);
                          setIsUploading(false);
                          console.log('File uploaded:', file.name, file.size, 'bytes');
                          // You can add file processing logic here
                        }, 500);
                      }
                    };
                    input.click();
                  }}
                >
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#FFFFFF',
                    marginBottom: '2px',
                    fontFamily: 'Inter, sans-serif',
                    textAlign: 'center',
                  }}>
                    Upload a file
                  </div>
                  {isUploading ? (
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(92, 162, 249, 0.1)',
                      border: '2px dashed rgba(92, 162, 249, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid rgba(91, 158, 255, 0.3)',
                        borderTopColor: '#5B9EFF',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                    </div>
                  ) : (
                    <motion.div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(92, 162, 249, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        position: 'relative',
                        cursor: 'pointer',
                      }}
                      animate={{
                        scale: isHoveringUpload ? 1.05 : 1,
                      }}
                      transition={{
                        scale: {
                          duration: 0.3,
                          ease: [0.4, 0, 0.2, 1],
                        },
                      }}
                    >
                      {/* Rotating border */}
                      <motion.div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '50%',
                          border: '2px dashed rgba(92, 162, 249, 0.3)',
                          pointerEvents: 'none',
                        }}
                        animate={isHoveringUpload ? {
                          rotate: 360,
                        } : {}}
                        transition={isHoveringUpload ? {
                          rotate: {
                            duration: 8,
                            repeat: Infinity,
                            ease: 'linear',
                          },
                        } : {
                          rotate: {
                            duration: 0,
                          },
                        }}
                      />
                      <Upload size={24} color="#5B9EFF" style={{ position: 'relative', zIndex: 1 }} />
                    </motion.div>
                  )}
                </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            ) : (
            // ========== CHAT MODE ==========
            <motion.div
              key="chat-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1]
              }}
              style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'visible',
              }}
            >
              {/* Top Header Bar */}
              <div style={{
                width: '100%',
                backgroundColor: '#1F2227',
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: 'none',
              }}>
                <div style={{ position: 'relative' }} ref={titleDropdownRef}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setIsTitleDropdownOpen(!isTitleDropdownOpen)}
                  >
                    <span style={{
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#D1D5DB',
                      fontFamily: 'Inter, sans-serif',
                    }}>
                      {conversationHistory.length > 0 && conversationHistory[0]?.role === 'user' 
                        ? conversationHistory[0].content 
                        : 'Demo Conversation'}
                    </span>
                    <ChevronDown size={16} color="#9CA5B5" />
                  </div>
                  
                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isTitleDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          marginTop: '8px',
                          backgroundColor: '#2F343B',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                          minWidth: '200px',
                          padding: '4px',
                          zIndex: 1000,
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                        }}
                      >
                        <button
                          onClick={() => {
                            setIsTitleDropdownOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#D1D5DB',
                            fontSize: '14px',
                            fontWeight: 400,
                            fontFamily: 'Inter, sans-serif',
                            cursor: 'pointer',
                            borderRadius: '6px',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Star size={16} />
                          <span>Add to favorites</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsTitleDropdownOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#D1D5DB',
                            fontSize: '14px',
                            fontWeight: 400,
                            fontFamily: 'Inter, sans-serif',
                            cursor: 'pointer',
                            borderRadius: '6px',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Pencil size={16} />
                          <span>Rename</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsTitleDropdownOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#D1D5DB',
                            fontSize: '14px',
                            fontWeight: 400,
                            fontFamily: 'Inter, sans-serif',
                            cursor: 'pointer',
                            borderRadius: '6px',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Folder size={16} />
                          <span>Add to project</span>
                        </button>
                        <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)', margin: '4px 0' }} />
                        <button
                          onClick={() => {
                            setIsTitleDropdownOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#DC2626',
                            fontSize: '14px',
                            fontWeight: 400,
                            fontFamily: 'Inter, sans-serif',
                            cursor: 'pointer',
                            borderRadius: '6px',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Trash2 size={16} />
                          <span>Delete</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Right side: User name and Share button */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '6px 12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                }}>
                  <span style={{
                    fontSize: '14px',
                    color: '#D1D5DB',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    Demo User
                  </span>
                  <button
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      fontFamily: 'Inter, sans-serif',
                      cursor: 'pointer',
                      padding: '0',
                    }}
                  >
                    Share
                  </button>
                </div>
              </div>

              {/* Chat Content Area */}
              <div
                ref={chatContentRef}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  padding: '40px 0 120px 0',
                  scrollBehavior: 'smooth',
                }}
              >
                <div style={{
                  maxWidth: '860px',
                  margin: '0 auto',
                  padding: '0 32px',
                }}>
                  {/* Render conversation history */}
                  {conversationHistory.map((message, idx) => (
                    <motion.div
                      key={idx}
                      ref={idx === conversationHistory.length - 1 ? lastMessageRef : null}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        display: 'flex',
                        flexDirection: message.role === 'assistant' && message.components && message.components.length > 0 && USE_EXPERIMENTAL_REPORT_LAYOUT ? 'column' : 'row',
                        justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                        alignItems: message.role === 'user' ? 'center' : (message.role === 'assistant' && message.components && message.components.length > 0 && USE_EXPERIMENTAL_REPORT_LAYOUT ? 'flex-start' : 'flex-start'),
                        gap: message.role === 'assistant' && message.components && message.components.length > 0 && USE_EXPERIMENTAL_REPORT_LAYOUT ? '8px' : '16px',
                        marginBottom: '32px',
                      }}
                    >
                      {message.role === 'user' ? (
                        <>
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minHeight: '42px', maxWidth: '100%' }}>
                            <div style={{ 
                              fontSize: '15px', 
                              color: '#E2E6F0', 
                              lineHeight: 1.6,
                              textAlign: 'right',
                            }}>
                              {message.content}
                            </div>
                          </div>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            backgroundColor: '#9CA5B5',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <span style={{ fontSize: '20px', fontWeight: 600, color: '#1F2227' }}>U</span>
                          </div>
                        </>
                      ) : (
                        <>
                          {message.components && message.components.length > 0 && USE_EXPERIMENTAL_REPORT_LAYOUT ? (
                            <ExperimentalReportView 
                              components={message.components} 
                              conversationHistory={conversationHistory}
                              messageIdx={idx}
                              healthScoresData={healthScores || undefined}
                              reportData={MOCK_REPORT_DATA}
                              onQuestionClick={handleQuestionSubmit}
                              onQuestionSelect={(question) => {
                                setChatInputValue(question);
                              }}
                            />
                          ) : (
                            <>
                              <div style={{
                                width: '42px',
                                height: '42px',
                                backgroundColor: '#32373F',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}>
                                <VortaStarIcon size={24} color="#5ca2f9" />
                              </div>
                              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', minHeight: '42px', maxWidth: '100%', width: 'auto' }}>
                                <div style={{ width: '100%', paddingTop: '8px' }}>
                                  {message.components && message.components.length > 0 ? (
                                    message.components.map((component, compIdx) => {
                                      if (component.type === 'text') {
                                        return (
                                          <div key={compIdx} style={{ marginBottom: compIdx < message.components!.length - 1 ? '24px' : '0', marginTop: compIdx === 0 ? '0' : '0', paddingTop: compIdx === 0 ? '0' : '0' }}>
                                            <LLMMarkdownRenderer content={component.data as string} />
                                          </div>
                                        );
                                      } else {
                                        const chartData = convertComponentToChartData(component);
                                        if (chartData) {
                                          return (
                                            <div key={compIdx} style={{ marginBottom: compIdx < message.components!.length - 1 ? '24px' : '0' }}>
                                              <ChatChart chartData={chartData} />
                                            </div>
                                          );
                                        }
                                        return null;
                                      }
                                    })
                                  ) : message.content ? (
                                    <LLMMarkdownRenderer content={message.content} />
                                  ) : null}
                                  
                                  {message.role === 'assistant' && (
                                    <div style={{ display: 'flex', gap: '16px', marginTop: '12px', alignItems: 'center' }}>
                                      <button
                                        onClick={() => {
                                          let fullContent = '';
                                          if (message.components && message.components.length > 0) {
                                            fullContent = message.components
                                              .filter(c => c.type === 'text')
                                              .map(c => c.data as string)
                                              .join('\n\n');
                                          } else if (message.content) {
                                            fullContent = message.content;
                                          }
                                          handleCopyMessage(fullContent, idx);
                                        }}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                          padding: '4px',
                                          backgroundColor: 'transparent',
                                          border: 'none',
                                          cursor: 'pointer',
                                          color: copiedMessageIdx === idx ? '#4ADE80' : '#9CA5B5',
                                          fontSize: '12px',
                                          fontWeight: 500,
                                        }}
                                      >
                                        {copiedMessageIdx === idx ? (
                                          <><Check size={14} /><span>{t('chat.copied', language)}</span></>
                                        ) : (
                                          <><Copy size={14} /><span>{t('chat.copy', language)}</span></>
                                        )}
                                      </button>
                                      
                                      <button
                                        onClick={() => {
                                          let fullContent = '';
                                          if (message.components && message.components.length > 0) {
                                            fullContent = message.components
                                              .filter(c => c.type === 'text')
                                              .map(c => c.data as string)
                                              .join('\n\n');
                                          } else if (message.content) {
                                            fullContent = message.content;
                                          }
                                          handleDownloadText(fullContent, message.components);
                                        }}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                          padding: '4px',
                                          backgroundColor: 'transparent',
                                          border: 'none',
                                          cursor: 'pointer',
                                          color: '#9CA5B5',
                                          fontSize: '12px',
                                          fontWeight: 500,
                                        }}
                                      >
                                        <Download size={14} />
                                        <span>{t('chat.download', language)}</span>
                                      </button>
                                      
                                      <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                                      
                                      <button
                                        onClick={() => console.log('Thumbs up')}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          padding: '4px',
                                          backgroundColor: 'transparent',
                                          border: 'none',
                                          cursor: 'pointer',
                                          color: '#9CA5B5',
                                          fontSize: '12px',
                                          transition: 'color 0.2s',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#BFD4FF'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = '#9CA5B5'}
                                      >
                                        <ThumbsUp size={14} />
                                      </button>
                                      
                                      <button
                                        onClick={() => console.log('Thumbs down')}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          padding: '4px',
                                          backgroundColor: 'transparent',
                                          border: 'none',
                                          cursor: 'pointer',
                                          color: '#9CA5B5',
                                          fontSize: '12px',
                                          transition: 'color 0.2s',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = '#BFD4FF'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = '#9CA5B5'}
                                      >
                                        <ThumbsDown size={14} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </motion.div>
                  ))}

                  {/* Loading indicator */}
                  {isWaitingForResponse && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '16px',
                        marginBottom: '32px',
                      }}
                    >
                      <div style={{
                        width: '42px',
                        height: '42px',
                        backgroundColor: '#32373F',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <VortaStarIcon size={24} color="#5ca2f9" />
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '4px',
                        paddingTop: '8px',
                      }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#9CA5B5',
                          animation: 'bounce 1.4s infinite ease-in-out',
                        }} />
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#9CA5B5',
                          animation: 'bounce 1.4s infinite ease-in-out',
                          animationDelay: '0.2s',
                        }} />
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#9CA5B5',
                          animation: 'bounce 1.4s infinite ease-in-out',
                          animationDelay: '0.4s',
                        }} />
                      </div>
                    </motion.div>
                  )}

                  {/* Scroll to bottom button */}
                  {showNewMessageButton && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={scrollToLatestMessageTop}
                      style={{
                        position: 'fixed',
                        bottom: '140px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#2F343B',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        color: '#D1D5DB',
                        fontSize: '14px',
                        cursor: 'pointer',
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <ArrowRight size={16} style={{ transform: 'rotate(90deg)' }} />
                      New message
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Chat Input Bar - Fixed at bottom */}
              <div style={{
                width: '100%',
                padding: '20px 32px',
                backgroundColor: 'transparent',
                borderTop: 'none',
                position: 'relative',
                zIndex: 10,
              }}>
                <div style={{
                  maxWidth: '860px',
                  margin: '0 auto',
                }}>
                  <ChatInput
                    onSend={handleQuestionSubmit}
                    isLoading={isWaitingForResponse}
                    placeholder={t('chat.input.placeholder', language)}
                    language={language}
                    onLanguageChange={handleLanguageChange}
                    externalValue={chatInputValue}
                    onExternalValueSet={() => setChatInputValue(undefined)}
                    uploadedFile={uploadedFile}
                    onRemoveFile={() => {
                      setUploadedFile(null);
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ========== EXCEL LOGO COMPONENT ==========
function ExcelLogo({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width={size}
      height={size}
      style={{ flexShrink: 0 }}
    >
      <defs>
        {/* Modern Excel Green Gradient */}
        <linearGradient id="excelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#21a366" }} />
          <stop offset="100%" style={{ stopColor: "#107c41" }} />
        </linearGradient>

        {/* Drop Shadow Filter for Depth */}
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="4" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Main Rounded Background Container */}
      <rect x="52" y="32" width="168" height="192" rx="18" fill="url(#excelGradient)" />

      {/* Stylized Cell Grid Layers (Translucent) */}
      <rect x="100" y="68" width="88" height="28" rx="4" fill="#ffffff" fillOpacity="0.15" />
      <rect x="100" y="112" width="88" height="28" rx="4" fill="#ffffff" fillOpacity="0.15" />
      <rect x="100" y="156" width="88" height="28" rx="4" fill="#ffffff" fillOpacity="0.15" />

      {/* The Iconic Floating 'X' Tile */}
      <rect x="36" y="80" width="96" height="96" rx="14" fill="#107c41" filter="url(#shadow)" />
      <path d="M60 108h10l8 12 8-12h10l-13 18 13 18h-10l-8-12-8 12H60l13-18z" fill="#ffffff" />
    </svg>
  );
}

// ========== CHAT INPUT COMPONENT (Standalone) ==========
function ChatInput({
  onSend,
  isLoading,
  placeholder,
  language,
  onLanguageChange,
  externalValue,
  onExternalValueSet,
  uploadedFile,
  onRemoveFile,
}: {
  onSend: (value: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  externalValue?: string;
  onExternalValueSet?: () => void;
  uploadedFile?: File | null;
  onRemoveFile?: () => void;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState('');
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);
  
  // Handle external value updates
  useEffect(() => {
    if (externalValue !== undefined && externalValue !== value) {
      setValue(externalValue);
      if (inputRef.current) {
        inputRef.current.focus();
      }
      if (onExternalValueSet) {
        onExternalValueSet();
      }
    }
  }, [externalValue]);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSend(value);
        setValue('');
      }
    }
  };
  
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [value]);

  // Close tools dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        toolsButtonRef.current &&
        !toolsButtonRef.current.contains(event.target as Node)
      ) {
        // Check if click is on one of the cards (they're inside the composer)
        const target = event.target as HTMLElement;
        if (!target.closest('[data-tools-cards]')) {
          setIsToolsOpen(false);
        }
      }
    };

    if (isToolsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isToolsOpen]);

  
  const hasText = value.trim().length > 0;
  const hasFile = !!uploadedFile;
  const isActive = isFocused || hasText || hasFile || isToolsOpen;
  
  return (
    <div
      style={{
        width: '100%',
        position: 'relative',
      }}
    >
      {/* Active Input Layer - Backplate */}
      <motion.div
        initial={false}
        animate={{
          opacity: isActive ? 1 : 0,
          scale: isActive ? 1 : 0.98,
          y: isActive ? 0 : 2,
        }}
        transition={{
          duration: 0.6,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{
          position: 'absolute',
          top: '-12px',
          left: '-12px',
          right: '-12px',
          bottom: '-12px',
          borderRadius: '18px',
          backgroundColor: 'rgba(31, 34, 39, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          zIndex: 0,
          pointerEvents: 'none',
          backdropFilter: 'blur(8px)',
        }}
      />
      
      <motion.div
        initial={false}
        animate={{
          borderColor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'rgba(95, 102, 114, 0.3)',
        }}
        transition={{
          duration: 0.5,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        style={{
          backgroundColor: '#2F343B',
          borderRadius: '12px',
          border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.15)' : 'rgba(95, 102, 114, 0.3)'}`,
          padding: '14px 16px',
          width: '100%',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            rows={1}
            disabled={isLoading}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              color: isFocused || value.trim() ? '#FFFFFF' : '#5F6672',
              fontSize: '15px',
              lineHeight: '1.5',
              fontFamily: 'Inter, sans-serif',
              marginBottom: '12px',
              transition: 'color 0.2s ease',
            }}
          />
          <style>{`
            textarea::placeholder {
              color: #5F6672;
            }
          `}</style>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '8px', paddingLeft: '0', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', gap: '6px', paddingLeft: '0', marginLeft: '0', alignItems: 'flex-end', position: 'relative' }}>
            {/* Uploaded File Pill */}
            <AnimatePresence>
              {uploadedFile && (() => {
                // Detect file type from extension
                const fileName = uploadedFile.name.toLowerCase();
                const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.xlsm');
                const isCSV = fileName.endsWith('.csv');
                
                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: -20 }}
                    transition={{ 
                      duration: 0.4,
                      ease: [0.4, 0, 0.2, 1],
                      delay: 0.1,
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(100, 150, 226, 0.4)',
                      border: '1px solid #6496E2',
                      height: '32px',
                    }}
                  >
                  {/* File Type Icon */}
                  {isExcel ? (
                    <ExcelLogo size={16} />
                  ) : isCSV ? (
                    <FileText size={16} color="#FFFFFF" />
                  ) : null}
                  
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#FFFFFF',
                    fontFamily: 'Inter, sans-serif',
                    whiteSpace: 'nowrap',
                  }}>
                    {uploadedFile.name.length > 5 
                      ? uploadedFile.name.substring(0, 5) + '..' 
                      : uploadedFile.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRemoveFile) {
                        onRemoveFile();
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0',
                      marginLeft: '4px',
                    }}
                  >
                    <X size={16} color="#FFFFFF" />
                  </button>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
            <div style={{ position: 'relative' }}>
            <button
                ref={toolsButtonRef}
                onClick={() => setIsToolsOpen(!isToolsOpen)}
              style={{
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#2F343B',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '0 12px',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 1px 2px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#353A42';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2F343B';
              }}
            >
              <Wrench size={16} color="#AFB6C0" />
              <span style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#FFFFFF',
                fontFamily: 'Inter, sans-serif',
              }}>
                Tools
              </span>
                <motion.div
                  animate={{ rotate: isToolsOpen ? 180 : 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ChevronDown size={14} color="#AFB6C0" />
                </motion.div>
            </button>
              
            </div>
            <button
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#2F343B',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 1px 2px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#353A42';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2F343B';
              }}
            >
              <Plus size={18} color="#9CA3AF" />
            </button>
          </div>
          <motion.button
            onClick={() => {
              if (value.trim()) {
                onSend(value);
                setValue('');
              }
            }}
            disabled={!value.trim() || isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            animate={{
              backgroundColor: value.trim() ? '#808893' : '#2F343B',
            }}
            transition={{
              duration: 0.12,
              ease: [0.4, 0, 0.2, 1],
            }}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              border: 'none',
              cursor: value.trim() && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {isLoading ? (
              <div style={{ 
                width: '18px', 
                height: '18px', 
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            ) : (
              <ArrowRight 
                size={20} 
                color={value.trim() ? '#CFD2D6' : '#5F6672'} 
                strokeWidth={2}
              />
            )}
          </motion.button>
        </div>
        
        {/* Tools Cards - Appear below tools row inside composer */}
        <AnimatePresence>
          {isToolsOpen && (
            <motion.div
              key="tools-cards"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ 
                opacity: 1, 
                height: 'auto',
                marginTop: '12px',
              }}
              exit={{ 
                opacity: 0, 
                height: 0,
                marginTop: 0,
              }}
              transition={{
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1],
                opacity: {
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                },
                height: {
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                },
              }}
              style={{
                display: 'flex',
                gap: '8px',
                overflow: 'hidden',
                position: 'relative',
                zIndex: 2,
              }}
              data-tools-cards
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -2 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -2 }}
                transition={{ 
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.08,
                }}
                onClick={() => {
                  onSend('Show Inventory Health report');
                  setIsToolsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#2F343B',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 1px 2px rgba(0, 0, 0, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#353A42';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2F343B';
                }}
              >
                <BarChart3 size={15} color="#AFB6C0" />
                <span style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#FFFFFF',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  Inventory Health
                </span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -2 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -2 }}
                transition={{ 
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.12,
                }}
                onClick={() => {
                  onSend('Show Sales Health report');
                  setIsToolsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#2F343B',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 1px 2px rgba(0, 0, 0, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#353A42';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2F343B';
                }}
              >
                <TrendingUp size={15} color="#AFB6C0" />
                <span style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#FFFFFF',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  Sales Health
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

