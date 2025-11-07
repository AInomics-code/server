import { useState } from 'react';
import { motion } from 'framer-motion';

export default function TableConfigDemo() {
  const [selectedTables, setSelectedTables] = useState<string[]>(['customers', 'orders']);
  const [tableConfigs, setTableConfigs] = useState<Record<string, {
    displayName: string;
    columnDescriptions: Record<string, string>;
    businessQuestions: string[];
  }>>({
    customers: {
      displayName: "Customer Database",
      columnDescriptions: {
        customer_id: "Unique Customer ID",
        company_name: "Business Name",
        contact_email: "Primary Email",
        territory_id: "Sales Territory",
        created_date: "Registration Date",
        status: "Account Status"
      },
      businessQuestions: [
        "Which customers haven't ordered this month?",
        "What's our customer retention rate by territory?",
        "Which high-value customers are at risk?"
      ]
    },
    orders: {
      displayName: "Order History",
      columnDescriptions: {
        order_id: "Order Number",
        customer_id: "Customer Reference",
        product_id: "Product SKU",
        quantity: "Items Ordered",
        order_date: "Purchase Date",
        total_amount: "Order Value",
        status: "Order Status"
      },
      businessQuestions: [
        "What's our average order value trend?",
        "Which products are selling fastest?",
        "What's our order fulfillment rate?"
      ]
    }
  });

  const mockTables = [
    { 
      name: "customers", 
      columns: ["customer_id", "company_name", "contact_email", "territory_id", "created_date", "status"],
      description: "Customer information and contact details" 
    },
    { 
      name: "orders", 
      columns: ["order_id", "customer_id", "product_id", "quantity", "order_date", "total_amount", "status"],
      description: "Order history and transaction data" 
    },
    { 
      name: "products", 
      columns: ["product_id", "product_name", "category", "price", "stock_quantity", "supplier_id"],
      description: "Product catalog and inventory" 
    }
  ];

  const formatTableName = (tableName: string): string => {
    return tableName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const updateTableConfig = (tableName: string, field: keyof typeof tableConfigs[string], value: any) => {
    setTableConfigs(prev => ({
      ...prev,
      [tableName]: {
        ...prev[tableName],
        [field]: value
      }
    }));
  };

  const updateBusinessQuestion = (tableName: string, questionIndex: number, question: string) => {
    const config = tableConfigs[tableName];
    if (config) {
      const newQuestions = [...config.businessQuestions];
      newQuestions[questionIndex] = question;
      updateTableConfig(tableName, 'businessQuestions', newQuestions);
    }
  };

  const toggleTable = (tableName: string) => {
    setSelectedTables(prev => 
      prev.includes(tableName) 
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-slate-100 mb-3">Database Schema Configuration</h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                Configure your database tables to help VORTA understand your business context and provide more accurate insights.
              </p>
            </div>
            <div className="flex items-center space-x-3 px-4 py-2 bg-slate-800/60 border border-slate-700/40 rounded-lg">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span className="text-slate-300 text-sm font-medium">PostgreSQL Connected</span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Table Selection Section */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
              </svg>
              <h2 className="text-lg font-medium text-slate-200">Available Tables</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {mockTables.map((table) => {
                const isSelected = selectedTables.includes(table.name);
                return (
                  <motion.button
                    key={table.name}
                    className={`p-4 rounded-lg border text-left transition-all group focus:outline-none focus:ring-2 focus:ring-slate-600 ${
                      isSelected
                        ? "border-slate-600 bg-slate-800/60"
                        : "border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/40"
                    }`}
                    onClick={() => toggleTable(table.name)}
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.995 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected 
                            ? "border-slate-500 bg-slate-600" 
                            : "border-slate-600 bg-slate-700/60"
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-slate-200" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm font-medium text-slate-200">
                          {formatTableName(table.name)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {table.description}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Configuration Section */}
          {selectedTables.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="border-t border-slate-700/40 pt-8">
                <div className="flex items-center space-x-2 mb-6">
                  <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  <h2 className="text-lg font-medium text-slate-200">Table Configuration</h2>
                  <span className="text-sm text-slate-500">({selectedTables.length} selected)</span>
                </div>
              </div>

              {selectedTables.map((tableName) => {
                const table = mockTables.find(t => t.name === tableName);
                const config = tableConfigs[tableName];
                
                if (!table || !config) return null;

                return (
                  <motion.div
                    key={tableName}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-slate-600/30 rounded-xl p-8 shadow-xl backdrop-blur-sm"
                  >
                    {/* Table Header */}
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex items-start space-x-5">
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-600/80 to-slate-700/80 rounded-xl flex items-center justify-center border border-slate-500/30 shadow-lg">
                          {/* Modern database icon with interconnected nodes */}
                          <svg className="w-6 h-6 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0-2.278-3.694-4.125-8.25-4.125s-8.25 1.847-8.25 4.125" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="group">
                            <input
                              value={config.displayName}
                              onChange={(e) => updateTableConfig(tableName, 'displayName', e.target.value)}
                              className="text-xl font-semibold text-slate-50 bg-transparent border-none outline-none focus:bg-slate-700/20 rounded-lg px-3 py-2 w-full group-hover:bg-slate-700/10 transition-all duration-200"
                              placeholder="Table display name"
                            />
                          </div>
                          <div className="flex items-center space-x-3 mt-2 px-3">
                            <span className="text-xs font-medium text-slate-400 bg-slate-700/40 px-2 py-1 rounded-md border border-slate-600/30">
                              {tableName}
                            </span>
                            <span className="text-xs text-slate-500">•</span>
                            <span className="text-xs text-slate-500">
                              {table.columns.length} columns
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleTable(tableName)}
                          className="text-slate-500 hover:text-slate-400 hover:bg-slate-700/40 transition-all duration-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500/50"
                          title="Remove table"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Business Questions Section */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-slate-600/60 to-slate-700/60 rounded-lg flex items-center justify-center border border-slate-500/30">
                            {/* Simple question mark icon */}
                            <svg className="w-4 h-4 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-base font-medium text-slate-200">Business Context Questions</h4>
                            <p className="text-xs text-slate-500 mt-0.5">Help VORTA understand your data patterns</p>
                          </div>
                        </div>
                        <div className="group relative">
                          <button className="w-6 h-6 bg-slate-700/40 hover:bg-slate-600/50 rounded-full flex items-center justify-center border border-slate-600/40 transition-colors">
                            <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <div className="invisible group-hover:visible absolute bottom-full right-0 mb-2 p-3 bg-slate-800/90 border border-slate-600/50 text-xs text-slate-300 rounded-lg shadow-xl whitespace-nowrap z-10 backdrop-blur-sm">
                            Define questions to train AI for better insights
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {config.businessQuestions.map((question, idx) => (
                          <div key={idx} className="group">
                            <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 bg-slate-600/40 border border-slate-500/30 rounded-full">
                                <span className="text-xs text-slate-400 font-medium">{idx + 1}</span>
                              </div>
                              <input
                                value={question}
                                onChange={(e) => updateBusinessQuestion(tableName, idx, e.target.value)}
                                placeholder="e.g., Which customers haven't ordered this month?"
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-700/20 border border-slate-600/40 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:border-slate-500/60 focus:bg-slate-700/30 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all duration-200 group-hover:bg-slate-700/25"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column Mapping Section */}
                    <div className="border-t border-slate-600/20 pt-8">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-slate-600/60 to-slate-700/60 rounded-lg flex items-center justify-center border border-slate-500/30">
                            {/* Modern mapping/transformation icon */}
                            <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-base font-medium text-slate-200">Column Mapping</h4>
                            <p className="text-xs text-slate-500 mt-0.5">Map database fields to business terminology</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-500 bg-slate-700/40 px-2 py-1 rounded-md border border-slate-600/30">
                            {table.columns.length} fields
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {table.columns.slice(0, 6).map((column) => (
                          <div key={column} className="group">
                            <div className="flex items-center space-x-4 p-3 bg-slate-700/10 hover:bg-slate-700/20 rounded-lg border border-slate-600/20 transition-all duration-200">
                              <div className="flex-shrink-0">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                                  <span className="text-xs font-mono text-slate-400 bg-slate-700/40 px-2 py-1 rounded-md border border-slate-600/30 min-w-0">
                                    {column}
                                  </span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <input
                                  value={config.columnDescriptions[column] || ''}
                                  onChange={(e) => {
                                    const newDescriptions = { ...config.columnDescriptions };
                                    newDescriptions[column] = e.target.value;
                                    updateTableConfig(tableName, 'columnDescriptions', newDescriptions);
                                  }}
                                  placeholder="Describe this field for business users..."
                                  className="w-full px-3 py-2 bg-slate-700/20 border border-slate-600/40 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:border-slate-500/60 focus:bg-slate-700/30 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all duration-200"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {table.columns.length > 6 && (
                        <div className="mt-6 pt-4 border-t border-slate-700/20">
                          <div className="flex items-center justify-center p-3 bg-slate-700/10 rounded-lg border border-slate-600/20">
                            <p className="text-sm text-slate-400 flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                              </svg>
                              <span>{table.columns.length - 6} additional columns available for mapping</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}