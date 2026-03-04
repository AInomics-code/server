import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, PanelLeft } from 'lucide-react';
import { useTranslation } from '@/config/i18n';
import { logout, isAdmin, getUserName } from '@/utils/auth';

interface GlobalSidebarProps {
  activePage?: 'home' | 'data' | 'playground' | 'llm' | 'admin';
  onHomeClick?: () => void;
  onHistoryToggle?: () => void;
}

export function GlobalSidebar({ activePage, onHomeClick, onHistoryToggle }: GlobalSidebarProps) {
  const [, setLocation] = useLocation();
  const [isSidebarExpanded] = useState(false); // Keep state for layout but don't allow toggling
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
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100%',
        width: isSidebarExpanded ? '256px' : '55px',
        backgroundColor: '#32373F',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        transition: 'width 0.3s ease',
        zIndex: 50,
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        overflow: 'visible',
      }}
    >
      {/* Top Section - Logo & Toggle */}
      <div style={{ 
        padding: '0 12px', 
        marginBottom: '16px', 
        display: 'flex', 
        justifyContent: isSidebarExpanded ? 'flex-start' : 'center' 
      }}>
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            cursor: onHomeClick ? 'pointer' : 'default',
            transition: 'opacity 0.2s ease',
          }}
          onClick={onHomeClick}
          onMouseEnter={(e) => {
            if (onHomeClick) {
              e.currentTarget.style.opacity = '0.8';
            }
          }}
          onMouseLeave={(e) => {
            if (onHomeClick) {
              e.currentTarget.style.opacity = '1';
            }
          }}
        >
          {/* Burger Menu Icon */}
          <div 
            className="panel-left-icon-wrapper"
            style={{
              width: '36px',
              height: '36px',
              padding: '0',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '-4px',
              cursor: onHistoryToggle ? 'pointer' : 'default',
              backgroundColor: 'transparent',
              border: 'none',
              transition: 'background-color 0.2s ease',
              overflow: 'visible',
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (onHistoryToggle) {
                onHistoryToggle();
              }
            }}
            onMouseEnter={(e) => {
              if (onHistoryToggle) {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
              }
              const svg = e.currentTarget.querySelector('svg');
              if (svg) {
                svg.style.transform = 'scale(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (onHistoryToggle) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
              const svg = e.currentTarget.querySelector('svg');
              if (svg) {
                svg.style.transform = 'scale(1)';
              }
            }}
          >
            <PanelLeft size={24} strokeWidth={2} color="#9CA3AF" />
          </div>
          {isSidebarExpanded && (
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#5ca2f9', margin: 0 }}>
              Vorta
            </h2>
          )}
        </div>
      </div>

      {/* Navigation Icons */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0', alignItems: 'center', gap: '0', marginTop: '20px', position: 'relative' }}>

        {/* Plus Button - Circular with rotating animation */}
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: 'rgba(180, 190, 200, 0.2)',
            border: 'none',
            cursor: 'pointer',
            outline: 'none',
            transition: 'background-color 0.15s ease, transform 0.3s ease',
            position: 'relative',
            marginTop: '4px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(180, 190, 200, 0.35)';
            const icon = e.currentTarget.querySelector('svg') as HTMLElement;
            if (icon) {
              icon.style.transform = 'rotate(90deg)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(180, 190, 200, 0.2)';
            const icon = e.currentTarget.querySelector('svg') as HTMLElement;
            if (icon) {
              icon.style.transform = 'rotate(0deg)';
            }
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(180, 190, 200, 0.5)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(180, 190, 200, 0.35)';
          }}
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#FFFFFF" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ 
              transition: 'transform 0.3s ease',
              transform: 'rotate(0deg)',
            }}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* LLM - ENABLED */}
        <button 
          onClick={() => setLocation('/chat')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isSidebarExpanded ? '12px' : '0',
            padding: '0',
            borderRadius: '6px',
            backgroundColor: activePage === 'llm' ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            outline: 'none',
            position: 'relative',
            width: '36px',
            height: '36px',
            marginTop: '16px',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (activePage !== 'llm') {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
            }
            const svg = e.currentTarget.querySelector('svg');
            if (svg) {
              svg.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (activePage !== 'llm') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
            const svg = e.currentTarget.querySelector('svg');
            if (svg) {
              svg.style.transform = 'scale(1)';
            }
          }}
        >
          {/* Chat/LLM Icon - White with thin border, ball remains filled */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ overflow: 'visible', transition: 'transform 0.2s ease' }}>
            <path 
              d="M4 4h13a3 3 0 013 3v8a3 3 0 01-3 3h-6l-5 4v-4H4a3 3 0 01-3-3V7a3 3 0 013-3z" 
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="21" cy="3" r="5.5" fill="#32373F"/>
            <circle cx="21" cy="3" r="3.5" fill="#FFFFFF"/>
          </svg>
          {isSidebarExpanded && (
            <span style={{ fontSize: '14px', color: activePage === 'llm' ? 'rgba(92, 162, 249, 0.8)' : '#DCE7F5' }}>
              {t('sidebar.llm')}
            </span>
          )}
        </button>

        {/* Admin Users - visible only to admins */}
        {isAdmin() && (
          <button
            onClick={() => setLocation('/admin/users')}
            title="User Management"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isSidebarExpanded ? '12px' : '0',
              padding: '0',
              borderRadius: '6px',
              backgroundColor: activePage === 'admin' ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              outline: 'none',
              position: 'relative',
              width: '36px',
              height: '36px',
              marginTop: '12px',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (activePage !== 'admin') {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
              }
              const svg = e.currentTarget.querySelector('svg');
              if (svg) {
                svg.style.transform = 'scale(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (activePage !== 'admin') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
              const svg = e.currentTarget.querySelector('svg');
              if (svg) {
                svg.style.transform = 'scale(1)';
              }
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.5" style={{ overflow: 'visible', transition: 'transform 0.2s ease' }}>
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/>
              <path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            {isSidebarExpanded && (
              <span style={{ fontSize: '14px', color: activePage === 'admin' ? 'rgba(92, 162, 249, 0.8)' : '#DCE7F5' }}>
                Users
              </span>
            )}
          </button>
        )}
      </div>

      {/* Bottom Section - Settings, User, and Aragon */}
      <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 'auto', paddingBottom: '24px', position: 'relative', minHeight: '200px' }}>
        {/* Settings Icon with Dropdown Menu */}
        <div style={{ position: 'absolute', bottom: '45px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }} ref={settingsMenuRef}>
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0',
              borderRadius: '6px',
              backgroundColor: isSettingsOpen ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              outline: 'none',
              width: '36px',
              height: '36px',
              transition: 'background-color 0.2s ease, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              if (!isSettingsOpen) {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
              }
              const svg = e.currentTarget.querySelector('svg');
              if (svg) {
                svg.style.transform = 'rotate(90deg)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSettingsOpen) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
              const svg = e.currentTarget.querySelector('svg');
              if (svg) {
                svg.style.transform = 'rotate(0deg)';
              }
            }}
          >
            <svg 
              width="21" 
              height="21" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#FFFFFF"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.2s ease',
              }}
            >
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
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
                bottom: '-50px',
                left: '55px',
                backgroundColor: '#2F343B',
                borderRadius: '6px',
                border: 'none',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
                minWidth: '200px',
                padding: '6px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{
                padding: '8px 12px',
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
                backgroundColor: 'rgba(103, 124, 153, 0.15)',
                margin: '4px 0',
              }} />
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '4px',
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
        
        {/* User avatar - at bottom */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'absolute', bottom: '5px' }}>
          {(() => {
            const fullName = getUserName() || '';
            const parts = fullName.trim().split(' ').filter(Boolean);
            const initials = parts.length >= 2
              ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
              : (parts[0]?.[0] ?? 'U').toUpperCase();
            return (
              <div
                title={fullName || 'User'}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#3A4A5C',
                  border: '1px solid rgba(92,162,249,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'default',
                }}
              >
                <span style={{ color: '#5ca2f9', fontSize: '13px', fontWeight: 700 }}>{initials}</span>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// Hook to get sidebar width for layout offset
export function useSidebarWidth() {
  const [isSidebarExpanded] = useState(false);
  return isSidebarExpanded ? '256px' : '55px';
}

export default GlobalSidebar;