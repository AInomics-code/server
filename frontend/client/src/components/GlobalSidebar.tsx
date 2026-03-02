import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useTranslation } from '@/config/i18n';
import { logout, isAdmin, getUserName } from '@/utils/auth';

interface GlobalSidebarProps {
  activePage?: 'home' | 'data' | 'playground' | 'llm' | 'admin';
  onHomeClick?: () => void;
}

export function GlobalSidebar({ activePage, onHomeClick }: GlobalSidebarProps) {
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
        width: isSidebarExpanded ? '256px' : '68px',
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
          {/* Aragon Star Logo */}
          <div style={{
            padding: '4px 10px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '-4px',
          }}>
            <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
              {/* Vertical line (0 degrees) */}
              <path 
                d="M32 8L32 56" 
                stroke="#5ca2f9" 
                strokeWidth="8" 
                strokeLinecap="square"
              />
              {/* Rotated 60 degrees */}
              <path 
                d="M52.78 20L11.22 44" 
                stroke="#5ca2f9" 
                strokeWidth="8" 
                strokeLinecap="square"
              />
              {/* Rotated 120 degrees */}
              <path 
                d="M11.22 20L52.78 44" 
                stroke="#5ca2f9" 
                strokeWidth="8" 
                strokeLinecap="square"
              />
            </svg>
          </div>
          {isSidebarExpanded && (
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#5ca2f9', margin: 0 }}>
              Vorta
            </h2>
          )}
        </div>
      </div>

      {/* Navigation Icons */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 12px', gap: '28px', marginTop: '16px', position: 'relative' }}>
        
        {/* Home - DISABLED */}
        <button 
          disabled
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px',
            borderRadius: '6px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'not-allowed',
            justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
            outline: 'none',
            opacity: 0.7,
          }}
        >
          {/* Home Icon */}
                      <svg width="21" height="21" fill="#535964" viewBox="0 0 24 24">
            <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
            <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
          </svg>
          {isSidebarExpanded && (
            <span style={{ fontSize: '14px', color: '#535964' }}>
              {t('sidebar.home')}
            </span>
          )}
        </button>

        {/* LLM - ENABLED */}
        <button 
          onClick={() => setLocation('/chat')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px',
            borderRadius: '6px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
            outline: 'none',
            position: 'relative',
            width: '100%',
          }}
          onMouseEnter={(e) => {
            if (activePage !== 'llm') {
              e.currentTarget.style.backgroundColor = 'rgba(42, 58, 82, 0.6)';
            }
          }}
          onMouseLeave={(e) => {
            if (activePage !== 'llm') {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {/* Chat/LLM Icon - Original Design */}
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" style={{ overflow: 'visible' }}>
            <path d="M4 4h13a3 3 0 013 3v8a3 3 0 01-3 3h-6l-5 4v-4H4a3 3 0 01-3-3V7a3 3 0 013-3z" fill={activePage === 'llm' ? 'rgba(92, 162, 249, 0.7)' : '#535964'}/>
            <circle cx="21" cy="3" r="5.5" fill="#32373F"/>
            <circle cx="21" cy="3" r="3.5" fill={activePage === 'llm' ? 'rgba(92, 162, 249, 0.7)' : '#535964'}/>
          </svg>
          {/* Active indicator line - vertical bar at the right edge of sidebar */}
          {activePage === 'llm' && (
            <div style={{
              position: 'absolute',
              right: '-12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '2.5px',
              height: '56px',
              backgroundColor: 'rgba(92, 162, 249, 0.6)',
              borderRadius: '1.5px 0 0 1.5px',
              zIndex: 100,
            }} />
          )}
          {isSidebarExpanded && (
            <span style={{ fontSize: '14px', color: activePage === 'llm' ? 'rgba(92, 162, 249, 0.8)' : '#DCE7F5' }}>
              {t('sidebar.llm')}
            </span>
          )}
        </button>

        {/* Playground - DISABLED */}
        <button 
          disabled
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px',
            borderRadius: '6px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'not-allowed',
            justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
            outline: 'none',
            opacity: 0.7,
          }}
        >
          {/* Grid Icon */}
                      <svg width="21" height="21" fill="#535964" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h2.25a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9.75 0a3 3 0 013-3H18a3 3 0 013 3v2.25a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6zM3 15.75a3 3 0 013-3h2.25a3 3 0 013 3V18a3 3 0 01-3 3H6a3 3 0 01-3-3v-2.25zm9.75 0a3 3 0 013-3H18a3 3 0 013 3V18a3 3 0 01-3 3h-2.25a3 3 0 01-3-3v-2.25z" clipRule="evenodd" />
          </svg>
          {isSidebarExpanded && (
            <span style={{ fontSize: '14px', color: '#535964' }}>
              {t('sidebar.playground')}
            </span>
          )}
        </button>

        {/* Data - DISABLED */}
        <button 
          disabled
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px',
            borderRadius: '6px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'not-allowed',
            justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
            outline: 'none',
            opacity: 0.7,
          }}
        >
          {/* Database Icon */}
                      <svg width="20" height="20" viewBox="0 0 24 24">
            <ellipse cx="12" cy="5" rx="9" ry="3" fill="#535964"/>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" fill="#535964"/>
            <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" fill="none" stroke="#32373F" strokeWidth="1.5"/>
            <path d="M3 8c0 1.66 4 3 9 3s9-1.34 9-3" fill="none" stroke="#32373F" strokeWidth="1.5"/>
            <path d="M3 16c0 1.66 4 3 9 3s9-1.34 9-3" fill="none" stroke="#32373F" strokeWidth="1.5"/>
          </svg>
          {isSidebarExpanded && (
            <span style={{ fontSize: '14px', color: '#535964' }}>
              {t('sidebar.data')}
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
              gap: '12px',
              padding: '10px',
              borderRadius: '6px',
              backgroundColor: activePage === 'admin' ? 'rgba(42, 58, 82, 0.6)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
              outline: 'none',
              position: 'relative',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              if (activePage !== 'admin') {
                e.currentTarget.style.backgroundColor = 'rgba(42, 58, 82, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              if (activePage !== 'admin') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={activePage === 'admin' ? 'rgba(92, 162, 249, 0.8)' : '#535964'} strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/>
              <path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            {activePage === 'admin' && (
              <div style={{
                position: 'absolute',
                right: '-12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '2.5px',
                height: '56px',
                backgroundColor: 'rgba(92, 162, 249, 0.6)',
                borderRadius: '1.5px 0 0 1.5px',
                zIndex: 100,
              }} />
            )}
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
        <div style={{ position: 'absolute', bottom: '70px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }} ref={settingsMenuRef}>
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '6px',
              backgroundColor: isSettingsOpen ? 'rgba(42, 58, 82, 0.6)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              if (!isSettingsOpen) {
                e.currentTarget.style.backgroundColor = 'rgba(42, 58, 82, 0.6)';
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
                bottom: '-50px',
                left: '68px',
                backgroundColor: '#1A222D',
                borderRadius: '6px',
                border: '1px solid rgba(103, 124, 153, 0.2)',
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
        
        {/* User avatar - At Very Bottom */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'absolute', bottom: '20px' }}>
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
  return isSidebarExpanded ? '256px' : '68px';
}

export default GlobalSidebar;