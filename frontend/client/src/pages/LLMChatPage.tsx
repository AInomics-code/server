import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalSidebar } from '@/components/GlobalSidebar';
import { ChatChart } from '@/components/ChatChart';
import { LLMMarkdownRenderer } from '@/components/LLMMarkdownRenderer';
import { GetStartedCards } from '@/components/GetStartedCards';
import { t, getCurrentLanguage, setCurrentLanguage, type Language } from '@/config/i18n';
import { 
  agentService, 
  generateSessionId, 
  Component,
  ChartComponent,
  PieChartComponent,
  BubbleChartComponent,
  RadarChartComponent,
} from '@/services/agentService';
import { 
  Paperclip, 
  ArrowRight, 
  X, 
  Copy,
  Download,
  Check,
  TrendingUp,
  ChevronDown,
  Activity,
  BarChart3,
  Calendar,
  Plus,
  Globe,
  LayoutGrid,
  Mic,
  ThumbsUp,
  ThumbsDown,
  FileText,
} from 'lucide-react';
import { SiSap, SiSalesforce, SiSnowflake } from 'react-icons/si';
import { FaFileExcel } from 'react-icons/fa';
import { Database } from 'lucide-react';

// ========== TYPES ==========
interface Message {
  role: 'user' | 'assistant';
  content: string; // For backward compatibility and user messages
  components?: Component[]; // New component-based format
  chartData?: any; // Legacy support
  dataExport?: {
    title: string;
    filename: string;
    csvContent: string;
  };
}

// ========== ICONS ==========
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

// ========== HELPER FUNCTIONS ==========
/**
 * Convert API component chart data to ChatChart format
 */
