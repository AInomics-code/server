import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';

interface KPIDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  kpiId: string;
}

const kpiData = {
  'performance-score': {
    name: 'Performance Score',
    definition: 'Composite metric combining sales velocity, inventory turnover, and customer satisfaction across all regional operations.',
    currentValue: 68,
    unit: '/100',
    trend: -8,
    sparkline: [75, 73, 71, 69, 68, 67, 65, 68],
    historicalData: [82, 78, 75, 72, 70, 68],
    benchmark: 75,
    status: 'needs-attention'
  },
  'inventory-turnover': {
    name: 'Inventory Turnover',
    definition: 'Rate at which inventory is sold and replaced over a specific period, indicating efficiency of inventory management.',
    currentValue: 4.2,
    unit: 'x/month',
    trend: 5,
    sparkline: [3.8, 3.9, 4.1, 4.0, 4.2, 4.3, 4.1, 4.2],
    historicalData: [3.6, 3.8, 3.9, 4.0, 4.1, 4.2],
    benchmark: 4.5,
    status: 'good'
  }
};

export default function KPIDrawer({ isOpen, onClose, kpiId }: KPIDrawerProps) {
  const kpi = kpiData[kpiId as keyof typeof kpiData];
  
  if (!kpi) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-emerald-400';
      case 'needs-attention': return 'text-amber-400';
      case 'critical': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-[300px] bg-gradient-to-b from-slate-800 to-slate-900 border-l border-slate-700/50 shadow-2xl z-50"
            style={{
              backdropFilter: 'blur(12px)',
              background: 'linear-gradient(180deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.98) 100%)'
            }}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-700/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">{kpi.name}</h3>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center transition-all duration-200"
                >
                  <X className="w-4 h-4 text-slate-300" />
                </button>
              </div>
              
              {/* Current Value */}
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-2xl font-bold text-white">{kpi.currentValue}{kpi.unit}</span>
                <div className={`flex items-center space-x-1 ${kpi.trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {kpi.trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="text-sm font-medium">{Math.abs(kpi.trend)}%</span>
                </div>
              </div>

              {/* Status */}
              <div className={`text-xs font-medium ${getStatusColor(kpi.status)} uppercase tracking-wide`}>
                {kpi.status.replace('-', ' ')}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Definition */}
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Definition</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{kpi.definition}</p>
              </div>

              {/* Real-time Sparkline */}
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3">Recent Trend</h4>
                <div className="flex items-end space-x-1 h-12 mb-2">
                  {kpi.sparkline.map((value, index) => {
                    const maxValue = Math.max(...kpi.sparkline);
                    const height = (value / maxValue) * 100;
                    return (
                      <div
                        key={index}
                        className={`flex-1 rounded-t transition-all duration-300 ${
                          kpi.trend >= 0 ? 'bg-emerald-500/40' : 'bg-red-500/40'
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </div>
                <div className="text-xs text-slate-500">Last 8 periods</div>
              </div>

              {/* Historical Performance */}
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3">6-Month History</h4>
                <div className="space-y-2">
                  {kpi.historicalData.map((value, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Month {6-index}</span>
                      <span className="text-slate-300 font-medium">{value}{kpi.unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benchmark */}
              <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Target Benchmark</span>
                  <span className="text-blue-300 font-medium">{kpi.benchmark}{kpi.unit}</span>
                </div>
                <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${(kpi.currentValue / kpi.benchmark) * 100}%` }}
                  />
                </div>
              </div>

              {/* Action */}
              <button className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg p-3 text-blue-300 text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2">
                <span>View in Full Dashboard</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}