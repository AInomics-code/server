import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  listConversations,
  deleteConversation,
  renameConversation,
  ConversationSummary,
} from '@/services/conversationHistoryService';

// ─── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: '#272C33',
  bgHover: 'rgba(255,255,255,0.05)',
  bgActive: 'rgba(92,162,249,0.1)',
  border: 'rgba(103, 124, 153, 0.15)',
  accent: '#5ca2f9',
  text: '#D1D5DB',
  textMuted: '#9CA5B5',
  textDim: '#535964',
  danger: '#F87171',
  dangerDim: 'rgba(248, 113, 113, 0.1)',
};

export const HISTORY_SIDEBAR_WIDTH = 260;

// ─── Date grouping helpers ────────────────────────────────────────────────────
function getDateGroup(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'Last 7 days';
  if (diffDays <= 30) return 'Last 30 days';
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

function groupConversations(conversations: ConversationSummary[]): { label: string; items: ConversationSummary[] }[] {
  const groups: Map<string, ConversationSummary[]> = new Map();
  const order: string[] = [];

  for (const conv of conversations) {
    const ref = conv.last_message_at || conv.updated_at;
    const label = getDateGroup(ref);
    if (!groups.has(label)) {
      groups.set(label, []);
      order.push(label);
    }
    groups.get(label)!.push(conv);
  }

  return order.map((label) => ({ label, items: groups.get(label)! }));
}

// ─── Single conversation row ──────────────────────────────────────────────────
interface ConvRowProps {
  conv: ConversationSummary;
  isActive: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, newTitle: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function ConvRow({ conv, isActive, onSelect, onRename, onDelete }: ConvRowProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(conv.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) renameInputRef.current?.select();
  }, [isRenaming]);

  useEffect(() => {
    if (!menuOpen) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [menuOpen]);

  const handleRenameSubmit = async () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== conv.title) {
      await onRename(conv.conversation_id, trimmed);
    }
    setIsRenaming(false);
  };

  const title = conv.title || 'Untitled conversation';

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); }}
    >
      {isRenaming ? (
        <div style={{ padding: '4px 8px' }}>
          <input
            ref={renameInputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') { setIsRenaming(false); setRenameValue(conv.title); }
            }}
            onBlur={handleRenameSubmit}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: '6px',
              border: `1px solid ${C.accent}`,
              backgroundColor: 'rgba(92,162,249,0.1)',
              color: C.text,
              fontSize: '13px',
              fontFamily: '"Inter", sans-serif',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      ) : (
        <button
          onClick={() => onSelect(conv.conversation_id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            padding: '8px 10px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: isActive ? C.bgActive : isHovered ? C.bgHover : 'transparent',
            textAlign: 'left',
            gap: '8px',
            transition: 'background-color 0.1s ease',
          }}
        >
          <span style={{
            flex: 1,
            fontSize: '13px',
            color: isActive ? C.accent : C.text,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontFamily: '"Inter", sans-serif',
            fontWeight: isActive ? 500 : 400,
          }}>
            {title}
          </span>

          {/* Action buttons (visible on hover) */}
          {(isHovered || menuOpen) && (
            <div
              style={{ display: 'flex', gap: '2px', flexShrink: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Three-dot menu */}
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                  style={{
                    padding: '3px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: menuOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    color: C.textMuted,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={(e) => { if (!menuOpen) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                  </svg>
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.12 }}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '4px',
                        backgroundColor: '#1A222D',
                        borderRadius: '8px',
                        border: '1px solid rgba(103,124,153,0.2)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                        padding: '4px',
                        zIndex: 200,
                        minWidth: '152px',
                      }}
                    >
                      <button
                        onClick={() => { setMenuOpen(false); setIsRenaming(true); setRenameValue(conv.title); }}
                        style={menuItemStyle()}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Rename
                      </button>
                      <button
                        onClick={async () => { setMenuOpen(false); await onDelete(conv.conversation_id); }}
                        style={menuItemStyle(true)}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.dangerDim; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                        </svg>
                        Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </button>
      )}
    </div>
  );
}

