import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Plug, HelpCircle, Brain, Plus, Trash2, Eye, EyeOff, ArrowRight, Save } from "lucide-react";

interface DatabaseConfig {
  engine: string;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
}

interface SalesQuestion {
  id: string;
  text: string;
}

interface SchemaConfig {
  tableDescriptions: string;
  keyColumns: string;
  kpiFormulas: string;
}

export default function OnboardingDataForm() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [currentSection, setCurrentSection] = useState(1);
  
  // Database configuration state
  const [dbConfig, setDbConfig] = useState<DatabaseConfig>({
    engine: '',
    host: '',
    port: '',
    database: '',
    username: '',
    password: ''
  });

  // Sales questions state
  const [salesQuestions, setSalesQuestions] = useState<SalesQuestion[]>([
    { id: '1', text: 'Which customers stopped ordering this month?' },
    { id: '2', text: 'Where are we behind on targets?' },
    { id: '3', text: 'What SKUs aren\'t moving by region?' }
  ]);

  // Schema configuration state
  const [schemaConfig, setSchemaConfig] = useState<SchemaConfig>({
    tableDescriptions: '',
    keyColumns: '',
    kpiFormulas: ''
  });

  const [isPublicAccess, setIsPublicAccess] = useState(true);

  const handleAddQuestion = () => {
    const newId = (salesQuestions.length + 1).toString();
    setSalesQuestions([...salesQuestions, { id: newId, text: '' }]);
  };

  const handleRemoveQuestion = (id: string) => {
    if (salesQuestions.length > 1) {
      setSalesQuestions(salesQuestions.filter(q => q.id !== id));
    }
  };

  const handleQuestionChange = (id: string, text: string) => {
    setSalesQuestions(salesQuestions.map(q => 
      q.id === id ? { ...q, text } : q
    ));
  };

  const handleContinueToDashboard = () => {
    // Store all configuration data (in real app, would send to API)
    console.log('Database Config:', dbConfig);
    console.log('Sales Questions:', salesQuestions);
    console.log('Schema Config:', schemaConfig);
    
    setLocation("/dashboard");
  };

  const handleSaveForLater = () => {
    // Save current progress and redirect
    console.log('Saving progress...');
    setLocation("/dashboard");
  };

  const dbEngines = [
    'PostgreSQL',
    'MySQL', 
    'SQL Server',
    'Oracle',
    'SQLite',
    'MariaDB'
  ];

  return (
    <motion.section 
      className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] text-white overflow-hidden"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255,255,255,0.08) 2px, transparent 0)`,
          backgroundSize: '50px 50px',
          animation: 'grain 8s steps(10) infinite'
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12 relative z-10">
        {/* Professional header with dark theme */}
        <motion.div 
          className="mb-8 pb-6 border-b border-blue-500/20"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, duration: 0.6, type: "spring", stiffness: 200 }}
              >
                <svg width="20" height="20" viewBox="0 0 100 100" className="text-white">
                  <ellipse cx="50" cy="50" rx="28" ry="10" 
                    fill="none" stroke="currentColor" strokeWidth="4" 
                    transform="rotate(0 50 50)" opacity="0.9" />
                  <ellipse cx="50" cy="50" rx="28" ry="10" 
                    fill="none" stroke="currentColor" strokeWidth="4" 
                    transform="rotate(60 50 50)" opacity="0.9" />
                  <ellipse cx="50" cy="50" rx="28" ry="10" 
                    fill="none" stroke="currentColor" strokeWidth="4" 
                    transform="rotate(120 50 50)" opacity="0.9" />
                  <circle cx="50" cy="50" r="3" fill="currentColor" />
                </svg>
              </motion.div>

              <div>
                <h1 className="text-2xl font-semibold text-white" style={{ 
                  fontFamily: '"Segoe UI", system-ui, sans-serif',
                  fontWeight: 600
                }}>
                  Connect your data sources
                </h1>
                <p className="text-blue-200/70 text-sm mt-1" style={{ 
                  fontFamily: '"Segoe UI", system-ui, sans-serif'
                }}>
                  Set up VORTA to work with your business data and processes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-blue-200/60">
              <span>Step 2 of 2</span>
              <div className="w-16 h-1 bg-blue-900/40 rounded-full">
                <div className="w-full h-full bg-blue-400 rounded-full"></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main content grid - Microsoft Copilot layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left column - Main content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Database Connection Card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <div className="bg-gradient-to-br from-[#1c2340]/80 to-[#2a3b5c]/80 rounded-xl p-6 border border-blue-500/20 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 bg-blue-500/15 rounded-lg flex items-center justify-center">
                    <Plug className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white" style={{ 
                      fontFamily: '"Segoe UI", system-ui, sans-serif',
                      fontSize: '16px'
                    }}>
                      Database connection
                    </h3>
                    <p className="text-blue-200/60 text-sm">
                      Connect to your data source securely
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Database Engine */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-blue-200 mb-2 uppercase tracking-wide">
                      Database type
                    </label>
                    <select
                      value={dbConfig.engine}
                      onChange={(e) => setDbConfig(prev => ({ ...prev, engine: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-blue-900/20 border border-blue-500/30 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm"
                      style={{ fontFamily: '"Segoe UI", system-ui, sans-serif' }}
                    >
                      <option value="" className="bg-blue-900">Select database type</option>
                      {dbEngines.map(engine => (
                        <option key={engine} value={engine} className="bg-blue-900">{engine}</option>
                      ))}
                    </select>
                  </div>

                  {/* Host/IP */}
                  <div>
                    <label className="block text-xs font-medium text-blue-200 mb-2 uppercase tracking-wide">
                      Host
                    </label>
                    <input
                      type="text"
                      value={dbConfig.host}
                      onChange={(e) => setDbConfig(prev => ({ ...prev, host: e.target.value }))}
                      placeholder="localhost"
                      className="w-full px-3 py-2.5 bg-blue-900/20 border border-blue-500/30 rounded-md text-white placeholder-blue-300/60 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm"
                      style={{ fontFamily: '"Segoe UI", system-ui, sans-serif' }}
                    />
                  </div>

                  {/* Port */}
                  <div>
                    <label className="block text-xs font-medium text-blue-200 mb-2 uppercase tracking-wide">
                      Port
                    </label>
                    <input
                      type="text"
                      value={dbConfig.port}
                      onChange={(e) => setDbConfig(prev => ({ ...prev, port: e.target.value }))}
                      placeholder="5432"
                      className="w-full px-3 py-2.5 bg-blue-900/20 border border-blue-500/30 rounded-md text-white placeholder-blue-300/60 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm"
                      style={{ fontFamily: '"Segoe UI", system-ui, sans-serif' }}
                    />
                  </div>

                  {/* Database Name */}
                  <div>
                    <label className="block text-xs font-medium text-blue-200 mb-2 uppercase tracking-wide">
                      Database name
                    </label>
                    <input
                      type="text"
                      value={dbConfig.database}
                      onChange={(e) => setDbConfig(prev => ({ ...prev, database: e.target.value }))}
                      placeholder="production_db"
                      className="w-full px-3 py-2.5 bg-blue-900/20 border border-blue-500/30 rounded-md text-white placeholder-blue-300/60 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm"
                      style={{ fontFamily: '"Segoe UI", system-ui, sans-serif' }}
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-xs font-medium text-blue-200 mb-2 uppercase tracking-wide">
                      Username
                    </label>
                    <input
                      type="text"
                      value={dbConfig.username}
                      onChange={(e) => setDbConfig(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="readonly_user"
                      className="w-full px-3 py-2.5 bg-blue-900/20 border border-blue-500/30 rounded-md text-white placeholder-blue-300/60 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm"
                      style={{ fontFamily: '"Segoe UI", system-ui, sans-serif' }}
                    />
                  </div>

                  {/* Password */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-blue-200 mb-2 uppercase tracking-wide">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={dbConfig.password}
                        onChange={(e) => setDbConfig(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter secure password"
                        className="w-full px-3 py-2.5 pr-10 bg-blue-900/20 border border-blue-500/30 rounded-md text-white placeholder-blue-300/60 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all text-sm"
                        style={{ fontFamily: '"Segoe UI", system-ui, sans-serif' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-blue-200 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Business Questions Card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <div className="bg-gradient-to-br from-[#1c2340]/80 to-[#2a3b5c]/80 rounded-xl p-6 border border-blue-500/20 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 bg-blue-500/15 rounded-lg flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white" style={{ 
                      fontFamily: '"Segoe UI", system-ui, sans-serif',
                      fontSize: '16px'
                    }}>
                      Common business questions
                    </h3>
                    <p className="text-blue-200/60 text-sm">
                      What do you frequently ask about your business?
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {salesQuestions.map((question, index) => (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex gap-3"
                    >
                      <div className="flex-1">
                        <textarea
                          value={question.text}
                          onChange={(e) => handleQuestionChange(question.id, e.target.value)}
                          placeholder={`Question ${index + 1}...`}
                          rows={2}
                          className="w-full px-3 py-2.5 bg-blue-900/20 border border-blue-500/30 rounded-md text-white placeholder-blue-300/60 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all resize-none text-sm"
                          style={{ fontFamily: '"Segoe UI", system-ui, sans-serif' }}
                        />
                      </div>
                      {salesQuestions.length > 1 && (
                        <button
                          onClick={() => handleRemoveQuestion(question.id)}
                          className="p-2 text-blue-300/60 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>

                <button
                  onClick={handleAddQuestion}
                  className="mt-4 flex items-center gap-2 px-3 py-2 text-blue-300 hover:text-blue-200 hover:bg-blue-500/10 rounded-md transition-all text-sm font-medium"
                  style={{ fontFamily: '"Segoe UI", system-ui, sans-serif' }}
                >
                  <Plus className="w-4 h-4" />
                  Add question
                </button>
              </div>
            </motion.div>

            {/* Business Context Card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <div className="bg-gradient-to-br from-[#1c2340]/80 to-[#2a3b5c]/80 rounded-xl p-6 border border-blue-500/20 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 bg-blue-500/15 rounded-lg flex items-center justify-center">
                    <Brain className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white" style={{ 
                        fontFamily: '"Segoe UI", system-ui, sans-serif',
                        fontSize: '16px'
                      }}>
                        Business context
                      </h3>
                      <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded-full font-medium">Optional</span>
                    </div>
                    <p className="text-blue-200/60 text-sm">
                      Help VORTA understand your data structure
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Table Descriptions */}
                  <div>
                    <label className="block text-xs font-medium text-blue-200 mb-2 uppercase tracking-wide">
                      Table descriptions
                    </label>
                    <textarea
                      value={schemaConfig.tableDescriptions}
                      onChange={(e) => setSchemaConfig(prev => ({ ...prev, tableDescriptions: e.target.value }))}
                      placeholder="Describe your main tables, e.g., 'sales' table contains transaction records..."
                      rows={3}
                      className="w-full px-3 py-2.5 bg-blue-900/20 border border-blue-500/30 rounded-md text-white placeholder-blue-300/60 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all resize-none text-sm"
                      style={{ fontFamily: '"Segoe UI", system-ui, sans-serif' }}
                    />
                  </div>

                  {/* Key Column Definitions */}
                  <div>
                    <label className="block text-xs font-medium text-blue-200 mb-2 uppercase tracking-wide">
                      Key column definitions
                    </label>
                    <textarea
                      value={schemaConfig.keyColumns}
                      onChange={(e) => setSchemaConfig(prev => ({ ...prev, keyColumns: e.target.value }))}
                      placeholder="Define important columns, e.g., 'customer_id' links to customers table..."
                      rows={3}
                      className="w-full px-3 py-2.5 bg-blue-900/20 border border-blue-500/30 rounded-md text-white placeholder-blue-300/60 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all resize-none text-sm"
                      style={{ fontFamily: '"Segoe UI", system-ui, sans-serif' }}
                    />
                  </div>

                  {/* KPI Formulas */}
                  <div>
                    <label className="block text-xs font-medium text-blue-200 mb-2 uppercase tracking-wide">
                      KPI formulas and filters
                    </label>
                    <textarea
                      value={schemaConfig.kpiFormulas}
                      onChange={(e) => setSchemaConfig(prev => ({ ...prev, kpiFormulas: e.target.value }))}
                      placeholder="E.g., Active sales = SUM(amount) WHERE status = 'completed'..."
                      rows={3}
                      className="w-full px-3 py-2.5 bg-blue-900/20 border border-blue-500/30 rounded-md text-white placeholder-blue-300/60 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all resize-none text-sm"
                      style={{ fontFamily: '"Segoe UI", system-ui, sans-serif' }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Right column - Helper sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              
              {/* Connection Status */}
              <div className="bg-gradient-to-br from-[#1c2340]/60 to-[#2a3b5c]/60 rounded-xl p-6 border border-blue-500/20 backdrop-blur-md">
                <h4 className="font-semibold text-white mb-4" style={{ 
                  fontFamily: '"Segoe UI", system-ui, sans-serif',
                  fontSize: '14px'
                }}>
                  Setup progress
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    </div>
                    <span className="text-sm text-blue-200">Database connection</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    </div>
                    <span className="text-sm text-blue-200">Business questions</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-900/40 flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-500/60 rounded-full"></div>
                    </div>
                    <span className="text-sm text-blue-300/60">Business context (optional)</span>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-xl p-6 border border-blue-500/20 backdrop-blur-sm">
                <h4 className="font-semibold text-white mb-3" style={{ 
                  fontFamily: '"Segoe UI", system-ui, sans-serif',
                  fontSize: '14px'
                }}>
                  💡 Setup tips
                </h4>
                
                <div className="space-y-3 text-sm text-blue-200/70">
                  <p>• Use a read-only database connection for security</p>
                  <p>• Add 3-5 common business questions you ask daily</p>
                  <p>• Business context helps VORTA give better insights</p>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Dark theme bottom actions bar */}
        <motion.div 
          className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-t border-blue-500/20 px-8 py-4 z-50 backdrop-blur-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
        >
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <button
              onClick={handleSaveForLater}
              className="flex items-center gap-2 px-4 py-2 text-blue-300/70 hover:text-white hover:bg-blue-500/10 rounded-lg transition-all duration-200 font-medium"
              style={{ 
                fontFamily: '"Segoe UI", "Inter", system-ui, sans-serif'
              }}
            >
              <Save className="w-4 h-4" />
              Save for later
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLocation('/onboarding')}
                className="px-6 py-2.5 text-blue-200 hover:text-white hover:bg-blue-500/10 rounded-lg transition-all duration-200 font-medium border border-blue-500/30"
                style={{ 
                  fontFamily: '"Segoe UI", "Inter", system-ui, sans-serif'
                }}
              >
                Back
              </button>
              
              <motion.button
                onClick={handleContinueToDashboard}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg"
                style={{ 
                  fontFamily: '"Segoe UI", "Inter", system-ui, sans-serif'
                }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 0 25px rgba(59, 130, 246, 0.25)",
                  transition: { duration: 0.2 }
                }}
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Bottom padding to account for fixed bar */}
        <div className="h-20"></div>
      </div>
    </motion.section>
  );
}