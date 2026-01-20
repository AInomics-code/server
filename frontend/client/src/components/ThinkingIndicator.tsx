import { motion } from 'framer-motion';
import { SiSap, SiSalesforce, SiSnowflake } from 'react-icons/si';
import { FaFileExcel } from 'react-icons/fa';
import { Database } from 'lucide-react';

// Vorta Star Icon
const VortaStarIcon = ({ size = 24, color = '#5B9EFF' }: { size?: number; color?: string }) => (
  <span style={{ fontSize: size, color, filter: 'drop-shadow(0 0 8px rgba(91, 158, 255, 0.4))' }}>✱</span>
);

interface ThinkingIndicatorProps {
  question: string;
}

export function ThinkingIndicator({ question }: ThinkingIndicatorProps) {
  const q = question.toLowerCase();
  
  // Dynamic task description based on question
  const getTaskDescription = () => {
    if (q.includes('forecast') || q.includes('demand')) {
      return 'Analyzing demand patterns and generating forecast predictions.';
    }
    if (q.includes('sales') || q.includes('revenue')) {
      return 'Querying sales data and computing business metrics.';
    }
    if (q.includes('inventory') || q.includes('stock')) {
      return 'Checking inventory levels and supply chain data.';
    }
    if (q.includes('product')) {
      return 'Retrieving product information and performance data.';
    }
    return 'Processing your query and gathering relevant information.';
  };

  // Dynamic search queries based on question
  const getSearchQueries = () => {
    if (q.includes('forecast')) return ['historical demand patterns', 'seasonal trends', 'ML predictions'];
    if (q.includes('product')) return ['product catalog data', 'SKU performance', 'inventory levels'];
    if (q.includes('inventory')) return ['warehouse inventory levels', 'reorder points', 'stock movements'];
    return ['business metrics', 'sales records 2025', 'customer segments analysis'];
  };

  const dataSources = [
    { name: 'Atlantic Goods Sales Database', source: 'Snowflake', color: '#29B5E8', logoType: 'snowflake' },
    { name: 'Inventory Management System', source: 'SAP', color: '#0FAAFF', logoType: 'sap' },
    { name: 'Customer Analytics Platform', source: 'Salesforce', color: '#00A1E0', logoType: 'salesforce' },
    { name: 'Budget Spreadsheets', source: 'Excel', color: '#217346', logoType: 'excel' },
    { name: 'Demand Forecasting Model', source: 'Internal', color: '#6366F1', logoType: 'internal' },
  ];

  return (
    <motion.div
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
        backgroundColor: '#324053',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <VortaStarIcon size={24} color="#5B9EFF" />
      </div>
      
      <div style={{ flex: 1, paddingTop: '4px' }}>
        {/* Working Header with Spinner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5B9EFF" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
            </svg>
          </motion.div>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#E2E6F0' }}>Working...</span>
        </div>

        {/* Task Description */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '16px' }}
        >
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#5B9EFF',
            borderRadius: '50%',
            marginTop: '5px',
            flexShrink: 0,
          }} />
          <span style={{ fontSize: '14px', color: '#C5CDD8', lineHeight: 1.5 }}>
            {getTaskDescription()}
          </span>
        </motion.div>

        {/* Searching Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ marginBottom: '12px' }}
        >
          <span style={{ fontSize: '12px', color: '#677C99', marginBottom: '8px', display: 'block' }}>
            Searching
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {getSearchQueries().map((query, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#677C99" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                <span style={{ fontSize: '12px', color: '#9CA5B5' }}>{query}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Reviewing Sources Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <span style={{ fontSize: '12px', color: '#5B9EFF', marginBottom: '10px', display: 'block' }}>
            Reviewing sources · {dataSources.length}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {dataSources.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 + i * 0.12 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {item.logoType === 'sap' && <SiSap size={18} color={item.color} />}
                  {item.logoType === 'salesforce' && <SiSalesforce size={18} color={item.color} />}
                  {item.logoType === 'snowflake' && <SiSnowflake size={18} color={item.color} />}
                  {item.logoType === 'excel' && <FaFileExcel size={16} color={item.color} />}
                  {item.logoType === 'internal' && <Database size={16} color={item.color} />}
                  <span style={{ fontSize: '13px', color: '#C5CDD8' }}>{item.name}</span>
                </div>
                <span style={{ fontSize: '11px', color: item.color, fontWeight: 500 }}>{item.source}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
