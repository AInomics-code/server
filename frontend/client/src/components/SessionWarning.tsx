import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface SessionWarningProps {
  onStaySignedIn: () => void;
  onSignOut: () => void;
  onClose: () => void;
}

export function SessionWarning({ onStaySignedIn, onSignOut, onClose }: SessionWarningProps) {
  const [countdown, setCountdown] = useState(30); // 30 seconds to decide

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto sign out if no action taken
          onSignOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onSignOut]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -20, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: -20, y: 20 }}
        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '100px', // Account for sidebar width (76px) + padding
          backgroundColor: '#1A222D',
          border: '1px solid rgba(248, 113, 113, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          minWidth: '280px',
          maxWidth: '320px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          zIndex: 10000,
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="#F87171" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#F87171' }}>
              Session Expiring
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '4px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={16} color="#9CA5B5" />
          </button>
        </div>

        {/* Message */}
        <p style={{ 
          fontSize: '13px', 
          color: '#DCE7F5', 
          margin: '0 0 16px 0',
          lineHeight: '1.5',
        }}>
          You've been inactive for 2 hours. Do you want to stay signed in?
        </p>

        {/* Countdown */}
        <div style={{ 
          fontSize: '12px', 
          color: '#9CA5B5', 
          marginBottom: '16px',
          fontStyle: 'italic',
        }}>
          Auto sign out in {countdown} seconds
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onSignOut}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(248, 113, 113, 0.4)',
              borderRadius: '6px',
              color: '#F87171',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.4)';
            }}
          >
            Sign Out
          </button>
          <button
            onClick={onStaySignedIn}
            style={{
              padding: '8px 16px',
              backgroundColor: '#5B9EFF',
              border: 'none',
              borderRadius: '6px',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4A8EE8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#5B9EFF';
            }}
          >
            Stay Signed In
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