function menuItemStyle(danger = false): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '8px 10px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: 'transparent',
    color: danger ? C.danger : C.text,
    fontSize: '13px',
    fontFamily: '"Inter", sans-serif',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color 0.1s ease',
  };
}

// ─── Main Sidebar Component ───────────────────────────────────────────────────
export interface ConversationHistorySidebarProps {
  isOpen: boolean;
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  refreshTrigger?: number;
}

export function ConversationHistorySidebar({
  isOpen,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  refreshTrigger = 0,
}: ConversationHistorySidebarProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { conversations: list } = await listConversations({ limit: 100 });
      setConversations(list);
    } catch {
      // silently fail — sidebar is non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  // Load when opened and on refresh trigger
  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load, refreshTrigger]);

  const handleRename = async (id: string, newTitle: string) => {
    await renameConversation(id, newTitle);
    setConversations((prev) =>
      prev.map((c) => (c.conversation_id === id ? { ...c, title: newTitle } : c))
    );
  };

  const handleDelete = async (id: string) => {
    await deleteConversation(id, true);
    setConversations((prev) => prev.filter((c) => c.conversation_id !== id));
    if (activeConversationId === id) onNewChat();
  };

  const filtered = search
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  const groups = groupConversations(filtered);

  return (
    <motion.div
      initial={false}
      animate={{ x: isOpen ? 0 : -HISTORY_SIDEBAR_WIDTH }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: 'fixed',
        left: 68,
        top: 0,
        height: '100%',
        width: HISTORY_SIDEBAR_WIDTH,
        backgroundColor: C.bg,
        borderRight: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
        fontFamily: '"Inter", -apple-system, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '20px 12px 12px', flexShrink: 0 }}>
        {/* New Chat button */}
        <button
          onClick={onNewChat}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            padding: '9px 12px',
            borderRadius: '8px',
            border: `1px solid rgba(92,162,249,0.25)`,
            backgroundColor: 'rgba(92,162,249,0.08)',
            color: C.accent,
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: '"Inter", sans-serif',
            transition: 'all 0.15s ease',
            marginBottom: '12px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(92,162,249,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(92,162,249,0.08)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Chat
        </button>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <svg
            width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke={C.textDim} strokeWidth="2.5"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            style={{
              width: '100%',
              padding: '8px 10px 8px 30px',
              borderRadius: '6px',
              border: `1px solid ${C.border}`,
              backgroundColor: 'rgba(15,19,23,0.4)',
              color: C.text,
              fontSize: '12px',
              fontFamily: '"Inter", sans-serif',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => { e.target.style.borderColor = C.accent; }}
            onBlur={(e) => { e.target.style.borderColor = C.border; }}
          />
        </div>
      </div>

      {/* Conversation list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px 4px' }}>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                style={{
                  height: '34px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  opacity: 1 - i * 0.12,
                }}
              />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div style={{
            padding: '32px 12px',
            textAlign: 'center',
            color: C.textDim,
            fontSize: '13px',
          }}>
            {search ? 'No results found' : 'No conversations yet'}
          </div>
        ) : (
          groups.map(({ label, items }) => (
            <div key={label} style={{ marginBottom: '8px' }}>
              <p style={{
                margin: '10px 4px 4px',
                fontSize: '11px',
                fontWeight: 600,
                color: C.textDim,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {label}
              </p>
              {items.map((conv) => (
                <ConvRow
                  key={conv.conversation_id}
                  conv={conv}
                  isActive={conv.conversation_id === activeConversationId}
                  onSelect={onSelectConversation}
                  onRename={handleRename}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Footer: refresh button */}
      <div style={{
        padding: '10px 12px',
        borderTop: `1px solid ${C.border}`,
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'flex-end',
      }}>
        <button
          onClick={load}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 10px',
            borderRadius: '5px',
            border: 'none',
            backgroundColor: 'transparent',
            color: C.textDim,
            fontSize: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: '"Inter", sans-serif',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = C.textMuted; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = C.textDim; }}
        >
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            style={loading ? { animation: 'spin 0.8s linear infinite' } : {}}
          >
            <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          Refresh
        </button>
      </div>
    </motion.div>
  );
}
