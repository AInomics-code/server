import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

interface LLMMarkdownRendererProps {
  content: string;
}

/**
 * Markdown renderer for LLM chat responses
 * Follows the API documentation format with proper styling
 */
export function LLMMarkdownRenderer({ content }: LLMMarkdownRendererProps) {
  return (
    <div style={{ 
      fontSize: '15px', 
      color: '#C5CDD8', 
      lineHeight: 1.6,
      marginTop: '0',
      paddingTop: '0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
    }}>
      <style>{`
        .llm-markdown-content > *:first-child {
          margin-top: 0 !important;
          padding-top: 0 !important;
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
        }
        .llm-markdown-content blockquote {
          border-left: 3px solid rgba(95, 102, 114, 0.3) !important;
        }
        .llm-markdown-content * {
          border-left-color: rgba(95, 102, 114, 0.3) !important;
        }
      `}</style>
      <div className="llm-markdown-content" style={{ width: '100%', marginTop: '0', paddingTop: '0', lineHeight: '1.5', display: 'flex', flexDirection: 'column' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headers
          h1: ({ children, node }) => {
            const isFirst = node?.position?.start?.line === 1;
            return (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  fontSize: '17px',
                  fontWeight: 600,
                  color: '#E6EAF1',
                  lineHeight: 1.5,
                  marginTop: isFirst ? '0' : '24px',
                  marginBottom: '16px',
                  paddingTop: '0',
                }}
              >
                {children}
              </motion.div>
            );
          },
          h2: ({ children, node }) => {
            const isFirst = node?.position?.start?.line === 1;
            return (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  fontSize: '17px',
                  fontWeight: 600,
                  color: '#E6EAF1',
                  lineHeight: 1.5,
                  marginTop: isFirst ? '0' : '24px',
                  marginBottom: '16px',
                  paddingTop: isFirst ? '0' : '0',
                }}
              >
                {children}
              </motion.div>
            );
          },
          h3: ({ children, node }) => {
            const isFirst = node?.position?.start?.line === 1;
            return (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  fontSize: '12px',
                  color: '#9CA5B5',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  marginTop: isFirst ? '0' : '20px',
                  marginBottom: '12px',
                }}
              >
                {children}
              </motion.div>
            );
          },
          
          // Paragraphs
          p: ({ children }) => (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                marginTop: '8px',
                marginBottom: '8px',
                lineHeight: 1.7,
                fontSize: '15px',
                color: '#C5CDD8',
              }}
            >
              {children}
            </motion.div>
          ),
          
          // Bold text
          strong: ({ children }) => {
            const text = String(children);
            // Check if it's a number/currency value
            const isNumber = /^\$?(?:\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+\.\d+|\b\d{4,}\b)[KMB]?$|^\d+%$/gi.test(text) && 
                           !/^[A-Z]\d+$/i.test(text);
            
            if (isNumber) {
              return (
                <span style={{ 
                  color: '#5B9EFF', 
                  fontWeight: 500,
                  fontSize: '15px',
                  display: 'inline-block',
                  padding: '2px 4px',
                  backgroundColor: 'rgba(91, 158, 255, 0.06)',
                  borderRadius: '3px',
                  margin: '0 1px',
                }}>
                  {children}
                </span>
              );
            }
            
            return (
              <strong style={{ 
                color: '#E6EAF1', 
                fontWeight: 600,
                fontSize: '15px',
              }}>
                {children}
              </strong>
            );
          },
          
          // Lists
          ul: ({ children }) => (
            <motion.ul
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                listStyle: 'none',
                paddingLeft: '20px',
                marginTop: '10px',
                marginBottom: '8px',
              }}
            >
              {children}
            </motion.ul>
          ),
          ol: ({ children }) => (
            <motion.ol
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                paddingLeft: '20px',
                marginTop: '10px',
                marginBottom: '8px',
              }}
            >
              {children}
            </motion.ol>
          ),
          li: ({ children }) => (
            <li style={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: '#C5CDD8',
              marginBottom: '6px',
              paddingLeft: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}>
              <span style={{ 
                color: '#677C99', 
                fontSize: '12px',
                marginTop: '2px',
                flexShrink: 0,
              }}>
                •
              </span>
              <span style={{ flex: 1 }}>
                {children}
              </span>
            </li>
          ),
          
          // Tables (from remark-gfm)
          table: ({ children }) => (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                marginTop: '16px',
                marginBottom: '16px',
                overflowX: 'auto',
              }}
            >
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                overflow: 'hidden',
              }}>
                {children}
              </table>
            </motion.div>
          ),
          thead: ({ children }) => (
            <thead style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
            }}>
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody>
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr style={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            }}>
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              fontSize: '13px',
              fontWeight: 600,
              color: '#9CA5B5',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
            }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td style={{
              padding: '12px 16px',
              fontSize: '15px',
              color: '#C5CDD8',
            }}>
              {children}
            </td>
          ),
          
          // Code
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  color: '#5B9EFF',
                }}>
                  {children}
                </code>
              );
            }
            return (
              <code className={className} style={{
                display: 'block',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#C5CDD8',
                overflowX: 'auto',
                marginTop: '12px',
                marginBottom: '12px',
              }}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'monospace',
              color: '#C5CDD8',
              overflowX: 'auto',
              marginTop: '12px',
              marginBottom: '12px',
              border: '1px solid rgba(255, 255, 255, 0.04)',
            }}>
              {children}
            </pre>
          ),
          
          // Blockquote
          blockquote: ({ children }) => (
            <motion.blockquote
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                borderLeft: '3px solid rgba(95, 102, 114, 0.3)',
                paddingLeft: '16px',
                marginTop: '16px',
                marginBottom: '16px',
                fontStyle: 'italic',
                color: '#9CA5B5',
              }}
            >
              {children}
            </motion.blockquote>
          ),
          
          // Horizontal rule
          hr: () => (
            <div style={{
              height: '1px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              marginTop: '24px',
              marginBottom: '20px',
            }} />
          ),
          
          // Links - Custom styling for download links
          a: ({ children, href, node }) => {
            const linkText = String(children).toLowerCase();
            const isDownloadLink = linkText.includes('download') && (linkText.includes('excel') || linkText.includes('report') || href?.includes('excel') || href?.includes('download'));
            
            if (isDownloadLink) {
              return (
                <motion.a
                  href={href}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 16px',
                    backgroundColor: '#2F343B',
                    borderRadius: '8px',
                    border: 'none',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    marginTop: '12px',
                    marginBottom: '12px',
                    width: 'fit-content',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#3A4149';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#2F343B';
                  }}
                >
                  <FileText size={18} color="#33C481" strokeWidth={2} />
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#E6EAF1',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    {children}
                  </span>
                </motion.a>
              );
            }
            
            // Default link styling
            return (
              <a
                href={href}
                style={{
                  color: '#5B9EFF',
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(91, 158, 255, 0.3)',
                  transition: 'border-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderBottomColor = 'rgba(91, 158, 255, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderBottomColor = 'rgba(91, 158, 255, 0.3)';
                }}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
      </div>
    </div>
  );
}
