import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Download, Check, FileText, Database } from 'lucide-react';
import { SiSap, SiSalesforce, SiSnowflake } from 'react-icons/si';
import { FaFileExcel } from 'react-icons/fa';

// Vorta Star Icon Component
const VortaStarIcon = ({ size = 24, color = '#5B9EFF' }: { size?: number; color?: string }) => (
  <span style={{ fontSize: size, color, filter: 'drop-shadow(0 0 8px rgba(91, 158, 255, 0.4))' }}>✱</span>
);

interface Message {
  role: 'user' | 'assistant';
  content: string;
  chartData?: any;
  dataExport?: {
    title: string;
    filename: string;
    csvContent: string;
  };
  isReportExport?: boolean;
  reportData?: {
    title: string;
    filename: string;
    content: string;
  };
}

interface ChatMessageProps {
  message: Message;
  index: number;
  isLast?: boolean;
}

export function ChatMessage({ message, index, isLast }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  // Copy message content
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Download as text file
  const handleDownload = () => {
    const blob = new Blob([message.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download CSV
  const handleDownloadCsv = () => {
    if (!message.dataExport) return;
    const blob = new Blob([message.dataExport.csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = message.dataExport.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Parse markdown-style text
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Bold headers
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <div key={i} style={{ 
            fontWeight: 600, 
            color: '#E2E6F0', 
            marginTop: i > 0 ? '16px' : 0, 
            marginBottom: '4px' 
          }}>
            {line.replace(/\*\*/g, '')}
          </div>
        );
      }
      
      // Horizontal rule
      if (line.trim() === '---') {
        return <div key={i} style={{ borderTop: '1px solid #2A3544', margin: '16px 0' }} />;
      }
      
      // Table rows
      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line.split('|').filter(c => c.trim());
        const isHeader = cells.every(c => c.trim().match(/^-+$/));
        if (isHeader) return null;
        return (
          <div key={i} style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
            gap: '8px',
            fontSize: '12px',
            padding: '6px 0',
            borderBottom: '1px solid #2A3544',
          }}>
            {cells.map((cell, ci) => (
              <span key={ci} style={{ color: ci === 0 ? '#E2E6F0' : '#9CA5B5' }}>
                {cell.trim()}
              </span>
            ))}
          </div>
        );
      }
      
      // Inline bold text
      if (line.includes('**')) {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <div key={i}>
            {parts.map((part, pi) => 
              part.startsWith('**') && part.endsWith('**') 
                ? <strong key={pi} style={{ color: '#E2E6F0' }}>{part.replace(/\*\*/g, '')}</strong>
                : <span key={pi}>{part}</span>
            )}
          </div>
        );
      }
      
      // Bullet points
      if (line.startsWith('- ')) {
        return <div key={i} style={{ paddingLeft: '8px' }}>• {line.slice(2)}</div>;
      }
      
      // Add source citations for data-heavy lines
      const shouldHaveSource = line.includes('%') || line.includes('units') || line.match(/\d{3,}/);
      const sourceLabels = ['SAP', 'Salesforce', 'internal', 'ML Model'];
      const randomSource = sourceLabels[i % sourceLabels.length];
      
      return (
        <div key={i} style={{ display: 'inline' }}>
          {line}
          {shouldHaveSource && line.length > 30 && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              marginLeft: '6px',
              padding: '2px 6px',
              backgroundColor: 'rgba(91, 158, 255, 0.1)',
              borderRadius: '4px',
              fontSize: '10px',
              color: '#5B9EFF',
              fontWeight: 500,
              verticalAlign: 'middle',
              cursor: 'pointer',
            }}>
              {randomSource}
            </span>
          )}
          {'\n'}
        </div>
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: isLast ? 0 : 0 }}
      style={{
        display: 'flex',
        alignItems: 'center',
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
      <div style={{ flex: 1, paddingTop: '10px' }}>
        {message.role === 'user' ? (
          // User message - simple text
          <div style={{ fontSize: '15px', color: '#E2E6F0', lineHeight: 1.6 }}>
            {message.content}
          </div>
        ) : message.isReportExport && message.reportData ? (
          // Report Export Message
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div style={{ 
              fontSize: '15px', 
              color: '#C5CDD8', 
              lineHeight: 1.7,
              marginBottom: '16px',
              whiteSpace: 'pre-wrap',
            }}>
              {renderContent(message.content.split('[REPORT_EXPORT]')[0])}
            </div>
            
            {/* Download Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                backgroundColor: '#1A222D',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'rgba(91, 158, 255, 0.15)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <FileText size={20} color="#5B9EFF" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#E6EAF1' }}>
                    {message.reportData.title}
                  </div>
                  <div style={{ fontSize: '11px', color: '#677C99' }}>
                    {message.reportData.filename}
                  </div>
                </div>
              </div>
              <motion.button
                onClick={() => {
                  const blob = new Blob([message.reportData!.content], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = message.reportData!.filename;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#5B9EFF',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Download size={14} />
                Download
              </motion.button>
            </motion.div>
          </motion.div>
        ) : (
          // Standard Assistant Message
          <div>
            {/* Text Content */}
            <div style={{ 
              fontSize: '15px', 
              color: '#C5CDD8', 
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}>
              {renderContent(message.content)}
            </div>
            
            {/* Sources Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <SiSap size={16} color="#0FAAFF" />
                  <SiSalesforce size={16} color="#00A1E0" />
                  <SiSnowflake size={16} color="#29B5E8" />
                  <FaFileExcel size={14} color="#217346" />
                  <Database size={14} color="#6366F1" />
                </div>
                <span style={{ fontSize: '12px', color: '#677C99' }}>5 sources</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              marginTop: '12px',
            }}>
              <button
                onClick={handleCopy}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.15s ease',
                  color: copied ? '#4ADE80' : '#677C99',
                  fontSize: '12px',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => { if (!copied) e.currentTarget.style.color = '#5B9EFF'; }}
                onMouseLeave={(e) => { if (!copied) e.currentTarget.style.color = '#677C99'; }}
              >
                {copied ? <><Check size={14} /><span>Copied</span></> : <><Copy size={14} /><span>Copy</span></>}
              </button>
              
              <button
                onClick={handleDownload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.15s ease',
                  color: '#677C99',
                  fontSize: '12px',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#5B9EFF'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#677C99'}
              >
                <Download size={14} />
                <span>Download</span>
              </button>
              
              {message.dataExport && (
                <button
                  onClick={handleDownloadCsv}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    backgroundColor: '#5B9EFF',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  <FileText size={14} />
                  <span>Download CSV</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