function convertComponentToChartData(component: Component): any | null {
  if (!component || !component.data) return null;
  
  const { type, data } = component;
  
  // Handle standard charts (bar, line, area, scatter, mixed)
  if (type === 'bar_chart' || type === 'line_chart' || type === 'area_chart' || type === 'scatter_chart' || type === 'mixed_chart') {
    const chartData = data as ChartComponent['data'];
    return {
      type: type === 'bar_chart' ? 'bar' : 
            type === 'line_chart' ? 'line' : 
            type === 'area_chart' ? 'line' : // Area uses line with fill
            type === 'scatter_chart' ? 'scatter' :
            'bar', // mixed_chart default
      labels: chartData.datasets[0]?.data.map((d: any) => d.x) || [],
      datasets: chartData.datasets.map((dataset: any) => ({
        label: dataset.label,
        data: dataset.data.map((d: any) => d.y),
        type: dataset.type || (type === 'mixed_chart' ? 'bar' : undefined),
      })),
      title: chartData.title,
    };
  }
  
  // Handle pie/polar charts
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
  
  // Handle bubble chart
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
  
  // Handle radar chart
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
export function LLMChatPage() {
  // ========== STATE MANAGEMENT ==========
  const [language, setLanguage] = useState<Language>(getCurrentLanguage());
  const [showGetStarted, setShowGetStarted] = useState(true);
  
  // Chat mode state
  const [chatMode, setChatMode] = useState(false);
  const [submittedQuestion, setSubmittedQuestion] = useState('');
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  
  // Conversation history for multi-turn chat
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  
  // UI state
  const [copiedMessageIdx, setCopiedMessageIdx] = useState<number | null>(null);
  
  // Backend integration
  const [sessionId] = useState(() => generateSessionId());
  const [userId] = useState("user");
  const currentRequestIdRef = useRef(0);
  const chatContentRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement | null>(null);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setCurrentLanguage(lang);
  };

  const scrollToLatestMessageTop = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Check if user has scrolled up
  useEffect(() => {
    const chatContent = chatContentRef.current;
    if (!chatContent) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContent;
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
      setShowNewMessageButton(isScrolledUp);
    };

    chatContent.addEventListener('scroll', handleScroll);
    // Check on mount and when content changes
    handleScroll();

    return () => {
      chatContent.removeEventListener('scroll', handleScroll);
    };
  }, [conversationHistory, chatMode]);

  // Note: we intentionally do NOT auto-scroll on new messages so the view
  // stays where the user is reading. The "New message" button lets them
  // jump to the latest message when they want.

  // ========== HANDLERS ==========
  
  // Main question submission handler
  const handleQuestionSubmit = async (rawQuestion: string) => {
    const question = rawQuestion.trim();
    if (!question) return;
    
    // Add user message to history
    setConversationHistory(prev => [...prev, { role: 'user', content: question }]);
    
    setSubmittedQuestion(question);
    setChatMode(true);
    setIsWaitingForResponse(true);
    setShowGetStarted(false);
    const requestId = ++currentRequestIdRef.current;
    
    try {
      // Call the real backend API
      const response = await agentService.sendQuery(question, userId, sessionId);

      // If a newer request was started (e.g. user went back), ignore this response
      if (currentRequestIdRef.current !== requestId) return;

      setIsWaitingForResponse(false);
      
      // New API format: response.message is an array of components
      // Add assistant response to history with components
      setConversationHistory(prev => [...prev, { 
        role: 'assistant', 
        content: '', // Empty for component-based messages
        components: response.message || [],
      }]);
    } catch (error) {
      // Ignore errors from stale requests after user navigated back
      if (currentRequestIdRef.current !== requestId) return;
      setIsWaitingForResponse(false);
      
      // Add error message to history
      setConversationHistory(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
      }]);
    }
  };
  
  // Card click handler
  const handleCardClick = async (cardTitle: string, question: string) => {
    // Add user message to history
    setConversationHistory(prev => [...prev, { role: 'user', content: question }]);
    
    setSubmittedQuestion(question);
    setChatMode(true);
    setIsWaitingForResponse(true);
    setShowGetStarted(false);
    const requestId = ++currentRequestIdRef.current;
    
    try {
      // Call the real backend API
      const response = await agentService.sendQuery(question, userId, sessionId);

      // If a newer request was started (e.g. user went back), ignore this response
      if (currentRequestIdRef.current !== requestId) return;

      setIsWaitingForResponse(false);
      
      // New API format: response.message is an array of components
      // Add assistant response to history with components
      setConversationHistory(prev => [...prev, { 
        role: 'assistant', 
        content: '', // Empty for component-based messages
        components: response.message || [],
      }]);
    } catch (error) {
      // Ignore errors from stale requests after user navigated back
      if (currentRequestIdRef.current !== requestId) return;
      setIsWaitingForResponse(false);
      
      // Add error message to history
      setConversationHistory(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
      }]);
    }
  };
  
  // Back to empty state
  const handleBackToHome = () => {
    // Bump request id so any in-flight responses are ignored
    currentRequestIdRef.current += 1;
    setIsWaitingForResponse(false);
    setChatMode(false);
    setConversationHistory([]);
    setSubmittedQuestion('');
    setShowGetStarted(true);
  };
  
  // Copy message
  const handleCopyMessage = async (content: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageIdx(idx);
      setTimeout(() => setCopiedMessageIdx(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };
  
  // Download message
  const handleDownloadText = async (content: string) => {
    try {
      // Dynamically import docx and file-saver (only when needed)
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
      const { saveAs } = await import('file-saver');
      
      // Parse the content to create Word document structure
      const lines = content.split('\n');
      const paragraphs: any[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const prevLine = i > 0 ? lines[i - 1].trim() : '';
        
        // Skip empty lines
        if (!line) {
          paragraphs.push(new Paragraph({ text: '', spacing: { after: 120 } }));
          continue;
        }
        
        // Section titles (uppercase, small)
        if (line.match(/^[A-Z][a-z\s]+(analysis|report|summary|overview|insights?|performance|breakdown|findings?)$/i) && !line.includes('**')) {
          paragraphs.push(
            new Paragraph({
              text: line.toUpperCase(),
              heading: HeadingLevel.HEADING_3,
              spacing: { before: prevLine ? 480 : 0, after: 240 },
            })
          );
          continue;
        }
        
        // Bold headlines (full line bold)
        if (line.startsWith('**') && line.endsWith('**')) {
          const text = line.replace(/\*\*/g, '');
          paragraphs.push(
            new Paragraph({
              text: text,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: prevLine ? 320 : 0, after: 160 },
            })
          );
          continue;
        }
        
        // Numbered lists
        if (line.match(/^\d+\.\s/)) {
          const text = line.replace(/^\d+\.\s/, '');
          paragraphs.push(
            new Paragraph({
              text: text,
              bullet: { level: 0 },
              spacing: { after: 160 },
            })
          );
          continue;
        }
        
        // Bullet lists
        if (line.startsWith('- ') || line.startsWith('• ')) {
          const text = line.slice(2);
          paragraphs.push(
            new Paragraph({
              text: text,
              bullet: { level: 0 },
              spacing: { after: 160 },
            })
          );
          continue;
        }
        
        // Regular paragraph with inline formatting
        if (line.includes('**')) {
          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          const textRuns: any[] = [];
          
          parts.forEach((part) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              textRuns.push(
                new TextRun({
                  text: part.replace(/\*\*/g, ''),
                  bold: true,
                })
              );
            } else {
              textRuns.push(new TextRun({ text: part }));
            }
          });
          
          paragraphs.push(
            new Paragraph({
              children: textRuns,
              spacing: { after: 160 },
            })
          );
          continue;
        }
        
        // Regular paragraph
        paragraphs.push(
          new Paragraph({
            text: line,
            spacing: { after: 160 },
          })
        );
      }
      
      // Create Word document
      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs,
        }],
      });
      
      // Generate and download
      const blob = await Packer.toBlob(doc);
      const fileName = `response_${new Date().toISOString().split('T')[0]}.docx`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Error creating Word document:', error);
      // Fallback to text file if Word generation fails or packages not installed
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `response_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };
  
  // Card data
  const cards = [
    {
      id: 'backorder-health',
      icon: Activity,
      title: t('cards.backorder.title', language),
      description: t('cards.backorder.description', language),
      workflow: 'backorder_health',
      question: t('cards.backorder.title', language),
    },
    {
      id: 'sales-health',
      icon: BarChart3,
      title: t('cards.sales.title', language),
      description: t('cards.sales.description', language),
      workflow: 'sales_health',
      question: t('cards.sales.title', language),
    },
    {
      id: 'forecast-tracking',
      icon: Calendar,
      title: t('cards.forecast.title', language),
      description: t('cards.forecast.description', language),
      workflow: 'forecast_tracking',
      question: t('cards.forecast.title', language),
    },
    {
      id: 'generate-reports',
      icon: FileText,
      title: t('cards.reports.title', language),
      description: t('cards.reports.description', language),
      workflow: 'generate_reports',
      question: t('cards.reports.title', language),
    },
  ];

  // ========== RENDER ==========
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#141A24',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <GlobalSidebar />
      
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        marginLeft: '64px',
      }}>
        <AnimatePresence mode="wait">
          {!chatMode && conversationHistory.length === 0 && !isWaitingForResponse ? (
            // ========== EMPTY STATE ==========
            <motion.div
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                paddingTop: '10px',
              }}
            >
              {/* Aragon Logo - Static */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '32px',
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
                  <VortaStarIcon size={56} color="#5B9EFF" />
                  <motion.span
                    initial={{ opacity: 0, x: -50, width: 0 }}
                    animate={{ opacity: 1, x: 0, width: 'auto' }}
                    transition={{ 
                      duration: 1.2, 
                      delay: 2, // 2s with only the logo, then slide text in
                      ease: [0.2, 0.8, 0.2, 1] // very smooth, slick ease
                    }}
                    style={{
                      fontSize: '44px',
                      fontWeight: 600,
                      color: '#5B9EFF',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {t('app.name', language)}
                  </motion.span>
                </div>
              </div>

              {/* Chat Input Bar */}
              <div style={{
                width: '100%',
                maxWidth: '800px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'center',
              }}>
                <ChatInput
                  onSend={handleQuestionSubmit}
                  isLoading={isWaitingForResponse}
                  placeholder={t('chat.input.placeholder', language)}
                  language={language}
                  onLanguageChange={handleLanguageChange}
                />
              </div>

              {/* Get Started Cards */}
              <GetStartedCards
                cards={cards}
                onCardClick={handleCardClick}
              />
            </motion.div>
          ) : (
            // ========== CHAT MODE ==========
            <motion.div
              key="chat-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                background: '#141A24',
                overflow: 'hidden',
              }}
            >
              {/* Chat Header */}
              <div style={{
                padding: '10px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                backgroundColor: '#1A222D',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}>
                <button
                  onClick={handleBackToHome}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    color: '#677C99',
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = '#E2E6F0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#677C99';
                  }}
                >
                  {t('chat.back', language)}
                </button>
                <span style={{ fontSize: '14px', color: '#FFFFFF', fontWeight: 600 }}>Vorta</span>
                <span style={{ fontSize: '14px', color: '#677C99', fontWeight: 400 }}>V.2</span>
              </div>

              {/* Chat Content */}
              <div 
                ref={chatContentRef}
                className="custom-scrollbar"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  position: 'relative',
                }}
              >
                <div
                  className="custom-scrollbar"
                  style={{
                    height: '100%',
                    padding: '40px 80px 60px 80px',
                    overflowY: 'auto',
                  }}
                >
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
                      alignItems: 'flex-start',
                      gap: '16px',
                      marginBottom: '32px',
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '42px',
                      height: '42px',
                      backgroundColor: message.role === 'user' ? '#677C99' : '#324053',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {message.role === 'user' ? (
                        <span style={{ fontSize: '20px', fontWeight: 600, color: '#0E1117' }}>U</span>
                      ) : (
                        <VortaStarIcon size={24} color="#5B9EFF" />
                      )}
                    </div>
                    
                    {/* Message Content */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', minHeight: '42px' }}>
                      {message.role === 'user' ? (
                        <div style={{ fontSize: '15px', color: '#E2E6F0', lineHeight: 1.6, paddingTop: '8px' }}>
                          {message.content}
                        </div>
                      ) : (
                        <div style={{ width: '100%', paddingTop: '8px' }}>
                          {/* Render components if available, otherwise fall back to content */}
                          {message.components && message.components.length > 0 ? (
                            // New component-based format - render each component
                            message.components.map((component, compIdx) => {
                              if (component.type === 'text') {
                                // Render text component using markdown renderer
                                return (
                                  <div key={compIdx} style={{ marginBottom: compIdx < message.components!.length - 1 ? '24px' : '0', marginTop: compIdx === 0 ? '0' : '0', paddingTop: compIdx === 0 ? '0' : '0' }}>
                                    <LLMMarkdownRenderer content={component.data as string} />
                                  </div>
                                );
                              } else {
                                // Chart component - convert API format to ChatChart format
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
                            // Fallback to legacy content format - use markdown renderer
                            <LLMMarkdownRenderer content={message.content} />
                          ) : null}
                          
                          {/* Legacy Chart Display (for backward compatibility) */}
                          {message.chartData && (
                            <ChatChart chartData={message.chartData} />
                          )}
                          
                          {/* Action Buttons */}
                          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', alignItems: 'center' }}>
                            <button
                              onClick={() => handleCopyMessage(message.content || (message.components?.map(c => c.type === 'text' ? c.data : '').join('\n') || ''), idx)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '4px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: copiedMessageIdx === idx ? '#4ADE80' : '#677C99',
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
                              onClick={() => handleDownloadText(message.content || (message.components?.map(c => c.type === 'text' ? c.data : '').join('\n') || ''))}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '4px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#677C99',
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
                                color: '#677C99',
                                fontSize: '12px',
                                transition: 'color 0.2s',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#4ADE80'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#677C99'}
                            >
                              <ThumbsUp size={16} />
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
                                color: '#677C99',
                                fontSize: '12px',
                                transition: 'color 0.2s',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#F87171'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#677C99'}
                            >
                              <ThumbsDown size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {/* Thinking Indicator */}
                {isWaitingForResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      marginBottom: '32px',
                    }}
                  >
                    {/* Static square container + subtle neon-like brightness pulse on inner Vorta star */}
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        backgroundColor: '#324053',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <motion.div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <svg
                          width={24}
                          height={24}
                          viewBox="0 0 64 64"
                          fill="none"
                        >
                          <motion.path
                            d="M32 8L32 56"
                            strokeWidth="8"
                            strokeLinecap="square"
                            animate={{
                              stroke: ['#5B9EFF', '#7BB3FF', '#5B9EFF'],
                            }}
                            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                          />
                          <motion.path
                            d="M32 8L32 56"
                            strokeWidth="8"
                            strokeLinecap="square"
                            transform="rotate(60 32 32)"
                            animate={{
                              stroke: ['#5B9EFF', '#7BB3FF', '#5B9EFF'],
                            }}
                            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                          />
                          <motion.path
                            d="M32 8L32 56"
                            strokeWidth="8"
                            strokeLinecap="square"
                            transform="rotate(120 32 32)"
                            animate={{
                              stroke: ['#5B9EFF', '#7BB3FF', '#5B9EFF'],
                            }}
                            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                          />
                        </svg>
                      </motion.div>
                    </div>

                    {/* Three typing dots */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', minHeight: '42px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <motion.div
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 1.4, repeat: Infinity, delay: 0, ease: 'easeInOut' }}
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#9CA5B5',
                          }}
                        />
                        <motion.div
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 1.4, repeat: Infinity, delay: 0.3, ease: 'easeInOut' }}
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#9CA5B5',
                          }}
                        />
                        <motion.div
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 1.4, repeat: Infinity, delay: 0.6, ease: 'easeInOut' }}
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#9CA5B5',
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
              
              {/* Gradient Fade */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '30px',
                background: 'linear-gradient(to top, #141A24 0%, rgba(20, 26, 36, 0.8) 50%, transparent 100%)',
                pointerEvents: 'none',
                zIndex: 5,
              }} />
              
              {/* New Message Button */}
              <AnimatePresence>
                {showNewMessageButton && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => {
                      scrollToLatestMessageTop();
                      setShowNewMessageButton(false);
                    }}
                    style={{
                      position: 'fixed',
                      left: 'calc(50% - 70px)',
                      bottom: '110px',
                      zIndex: 30,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      backgroundColor: '#1F2835',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      color: '#9CA5B5',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#252F3E';
                      e.currentTarget.style.color = '#E6EAF1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1F2835';
                      e.currentTarget.style.color = '#9CA5B5';
                    }}
                  >
                    <ChevronDown size={16} />
                    New message
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            
            {/* Chat Input */}
            <div style={{
              padding: '24px 80px',
              backgroundColor: '#141A24',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
            }}>
              <div style={{
                width: '100%',
                maxWidth: '1000px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}>
                <ChatInput
                  onSend={handleQuestionSubmit}
                  isLoading={isWaitingForResponse}
                  placeholder={
                    conversationHistory.length > 0
                      ? t('chat.input.placeholder.followup', language)
                      : t('chat.input.placeholder', language)
                  }
                  language={language}
                  onLanguageChange={handleLanguageChange}
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

// Icon Button Component - subtle blue hover effect
function IconButton({ Icon, size }: { Icon: React.ComponentType<any>; size: number }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '30px',
        height: '30px',
        borderRadius: '999px',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
      }}
    >
      <Icon size={size} color={isHovered ? '#5B9EFF' : '#677C99'} />
    </button>
  );
}

// Language Toggle Button - same size as icons, subtle blue hover
function LanguageToggleButton({
  language,
  onLanguageChange,
}: {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      onClick={() => onLanguageChange(language === 'en' ? 'es' : 'en')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '30px',
        height: '30px',
        borderRadius: '999px',
        border: 'none',
        backgroundColor: 'transparent',
        color: isHovered ? '#5B9EFF' : '#677C99',
        fontSize: '13px',
        fontWeight: 600,
        lineHeight: '1',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        letterSpacing: '0.02em',
        transition: 'color 0.2s ease',
        padding: 0,
      }}
    >
      {language.toUpperCase()}
    </button>
  );
}

// Chat Input Component
function ChatInput({
  onSend,
  isLoading,
  placeholder,
  language,
  onLanguageChange,
}: {
  onSend: (value: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState('');
  
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
  
  return (
    <motion.div
      style={{
        backgroundColor: '#19212C',
        borderRadius: '12px',
        border: `1px solid ${isFocused || value.trim() ? 'rgba(91, 158, 255, 0.3)' : 'rgba(255,255,255,0.08)'}`,
        padding: '14px 16px',
        width: '100%',
        maxWidth: '1000px',
        transition: 'border-color 0.2s ease',
      }}
    >
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
          color: '#E6EAF1',
          fontSize: '15px',
          lineHeight: '1.5',
          fontFamily: 'Inter, sans-serif',
          marginBottom: '12px',
        }}
      />
      <style>{`
        textarea::placeholder {
          color: #677C99;
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', paddingLeft: '0' }}>
        <div style={{ display: 'flex', gap: '6px', paddingLeft: '0', marginLeft: '0' }}>
          {/* Globe */}
          <IconButton Icon={Globe} size={18} />

          {/* Single compact language toggle (cycles EN/ES) - same visual weight as icons */}
          <LanguageToggleButton
            language={language}
            onLanguageChange={onLanguageChange}
          />

          {/* Other small icons */}
          <IconButton Icon={Paperclip} size={18} />
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
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: value.trim() ? '#5B9EFF' : '#2A3544',
            border: 'none',
            cursor: value.trim() && !isLoading ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.12s',
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
            <ArrowRight size={20} color={value.trim() ? 'white' : '#677C99'} />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
