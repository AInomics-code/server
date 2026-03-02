import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon, LogOut, Plus, Search, Briefcase } from 'lucide-react';
import { useTranslation } from '@/config/i18n';
import { logout } from '@/utils/auth';

interface DemoGlobalSidebarProps {
  activePage?: 'home' | 'data' | 'playground' | 'llm';
  onHomeClick?: () => void;
  onToggleSidebar?: () => void;
  isCompact?: boolean;
  isExpanded?: boolean;
}

/**
 * DEMO GLOBAL SIDEBAR - Isolated version for demo page only
 * Changes here will NOT affect the main LLM page
 */
export function DemoGlobalSidebar({ activePage, onHomeClick, onToggleSidebar, isCompact = false, isExpanded = false }: DemoGlobalSidebarProps) {
  const [, setLocation] = useLocation();
  const [isSidebarExpanded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Close settings menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };

    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsOpen]);

  const handleLogout = () => {
    logout();
  };

  return (
    <div 
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        overflow: 'visible',
      }}
    >
      {/* Top Section - Toggle Icon (only visible in collapsed state) */}
      {!isExpanded && (
        <div style={{ 
          padding: '0 12px', 
          marginBottom: '16px', 
          marginTop: '-16px',
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {/* Sidebar/Layout Icon - centered in rail when collapsed */}
          <div
            onClick={onToggleSidebar}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="20" height="16" viewBox="0 0 18 14" fill="none">
              {/* Main container outline */}
              <rect 
                x="1" 
                y="1" 
                width="16" 
                height="12" 
                rx="2" 
                stroke="#6B7280" 
                strokeWidth="0.8"
                fill="none"
              />
              {/* Left sidebar section - balanced width */}
              <rect 
                x="1.5" 
                y="1.5" 
                width="5.5" 
                height="11" 
                rx="1.5" 
                stroke="#6B7280" 
                strokeWidth="0.8"
                fill="none"
              />
              {/* Vertical divider line - clean and linear */}
              <line 
                x1="7" 
                y1="1.5" 
                x2="7" 
                y2="12.5" 
                stroke="#6B7280" 
                strokeWidth="0.8"
                strokeLinecap="round"
              />
              {/* Right content section outline */}
              <rect 
                x="7.5" 
                y="1.5" 
                width="9" 
                height="11" 
                rx="1.5" 
                stroke="#6B7280" 
                strokeWidth="0.8"
                fill="none"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Navigation Icons */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 12px', marginTop: '16px', position: 'relative', gap: '0px', alignItems: 'center' }}>
        
        {/* Plus Icon - Circular Button */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '36px',
          height: '52px',
          flexShrink: 0,
        }}>
          <button 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#3A3F47',
              border: 'none',
              cursor: 'pointer',
              outline: 'none',
              padding: 0,
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#424750';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3A3F47';
            }}
          >
            <Plus size={18} color="#AFB6C0" strokeWidth={2} />
          </button>
        </div>

        {/* Search Icon */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '36px',
          height: '52px',
          flexShrink: 0,
        }}>
          <button 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              padding: '6px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              outline: 'none',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Search
              size={18}
              color="#FFFFFF"
              strokeWidth={1.5}
              style={{ width: 18, height: 18 }}
            />
          </button>
        </div>

        {/* Briefcase Icon */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '36px',
          height: '52px',
          flexShrink: 0,
        }}>
          <button 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              padding: '6px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              outline: 'none',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Briefcase
              size={18}
              color="#FFFFFF"
              strokeWidth={1.5}
              style={{ width: 18, height: 18 }}
            />
          </button>
        </div>
      </div>

      {/* Bottom Section - Settings, User */}
      <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 'auto', paddingBottom: '24px', position: 'relative', minHeight: '200px' }}>
        {/* Settings Icon with Dropdown Menu */}
        <div style={{ position: 'absolute', bottom: '44px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }} ref={settingsMenuRef}>
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '6px',
              backgroundColor: isSettingsOpen ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              if (!isSettingsOpen) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSettingsOpen) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill={isSettingsOpen ? '#FFFFFF' : '#535964'}>
              <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.4-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
            </svg>
          </button>

          {/* Settings Dropdown Menu */}
          <AnimatePresence>
          {isSettingsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              style={{
                position: 'absolute',
                top: '16px',
                left: '60px',
                backgroundColor: '#2F343B',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)',
                minWidth: '200px',
                padding: '8px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{
                padding: '8px 12px 6px 12px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#9CA5B5',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontFamily: '"Inter", sans-serif',
              }}>
                Settings
              </div>
              <div style={{
                height: '1px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                margin: '2px 0',
              }} />
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#F87171',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: '"Inter", sans-serif',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.12)';
                  e.currentTarget.style.color = '#EF4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#F87171';
                }}
              >
                <LogOut size={16} strokeWidth={2.2} />
                <span>Logout</span>
              </button>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
        
        {/* User Circle with U - At Very Bottom */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'absolute', bottom: '-8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#535964',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <span style={{
              color: '#202A37',
              fontSize: '14px',
              fontWeight: 600,
            }}>U</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DemoGlobalSidebar;
