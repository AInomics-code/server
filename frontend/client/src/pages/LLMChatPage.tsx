import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalSidebar } from '@/components/GlobalSidebar';
import { ChatChart } from '@/components/ChatChart';
import { LLMMarkdownRenderer } from '@/components/LLMMarkdownRenderer';
import { GetStartedCards } from '@/components/GetStartedCards';
import { t, getCurrentLanguage, setCurrentLanguage, type Language } from '@/config/i18n';
import { 
  agentService, 
  Component,
  ChartComponent,
  PieChartComponent,
  BubbleChartComponent,
  RadarChartComponent,
} from '@/services/agentService';
import { getUserName } from '@/utils/auth';
import { 
  Paperclip, 
  ArrowRight, 
  X, 
  Copy,
  Download,
  Check,
  TrendingUp,
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
  Package,
  ClipboardCheck,
} from 'lucide-react';
import { SiSap, SiSalesforce, SiSnowflake } from 'react-icons/si';
import { FaFileExcel } from 'react-icons/fa';
import { Database } from 'lucide-react';
import { Document, Page, Text, View, StyleSheet, pdf, Svg, Path, G } from '@react-pdf/renderer';

// ========== CLEAN PDF STYLES ==========
const pdfStyles = StyleSheet.create({
  page: {
    padding: 50,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  contentContainer: {
    width: '100%',
  },
  header: {
    marginBottom: 30,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoStar: {
    width: 28,
    height: 28,
    marginRight: 10,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5B9EFF',
    letterSpacing: 0.5,
  },
  headerMetadata: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'right',
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 12,
    marginBottom: 24,
  },
  h1: {
    fontSize: 20,
    fontWeight: 600,
    color: '#1A1A1A',
    marginTop: 32,
    marginBottom: 16,
  },
  h2: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1A1A1A',
    marginTop: 24,
    marginBottom: 12,
  },
  h3: {
    fontSize: 14,
    fontWeight: 500,
    color: '#4A5568',
    marginTop: 20,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  paragraph: {
    fontSize: 12,
    color: '#2D3748',
    lineHeight: 1.7,
    marginBottom: 8,
    fontWeight: 400,
  },
  bold: {
    fontWeight: 500,
    color: '#1A1A1A',
  },
  boldText: {
    fontWeight: 500,
    color: '#1A1A1A',
    fontSize: 12,
  },
  numberHighlight: {
    color: '#5B9EFF',
    fontWeight: 500,
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#D0D5DC',
    marginTop: 20,
    marginBottom: 20,
  },
  summaryItem: {
    fontSize: 12,
    color: '#1A1A1A',
    marginBottom: 6,
    lineHeight: 1.5,
  },
  summaryLabel: {
    fontWeight: 500,
  },
  listItem: {
    fontSize: 12,
    color: '#1A1A1A',
    marginBottom: 10,
    lineHeight: 1.6,
    paddingLeft: 0,
  },
  listItemTitle: {
    fontWeight: 500,
    marginBottom: 4,
    fontSize: 12,
  },
  listItemDetail: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  tableContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  table: {
    width: '100%',
    marginBottom: 12,
  },
  tableHeader: {
    borderBottom: '1px solid #1A1A1A',
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  tableRow: {
    borderBottom: '0.5px solid #E0E0E0',
    paddingVertical: 8,
  },
  tableCell: {
    fontSize: 10,
    color: '#1A1A1A',
    paddingVertical: 4,
  },
  tableCellNumeric: {
    fontSize: 10,
    color: '#1A1A1A',
    fontWeight: 'bold',
    paddingVertical: 4,
  },
  alertBlock: {
    marginTop: 16,
    marginBottom: 16,
  },
  alertText: {
    fontSize: 11,
    color: '#1A1A1A',
    lineHeight: 1.6,
    marginBottom: 6,
  },
  alertLabel: {
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 8,
    color: '#999999',
    borderTop: '0.5px solid #E0E0E0',
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLogo: {
    width: 10,
    height: 10,
    marginRight: 4,
  },
});

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
  // Don't generate session_id - let backend create it for new conversations
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId] = useState(() => {
    // Use the auth utility to get user ID
    const userId = localStorage.getItem('userId');
    return userId || 'user';
  });
  const currentRequestIdRef = useRef(0);
  const chatContentRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement | null>(null);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setCurrentLanguage(lang);
  };

  const scrollToLatestMessageTop = () => {
    if (chatContentRef.current) {
      // Scroll to the bottom of the container with smooth behavior
      const container = chatContentRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
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

  // Auto-scroll to latest message when new messages arrive
  useEffect(() => {
    if (conversationHistory.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        scrollToLatestMessageTop();
      }, 150);
    }
  }, [conversationHistory.length]);

  // Also scroll when response finishes loading
  useEffect(() => {
    if (!isWaitingForResponse && conversationHistory.length > 0) {
      setTimeout(() => {
        scrollToLatestMessageTop();
      }, 200);
    }
  }, [isWaitingForResponse, conversationHistory.length]);

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
      const response = await agentService.sendQuery(question, userId, sessionId || '');

      // If a newer request was started (e.g. user went back), ignore this response
      if (currentRequestIdRef.current !== requestId) return;
      
      setIsWaitingForResponse(false);
      
      // Save the session_id from the backend for subsequent messages
      if (response.metadata?.session_id && !sessionId) {
        setSessionId(response.metadata.session_id);
      }
      
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
      const response = await agentService.sendQuery(question, userId, sessionId || '');

      // If a newer request was started (e.g. user went back), ignore this response
      if (currentRequestIdRef.current !== requestId) return;
      
      setIsWaitingForResponse(false);
      
      // Save the session_id from the backend for subsequent messages
      if (response.metadata?.session_id && !sessionId) {
        setSessionId(response.metadata.session_id);
      }
      
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
    // Reset session_id for new conversation
    setSessionId(null);
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
  
  // Download message as Palantir Foundry / Gotham style PDF
  const handleDownloadText = async (content: string, components?: Component[]) => {
    try {
      // Parse markdown content
      const lines = content.split('\n');
      
      // Extract report title
      let reportTitle = '';
      let reportSubtitle = '';
      const titleMatch = content.match(/([A-Z][A-Z\s]+(?:REPORT|ANALYSIS|SUMMARY|OVERVIEW)[\s\-]+[A-Z0-9\s]+)/);
      if (titleMatch) {
        const fullTitle = titleMatch[1];
        const parts = fullTitle.split(/\s*-\s*/);
        reportTitle = parts[0] || '';
        reportSubtitle = parts.slice(1).join(' - ') || '';
      }
      
      // Simple header with logo
      const allElements: any[] = [];
      allElements.push(
        <View style={pdfStyles.header} key="header">
          <View style={pdfStyles.headerTop}>
            <View style={pdfStyles.logoContainer}>
              <Svg style={pdfStyles.logoStar} viewBox="0 0 64 64">
                {/* Vertical line (0 degrees) */}
                <Path 
                  d="M32 8L32 56" 
                  stroke="#5B9EFF" 
                  strokeWidth="8" 
                  strokeLinecap="square"
                />
                {/* Rotated 60 degrees: x' = x*cos(60) - y*sin(60), y' = x*sin(60) + y*cos(60) */}
                {/* Center at (32, 32), rotate around it */}
                {/* For point (32, 8): relative to center is (0, -24), rotated becomes (12*√3, -12) = (20.78, -12), absolute (52.78, 20) */}
                {/* For point (32, 56): relative to center is (0, 24), rotated becomes (-12*√3, 12) = (-20.78, 12), absolute (11.22, 44) */}
                <Path 
                  d="M52.78 20L11.22 44" 
                  stroke="#5B9EFF" 
                  strokeWidth="8" 
                  strokeLinecap="square"
                />
                {/* Rotated 120 degrees */}
                {/* For point (32, 8): relative (0, -24), rotated 120° becomes (-12*√3, -12) = (-20.78, -12), absolute (11.22, 20) */}
                {/* For point (32, 56): relative (0, 24), rotated 120° becomes (12*√3, 12) = (20.78, 12), absolute (52.78, 44) */}
                <Path 
                  d="M11.22 20L52.78 44" 
                  stroke="#5B9EFF" 
                  strokeWidth="8" 
                  strokeLinecap="square"
                />
              </Svg>
              <Text style={pdfStyles.logoText}>Aragon</Text>
            </View>
            <Text style={pdfStyles.headerMetadata}>
              Report generated on {new Date().toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })} at {new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
          {reportTitle && (
            <Text style={pdfStyles.reportTitle}>{reportTitle}</Text>
          )}
        </View>
      );
      
      // Build content - simple, clean structure matching the example
      let currentSection: any[] = [];
      let tableData: string[][] = [];
      let tableHeaders: string[] = [];
      let inTable = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
        
        // Detect table rows (lines starting and ending with |)
        const isTableRow = line.startsWith('|') && line.endsWith('|');
        const isTableSeparator = isTableRow && line.match(/^\|[\s\-:]+\|/);
        
        if (isTableRow && !isTableSeparator) {
          // Parse table row
          const cells = line.split('|').map(c => c.trim()).filter(c => c);
          
          if (!inTable) {
            // First row is header
            tableHeaders = cells;
            inTable = true;
            tableData = [];
          } else {
            // Data row
            tableData.push(cells);
          }
          continue;
        } else if (isTableSeparator) {
          // Skip separator row
          continue;
        } else if (inTable && !isTableRow) {
          // End of table - render it with insight if available
          if (tableHeaders.length > 0 && tableData.length > 0) {
            // Render table
            const cellWidth = `${100 / tableHeaders.length}%`;
            allElements.push(
              <View style={pdfStyles.tableContainer} key={`table-${i}`}>
                <View style={pdfStyles.table}>
                  <View style={pdfStyles.tableHeader}>
                    <View style={{ flexDirection: 'row' }}>
                      {tableHeaders.map((header, hi) => (
                        <View key={hi} style={{ width: cellWidth, paddingRight: 8 }}>
                          <Text style={pdfStyles.tableHeaderCell}>
                            {header.replace(/\*\*/g, '').trim()}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  
                  {tableData.map((row, ri) => (
                    <View key={ri} style={pdfStyles.tableRow}>
                      <View style={{ flexDirection: 'row' }}>
                        {row.map((cell, ci) => {
                          const cellText = cell.replace(/\*\*/g, '').trim();
                          const isNumeric = /\$[\d,]+|[\d,]+(?:\.\d+)?%/.test(cellText);
                          return (
                            <View key={ci} style={{ width: cellWidth, paddingRight: 8 }}>
                              <Text style={isNumeric ? pdfStyles.tableCellNumeric : pdfStyles.tableCell}>
                                {cellText}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );
          }
          inTable = false;
          tableHeaders = [];
          tableData = [];
        }
        
        // Empty line - close current section
        if (!line) {
          if (currentSection.length > 0) {
            allElements.push(
              <View style={pdfStyles.section} key={`section-${i}`}>
                {currentSection}
              </View>
            );
            currentSection = [];
          }
          continue;
        }
        
        // Main headers (##) - H1
        if (line.startsWith('## ')) {
          if (currentSection.length > 0) {
            allElements.push(
              <View style={pdfStyles.section} key={`section-${i}`}>
                {currentSection}
              </View>
            );
            currentSection = [];
          }
          // Add divider before new section (except for first section after header)
          const hasHeader = allElements.some(el => el && el.key === 'header');
          if (hasHeader && allElements.length > 1) {
            allElements.push(
              <View style={pdfStyles.sectionDivider} key={`divider-${i}`} />
            );
          }
          allElements.push(
            <Text style={pdfStyles.h1} key={`heading-${i}`}>
              {line.replace(/^##\s+/, '')}
            </Text>
          );
          continue;
        }
        
        // Subheaders (###) - H2 or H3
        if (line.startsWith('### ')) {
          if (currentSection.length > 0) {
            allElements.push(
              <View style={pdfStyles.section} key={`section-${i}`}>
                {currentSection}
              </View>
            );
            currentSection = [];
          }
          // Check if it's H3 (smaller, uppercase) or H2
          const headerText = line.replace(/^###\s+/, '');
          const isH3 = headerText.length < 30 && /^[A-Z\s]+$/.test(headerText.trim());
          
          if (isH3) {
            // H3 style - smaller, uppercase
            allElements.push(
              <Text style={pdfStyles.h3} key={`h3-${i}`}>
                {headerText}
              </Text>
            );
          } else {
            // H2 style
            allElements.push(
              <View style={pdfStyles.sectionDivider} key={`divider-${i}`} />
            );
            allElements.push(
              <Text style={pdfStyles.h2} key={`subheading-${i}`}>
                {headerText}
              </Text>
            );
          }
          continue;
        }
        
        // H4 headers (####)
        if (line.startsWith('#### ')) {
          if (currentSection.length > 0) {
            allElements.push(
              <View style={pdfStyles.section} key={`section-${i}`}>
                {currentSection}
              </View>
            );
            currentSection = [];
          }
          allElements.push(
            <Text style={pdfStyles.h3} key={`h4-${i}`}>
              {line.replace(/^####\s+/, '')}
            </Text>
          );
          continue;
        }
        
        // Bold headlines (full line bold) - preserve bold
        if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
          const text = line.replace(/\*\*/g, '').trim();
          currentSection.push(
            <Text style={pdfStyles.boldText} key={`bold-${i}`}>
              {text}
            </Text>
          );
          continue;
        }
        
        // List items - preserve inline bold
        if (line.startsWith('- ') || line.startsWith('• ') || line.match(/^\d+\.\s/)) {
          let text = line.replace(/^[-•]\s+|\d+\.\s+/, '').trim();
          // Parse inline bold and numbers
          const parts = text.split(/(\*\*[^*]+\*\*|\$[\d,]+(?:\.\d+)?|[\d,]+(?:\.\d+)?%)/g);
          const textRuns: any[] = [];
          
          parts.forEach((part, idx) => {
            if (!part.trim()) return;
            if (part.startsWith('**') && part.endsWith('**')) {
              // Bold text
              const boldText = part.replace(/\*\*/g, '');
              textRuns.push(
                <Text style={pdfStyles.boldText} key={`list-bold-${i}-${idx}`}>
                  {boldText}
                </Text>
              );
            } else if (/\$[\d,]+(?:\.\d+)?|[\d,]+(?:\.\d+)?%/.test(part)) {
              // Numbers/currency
              textRuns.push(
                <Text style={pdfStyles.numberHighlight} key={`list-num-${i}-${idx}`}>
                  {part}
                </Text>
              );
            } else {
              textRuns.push(part);
            }
          });
          
          if (textRuns.length > 0) {
            // Check if it's a key-value pair for summary
            const fullText = text.replace(/\*\*/g, '');
            const keyValueMatch = fullText.match(/^(.+?):\s*(.+)$/);
            if (keyValueMatch) {
              // Extract just the value part to avoid duplication
              const labelText = keyValueMatch[1].trim();
              const valueText = keyValueMatch[2].trim();
              // Re-parse the value to preserve formatting
              const valueParts = valueText.split(/(\*\*[^*]+\*\*|\$[\d,]+(?:\.\d+)?|[\d,]+(?:\.\d+)?%)/g);
              const valueRuns: any[] = [];
              
              valueParts.forEach((part, idx) => {
                if (!part.trim()) return;
                if (part.startsWith('**') && part.endsWith('**')) {
                  const boldText = part.replace(/\*\*/g, '');
                  valueRuns.push(
                    <Text style={pdfStyles.boldText} key={`value-bold-${i}-${idx}`}>
                      {boldText}
                    </Text>
                  );
                } else if (/\$[\d,]+(?:\.\d+)?|[\d,]+(?:\.\d+)?%/.test(part)) {
                  valueRuns.push(
                    <Text style={pdfStyles.numberHighlight} key={`value-num-${i}-${idx}`}>
                      {part}
                    </Text>
                  );
                } else {
                  valueRuns.push(part);
                }
              });
              
              currentSection.push(
                <Text style={pdfStyles.summaryItem} key={`list-${i}`}>
                  <Text style={pdfStyles.summaryLabel}>{labelText}: </Text>
                  {valueRuns.length > 0 ? valueRuns : valueText}
                </Text>
              );
            } else {
              // Check if it's a product/client entry (has parentheses or specific format)
              const fullTextPlain = text.replace(/\*\*/g, '');
              if (fullTextPlain.includes('(') || fullTextPlain.match(/Sales:|Quantity:|Transactions:/)) {
                // This is a detailed list item (Top 5 products/clients)
                const parts = fullTextPlain.split(/\s*(Sales:|Quantity:|Transactions:)/);
                if (parts.length > 1) {
                  currentSection.push(
                    <View key={`list-${i}`} style={{ marginBottom: 8 }}>
                      <Text style={pdfStyles.listItemTitle}>
                        {parts[0].trim()}
                      </Text>
                      {parts.slice(1).map((part, pidx) => {
                        if (part.match(/Sales:|Quantity:|Transactions:/)) {
                          return (
                            <Text key={pidx} style={pdfStyles.listItemDetail}>
                              {part} {parts[pidx + 2] || ''}
                            </Text>
                          );
                        }
                        return null;
                      })}
                    </View>
                  );
                } else {
                  currentSection.push(
                    <Text style={pdfStyles.listItem} key={`list-${i}`}>
                      {textRuns}
                    </Text>
                  );
                }
              } else {
                currentSection.push(
                  <Text style={pdfStyles.listItem} key={`list-${i}`}>
                    {textRuns}
                  </Text>
                );
              }
            }
          }
          continue;
        }
        
        // Paragraph with inline bold and numbers - preserve formatting
        if (line.includes('**') || /\$[\d,]+|[\d,]+%/.test(line)) {
          // Split by bold markers and numbers
          const parts = line.split(/(\*\*[^*]+\*\*|\$[\d,]+(?:\.\d+)?|[\d,]+(?:\.\d+)?%)/g);
          const textRuns: any[] = [];
          
          parts.forEach((part, idx) => {
            if (!part.trim()) return;
            if (part.startsWith('**') && part.endsWith('**')) {
              // Bold text
              const boldText = part.replace(/\*\*/g, '');
              textRuns.push(
                <Text style={pdfStyles.boldText} key={`para-bold-${i}-${idx}`}>
                  {boldText}
                </Text>
              );
            } else if (/\$[\d,]+(?:\.\d+)?|[\d,]+(?:\.\d+)?%/.test(part)) {
              // Numbers/currency - highlight in blue
              textRuns.push(
                <Text style={pdfStyles.numberHighlight} key={`para-num-${i}-${idx}`}>
                  {part}
                </Text>
              );
            } else {
              textRuns.push(part);
            }
          });
          
          currentSection.push(
            <Text style={pdfStyles.paragraph} key={`para-${i}`}>
              {textRuns}
            </Text>
          );
          continue;
        }
        
        // Regular paragraph - check for any remaining bold
        if (line.includes('**')) {
          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          const textRuns: any[] = [];
          
          parts.forEach((part, idx) => {
            if (!part.trim()) return;
            if (part.startsWith('**') && part.endsWith('**')) {
              const boldText = part.replace(/\*\*/g, '');
              textRuns.push(
                <Text style={pdfStyles.boldText} key={`reg-bold-${i}-${idx}`}>
                  {boldText}
                </Text>
              );
            } else {
              textRuns.push(part);
            }
          });
          
          currentSection.push(
            <Text style={pdfStyles.paragraph} key={`para-${i}`}>
              {textRuns}
            </Text>
          );
        } else {
          let cleanLine = line.trim();
          if (cleanLine) {
            currentSection.push(
              <Text style={pdfStyles.paragraph} key={`para-${i}`}>
                {cleanLine}
              </Text>
            );
          }
        }
      }

      // Handle table at end of content
      if (inTable && tableHeaders.length > 0 && tableData.length > 0) {
        const cellWidth = `${100 / tableHeaders.length}%`;
        allElements.push(
          <View style={pdfStyles.tableContainer} key="table-final">
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tableHeader}>
                <View style={{ flexDirection: 'row' }}>
                  {tableHeaders.map((header, hi) => (
                    <View key={hi} style={{ width: cellWidth, paddingRight: 8 }}>
                      <Text style={pdfStyles.tableHeaderCell}>
                        {header.replace(/\*\*/g, '').trim()}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              {tableData.map((row, ri) => (
                <View key={ri} style={pdfStyles.tableRow}>
                  <View style={{ flexDirection: 'row' }}>
                    {row.map((cell, ci) => {
                      const cellText = cell.replace(/\*\*/g, '').trim();
                      const isNumeric = /\$[\d,]+|[\d,]+(?:\.\d+)?%/.test(cellText);
                      return (
                        <View key={ci} style={{ width: cellWidth, paddingRight: 8 }}>
                          <Text style={isNumeric ? pdfStyles.tableCellNumeric : pdfStyles.tableCell}>
                            {cellText}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          </View>
        );
      }

      // Add remaining section
      if (currentSection.length > 0) {
        allElements.push(
          <View style={pdfStyles.section} key="final-section">
            {currentSection}
          </View>
        );
      }

      // Add chart components if provided
      if (components && components.length > 0) {
        components.forEach((component, compIdx) => {
          if (component.type === 'pie_chart' || component.type === 'polar_chart') {
            const chartData = component.data as PieChartComponent['data'];
            if (chartData && chartData.datasets && chartData.datasets[0]) {
              const data = chartData.datasets[0].data;
              const total = data.reduce((sum: number, item: any) => sum + (item.value || 0), 0);
              
              // Add chart title
              if (chartData.title) {
                allElements.push(
                  <Text style={pdfStyles.h2} key={`chart-title-${compIdx}`}>
                    {chartData.title}
                  </Text>
                );
              }
              
              // Create simple pie chart representation using SVG
              const chartSize = 200;
              const centerX = chartSize / 2;
              const centerY = chartSize / 2;
              const radius = 80;
              let currentAngle = -90; // Start at top
              
              const colors = ['#5B9EFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
              
              const paths: any[] = [];
              data.slice(0, 6).forEach((item: any, idx: number) => {
                const value = item.value || 0;
                const percentage = (value / total) * 100;
                const angle = (percentage / 100) * 360;
                const startAngle = currentAngle;
                const endAngle = currentAngle + angle;
                
                // Convert angles to radians
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;
                
                // Calculate arc points
                const x1 = centerX + radius * Math.cos(startRad);
                const y1 = centerY + radius * Math.sin(startRad);
                const x2 = centerX + radius * Math.cos(endRad);
                const y2 = centerY + radius * Math.sin(endRad);
                
                const largeArc = angle > 180 ? 1 : 0;
                
                paths.push(
                  <Path
                    key={`slice-${idx}`}
                    d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={colors[idx % colors.length]}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                );
                
                currentAngle = endAngle;
              });
              
              allElements.push(
                <View key={`chart-${compIdx}`} style={{ 
                  marginTop: 20, 
                  marginBottom: 30, 
                  alignItems: 'center',
                  border: '1px solid #E0E0E0',
                  padding: 16,
                  backgroundColor: '#FAFAFA',
                }}>
                  <Svg width={chartSize} height={chartSize} viewBox={`0 0 ${chartSize} ${chartSize}`}>
                    {paths}
                  </Svg>
                  
                  {/* Legend - make more visible */}
                  <View style={{ marginTop: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {data.slice(0, 6).map((item: any, idx: number) => (
                      <View key={`legend-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 10 }}>
                        <View style={{ width: 14, height: 14, backgroundColor: colors[idx % colors.length], marginRight: 8, border: '1px solid #E0E0E0' }} />
                        <Text style={{ fontSize: 11, color: '#1A1A1A', fontWeight: 500 }}>
                          {item.label}: <Text style={{ fontWeight: 'bold', color: '#5B9EFF' }}>{((item.value || 0) / total * 100).toFixed(1)}%</Text>
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            }
          } else if (component.type === 'bar_chart' || component.type === 'line_chart') {
            const chartData = component.data as ChartComponent['data'];
            if (chartData && chartData.datasets && chartData.datasets[0]) {
              // Add chart title
              if (chartData.title) {
                allElements.push(
                  <Text style={pdfStyles.h2} key={`chart-title-${compIdx}`}>
                    {chartData.title}
                  </Text>
                );
              }
              
              // Create bar chart with axes and border
              const chartWidth = 500;
              const chartHeight = 250;
              const paddingLeft = 50; // Space for Y-axis labels
              const paddingBottom = 40; // Space for X-axis labels
              const paddingTop = 20;
              const paddingRight = 20;
              const plotWidth = chartWidth - paddingLeft - paddingRight;
              const plotHeight = chartHeight - paddingTop - paddingBottom;
              const barWidth = 40;
              const maxValue = Math.max(...chartData.datasets[0].data.map((d: any) => d.y || d.value || 0));
              const roundedMax = Math.ceil(maxValue / 1000000) * 1000000; // Round up to nearest million
              const barSpacing = (plotWidth - (chartData.datasets[0].data.length * barWidth)) / (chartData.datasets[0].data.length + 1);
              
              // Y-axis scale values (rendered as SVG text) - make more visible
              const yAxisSteps = 5;
              const yAxisLabels: any[] = [];
              for (let i = 0; i <= yAxisSteps; i++) {
                const value = (roundedMax / yAxisSteps) * i;
                const y = paddingTop + plotHeight - (i / yAxisSteps) * plotHeight;
                const displayValue = value >= 1000000 
                  ? `${(value / 1000000).toFixed(1)}M`
                  : value >= 1000
                  ? `${(value / 1000).toFixed(0)}K`
                  : value.toLocaleString();
                yAxisLabels.push(
                  <Text
                    key={`y-label-${i}`}
                    x={paddingLeft - 10}
                    y={y + 4}
                    style={{ fontSize: 10, fill: '#1A1A1A', fontWeight: 'bold' }}
                    textAnchor="end"
                  >
                    {displayValue}
                  </Text>
                );
              }
              
              // Y-axis line - lighter
              const yAxisLine = (
                <Path
                  key="y-axis"
                  d={`M ${paddingLeft} ${paddingTop} L ${paddingLeft} ${paddingTop + plotHeight}`}
                  stroke="#E8E8E8"
                  strokeWidth={0.8}
                />
              );
              
              // X-axis line - lighter
              const xAxisLine = (
                <Path
                  key="x-axis"
                  d={`M ${paddingLeft} ${paddingTop + plotHeight} L ${paddingLeft + plotWidth} ${paddingTop + plotHeight}`}
                  stroke="#E8E8E8"
                  strokeWidth={0.8}
                />
              );
              
              // Grid lines - lighter
              const gridLines: any[] = [];
              for (let i = 0; i <= yAxisSteps; i++) {
                const y = paddingTop + plotHeight - (i / yAxisSteps) * plotHeight;
                gridLines.push(
                  <Path
                    key={`grid-${i}`}
                    d={`M ${paddingLeft} ${y} L ${paddingLeft + plotWidth} ${y}`}
                    stroke="#F5F5F5"
                    strokeWidth={0.5}
                  />
                );
              }
              
              // Bars
              const bars: any[] = [];
              const xLabels: any[] = [];
              chartData.datasets[0].data.forEach((item: any, idx: number) => {
                const value = item.y || item.value || 0;
                const barHeight = (value / roundedMax) * plotHeight;
                const x = paddingLeft + barSpacing + idx * (barWidth + barSpacing);
                const y = paddingTop + plotHeight - barHeight;
                
                bars.push(
                  <Path
                    key={`bar-${idx}`}
                    d={`M ${x} ${paddingTop + plotHeight} L ${x} ${y} L ${x + barWidth} ${y} L ${x + barWidth} ${paddingTop + plotHeight} Z`}
                    fill="#5B9EFF"
                    stroke="#FFFFFF"
                    strokeWidth={1}
                  />
                );
                
                // X-axis labels (rendered as SVG text) - make more visible
                const labelX = x + (barWidth / 2);
                const labelY = paddingTop + plotHeight + 22;
                xLabels.push(
                  <Text
                    key={`x-label-${idx}`}
                    x={labelX}
                    y={labelY}
                    style={{ fontSize: 10, fill: '#1A1A1A', fontWeight: 'bold' }}
                    textAnchor="middle"
                  >
                    {item.x || item.label || ''}
                  </Text>
                );
                xLabels.push(
                  <Text
                    key={`x-value-${idx}`}
                    x={labelX}
                    y={labelY + 14}
                    style={{ fontSize: 9, fill: '#666666', fontWeight: 'bold' }}
                    textAnchor="middle"
                  >
                    {value.toLocaleString()}
                  </Text>
                );
              });
              
              allElements.push(
                <View key={`chart-${compIdx}`} style={{ 
                  marginTop: 20, 
                  marginBottom: 30, 
                  alignItems: 'center',
                  border: '1px solid #E0E0E0',
                  padding: 16,
                  backgroundColor: '#FAFAFA',
                }}>
                  <Svg width={chartWidth} height={chartHeight + 40} viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}>
                    {gridLines}
                    {yAxisLine}
                    {xAxisLine}
                    {bars}
                    {yAxisLabels}
                    {xLabels}
                  </Svg>
                </View>
              );
            }
          }
        });
      }

      // Create simple, clean PDF matching the example
      const doc = (
        <Document>
          <Page size="A4" style={pdfStyles.page}>
            <View style={pdfStyles.contentContainer}>
              {allElements}
            </View>
            <View style={pdfStyles.footer} fixed>
              <Svg style={pdfStyles.footerLogo} viewBox="0 0 64 64">
                {/* Vertical line (0 degrees) */}
                <Path 
                  d="M32 8L32 56" 
                  stroke="#999999" 
                  strokeWidth="8" 
                  strokeLinecap="square"
                />
                {/* Rotated 60 degrees */}
                <Path 
                  d="M52.78 20L11.22 44" 
                  stroke="#999999" 
                  strokeWidth="8" 
                  strokeLinecap="square"
                />
                {/* Rotated 120 degrees */}
                <Path 
                  d="M11.22 20L52.78 44" 
                  stroke="#999999" 
                  strokeWidth="8" 
                  strokeLinecap="square"
                />
              </Svg>
              <Text>Aragon - Business Intelligence Platform | Confidential</Text>
            </View>
          </Page>
        </Document>
      );

      // Generate and download PDF
      const blob = await pdf(doc).toBlob();
      const fileName = `aragon_report_${new Date().toISOString().split('T')[0]}_${Date.now()}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating PDF:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      // Fallback to text file
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
      icon: ClipboardCheck,
      title: t('cards.forecast.title', language),
      description: t('cards.forecast.description', language),
      workflow: 'forecast_tracking',
      question: t('cards.forecast.title', language),
    },
    {
      id: 'generate-reports',
      icon: Package,
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
      backgroundColor: '#1F2227',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <GlobalSidebar activePage="llm" />
      
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
              transition={{ 
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1]
              }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                paddingTop: '0px',
              }}
            >
              {/* Aragon Logo - Static */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px',
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
                  <VortaStarIcon size={56} color="#FFFFFF" />
                  <motion.span
                    initial={{ opacity: 0, x: -50, width: 0 }}
                    animate={{ opacity: 1, x: 0, width: 'auto' }}
                    transition={{ 
                      duration: 0.8, 
                      delay: 1, // 1s with only the logo, then slide text in
                      ease: [0.2, 0.8, 0.2, 1] // very smooth, slick ease
                    }}
                    style={{
                      fontSize: '44px',
                      fontWeight: 600,
                      color: '#FFFFFF',
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
              transition={{ 
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1]
              }}
              style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                background: '#1F2227',
                overflow: 'hidden',
              }}
            >
              {/* Chat Header */}
              <div style={{
                padding: '14px 24px',
                backgroundColor: 'rgba(47, 52, 59, 0.6)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
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
                    color: '#FFFFFF',
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                >
                  {t('chat.back', language)}
                </button>
                <span style={{ fontSize: '14px', color: '#FFFFFF', fontWeight: 600 }}>Vorta</span>
                <span style={{ fontSize: '14px', color: '#FFFFFF', fontWeight: 400, marginLeft: '2px' }}>V.2</span>
                
                {/* User Display */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginLeft: 'auto',
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#9CA5B5',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '16px', fontWeight: 600, color: '#1F2227' }}>U</span>
                  </div>
                  <span style={{
                    fontSize: '14px',
                    color: '#FFFFFF',
                    fontWeight: 400,
                    display: 'flex',
                    alignItems: 'center',
                    height: '32px',
                  }}>
                    {getUserName() || localStorage.getItem('userId') || 'User'}
                  </span>
                </div>
              </div>

              {/* Chat Content */}
              <div 
                ref={chatContentRef}
                className="custom-scrollbar"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  position: 'relative',
                  padding: '0 24px 16px 24px',
                }}
              >
                {/* Subtle fade overlay at bottom edge - positioned at bottom of viewport */}
                <div style={{
                  position: 'sticky',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '60px',
                  background: 'linear-gradient(to top, rgba(31, 34, 39, 0.9) 0%, rgba(31, 34, 39, 0.4) 50%, rgba(31, 34, 39, 0) 100%)',
                  pointerEvents: 'none',
                  zIndex: 5,
                }} />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    position: 'relative',
                    minHeight: '100%',
                  }}
                >
                  {/* Centered conversation column matching chat input width */}
                  <div style={{
                    width: '100%',
                    maxWidth: '900px',
                    display: 'flex',
                    flexDirection: 'column',
                    margin: '0 auto',
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
                      alignItems: message.role === 'user' ? 'center' : 'flex-start',
                      gap: '16px',
                      marginBottom: '32px',
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '42px',
                      height: '42px',
                      backgroundColor: message.role === 'user' ? '#9CA5B5' : '#32373F',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {message.role === 'user' ? (
                        <span style={{ fontSize: '20px', fontWeight: 600, color: '#1F2227' }}>U</span>
                      ) : (
                        <VortaStarIcon size={24} color="#FFFFFF" />
                      )}
                    </div>
                    
                        {/* Message Content - centered within column */}
                        <div style={{ flex: 1, display: 'flex', alignItems: message.role === 'user' ? 'center' : 'flex-start', minHeight: '42px', maxWidth: '100%' }}>
                      {message.role === 'user' ? (
                        <div style={{ 
                          fontSize: '15px', 
                          color: '#E2E6F0', 
                          lineHeight: 1.6,
                        }}>
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
                              onClick={() => {
                                // Extract all text content from message
                                let fullContent = '';
                                if (message.components && message.components.length > 0) {
                                  // Get all text components and join them
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
                                // Extract all text content from message
                                let fullContent = '';
                                if (message.components && message.components.length > 0) {
                                  // Get all text components and join them
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
                                color: '#9CA5B5',
                                fontSize: '12px',
                                transition: 'color 0.2s',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#FCA5A5'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#9CA5B5'}
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
                      backgroundColor: '#32373F',
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
                              stroke: ['#FFFFFF', '#E6EAF1', '#FFFFFF'],
                            }}
                            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                          />
                          <motion.path
                            d="M32 8L32 56"
                            strokeWidth="8"
                            strokeLinecap="square"
                            transform="rotate(60 32 32)"
                            animate={{
                              stroke: ['#FFFFFF', '#E6EAF1', '#FFFFFF'],
                            }}
                            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                          />
                          <motion.path
                            d="M32 8L32 56"
                            strokeWidth="8"
                            strokeLinecap="square"
                            transform="rotate(120 32 32)"
                            animate={{
                              stroke: ['#FFFFFF', '#E6EAF1', '#FFFFFF'],
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
                </div>
            </div>
            
            {/* Chat Input */}
            <div style={{
              padding: '0 24px 24px 24px',
              backgroundColor: 'transparent',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
            }}>
              <div style={{
                width: '100%',
                maxWidth: '900px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                position: 'relative',
                zIndex: 2,
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
      <Icon size={size} color={isHovered ? '#5B9EFF' : '#5F6672'} />
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
        color: isHovered ? '#5B9EFF' : '#5F6672',
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
  
  const hasText = value.trim().length > 0;
  const isActive = isFocused || hasText;
  
  return (
    <div
      className={`composer-shell ${isActive ? 'composer-active' : ''}`}
      style={{
        position: 'relative',
        width: '100%',
      }}
    >
    <motion.div
      style={{
          backgroundColor: '#2F343B',
        borderRadius: '12px',
          border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(95, 102, 114, 0.3)'}`,
        padding: '14px 16px',
        width: '100%',
        transition: 'border-color 0.2s ease',
          boxShadow: isActive ? '0 0 0 1px rgba(255, 255, 255, 0.1)' : 'none',
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', paddingLeft: '0', position: 'relative', zIndex: 2 }}>
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
            backgroundColor: value.trim() ? '#4A5568' : '#2F343B',
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
            <ArrowRight size={20} color={value.trim() ? 'white' : '#5F6672'} />
          )}
        </motion.button>
      </div>
    </motion.div>
    </div>
  );
}
