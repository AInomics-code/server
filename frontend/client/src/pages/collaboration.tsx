import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Search, Filter, Send, AtSign, Hash } from 'lucide-react';
import ContextPanel from '@/components/ContextPanel';
import ReportPanel from '@/components/ReportPanel';
import KPIDrawer from '@/components/KPIDrawer';
import { ToastContainer } from '@/components/Toast';
import { parseChips, teamMembers } from '@/data/entities';

// Refined tag component with readable format
const EntityTag = ({ type, value, id, onClick }: { type: string; value: string; id: string; onClick: () => void }) => {
  const typeLabels = {
    kpi: 'KPI',
    zone: 'Zone',
    product: 'Product',
    report: 'Report'
  };
  
  const typeColors = {
    kpi: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    zone: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    product: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    report: 'bg-purple-500/10 text-purple-300 border-purple-500/20'
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 hover:scale-105 ${typeColors[type as keyof typeof typeColors] || typeColors.kpi}`}
    >
      {typeLabels[type as keyof typeof typeLabels] || type}: {value}
    </button>
  );
};

// Refined comment card with luxury styling
const CommentCard = ({ comment, openReportPanel, openKpiDrawer }: { 
  comment: any; 
  openReportPanel: (id: string) => void;
  openKpiDrawer: (id: string) => void;
}) => {
  const member = teamMembers.find(m => m.name === comment.author);
  
  // Extract entities for clean display
  const entities = [
    { type: 'zone', value: 'Chiriquí Central', id: 'chiriqui' },
    { type: 'product', value: 'Mango Salsa', id: 'mango-salsa' },
    { type: 'kpi', value: 'Performance Score', id: 'performance-score' },
    { type: 'report', value: 'Q3 Forecast', id: 'q3-forecast' }
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,.4)' }}
      className="bg-slate-800/30 backdrop-blur-md rounded-2xl shadow-lg transition-all duration-300"
      style={{
        background: 'rgba(30,41,59,.4)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 16px rgba(0,0,0,.2)',
        padding: '28px',
        minHeight: '200px'
      }}
    >
      {/* Header with avatar and info */}
      <div className="flex items-start space-x-4 mb-6">
        <div className="relative">
          <div className="w-12 h-12 bg-slate-700/40 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-sm font-semibold text-slate-300">{comment.avatar}</span>
          </div>
          {member?.online && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-800"></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-1">
            <h4 className="font-medium text-white">{comment.author}</h4>
            <span className="text-xs text-slate-400 font-medium">{comment.role}</span>
          </div>
          <p className="text-xs text-slate-500">{comment.time}</p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <p className="text-slate-300 leading-relaxed text-sm">
          {comment.content.replace(/#(kpi|zone|product|report):([^#\s,]+)/g, '')}
        </p>
        
        {/* Entity tags */}
        <div className="flex flex-wrap gap-2">
          {entities.slice(0, comment.id).map((entity, index) => (
            <EntityTag
              key={index}
              type={entity.type}
              value={entity.value}
              id={entity.id}
              onClick={() => {
                if (entity.type === 'report') openReportPanel(entity.id);
                else if (entity.type === 'kpi') openKpiDrawer(entity.id);
              }}
            />
          ))}
        </div>

        {/* Action buttons row */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700/30">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => openReportPanel('q3-forecast')}
              className="text-xs px-4 py-2 bg-slate-700/40 hover:bg-slate-600/50 rounded-lg text-slate-300 hover:text-white transition-all duration-200 hover:scale-105"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Open Report
            </button>
            <button
              onClick={() => openKpiDrawer('performance-score')}
              className="text-xs px-4 py-2 bg-slate-700/40 hover:bg-slate-600/50 rounded-lg text-slate-300 hover:text-white transition-all duration-200 hover:scale-105"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Open KPI
            </button>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('create-task', { detail: { title: `Follow up on ${comment.author}'s comment` } }));
                window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Task created', type: 'success' } }));
              }}
              className="text-xs px-4 py-2 bg-slate-700/40 hover:bg-slate-600/50 rounded-lg text-slate-300 hover:text-white transition-all duration-200"
            >
              Create Task
            </button>
          </div>
          
          <button
            onClick={() => {
              window.location.href = '/scenario-simulator';
              window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Opening AI Scenario Simulator', type: 'info' } }));
            }}
            className="text-xs px-4 py-2 bg-amber-500/15 hover:bg-amber-500/25 rounded-lg text-amber-300 hover:text-amber-200 transition-all duration-200 border border-amber-500/25 hover:scale-105"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 0 16px rgba(245,158,11,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 0 rgba(245,158,11,0)';
            }}
          >
            Simulate
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default function Collaboration() {
  const [, setLocation] = useLocation();
  const [newComment, setNewComment] = useState('');
  const [contextPanel, setContextPanel] = useState<{ isOpen: boolean; entityId: string | null; activeTab: string }>({
    isOpen: false,
    entityId: null,
    activeTab: 'overview'
  });

  const [reportPanel, setReportPanel] = useState({
    isOpen: false,
    reportId: null as string | null
  });

  const [kpiDrawer, setKpiDrawer] = useState({
    isOpen: false,
    kpiId: null as string | null
  });
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Clean sample comments without hashtags
  const [comments] = useState([
    {
      id: 1,
      author: 'Elena Rodriguez',
      role: 'Sales Director',
      time: '2 hours ago',
      content: 'The performance analysis for Chiriquí Central looks concerning. We need to prioritize emergency transfer for Mango Salsa tomorrow morning. Can we review the Q3 forecast impact?',
      avatar: 'ER'
    },
    {
      id: 2,
      author: 'Miguel Santos',
      role: 'Operations Manager',
      time: '1 hour ago',
      content: '@elena The David warehouse has confirmed 4,800 units available. I can coordinate the 6-hour transit route. Should we also review inventory turnover levels for other locations?',
      avatar: 'MS'
    },
    {
      id: 3,
      author: 'Sofia Chen',
      role: 'Analytics Lead',
      time: '45 minutes ago',
      content: 'I\'ve updated the forecasting parameters for Mango Salsa. The 1.8x promotional multiplier has been applied to Chiriquí Central. We should see better predictions for similar seasonal events.',
      avatar: 'SC'
    }
  ]);

  // Panel handler functions

  const openContextPanel = (type: string, id: string, tab = 'overview') => {
    setContextPanel({ isOpen: true, entityId: id, activeTab: tab });
  };

  const closeContextPanel = () => {
    setContextPanel({ isOpen: false, entityId: null, activeTab: 'overview' });
  };

  const openReportPanel = (reportId: string) => {
    setReportPanel({ isOpen: true, reportId });
  };

  const closeReportPanel = () => {
    setReportPanel({ isOpen: false, reportId: null });
  };

  const openKpiDrawer = (kpiId: string) => {
    setKpiDrawer({ isOpen: true, kpiId });
  };

  const closeKpiDrawer = () => {
    setKpiDrawer({ isOpen: false, kpiId: null });
  };

  const handleSendComment = () => {
    if (!newComment.trim()) return;
    // Here you would normally add the comment to the list
    setNewComment('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  };

  const handleInputChange = (value: string) => {
    setNewComment(value);
    
    // Check for mentions
    const mentionMatch = value.match(/@([a-zA-Z]*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  const insertMention = (member: any) => {
    const mentionText = `@${member.name.toLowerCase().replace(' ', '')} `;
    const beforeMention = newComment.replace(/@[a-zA-Z]*$/, '');
    setNewComment(beforeMention + mentionText);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] text-white font-sans flex">
      
      {/* Left Sidebar */}
      <div className="fixed left-4 top-4 bottom-4 w-16 bg-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-2xl flex flex-col items-center py-6 z-10">
        {/* Top Icon - Dashboard/Home */}
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-6">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>

        {/* Navigation Icons */}
        <div className="flex flex-col space-y-4">
          <button 
            onClick={() => setLocation('/dashboard')}
            className="w-10 h-10 rounded-xl bg-slate-700/30 hover:bg-slate-600/50 flex items-center justify-center transition-all duration-200 hover:scale-105"
          >
            <svg className="w-5 h-5 text-slate-400 hover:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>

          <button className="w-10 h-10 rounded-xl bg-slate-700/30 hover:bg-slate-600/50 flex items-center justify-center transition-all duration-200 hover:scale-105">
            <svg className="w-5 h-5 text-slate-400 hover:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Collaboration Hub - Highlighted */}
          <button className="w-10 h-10 rounded-xl bg-blue-500/30 border border-blue-500/50 flex items-center justify-center transition-all duration-200">
            <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>

          <button className="w-10 h-10 rounded-xl bg-slate-700/30 hover:bg-slate-600/50 flex items-center justify-center transition-all duration-200 hover:scale-105">
            <svg className="w-5 h-5 text-slate-400 hover:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

          <button 
            onClick={() => setLocation('/scenario-simulator')}
            className="w-10 h-10 rounded-xl bg-slate-700/30 hover:bg-amber-500/50 flex items-center justify-center transition-all duration-200 hover:scale-105"
            title="AI Scenario Simulator"
          >
            <svg className="w-5 h-5 text-slate-400 hover:text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>

          <button className="w-10 h-10 rounded-xl bg-slate-700/30 hover:bg-slate-600/50 flex items-center justify-center transition-all duration-200 hover:scale-105">
            <svg className="w-5 h-5 text-slate-400 hover:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Bottom Icon - User/Profile */}
        <div className="mt-auto">
          <button className="w-10 h-10 rounded-xl bg-slate-700/30 hover:bg-slate-600/50 flex items-center justify-center transition-all duration-200 hover:scale-105">
            <svg className="w-5 h-5 text-slate-400 hover:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-24">
        <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '32px' }}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-semibold mb-2 tracking-wide bg-gradient-to-r from-slate-200 to-blue-300 bg-clip-text text-transparent" style={{ letterSpacing: '1px', fontWeight: 600 }}>
              Collaboration Hub
            </h1>
            <p className="text-slate-400">Connect insights to action through intelligent team collaboration</p>
          </motion.div>

          {/* Sticky Sub-Header */}
          <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-sm rounded-xl border border-white/10 p-4 mb-8">
            <div className="flex items-center justify-between gap-4">
              {/* Filters */}
              <div className="flex items-center space-x-1">
                {['All', 'Mentions', 'Unread'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-2 text-sm font-medium transition-all duration-200 relative ${
                      activeFilter === filter
                        ? 'text-white'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {filter}
                    {activeFilter === filter && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 w-64"
                  />
                </div>

                {/* Counter */}
                <div className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                  <span className="text-sm font-medium text-blue-300">3 new</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-8 mb-12">
            {comments.map((comment, index) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                openReportPanel={openReportPanel}
                openKpiDrawer={openKpiDrawer}
              />
            ))}
          </div>

          {/* Enhanced Composer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative"
            style={{
              background: 'rgba(16,24,43,.68)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,.06)',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(0,0,0,.35)',
              padding: '24px'
            }}
          >
            {/* Mention Dropdown */}
            {showMentions && (
              <div className="absolute bottom-full left-6 mb-2 w-64 bg-slate-800/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl z-30">
                <div className="p-2">
                  <div className="text-xs text-slate-400 mb-2 px-2">Mention team member</div>
                  {filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => insertMention(member)}
                      className="w-full flex items-center space-x-3 p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                      <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-blue-300">{member.avatar}</span>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium text-white">{member.name}</div>
                        <div className="text-xs text-slate-400">{member.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              {/* Textarea container */}
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={newComment}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Share insights, mention @teammates, discuss findings..."
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl p-4 pb-12 text-white placeholder-slate-400 resize-none focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 min-h-[120px]"
                />
                
                {/* Suggestion chips - positioned properly at bottom */}
                <div className="absolute bottom-4 left-4 flex items-center space-x-4">
                  <button className="text-xs text-slate-500 hover:text-slate-400 transition-colors flex items-center space-x-1">
                    <AtSign className="w-3 h-3" />
                    <span>@mention</span>
                  </button>
                  <button className="text-xs text-slate-500 hover:text-slate-400 transition-colors flex items-center space-x-1">
                    <Hash className="w-3 h-3" />
                    <span>#tag</span>
                  </button>
                  <button className="text-xs text-slate-500 hover:text-slate-400 transition-colors">
                    /commands
                  </button>
                </div>
              </div>
              
              {/* Send button - aligned with textarea */}
              <div className="flex items-end">
                <button
                  onClick={handleSendComment}
                  className="px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-blue-300 font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-2"
                  style={{
                    boxShadow: '0 0 0 rgba(77,163,255,0)',
                    transition: 'all 180ms ease-out'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 24px rgba(77,163,255,0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 0 rgba(77,163,255,0)';
                  }}
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Context Panel */}
      <ContextPanel
        isOpen={contextPanel.isOpen}
        onClose={closeContextPanel}
        entityId={contextPanel.entityId}
        activeTab={contextPanel.activeTab}
      />

      {/* Report Panel */}
      <ReportPanel
        isOpen={reportPanel.isOpen}
        onClose={closeReportPanel}
        reportId={reportPanel.reportId || ''}
      />

      {/* KPI Drawer */}
      <KPIDrawer
        isOpen={kpiDrawer.isOpen}
        onClose={closeKpiDrawer}
        kpiId={kpiDrawer.kpiId || ''}
      />

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}