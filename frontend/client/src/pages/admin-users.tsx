import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { GlobalSidebar } from '@/components/GlobalSidebar';
import { getUserEmail } from '@/utils/auth';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  User,
  UserCreatePayload,
  UserUpdatePayload,
} from '@/services/userManagementService';

// ─── Color tokens (consistent with the rest of the app) ──────────────────────
const C = {
  bg: '#1F2227',
  surface: '#32373F',
  surfaceHover: '#3B4149',
  input: '#2F343B',
  border: 'rgba(103, 124, 153, 0.2)',
  accent: '#5ca2f9',
  accentDim: 'rgba(92, 162, 249, 0.12)',
  text: '#D1D5DB',
  textMuted: '#9CA5B5',
  textDim: '#535964',
  danger: '#F87171',
  dangerDim: 'rgba(248, 113, 113, 0.12)',
  success: '#4ADE80',
  successDim: 'rgba(74, 222, 128, 0.12)',
  shadow: '0 8px 32px rgba(0,0,0,0.4)',
};

// ─── Toast ────────────────────────────────────────────────────────────────────
interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error';
}

function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const counter = useRef(0);

  const show = (message: string, type: 'success' | 'error') => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  return { toasts, showSuccess: (m: string) => show(m, 'success'), showError: (m: string) => show(m, 'error') };
}

