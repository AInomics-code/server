import { useState } from 'react';
import { useLocation } from 'wouter';
import { HelpCircle, Settings as SettingsIcon } from 'lucide-react';

interface GlobalSidebarProps {
  activePage?: 'home' | 'data' | 'playground' | 'llm';
}

export function GlobalSidebar({ activePage }: GlobalSidebarProps) {
  const [, setLocation] = useLocation();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  return (
    <div 
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100%',
        width: isSidebarExpanded ? '256px' : '64px',
        backgroundColor: '#202A37',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        transition: 'width 0.3s ease',
        zIndex: 50,
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* Top Section - Logo & Toggle */}
      <div style={{ 
        padding: '0 12px', 
        marginBottom: '16px', 
        display: 'flex', 
        justifyContent: isSidebarExpanded ? 'flex-start' : 'center' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            style={{
              padding: '10px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              outline: 'none',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(42, 58, 82, 0.6)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {/* Hamburger Icon */}
            <svg width="20" height="20" fill="none" stroke="#677C99" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          {isSidebarExpanded && (
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#DCE7F5', margin: 0 }}>
              Vorta
            </h2>
          )}
        </div>
      </div>

      {/* Divider after header */}
      <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.06)', marginBottom: '16px' }} />

      {/* Navigation Icons */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 12px', gap: '12px' }}>
        
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
            opacity: 0.4,
          }}
        >
          {/* Home Icon */}
          <svg width="20" height="20" fill="#677C99" viewBox="0 0 24 24">
            <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
            <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
          </svg>
          {isSidebarExpanded && (
            <span style={{ fontSize: '14px', color: '#677C99' }}>
              Home
            </span>
          )}
        </button>

        {/* LLM - ENABLED */}
        <button 
          onClick={() => setLocation('/llm-chat')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px',
            borderRadius: '6px',
            backgroundColor: activePage === 'llm' ? 'rgba(91, 158, 255, 0.12)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
            outline: 'none',
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
          {/* Chat/LLM Icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ overflow: 'visible' }}>
            <path d="M4 4h13a3 3 0 013 3v8a3 3 0 01-3 3h-6l-5 4v-4H4a3 3 0 01-3-3V7a3 3 0 013-3z" fill={activePage === 'llm' ? '#5B9EFF' : '#677C99'}/>
            <circle cx="21" cy="3" r="5.5" fill="#202A37"/>
            <circle cx="21" cy="3" r="3.5" fill={activePage === 'llm' ? '#5B9EFF' : '#677C99'}/>
          </svg>
          {isSidebarExpanded && (
            <span style={{ fontSize: '14px', color: activePage === 'llm' ? '#5B9EFF' : '#DCE7F5' }}>
              LLM
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
            opacity: 0.4,
          }}
        >
          {/* Grid Icon */}
          <svg width="20" height="20" fill="#677C99" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h2.25a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9.75 0a3 3 0 013-3H18a3 3 0 013 3v2.25a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6zM3 15.75a3 3 0 013-3h2.25a3 3 0 013 3V18a3 3 0 01-3 3H6a3 3 0 01-3-3v-2.25zm9.75 0a3 3 0 013-3H18a3 3 0 013 3V18a3 3 0 01-3 3h-2.25a3 3 0 01-3-3v-2.25z" clipRule="evenodd" />
          </svg>
          {isSidebarExpanded && (
            <span style={{ fontSize: '14px', color: '#677C99' }}>
              Playground
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
            opacity: 0.4,
          }}
        >
          {/* Database Icon */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <ellipse cx="12" cy="5" rx="9" ry="3" fill="#677C99"/>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" fill="#677C99"/>
            <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" fill="none" stroke="#202A37" strokeWidth="1.5"/>
            <path d="M3 8c0 1.66 4 3 9 3s9-1.34 9-3" fill="none" stroke="#202A37" strokeWidth="1.5"/>
            <path d="M3 16c0 1.66 4 3 9 3s9-1.34 9-3" fill="none" stroke="#202A37" strokeWidth="1.5"/>
          </svg>
          {isSidebarExpanded && (
            <span style={{ fontSize: '14px', color: '#677C99' }}>
              Data
            </span>
          )}
        </button>

        {/* Divider before Help */}
        <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.06)', margin: '24px -12px 12px -12px', width: 'calc(100% + 24px)' }} />

        {/* Help */}
        <button 
          onClick={() => console.log('Help clicked')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px',
            borderRadius: '6px',
            backgroundColor: 'transparent',
            border: '1px solid transparent',
            cursor: 'pointer',
            justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(91, 158, 255, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(91, 158, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <HelpCircle size={20} color="#5B9EFF" />
          {isSidebarExpanded && (
            <span style={{ fontSize: '14px', color: '#5B9EFF' }}>Help</span>
          )}
        </button>
      </div>

      {/* Bottom Section - Settings */}
      <div style={{ padding: '0 12px' }}>
        <button 
          onClick={() => console.log('Settings clicked')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px',
            borderRadius: '6px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
            outline: 'none',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(42, 58, 82, 0.6)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <SettingsIcon size={20} color="#677C99" />
          {isSidebarExpanded && (
            <span style={{ fontSize: '14px', color: '#DCE7F5' }}>Settings</span>
          )}
        </button>
      </div>
    </div>
  );
}

// Hook to get sidebar width for layout offset
export function useSidebarWidth() {
  const [isSidebarExpanded] = useState(false);
  return isSidebarExpanded ? '256px' : '64px';
}

export default GlobalSidebar;