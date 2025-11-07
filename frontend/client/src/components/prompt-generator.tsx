import { useState } from "react";
import { Lightbulb, TrendingUp, Users, Package, DollarSign, AlertTriangle, BarChart3, Target, Zap } from "lucide-react";

interface PromptSuggestion {
  id: string;
  text: string;
  category: string;
  icon: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
}

interface PromptGeneratorProps {
  onPromptSelect: (prompt: string) => void;
  isVisible: boolean;
  onToggle: () => void;
}

export function PromptGenerator({ onPromptSelect, isVisible, onToggle }: PromptGeneratorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const promptSuggestions: PromptSuggestion[] = [
    // High Priority - Critical Business Questions
    {
      id: 'cash-flow',
      text: "¿Cuál es nuestra situación actual de flujo de caja y qué clientes representan el mayor riesgo de cobranza?",
      category: 'financial',
      icon: <DollarSign size={14} className="text-gray-400" />,
      priority: 'high'
    },
    {
      id: 'stock-alerts',
      text: "¿Qué productos están experimentando desabastecimiento y cuál es el impacto en los ingresos?",
      category: 'inventory',
      icon: <AlertTriangle size={14} className="text-gray-400" />,
      priority: 'high'
    },
    {
      id: 'underperforming-regions',
      text: "¿Qué regiones tienen bajo rendimiento y qué acciones específicas deberíamos tomar?",
      category: 'performance',
      icon: <TrendingUp size={14} className="text-gray-400" />,
      priority: 'high'
    },

    // Medium Priority - Strategic Analysis
    {
      id: 'top-performers',
      text: "¿Qué representantes de ventas, productos y regiones están generando nuestros mejores resultados?",
      category: 'performance',
      icon: <Target size={14} className="text-gray-400" />,
      priority: 'medium'
    },
    {
      id: 'client-analysis',
      text: "Analiza nuestros top 5 clientes por ingresos e identifica oportunidades de crecimiento",
      category: 'clients',
      icon: <Users size={14} className="text-gray-400" />,
      priority: 'medium'
    },
    {
      id: 'product-margins',
      text: "¿Qué productos tienen los márgenes de ganancia más altos y deberíamos enfocarnos en promocionarlos?",
      category: 'products',
      icon: <Package size={14} className="text-gray-400" />,
      priority: 'medium'
    },
    {
      id: 'promotion-roi',
      text: "¿Cuál es el ROI de nuestras campañas promocionales actuales y cuáles deberíamos expandir?",
      category: 'marketing',
      icon: <BarChart3 size={14} className="text-gray-400" />,
      priority: 'medium'
    },

    // Low Priority - Operational Insights
    {
      id: 'daily-summary',
      text: "Dame un resumen integral del rendimiento empresarial de hoy",
      category: 'operations',
      icon: <Lightbulb size={14} className="text-gray-400" />,
      priority: 'low'
    },
    {
      id: 'territory-routes',
      text: "¿Cómo podemos optimizar las rutas de los representantes de ventas para mejorar la cobertura territorial?",
      category: 'operations',
      icon: <Zap size={14} className="text-gray-400" />,
      priority: 'low'
    },
    {
      id: 'new-opportunities',
      text: "¿Qué nuevas oportunidades de mercado debería considerar La Doña basándose en las tendencias actuales?",
      category: 'strategy',
      icon: <TrendingUp size={14} className="text-gray-400" />,
      priority: 'low'
    },
    {
      id: 'competitive-analysis',
      text: "¿Cómo se compara la posición de mercado de La Doña con nuestros principales competidores?",
      category: 'strategy',
      icon: <BarChart3 size={14} className="text-gray-400" />,
      priority: 'low'
    },
    {
      id: 'backorder-impact',
      text: "¿Cuál es el impacto de los pedidos pendientes actuales en la satisfacción del cliente y los ingresos?",
      category: 'inventory',
      icon: <Package size={14} className="text-gray-400" />,
      priority: 'medium'
    }
  ];

  const categories = [
    { id: 'all', name: 'Todas las Preguntas', count: promptSuggestions.length },
    { id: 'financial', name: 'Financiero', count: promptSuggestions.filter(p => p.category === 'financial').length },
    { id: 'performance', name: 'Rendimiento', count: promptSuggestions.filter(p => p.category === 'performance').length },
    { id: 'clients', name: 'Clientes', count: promptSuggestions.filter(p => p.category === 'clients').length },
    { id: 'inventory', name: 'Inventario', count: promptSuggestions.filter(p => p.category === 'inventory').length },
    { id: 'operations', name: 'Operaciones', count: promptSuggestions.filter(p => p.category === 'operations').length }
  ];

  const filteredPrompts = selectedCategory === 'all' 
    ? promptSuggestions 
    : promptSuggestions.filter(p => p.category === selectedCategory);

  const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
  const sortedPrompts = filteredPrompts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">Crítico</span>;
      case 'medium':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">Estratégico</span>;
      case 'low':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Insight</span>;
      default:
        return null;
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 left-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 z-50 group"
        title="Generador de Preguntas AI"
      >
        <Lightbulb size={20} />
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
          {promptSuggestions.filter(p => p.priority === 'high').length}
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-slideInLeft">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb size={20} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">Generador de Preguntas AI</h3>
          </div>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">Preguntas inteligentes de negocio para La Doña</p>
      </div>

      {/* Category Filters */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 text-xs rounded-full transition-all ${
                selectedCategory === category.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Prompt List */}
      <div className="max-h-96 overflow-y-auto">
        <div className="p-3 space-y-2">
          {sortedPrompts.map(prompt => (
            <button
              key={prompt.id}
              onClick={() => {
                onPromptSelect(prompt.text);
                onToggle();
              }}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {prompt.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getPriorityBadge(prompt.priority)}
                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                      {prompt.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 group-hover:text-blue-900 transition-colors">
                    {prompt.text}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Haz clic en cualquier pregunta para consultar a La Doña AI al instante
        </p>
      </div>
    </div>
  );
}