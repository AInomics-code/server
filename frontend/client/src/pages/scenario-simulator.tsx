import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Play, Save, Download, RotateCcw, TrendingUp, ArrowLeft, Plus, Info, ChevronRight } from 'lucide-react';
// @ts-ignore
import { simulateScenario } from '@/data/formulas';
import { getEntityById, getEntitiesByType } from '@/data/entities';

// Type definitions
interface SimulationResult {
  current: {
    revenue: number;
    units: number;
    margin: number;
    serviceLevel: number;
  };
  simulated: {
    revenue: number;
    units: number;
    margin: number;
    serviceLevel: number;
  };
}

export default function ScenarioSimulator() {
  const [entityType, setEntityType] = useState('products');
  const [entityName, setEntityName] = useState('mangoSalsa');
  const [timeHorizon, setTimeHorizon] = useState('12weeks');
  const [showAssumptions, setShowAssumptions] = useState(false);
  
  const [variables, setVariables] = useState({
    demandGrowth: 0.15, // 15%
    priceChange: 0.0,   // 0%
    promoMultiplier: 1.0, // No promotion
    marketingSpend: 0.0, // 0% additional spend
    leadTime: 14,       // 14 days
    stockAvailable: 5000 // units
  });

  const [results, setResults] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Load entity data
  const entities = getEntitiesByType(entityType);
  const selectedEntity = getEntityById(entityType, entityName) as any;

  useEffect(() => {
    if (selectedEntity) {
      setVariables(prev => ({
        ...prev,
        stockAvailable: selectedEntity.stockOnHand || 5000,
        leadTime: selectedEntity.leadTime || 14
      }));
    }
  }, [selectedEntity]);

  const entityTypeOptions = [
    { id: 'products', name: 'Product' },
    { id: 'zones', name: 'Zone' },
    { id: 'kpis', name: 'KPI' }
  ];

  const timeHorizonOptions = [
    { id: '4weeks', name: '4 Weeks' },
    { id: '12weeks', name: '12 Weeks' },
    { id: '6months', name: '6 Months' },
    { id: '1year', name: '1 Year' }
  ];

  const runSimulation = () => {
    if (!selectedEntity) return;
    
    setIsSimulating(true);
    setTimeout(() => {
      const simulationInputs = {
        entity: selectedEntity,
        demandGrowth: variables.demandGrowth,
        priceChange: variables.priceChange,
        promoMultiplier: variables.promoMultiplier,
        marketingSpend: variables.marketingSpend,
        leadTime: variables.leadTime,
        stockAvailable: variables.stockAvailable
      };
      
      const scenarioResults = simulateScenario(simulationInputs);
      setResults(scenarioResults);
      setIsSimulating(false);
    }, 1500);
  };

  const resetVariables = () => {
    setVariables({
      demandGrowth: 0,
      priceChange: 0,
      promoMultiplier: 1.0,
      marketingSpend: 0.0,
      leadTime: selectedEntity?.leadTime || 14,
      stockAvailable: selectedEntity?.stockOnHand || 5000
    });
    setResults(null);
  };

  const handleSliderChange = (key: string, value: number) => {
    setVariables(prev => ({ ...prev, [key]: value }));
  };

  const getInsight = (metric: string, current: number, simulated: number) => {
    const change = ((simulated / current - 1) * 100);
    
    switch (metric) {
      case 'revenue':
        if (change > 5) return "Revenue increased due to higher demand and price optimization";
        if (change < -5) return "Revenue declined from reduced demand or pricing pressure";
        return "Revenue remained stable with balanced demand-price dynamics";
      case 'margin':
        if (change > 3) return "Margin improved as price uplift outweighed promotion costs";
        if (change < -3) return "Margin compressed due to promotional spending or cost increases";
        return "Margin maintained through balanced pricing strategy";
      case 'serviceLevel':
        if (change < -5) return "Service level dropped because demand exceeds available inventory";
        if (change > 5) return "Service level improved with better demand-supply balance";
        return "Service level maintained within acceptable range";
      default:
        return "Performance adjusted based on scenario parameters";
    }
  };

  const getRecommendation = () => {
    if (!results) return null;
    
    const serviceLevelChange = results.simulated.serviceLevel - results.current.serviceLevel;
    const marginChange = ((results.simulated.margin / results.current.margin - 1) * 100);
    
    if (serviceLevelChange < -5) {
      return "Consider increasing stock levels or reducing lead time to improve service level";
    }
    if (marginChange < -10) {
      return "Monitor margin compression - consider adjusting promotional intensity";
    }
    if (marginChange > 15) {
      return "Strong margin performance - opportunity to reinvest in market expansion";
    }
    return "Current scenario parameters support balanced growth objectives";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Left Sidebar */}
      <div className="w-24 bg-slate-900/95 backdrop-blur-sm border-r border-slate-700/30 flex flex-col items-center py-8">
        <button
          onClick={() => window.history.back()}
          className="w-10 h-10 bg-blue-500/30 rounded-xl flex items-center justify-center mb-8 hover:bg-blue-500/40 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-blue-300" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px' }}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl font-semibold mb-3 bg-gradient-to-r from-slate-200 to-blue-300 bg-clip-text text-transparent">
              AI Scenario Simulator
            </h1>
            <p className="text-slate-400 text-lg">Model future outcomes with intelligent what-if analysis</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Configuration */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* Focus Selection */}
              <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-slate-700/30">
                <h3 className="text-xl font-semibold text-slate-200 mb-4">Focus Selection</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                      <select
                        value={entityType}
                        onChange={(e) => setEntityType(e.target.value)}
                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        {entityTypeOptions.map(option => (
                          <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Time Horizon</label>
                      <select
                        value={timeHorizon}
                        onChange={(e) => setTimeHorizon(e.target.value)}
                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        {timeHorizonOptions.map(option => (
                          <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Entity</label>
                    <select
                      value={entityName}
                      onChange={(e) => setEntityName(e.target.value)}
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      {Object.values(entities).map((entity: any) => (
                        <option key={entity.id} value={entity.id}>
                          {entity.name || entity.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Demand & Pricing */}
              <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-slate-700/30">
                <h3 className="text-xl font-semibold text-slate-200 mb-4">Demand & Pricing</h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-slate-300">
                        Demand Growth: {(variables.demandGrowth * 100).toFixed(1)}%
                      </label>
                      <button className="w-4 h-4 text-slate-400 hover:text-slate-300" title="Expected percentage change in baseline demand">
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="range"
                      min="-0.5"
                      max="1.0"
                      step="0.05"
                      value={variables.demandGrowth}
                      onChange={(e) => handleSliderChange('demandGrowth', parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none slider-thumb"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-slate-300">
                        Price Change: {(variables.priceChange * 100).toFixed(1)}%
                      </label>
                      <button className="w-4 h-4 text-slate-400 hover:text-slate-300" title="Percentage adjustment to current pricing">
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="range"
                      min="-0.3"
                      max="0.3"
                      step="0.05"
                      value={variables.priceChange}
                      onChange={(e) => handleSliderChange('priceChange', parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none slider-thumb"
                    />
                  </div>
                </div>
              </div>

              {/* Promotions & Marketing */}
              <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-slate-700/30">
                <h3 className="text-xl font-semibold text-slate-200 mb-4">Promotions & Marketing</h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-slate-300">
                        Promo Multiplier: {variables.promoMultiplier.toFixed(1)}×
                      </label>
                      <button className="w-4 h-4 text-slate-400 hover:text-slate-300" title="Demand uplift from promotional campaigns; 1.8× means 80% increase">
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="3.0"
                      step="0.1"
                      value={variables.promoMultiplier}
                      onChange={(e) => handleSliderChange('promoMultiplier', parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none slider-thumb"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-slate-300">
                        Marketing Spend: {(variables.marketingSpend * 100).toFixed(1)}%
                      </label>
                      <button className="w-4 h-4 text-slate-400 hover:text-slate-300" title="Additional marketing investment as percentage of revenue">
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="0.15"
                      step="0.01"
                      value={variables.marketingSpend}
                      onChange={(e) => handleSliderChange('marketingSpend', parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none slider-thumb"
                    />
                  </div>
                </div>
              </div>

              {/* Supply Chain */}
              <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-slate-700/30">
                <h3 className="text-xl font-semibold text-slate-200 mb-4">Supply Chain</h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-slate-300">
                        Lead Time: {variables.leadTime} days
                      </label>
                      <button className="w-4 h-4 text-slate-400 hover:text-slate-300" title="Time between order placement and inventory availability">
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      step="1"
                      value={variables.leadTime}
                      onChange={(e) => handleSliderChange('leadTime', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none slider-thumb"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-slate-300">
                        Stock Available: {variables.stockAvailable.toLocaleString()} units
                      </label>
                      <button className="w-4 h-4 text-slate-400 hover:text-slate-300" title="Current inventory available to meet demand">
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="10000"
                      step="100"
                      value={variables.stockAvailable}
                      onChange={(e) => handleSliderChange('stockAvailable', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-700/50 rounded-lg appearance-none slider-thumb"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={runSimulation}
                    disabled={isSimulating}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isSimulating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Simulating...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Run Simulation
                      </>
                    )}
                  </button>
                  <button
                    onClick={resetVariables}
                    className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Results */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              {/* Results Panel */}
              <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-slate-700/30">
                <h3 className="text-xl font-semibold text-slate-200 mb-4">Scenario Results</h3>
                
                {results ? (
                  <div className="space-y-6">
                    {/* Metrics Comparison */}
                    <div className="space-y-4">
                      {/* Revenue */}
                      <div className="bg-slate-900/30 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-slate-300">Revenue</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-slate-200">
                              ${results.current.revenue.toLocaleString()}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                            <span className="text-lg font-semibold text-blue-300">
                              ${results.simulated.revenue.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">
                            {getInsight('revenue', results.current.revenue, results.simulated.revenue)}
                          </span>
                          <span className={`font-medium ${
                            results.simulated.revenue > results.current.revenue ? 'text-green-400' : 'text-red-400'
                          }`}>
                            Δ {((results.simulated.revenue / results.current.revenue - 1) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Units */}
                      <div className="bg-slate-900/30 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-slate-300">Units Sold</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-slate-200">
                              {results.current.units.toLocaleString()}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                            <span className="text-lg font-semibold text-blue-300">
                              {results.simulated.units.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">Volume change from demand and promotion effects</span>
                          <span className={`font-medium ${
                            results.simulated.units > results.current.units ? 'text-green-400' : 'text-red-400'
                          }`}>
                            Δ {((results.simulated.units / results.current.units - 1) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Margin */}
                      <div className="bg-slate-900/30 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-slate-300">Gross Margin</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-slate-200">
                              ${results.current.margin.toLocaleString()}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                            <span className="text-lg font-semibold text-blue-300">
                              ${results.simulated.margin.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">
                            {getInsight('margin', results.current.margin, results.simulated.margin)}
                          </span>
                          <span className={`font-medium ${
                            results.simulated.margin > results.current.margin ? 'text-green-400' : 'text-red-400'
                          }`}>
                            Δ {((results.simulated.margin / results.current.margin - 1) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Service Level */}
                      <div className="bg-slate-900/30 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-slate-300">Service Level</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-slate-200">
                              {results.current.serviceLevel}%
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                            <span className="text-lg font-semibold text-blue-300">
                              {results.simulated.serviceLevel}%
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">
                            {getInsight('serviceLevel', results.current.serviceLevel, results.simulated.serviceLevel)}
                          </span>
                          <span className={`font-medium ${
                            results.simulated.serviceLevel > results.current.serviceLevel ? 'text-green-400' : 'text-red-400'
                          }`}>
                            Δ {(results.simulated.serviceLevel - results.current.serviceLevel).toFixed(1)}pp
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-gradient-to-r from-blue-900/20 to-slate-900/20 rounded-lg p-4 border border-blue-700/30">
                      <h4 className="text-sm font-semibold text-blue-300 mb-2">Recommended Actions</h4>
                      <p className="text-sm text-slate-300">{getRecommendation()}</p>
                    </div>

                    {/* Action Buttons - Unified Style */}
                    <div className="flex gap-3 justify-end">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Save Scenario
                      </button>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export PDF
                      </button>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Task
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-700/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-400 text-lg mb-2">Ready to simulate scenarios</p>
                    <p className="text-slate-500 text-sm">Adjust variables on the left and run simulation to see projected outcomes</p>
                  </div>
                )}
              </div>

              {/* Model Assumptions */}
              <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/30">
                <button
                  onClick={() => setShowAssumptions(!showAssumptions)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-slate-700/20 transition-colors rounded-2xl"
                >
                  <h3 className="text-lg font-semibold text-slate-200">Model Assumptions</h3>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showAssumptions ? 'rotate-180' : ''}`} />
                </button>
                
                {showAssumptions && (
                  <div className="px-6 pb-6 space-y-3 text-sm text-slate-300">
                    <div className="bg-slate-900/30 rounded-lg p-3">
                      <span className="font-medium text-slate-200">Demand Forecast = </span>
                      baseline units × (1 + demand growth) × promo multiplier
                    </div>
                    <div className="bg-slate-900/30 rounded-lg p-3">
                      <span className="font-medium text-slate-200">Effective Price = </span>
                      baseline price × (1 + price change)
                    </div>
                    <div className="bg-slate-900/30 rounded-lg p-3">
                      <span className="font-medium text-slate-200">Revenue = </span>
                      demand forecast × effective price
                    </div>
                    <div className="bg-slate-900/30 rounded-lg p-3">
                      <span className="font-medium text-slate-200">Service Level = </span>
                      min(100%, (Stock Available / Demand Forecast) × lead time adjustment)
                    </div>
                    <div className="bg-slate-900/30 rounded-lg p-3">
                      <span className="font-medium text-slate-200">Gross Margin = </span>
                      revenue × margin rate - (marketing spend × revenue)
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}