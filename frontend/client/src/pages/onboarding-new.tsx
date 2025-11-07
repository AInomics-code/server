import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Database, 
  FileSpreadsheet, 
  Globe2, 
  FileText, 
  Grid3X3, 
  Check,
  ArrowRight,
  Upload,
  Key,
  Link2,
  Circle
} from "lucide-react";

interface DataSource {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  type: 'url' | 'key' | 'file';
  placeholder: string;
}

const dataSources: DataSource[] = [
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    icon: Database,
    type: 'url',
    placeholder: 'postgresql://username:password@host:port/database'
  },
  {
    id: 'mysql',
    name: 'MySQL',
    icon: Database,
    type: 'url',
    placeholder: 'mysql://username:password@host:port/database'
  },
  {
    id: 'sheets',
    name: 'Google Sheets',
    icon: FileSpreadsheet,
    type: 'url',
    placeholder: 'https://docs.google.com/spreadsheets/d/...'
  },
  {
    id: 'airtable',
    name: 'Airtable',
    icon: Grid3X3,
    type: 'key',
    placeholder: 'apikey:your-airtable-api-key'
  },
  {
    id: 'excel',
    name: 'Excel/CSV',
    icon: FileText,
    type: 'file',
    placeholder: 'Upload your file'
  },
  {
    id: 'api',
    name: 'REST API',
    icon: Globe2,
    type: 'key',
    placeholder: 'apikey:your-rest-api-key'
  }
];