function ToastStack({ toasts }: { toasts: ToastState[] }) {
  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              padding: '12px 18px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: '"Inter", sans-serif',
              color: t.type === 'success' ? C.success : C.danger,
              backgroundColor: t.type === 'success' ? C.successDim : C.dangerDim,
              border: `1px solid ${t.type === 'success' ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
              backdropFilter: 'blur(8px)',
              minWidth: '260px',
              boxShadow: C.shadow,
            }}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── User Form Modal ──────────────────────────────────────────────────────────
interface UserFormProps {
  mode: 'create' | 'edit';
  initial?: User | null;
  onClose: () => void;
  onSave: (data: UserCreatePayload | UserUpdatePayload) => Promise<void>;
  loading: boolean;
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '6px',
  border: `1px solid ${C.border}`,
  backgroundColor: C.input,
  color: C.text,
  fontSize: '14px',
  fontFamily: '"Inter", sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s ease',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: C.textMuted,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '6px',
  fontFamily: '"Inter", sans-serif',
};

function UserFormModal({ mode, initial, onClose, onSave, loading }: UserFormProps) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    last_name: initial?.last_name ?? '',
    email: initial?.email ?? '',
    password: '',
    admin: initial?.admin ?? false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.last_name.trim()) e.last_name = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (mode === 'create') {
      if (!form.password) e.password = 'Required';
      else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    } else if (form.password && form.password.length < 8) {
      e.password = 'Minimum 8 characters';
    }
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const payload: UserCreatePayload | UserUpdatePayload = {
      name: form.name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      admin: form.admin,
      ...(form.password ? { password: form.password } : {}),
    };
    await onSave(payload);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        backgroundColor: 'rgba(15,19,23,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        style={{
          backgroundColor: C.surface,
          borderRadius: '12px',
          border: `1px solid ${C.border}`,
          width: '460px',
          maxWidth: '90vw',
          boxShadow: C.shadow,
          fontFamily: '"Inter", sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: C.text }}>
            {mode === 'create' ? 'New User' : 'Edit User'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textDim, padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Name row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={LABEL_STYLE}>First Name</label>
              <input
                style={{ ...INPUT_STYLE, borderColor: errors.name ? C.danger : C.border }}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                onFocus={(e) => { e.target.style.borderColor = C.accent; }}
                onBlur={(e) => { e.target.style.borderColor = errors.name ? C.danger : C.border; }}
                placeholder="John"
              />
              {errors.name && <p style={{ margin: '4px 0 0', fontSize: '12px', color: C.danger }}>{errors.name}</p>}
            </div>
            <div>
              <label style={LABEL_STYLE}>Last Name</label>
              <input
                style={{ ...INPUT_STYLE, borderColor: errors.last_name ? C.danger : C.border }}
                value={form.last_name}
                onChange={(e) => set('last_name', e.target.value)}
                onFocus={(e) => { e.target.style.borderColor = C.accent; }}
                onBlur={(e) => { e.target.style.borderColor = errors.last_name ? C.danger : C.border; }}
                placeholder="Doe"
              />
              {errors.last_name && <p style={{ margin: '4px 0 0', fontSize: '12px', color: C.danger }}>{errors.last_name}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={LABEL_STYLE}>Email</label>
            <input
              type="email"
              style={{ ...INPUT_STYLE, borderColor: errors.email ? C.danger : C.border }}
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              onFocus={(e) => { e.target.style.borderColor = C.accent; }}
              onBlur={(e) => { e.target.style.borderColor = errors.email ? C.danger : C.border; }}
              placeholder="john@example.com"
            />
            {errors.email && <p style={{ margin: '4px 0 0', fontSize: '12px', color: C.danger }}>{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label style={LABEL_STYLE}>{mode === 'edit' ? 'New Password (leave blank to keep)' : 'Password'}</label>
            <input
              type="password"
              style={{ ...INPUT_STYLE, borderColor: errors.password ? C.danger : C.border }}
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              onFocus={(e) => { e.target.style.borderColor = C.accent; }}
              onBlur={(e) => { e.target.style.borderColor = errors.password ? C.danger : C.border; }}
              placeholder="••••••••"
            />
            {errors.password && <p style={{ margin: '4px 0 0', fontSize: '12px', color: C.danger }}>{errors.password}</p>}
          </div>

          {/* Admin toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '8px', backgroundColor: C.input, border: `1px solid ${C.border}` }}>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: C.text }}>Administrator</p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: C.textMuted }}>Can manage users and settings</p>
            </div>
            <button
              onClick={() => set('admin', !form.admin)}
              style={{
                width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                backgroundColor: form.admin ? C.accent : C.textDim,
                position: 'relative', transition: 'background-color 0.2s ease', flexShrink: 0,
              }}
            >
              <span style={{
                position: 'absolute', top: '3px', left: form.admin ? '23px' : '3px',
                width: '18px', height: '18px', borderRadius: '50%',
                backgroundColor: '#fff', transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 18px', borderRadius: '6px', border: `1px solid ${C.border}`,
              backgroundColor: 'transparent', color: C.textMuted, fontSize: '14px',
              fontWeight: 500, cursor: 'pointer', fontFamily: '"Inter", sans-serif',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: '9px 22px', borderRadius: '6px', border: 'none',
              backgroundColor: loading ? C.textDim : C.accent,
              color: loading ? C.textMuted : '#fff', fontSize: '14px',
              fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: '"Inter", sans-serif', transition: 'background-color 0.15s ease',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            {loading && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 0.8s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            )}
            {mode === 'create' ? 'Create User' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
function ConfirmDeleteModal({ user, onClose, onConfirm, loading }: { user: User; onClose: () => void; onConfirm: () => Promise<void>; loading: boolean }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        backgroundColor: 'rgba(15,19,23,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ duration: 0.2 }}
        style={{
          backgroundColor: C.surface, borderRadius: '12px',
          border: `1px solid ${C.border}`, width: '400px', maxWidth: '90vw',
          boxShadow: C.shadow, fontFamily: '"Inter", sans-serif', padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: C.dangerDim, border: `1px solid rgba(248,113,113,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="2.5">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
          </div>
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600, color: C.text }}>Delete User</h3>
            <p style={{ margin: 0, fontSize: '14px', color: C.textMuted, lineHeight: '1.5' }}>
              Are you sure you want to delete <strong style={{ color: C.text }}>{user.name} {user.last_name}</strong>? This action cannot be undone.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 18px', borderRadius: '6px', border: `1px solid ${C.border}`,
              backgroundColor: 'transparent', color: C.textMuted, fontSize: '14px',
              fontWeight: 500, cursor: 'pointer', fontFamily: '"Inter", sans-serif',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '9px 22px', borderRadius: '6px', border: 'none',
              backgroundColor: loading ? C.textDim : '#DC2626',
              color: '#fff', fontSize: '14px', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: '"Inter", sans-serif',
              transition: 'background-color 0.15s ease', display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            {loading && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 0.8s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            )}
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Avatar initials ──────────────────────────────────────────────────────────
function UserAvatar({ name, lastName }: { name: string; lastName: string }) {
  const initial = name.charAt(0).toUpperCase();
  const hue = (name.charCodeAt(0) * 37) % 360;
  return (
    <div style={{
      width: '36px', height: '36px', borderRadius: '50%',
      backgroundColor: `hsl(${hue}, 50%, 45%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '14px', fontWeight: 600, color: '#fff',
      flexShrink: 0,
    }}>
      {initial}
    </div>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────
function RoleBadge({ admin }: { admin: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600,
      backgroundColor: admin ? C.accentDim : 'rgba(103,124,153,0.12)',
      color: admin ? C.accent : C.textMuted,
      border: `1px solid ${admin ? 'rgba(92,162,249,0.25)' : 'rgba(103,124,153,0.2)'}`,
      fontFamily: '"Inter", sans-serif',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }}>
      {admin ? (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/></svg>
      )}
      {admin ? 'Admin' : 'User'}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'board' | 'list'>('table');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);
  const moreOptionsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const { toasts, showSuccess, showError } = useToast();

  const loadUsers = async () => {
    setLoadingList(true);
    setError(null);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load users');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  // Close more options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(event.target as Node)) {
        setIsMoreOptionsOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        if (!searchInputRef.current?.value) {
          setIsSearchOpen(false);
        }
      }
    };

    if (isMoreOptionsOpen || isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreOptionsOpen, isSearchOpen]);

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      `${u.name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole =
      filterRole === 'all' ||
      (filterRole === 'admin' ? u.admin : !u.admin);
    return matchSearch && matchRole;
  });

  const handleCreate = async (payload: any) => {
    setActionLoading(true);
    try {
      await createUser(payload);
      showSuccess('User created successfully');
      setModalMode(null);
      await loadUsers();
    } catch (e: any) {
      showError(e.message || 'Failed to create user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (payload: any) => {
    if (!editingUser) return;
    setActionLoading(true);
    try {
      await updateUser(editingUser.user_id, payload);
      showSuccess('User updated successfully');
      setModalMode(null);
      setEditingUser(null);
      await loadUsers();
    } catch (e: any) {
      showError(e.message || 'Failed to update user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setActionLoading(true);
    try {
      await deleteUser(deletingUser.user_id);
      showSuccess('User deleted');
      setDeletingUser(null);
      await loadUsers();
    } catch (e: any) {
      showError(e.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(103,124,153,0.3); border-radius: 3px; }
      `}</style>

      <GlobalSidebar activePage="admin" onHomeClick={() => setLocation('/chat')} />

      <div style={{
        marginLeft: '55px',
        minHeight: '100vh',
        backgroundColor: C.bg,
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      }}>
        {/* Page Header */}
        <div style={{
          borderBottom: `1px solid rgba(103, 124, 153, 0.1)`,
        }}>
          {/* Main Header Section */}
          <div style={{
            padding: '20px 40px 12px 40px',
          }}>
            {/* Top Row: Title and Actions */}
            <div style={{
          display: 'flex',
              alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
              marginBottom: '2px',
        }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => setLocation('/chat')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: C.textMuted,
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    fontFamily: '"Inter", sans-serif',
                    transition: 'all 0.2s ease',
                    alignSelf: 'flex-start',
                    marginLeft: '-14px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = C.text;
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = C.textMuted;
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                  <span>Back to Chat</span>
              </button>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 500, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>User Management</h1>
            </div>
          </div>
            
            {/* Category Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '-2px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 0',
                cursor: 'pointer',
              }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: C.accent }}>Active user licenses</span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '32px',
                  height: '20px',
                  padding: '0 8px',
                  borderRadius: '12px',
                  backgroundColor: C.accent,
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                }}>
                  {users.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ padding: '20px 40px 10px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          {/* Left Side: View Toggles */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {(['table', 'board', 'list'] as const).map((mode) => (
          <button
                key={mode}
                onClick={() => setViewMode(mode)}
            style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: viewMode === mode ? `1px solid ${C.border}` : 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
              fontFamily: '"Inter", sans-serif',
                  backgroundColor: viewMode === mode ? C.surface : 'transparent',
                  color: viewMode === mode ? C.text : C.textMuted,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (viewMode !== mode) {
                    e.currentTarget.style.color = C.text;
                  }
                }}
                onMouseLeave={(e) => {
                  if (viewMode !== mode) {
                    e.currentTarget.style.color = C.textMuted;
                  }
                }}
              >
                {mode === 'table' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                    <rect x="14" y="14" width="7" height="7" rx="1"/>
                  </svg>
                )}
                {mode === 'board' && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {/* Clean kanban board: outline + 3 columns (no tiny cards at 14px) */}
                    <rect x="3" y="5" width="18" height="14" rx="3" />
                    <line x1="9" y1="7" x2="9" y2="17" />
                    <line x1="15" y1="7" x2="15" y2="17" />
                  </svg>
                )}
                {mode === 'list' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="8" y1="6" x2="21" y2="6"/>
                    <line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/>
                    <line x1="3" y1="12" x2="3.01" y2="12"/>
                    <line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                )}
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
            ))}
        </div>

          {/* Right Side: Actions */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {/* Search */}
            {isSearchOpen ? (
              <div ref={searchContainerRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" style={{ position: 'absolute', left: '12px', pointerEvents: 'none', zIndex: 1 }}>
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
                  ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search"
                  autoFocus
              style={{
                    padding: '8px 14px 8px 36px',
                    borderRadius: '6px',
                    border: `1px solid ${C.border}`,
                    backgroundColor: 'transparent',
                    color: C.text,
                    fontSize: '13px',
                    fontFamily: '"Inter", sans-serif',
                    width: '200px',
                    height: '36px',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = C.accent;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = C.border;
                  }}
            />
          </div>
            ) : (
              <button
                onClick={() => {
                  setIsSearchOpen(true);
                  setTimeout(() => searchInputRef.current?.focus(), 0);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: C.textMuted,
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: '"Inter", sans-serif',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = C.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = C.textMuted;
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                Search
              </button>
            )}

            {/* Hide - Toggle column visibility */}
              <button
                onClick={() => {
                  // Toggle visibility of less important columns (Joined, Active)
                  const columnsToToggle = ['Joined', 'Active'];
                  const newHidden = new Set(hiddenColumns);
                  const allHidden = columnsToToggle.every(col => newHidden.has(col));
                  
                  if (allHidden) {
                    columnsToToggle.forEach(col => newHidden.delete(col));
                  } else {
                    columnsToToggle.forEach(col => newHidden.add(col));
                  }
                  
                  setHiddenColumns(newHidden);
                  showSuccess(allHidden ? 'Columns shown' : 'Columns hidden');
                }}
                style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(156, 165, 181, 0.3)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                color: C.textMuted,
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: '"Inter", sans-serif',
                  transition: 'all 0.15s ease',
                }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M3 12h18M3 18h18"/>
                <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
                <circle cx="6" cy="12" r="1.5" fill="currentColor"/>
                <circle cx="6" cy="18" r="1.5" fill="currentColor"/>
              </svg>
              Hide
              </button>

            {/* More Options (three dots) */}
            <div ref={moreOptionsRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setIsMoreOptionsOpen(!isMoreOptionsOpen)}
                style={{
                  width: '36px',
                  height: '32px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: C.textMuted,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = C.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = C.textMuted;
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="19" cy="12" r="1"/>
                  <circle cx="5" cy="12" r="1"/>
                </svg>
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isMoreOptionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                    style={{
                      position: 'absolute',
                      top: '44px',
                      right: '0',
                      backgroundColor: C.surface,
                      borderRadius: '8px',
                      border: `1px solid ${C.border}`,
                      boxShadow: C.shadow,
                      minWidth: '200px',
                      padding: '8px',
                      zIndex: 1000,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <button
                      onClick={() => {
                        const csv = [
                          ['Name', 'Email', 'User Type', 'Joined'],
                          ...users.map(u => [
                            `${u.name} ${u.last_name}`,
                            u.email,
                            u.admin ? 'Admin' : 'User',
                            formatDate(u.created_at)
                          ])
                        ].map(row => row.join(',')).join('\n');
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
                        a.click();
                        window.URL.revokeObjectURL(url);
                        setIsMoreOptionsOpen(false);
                        showSuccess('Users exported successfully');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: C.text,
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: '"Inter", sans-serif',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      <span>Export users</span>
                    </button>
                    <div style={{
                      height: '1px',
                      backgroundColor: C.border,
                      margin: '4px 0',
                    }} />
                    <button
                      onClick={() => {
                        loadUsers();
                        setIsMoreOptionsOpen(false);
                        showSuccess('Users refreshed');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: C.text,
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: '"Inter", sans-serif',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M23 4v6h-6"/>
                        <path d="M1 20v-6h6"/>
                        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                      </svg>
                      <span>Refresh</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
          </div>

            {/* Export */}
          <button
              onClick={() => {
                const csv = [
                  ['Name', 'Email', 'User Type', 'Joined'],
                  ...users.map(u => [
                    `${u.name} ${u.last_name}`,
                    u.email,
                    u.admin ? 'Admin' : 'User',
                    formatDate(u.created_at)
                  ])
                ].map(row => row.join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
                showSuccess('Users exported successfully');
              }}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                backgroundColor: 'transparent',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              fontFamily: '"Inter", sans-serif',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
              Export
            </button>

            {/* Add User */}
            <button
              onClick={() => setModalMode('create')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                backgroundColor: 'transparent',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: '"Inter", sans-serif',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Add User
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
          </button>
          </div>
        </div>

        {/* Content Area - Table/Board/List Views */}
        <div style={{ padding: '0 40px 40px' }}>
          {error ? (
            <div style={{ padding: '24px', borderRadius: '10px', backgroundColor: C.dangerDim, border: `1px solid rgba(248,113,113,0.2)`, color: C.danger, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          ) : loadingList ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ height: '60px', borderRadius: '8px', backgroundColor: C.surface, border: `1px solid ${C.border}`, opacity: 1 - i * 0.15 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: C.textMuted, fontSize: '14px' }}>
              No users found
            </div>
          ) : viewMode === 'table' ? (
            <div style={{ borderRadius: '4px', overflow: 'hidden', backgroundColor: 'transparent' }}>
              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: hiddenColumns.has('Joined') && hiddenColumns.has('Active')
                  ? '2fr 2fr 140px 100px'
                  : hiddenColumns.has('Joined')
                  ? '2fr 2fr 140px 150px 100px'
                  : hiddenColumns.has('Active')
                  ? '2fr 2fr 140px 140px 100px'
                  : '2fr 2fr 140px 140px 150px 100px',
                padding: '14px 24px',
                borderTop: `1px solid rgba(103, 124, 153, 0.15)`,
                borderLeft: `1px solid rgba(103, 124, 153, 0.15)`,
                borderRight: `1px solid rgba(103, 124, 153, 0.15)`,
                borderBottom: `1px solid rgba(103, 124, 153, 0.15)`,
                backgroundColor: 'rgba(50, 55, 63, 0.4)',
                borderRadius: '4px 4px 0 0',
              }}>
                {['User', 'Email', 'User type', 'Joined', 'Active', '']
                  .filter(h => !hiddenColumns.has(h))
                  .map((h) => (
                    <span key={h} style={{ fontSize: '12px', fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</span>
                ))}
              </div>

              {/* Table Rows */}
              {filtered.map((user, idx) => (
                  <motion.div
                    key={user.user_id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: hiddenColumns.has('Joined') && hiddenColumns.has('Active')
                        ? '2fr 2fr 140px 100px'
                        : hiddenColumns.has('Joined')
                        ? '2fr 2fr 140px 150px 100px'
                        : hiddenColumns.has('Active')
                        ? '2fr 2fr 140px 140px 100px'
                        : '2fr 2fr 140px 140px 150px 100px',
                      padding: '16px 24px',
                      borderLeft: `1px solid rgba(103, 124, 153, 0.15)`,
                      borderRight: `1px solid rgba(103, 124, 153, 0.15)`,
                      borderBottom: idx < filtered.length - 1 ? `1px solid rgba(103, 124, 153, 0.15)` : `1px solid rgba(103, 124, 153, 0.15)`,
                      borderRadius: idx === filtered.length - 1 ? '0 0 4px 4px' : '0',
                      alignItems: 'center',
                      backgroundColor: 'rgba(50, 55, 63, 0.4)',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(50, 55, 63, 0.5)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(50, 55, 63, 0.4)'; }}
                  >
                    {/* User column */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <UserAvatar name={user.name} lastName={user.last_name} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.name} {user.last_name}
                        </p>
                      </div>
                    </div>

                    {/* Email */}
                    <span style={{ fontSize: '14px', color: C.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.email}
                    </span>

                    {/* User type */}
                    <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: user.admin ? C.accent : C.textMuted,
                        padding: '4px 12px',
                        borderRadius: '12px',
                        backgroundColor: user.admin ? C.accentDim : 'transparent',
                        display: 'inline-block',
                      }}>
                        {user.admin ? 'Admin' : 'User'}
                      </span>
                    </div>

                    {/* Joined */}
                    {!hiddenColumns.has('Joined') && (
                      <span style={{ fontSize: '14px', color: C.textMuted }}>{formatDate(user.created_at)}</span>
                    )}

                    {/* Active Status */}
                    {!hiddenColumns.has('Active') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {(() => {
                        const currentUserEmail = getUserEmail();
                        const isCurrentUser = currentUserEmail && currentUserEmail.toLowerCase() === user.email.toLowerCase();
                        
                        // If it's the current logged-in user, they're always active
                        if (isCurrentUser) {
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: '#4ADE80',
                                flexShrink: 0,
                              }} />
                              <span style={{ fontSize: '13px', color: C.textMuted }}>
                                Active now
                              </span>
                            </div>
                          );
                        }
                        
                        // For other users, use mock logic (replace with real activity data)
                        const hash = user.user_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                        const isActive = hash % 3 !== 0; // ~67% active
                        const minutesAgo = (hash % 30) + 1;
                        const dotColor = isActive ? '#4ADE80' : '#F87171'; // Green if active, red if not
                        
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: dotColor,
                              flexShrink: 0,
                            }} />
                            <span style={{ fontSize: '13px', color: C.textMuted }}>
                              {isActive ? `Active ${minutesAgo} min ago` : 'Not active'}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => { setEditingUser(user); setModalMode('edit'); }}
                        title="Edit"
                        style={{
                          padding: '8px', borderRadius: '6px', border: 'none',
                          backgroundColor: 'transparent', color: C.textDim, cursor: 'pointer',
                          display: 'flex', alignItems: 'center',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.accentDim; e.currentTarget.style.color = C.accent; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textDim; }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeletingUser(user)}
                        title="Delete"
                        style={{
                          padding: '8px', borderRadius: '6px', border: 'none',
                          backgroundColor: 'transparent', color: C.textDim, cursor: 'pointer',
                          display: 'flex', alignItems: 'center',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.dangerDim; e.currentTarget.style.color = C.danger; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textDim; }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                ))}
            </div>
          ) : viewMode === 'board' ? (
            <>
              {/* Board View - Kanban Style */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {filtered.map((user, idx) => {
                const currentUserEmail = getUserEmail();
                const isCurrentUser = currentUserEmail && currentUserEmail.toLowerCase() === user.email.toLowerCase();
                const hash = user.user_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const isActive = isCurrentUser || hash % 3 !== 0;
                const minutesAgo = (hash % 30) + 1;
                
                return (
                  <motion.div
                    key={user.user_id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      border: `1px solid rgba(103, 124, 153, 0.15)`,
                      backgroundColor: 'rgba(50, 55, 63, 0.4)',
                      transition: 'all 0.15s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(50, 55, 63, 0.5)';
                      e.currentTarget.style.borderColor = C.accent;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(50, 55, 63, 0.4)';
                      e.currentTarget.style.borderColor = 'rgba(103, 124, 153, 0.15)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <UserAvatar name={user.name} lastName={user.last_name} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.name} {user.last_name}
                        </p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: C.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: `1px solid rgba(103, 124, 153, 0.1)` }}>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: user.admin ? C.accent : C.textMuted,
                        padding: '4px 10px',
                        borderRadius: '12px',
                        backgroundColor: user.admin ? C.accentDim : 'transparent',
                      }}>
                        {user.admin ? 'Admin' : 'User'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: isCurrentUser ? '#4ADE80' : (isActive ? '#4ADE80' : '#F87171'),
                        }} />
                        <span style={{ fontSize: '11px', color: C.textMuted }}>
                          {isCurrentUser ? 'Active now' : (isActive ? `${minutesAgo}m ago` : 'Offline')}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              </div>
            </>
          ) : (
            <>
              {/* List View - Compact List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filtered.map((user, idx) => {
                const currentUserEmail = getUserEmail();
                const isCurrentUser = currentUserEmail && currentUserEmail.toLowerCase() === user.email.toLowerCase();
                const hash = user.user_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const isActive = isCurrentUser || hash % 3 !== 0;
                const minutesAgo = (hash % 30) + 1;
                
                return (
                  <motion.div
                    key={user.user_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: `1px solid rgba(103, 124, 153, 0.1)`,
                      backgroundColor: 'rgba(50, 55, 63, 0.3)',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(50, 55, 63, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(50, 55, 63, 0.3)';
                    }}
                  >
                    <UserAvatar name={user.name} lastName={user.last_name} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: C.text }}>
                          {user.name} {user.last_name}
                        </p>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: user.admin ? C.accent : C.textMuted,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          backgroundColor: user.admin ? C.accentDim : 'transparent',
                        }}>
                          {user.admin ? 'Admin' : 'User'}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: C.textMuted }}>
                        {user.email}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                      {!hiddenColumns.has('Joined') && (
                        <span style={{ fontSize: '12px', color: C.textMuted, minWidth: '100px' }}>
                          {formatDate(user.created_at)}
                        </span>
                      )}
                      {!hiddenColumns.has('Active') && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '120px' }}>
                          <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: isCurrentUser ? '#4ADE80' : (isActive ? '#4ADE80' : '#F87171'),
                          }} />
                          <span style={{ fontSize: '12px', color: C.textMuted }}>
                            {isCurrentUser ? 'Active now' : (isActive ? `${minutesAgo} min ago` : 'Not active')}
                          </span>
            </div>
                      )}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => { setEditingUser(user); setModalMode('edit'); }}
                          title="Edit"
                          style={{
                            padding: '6px', borderRadius: '4px', border: 'none',
                            backgroundColor: 'transparent', color: C.textDim, cursor: 'pointer',
                            display: 'flex', alignItems: 'center',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.accentDim; e.currentTarget.style.color = C.accent; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textDim; }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeletingUser(user)}
                          title="Delete"
                          style={{
                            padding: '6px', borderRadius: '4px', border: 'none',
                            backgroundColor: 'transparent', color: C.textDim, cursor: 'pointer',
                            display: 'flex', alignItems: 'center',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.dangerDim; e.currentTarget.style.color = C.danger; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textDim; }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(modalMode === 'create' || modalMode === 'edit') && (
          <UserFormModal
            key="form"
            mode={modalMode}
            initial={modalMode === 'edit' ? editingUser : null}
            onClose={() => { setModalMode(null); setEditingUser(null); }}
            onSave={modalMode === 'create' ? handleCreate : handleEdit}
            loading={actionLoading}
          />
        )}
        {deletingUser && (
          <ConfirmDeleteModal
            key="delete"
            user={deletingUser}
            onClose={() => setDeletingUser(null)}
            onConfirm={handleDelete}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>

      <ToastStack toasts={toasts} />
    </>
  );
}
