import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, TrendingUp, TrendingDown } from 'lucide-react';

interface ReportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
}

const reportData = {
  'q3-forecast': {
    title: 'Q3 Performance Forecast',
    kpiValue: '$2.4M',
    trend: -12,
    summary: 'This report highlights a 12% sales drop in Chiriquí due to seasonal shifts and distribution delays. However, recovery is projected for Q4 with the new promotional campaigns and improved logistics routes.',
    chartData: [85, 78, 82, 75, 68, 71, 74, 69],
    lastUpdated: '2 hours ago'
  },
  'performance-score': {
    title: 'Regional Performance Analysis',
    kpiValue: '68/100',
    trend: -8,
    summary: 'Regional performance shows concerning trends in key markets. Chiriquí Central requires immediate attention with emergency stock transfers and promotional support to prevent further decline.',
    chartData: [75, 72, 68, 71, 69, 65, 68, 66],
    lastUpdated: '45 minutes ago'
  }
};

export default function ReportPanel({ isOpen, onClose, reportId }: ReportPanelProps) {
  const report = reportData[reportId as keyof typeof reportData];
  
  if (!report) return null;

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
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-[40%] bg-gradient-to-b from-slate-800 to-slate-900 border-l border-slate-700/50 shadow-2xl z-50"
            style={{
              backdropFilter: 'blur(12px)',
              background: 'linear-gradient(180deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.98) 100%)'
            }}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-700/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">{report.title}</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center transition-all duration-200 hover:scale-105"
                >
                  <X className="w-4 h-4 text-slate-300" />
                </button>
              </div>
              
              {/* Export Options */}
              <div className="flex items-center space-x-3">
                <button className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-300 text-sm transition-all duration-200">
                  <Download className="w-4 h-4" />
                  <span>PDF</span>
                </button>
                <button className="flex items-center space-x-2 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg text-emerald-300 text-sm transition-all duration-200">
                  <FileText className="w-4 h-4" />
                  <span>Excel</span>
                </button>
                <span className="text-xs text-slate-400 ml-auto">Updated {report.lastUpdated}</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* KPI Snapshot */}
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Primary Metric</span>
                  <div className={`flex items-center space-x-1 ${report.trend < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {report.trend < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    <span className="text-sm font-medium">{Math.abs(report.trend)}%</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-3">{report.kpiValue}</div>
                
                {/* Mini Chart */}
                <div className="flex items-end space-x-1 h-16">
                  {report.chartData.map((value, index) => (
                    <div
                      key={index}
                      className={`flex-1 rounded-t ${report.trend < 0 ? 'bg-red-500/30' : 'bg-emerald-500/30'}`}
                      style={{ height: `${(value / Math.max(...report.chartData)) * 100}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Executive Summary */}
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                <h3 className="text-sm font-medium text-slate-300 mb-3">Executive Summary</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{report.summary}</p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl p-4 text-blue-300 font-medium transition-all duration-200 hover:scale-105">
                  View Full Report in Analytics
                </button>
                <button className="w-full bg-slate-700/40 hover:bg-slate-600/50 border border-slate-600/30 rounded-xl p-4 text-slate-300 font-medium transition-all duration-200 hover:scale-105">
                  Schedule Follow-up Analysis
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}