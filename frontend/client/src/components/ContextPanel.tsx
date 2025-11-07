import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { X, ExternalLink, Calendar, UserPlus, Play } from 'lucide-react';
import { EntityData, getEntityById } from '@/data/entities';

interface ContextPanelProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string | null;
  activeTab?: string;
}

const Sparkline = ({ data }: { data: number[] }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full h-12 bg-slate-800/50 rounded-lg p-2">
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke="#4DA3FF"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
};

export default function ContextPanel({ isOpen, onClose, entityId, activeTab = 'overview' }: ContextPanelProps) {
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [entity, setEntity] = useState<EntityData | null>(null);

  useEffect(() => {
    if (entityId) {
      const entityData = getEntityById(entityId);
      setEntity(entityData || null);
    }
  }, [entityId]);

  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  const handleAction = (action: string, payload?: any) => {
    window.dispatchEvent(new CustomEvent(action, { detail: payload }));
    
    // Show toast feedback
    const toastEvent = new CustomEvent('show-toast', {
      detail: { 
        message: action === 'create-task' ? 'Task created' : 
                action === 'assign-user' ? 'Assigned to team member' :
                action === 'add-calendar' ? 'Added to calendar' : 'Action completed',
        type: 'success'
      }
    });
    window.dispatchEvent(toastEvent);
  };

  const navigateToVisualLab = () => {
    if (entity) {
      const query = `entity=${entity.type}&id=${entity.id}`;
      window.dispatchEvent(new CustomEvent('navigate-visual-lab', { detail: { query } }));
      // For now, we'll just show a toast since we don't have the visual lab page
      handleAction('navigate-visual-lab', { query });
    }
  };

  const runScenario = () => {
    if (entity) {
      window.dispatchEvent(new CustomEvent('simulate', {
        detail: { entity: entity.type, id: entity.id, delta: +10 }
      }));
      handleAction('run-scenario', { entity: entity.type, id: entity.id });
    }
  };

  // Trap focus and handle escape
  useEffect(() => {
    if (isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!entity) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ 
              duration: 0.22, 
              ease: [0.2, 0.8, 0.2, 1] 
            }}
            className="fixed right-0 top-0 h-full w-[480px] max-w-[90vw] bg-slate-900/95 backdrop-blur-lg border-l border-white/10 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white tracking-wide">
                    {entity.title}
                  </h2>
                  <p className="text-sm text-blue-300 uppercase tracking-wider font-medium">
                    {entity.type}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center transition-all duration-200 hover:scale-105"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              
              {/* Tabs */}
              <div className="flex space-x-1">
                {['overview', 'chart', 'report', 'actions'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setCurrentTab(tab)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      currentTab === tab
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {currentTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-2 tracking-wide">Description</h3>
                    <p className="text-slate-400 leading-relaxed">{entity.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-3 tracking-wide">Current Value</h3>
                    <div className="text-2xl font-semibold text-white">{entity.value}</div>
                  </div>
                  
                  {entity.trend && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-300 mb-3 tracking-wide">7-Day Trend</h3>
                      <Sparkline data={entity.trend} />
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-2 tracking-wide">Last Updated</h3>
                    <p className="text-slate-400">
                      {new Date(entity.lastUpdated).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {currentTab === 'chart' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white tracking-wide">Interactive Chart</h3>
                  <div className="h-64 bg-slate-800/50 rounded-lg border border-white/10 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="text-slate-400">Interactive chart visualization</p>
                      <p className="text-sm text-slate-500">Chart component integration pending</p>
                    </div>
                  </div>
                </div>
              )}

              {currentTab === 'report' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white tracking-wide">Detailed Report</h3>
                  <div className="h-96 bg-slate-800/50 rounded-lg border border-white/10 p-4">
                    <div className="h-full overflow-y-auto">
                      <h4 className="font-medium text-blue-300 mb-3">{entity.title} Analysis</h4>
                      <div className="space-y-3 text-sm text-slate-400">
                        <p>Current performance indicates {entity.value} with trend analysis showing mixed signals across the evaluation period.</p>
                        <p>Key factors contributing to current status include market conditions, operational efficiency, and strategic initiatives implemented in Q2.</p>
                        <p>Recommendations for optimization include enhanced monitoring protocols and targeted improvement measures.</p>
                        <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <p className="text-blue-300 font-medium">Report Integration</p>
                          <p className="text-xs text-blue-400 mt-1">Full report viewer integration pending</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentTab === 'actions' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white tracking-wide">Quick Actions</h3>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => handleAction('create-task', { title: `Review ${entity.title}`, entity: entity.id })}
                      className="w-full p-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg border border-white/10 flex items-center space-x-3 transition-all duration-200 hover:scale-[1.02] group"
                    >
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <span className="text-slate-300 font-medium">Create Task</span>
                    </button>

                    <button
                      onClick={() => handleAction('assign-user', { entity: entity.id })}
                      className="w-full p-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg border border-white/10 flex items-center space-x-3 transition-all duration-200 hover:scale-[1.02] group"
                    >
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                        <UserPlus className="w-4 h-4 text-green-400" />
                      </div>
                      <span className="text-slate-300 font-medium">Assign To...</span>
                    </button>

                    <button
                      onClick={() => handleAction('add-calendar', { entity: entity.id })}
                      className="w-full p-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg border border-white/10 flex items-center space-x-3 transition-all duration-200 hover:scale-[1.02] group"
                    >
                      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                        <Calendar className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="text-slate-300 font-medium">Add to Calendar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 space-y-3">
              <button
                onClick={navigateToVisualLab}
                className="w-full p-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg border border-blue-500/30 flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20 group"
              >
                <ExternalLink className="w-4 h-4 text-blue-300" />
                <span className="text-blue-300 font-medium">Open in Visual Lab</span>
              </button>
              
              <button
                onClick={runScenario}
                className="w-full p-3 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg border border-amber-500/30 flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/20 group"
              >
                <Play className="w-4 h-4 text-amber-300" />
                <span className="text-amber-300 font-medium">Run Scenario</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}