export default function OnboardingNew() {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [connectedSources, setConnectedSources] = useState<Set<string>>(new Set());
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [, setLocation] = useLocation();

  const handleSourceClick = (sourceId: string) => {
    setSelectedSource(selectedSource === sourceId ? null : sourceId);
  };

  const handleConnect = (sourceId: string) => {
    const value = inputValues[sourceId];
    if (value && value.trim()) {
      setConnectedSources(prev => new Set([...Array.from(prev), sourceId]));
      setSelectedSource(null);
      console.log(`Connected to ${sourceId} with:`, value);
    }
  };

  const handleSkip = () => {
    setLocation('/dashboard');
  };

  const handleContinue = () => {
    if (connectedSources.size === 0) {
      // Show micro toast
      alert("You'll be able to connect sources later from your dashboard.");
    }
    setLocation('/onboarding/data');
  };

  const renderInputField = (source: DataSource) => {
    const value = inputValues[source.id] || '';
    
    if (source.type === 'file') {
      return (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-blue-200">
            Upload File
          </label>
          <div className="relative">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setInputValues(prev => ({ ...prev, [source.id]: file.name }));
                }
              }}
            />
            <div className="flex items-center gap-3 p-4 border border-blue-500/30 rounded-xl bg-blue-900/20 backdrop-blur-sm hover:border-blue-400/40 transition-colors">
              <Upload className="w-5 h-5 text-blue-300" />
              <span className="text-blue-200">
                {value || 'Choose file to upload'}
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-blue-200">
          {source.type === 'url' ? 'Connection URL' : 'API Key'}
        </label>
        <div className="relative">
          {source.type === 'key' && (
            <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
          )}
          {source.type === 'url' && (
            <Link2 className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
          )}
          <input
            type={source.type === 'key' ? 'password' : 'text'}
            value={value}
            onChange={(e) => setInputValues(prev => ({ ...prev, [source.id]: e.target.value }))}
            placeholder={source.placeholder}
            className={`w-full ${source.type !== 'url' ? 'pl-12' : 'pl-12'} pr-4 py-4 bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-xl text-white placeholder-blue-300/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all`}
          />
        </div>
      </div>
    );
  };

  return (
    <motion.section 
      className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] text-white overflow-hidden"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Background Pattern - Seamless across viewport */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255,255,255,0.08) 2px, transparent 0)`,
          backgroundSize: '50px 50px',
          animation: 'grain 8s steps(10) infinite'
        }} />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-20 relative z-10">
        {/* Refined Enterprise Header */}
        <motion.div 
          className="mb-20"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="flex items-center gap-5 mb-4">
            {/* VORTA Atom Logo - 20% larger with glow */}
            <motion.svg 
              width="36" 
              height="36" 
              viewBox="0 0 100 100" 
              className="text-cyan-400 cursor-pointer"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              whileHover={{ 
                scale: 1.1,
                filter: "drop-shadow(0 0 12px rgba(103, 232, 249, 0.4))",
                transition: { duration: 0.3 }
              }}
              transition={{ delay: 0.3, duration: 0.6, type: "spring", stiffness: 200 }}
            >
              <defs>
                <radialGradient id="atomGradientOnboarding" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" style={{ stopColor: '#67e8f9', stopOpacity: 1 }} />
                  <stop offset="60%" style={{ stopColor: '#06b6d4', stopOpacity: 0.9 }} />
                  <stop offset="100%" style={{ stopColor: '#0891b2', stopOpacity: 0.7 }} />
                </radialGradient>
              </defs>
              
              {/* Orbital rings */}
              <ellipse cx="50" cy="50" rx="32" ry="12" 
                fill="none" stroke="url(#atomGradientOnboarding)" strokeWidth="3" 
                transform="rotate(0 50 50)" opacity="0.9" />
              <ellipse cx="50" cy="50" rx="32" ry="12" 
                fill="none" stroke="url(#atomGradientOnboarding)" strokeWidth="3" 
                transform="rotate(60 50 50)" opacity="0.9" />
              <ellipse cx="50" cy="50" rx="32" ry="12" 
                fill="none" stroke="url(#atomGradientOnboarding)" strokeWidth="3" 
                transform="rotate(120 50 50)" opacity="0.9" />
              
              {/* Central nucleus */}
              <circle cx="50" cy="50" r="4" fill="url(#atomGradientOnboarding)" opacity="1" />
            </motion.svg>

            <motion.h1 
              className="text-4xl font-medium text-white"
              style={{ 
                fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
                letterSpacing: '-0.5px'
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Let's get you set up
            </motion.h1>
          </div>
          
          <motion.p 
            className="text-blue-200/70 max-w-[70%] leading-relaxed"
            style={{ 
              fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
              fontSize: '15px'
            }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Choose how to connect your business data below. You can skip and configure this later.
          </motion.p>
        </motion.div>

        {/* Refined Connection Cards Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {dataSources.map((source, index) => {
            const Icon = source.icon;
            const isSelected = selectedSource === source.id;
            const isConnected = connectedSources.has(source.id);
            
            return (
              <motion.div
                key={source.id}
                className={`relative group cursor-pointer`}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: 0.7 + index * 0.05, 
                  duration: 0.5,
                  type: "spring",
                  stiffness: 120
                }}
                whileHover={{ 
                  scale: isConnected ? 1 : 1.05,
                  transition: { duration: 0.2 }
                }}
                onClick={() => !isConnected && handleSourceClick(source.id)}
              >
                {/* Enhanced Glass Card */}
                <div className={`relative rounded-2xl backdrop-blur-md transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.25)] ${
                  isConnected 
                    ? 'bg-green-500/10 border border-green-400/30 ring-2 ring-green-400/20' 
                    : isSelected
                    ? 'bg-gradient-to-br from-[#1c2340] to-[#2a3b5c] border border-blue-400/40 ring-2 ring-blue-400/30'
                    : 'bg-gradient-to-br from-[#1c2340]/60 to-[#2a3b5c]/60 border border-blue-500/20 hover:from-[#1c2340]/80 hover:to-[#2a3b5c]/80 hover:border-blue-400/30 hover:ring-2 hover:ring-blue-400/20'
                }}`} 
                style={{ padding: '18px 24px' }}>
                  
                  {/* Connected Indicator */}
                  {isConnected && (
                    <motion.div 
                      className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1.5 shadow-lg"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}

                  {/* Enhanced Icon and Title Section */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-xl transition-all duration-300 ${
                      isConnected
                        ? 'bg-green-500/15 text-green-400' 
                        : isSelected
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 group-hover:text-blue-300'
                    }`}>
                      <Icon className="w-7 h-7" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-white mb-1" style={{ 
                        fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif'
                      }}>
                        {source.name}
                      </h3>
                      {/* Refined Status Indicator */}
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-blue-400/60'}`} />
                        <span className={`text-xs font-medium ${isConnected ? 'text-green-400' : 'text-blue-400/80'}`}>
                          {isConnected ? 'Connected' : 'Not connected'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Refined Hover Connect Button */}
                  {!isConnected && !isSelected && (
                    <motion.div 
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                    >
                      <button className="w-full py-3 px-4 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl text-sm font-medium text-blue-300 hover:text-blue-200 transition-all duration-200 border border-blue-500/30">
                        Connect
                      </button>
                    </motion.div>
                  )}

                  {/* Expanded Form */}
                  <AnimatePresence>
                    {isSelected && !isConnected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.3, type: "spring", stiffness: 120 }}
                        className="border-t border-blue-500/30 pt-5"
                      >
                        {renderInputField(source)}
                        
                        <div className="flex justify-end space-x-3 mt-5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSource(null);
                            }}
                            className="px-4 py-2 text-blue-300/70 hover:text-white transition-all duration-200 font-medium"
                            style={{ 
                              fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConnect(source.id);
                            }}
                            disabled={!inputValues[source.id]?.trim()}
                            className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg ${
                              inputValues[source.id]?.trim()
                                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-xl hover:shadow-blue-500/20'
                                : 'bg-blue-900/50 text-blue-400/60 cursor-not-allowed'
                            }`}
                            style={{ 
                              fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif'
                            }}
                          >
                            Connect
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Enhanced Footer CTAs */}
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-center gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <motion.button
            onClick={handleSkip}
            className="text-blue-300/70 hover:text-white transition-all duration-200 font-medium opacity-60 hover:opacity-100 order-2 md:order-1"
            style={{ 
              fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif'
            }}
            whileHover={{ x: 2 }}
          >
            Skip for now
          </motion.button>
          
          <motion.button
            onClick={handleContinue}
            className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-blue-500/50 order-1 md:order-2 w-full md:w-auto"
            style={{ 
              fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif'
            }}
            whileHover={{ 
              x: 3,
              boxShadow: "0 0 25px rgba(6, 182, 212, 0.15)",
              transition: { duration: 0.2 }
            }}
          >
            <span>Connect & Continue</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </motion.section>
  );
}