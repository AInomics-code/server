import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';

interface BusinessPrompt {
  id: number;
  question: string;
  tag?: string;
}

const suggestedPrompts = [
  "What are our top-performing SKUs this quarter?",
  "Which stores are lagging behind in Q2?", 
  "Where are we losing margin and why?",
  "Which campaigns drove the highest ROI last month?",
  "Which clients are most profitable?",
  "What changed in Q3 vs Q2?",
  "Which products have declining sales trends?",
  "What are our customer retention rates by segment?"
];

const promptTags = ['Sales', 'Marketing', 'Finance', 'Operations', 'Analytics'];

export default function BusinessContextPrompts() {
  const [, setLocation] = useLocation();
  const [prompts, setPrompts] = useState<BusinessPrompt[]>([
    { id: 1, question: '', tag: undefined },
    { id: 2, question: '', tag: undefined },
    { id: 3, question: '', tag: undefined }
  ]);

  const addPrompt = () => {
    if (prompts.length < 5) {
      setPrompts([...prompts, { id: Date.now(), question: '', tag: undefined }]);
    }
  };

  const removePrompt = (id: number) => {
    if (prompts.length > 1) {
      setPrompts(prompts.filter(p => p.id !== id));
    }
  };

  const updatePrompt = (id: number, field: keyof BusinessPrompt, value: string) => {
    setPrompts(prompts.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const generateSuggestions = () => {
    const shuffled = [...suggestedPrompts].sort(() => 0.5 - Math.random());
    const newPrompts = prompts.map((p, idx) => ({
      ...p,
      question: p.question || shuffled[idx] || ''
    }));
    setPrompts(newPrompts);
  };

  const hasValidPrompts = () => {
    return prompts.some(p => p.question.trim().length > 0);
  };

  const handleContinue = () => {
    // Save prompts to localStorage or send to backend
    const validPrompts = prompts.filter(p => p.question.trim().length > 0);
    localStorage.setItem('businessPrompts', JSON.stringify(validPrompts));
    setLocation('/dashboard');
  };

  const handleSkip = () => {
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:24px_24px]"></div>
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl"
        >
          {/* Header Section */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center space-x-3 mb-6"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-slate-600/80 to-slate-700/80 rounded-xl flex items-center justify-center border border-slate-500/30 shadow-lg">
                <svg className="w-6 h-6 text-slate-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-100">Let VORTA understand your goals</h1>
                <p className="text-slate-400 mt-2">Define the key business questions you ask most often</p>
              </div>
            </motion.div>

            <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-400/30">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-medium text-slate-200 mb-2">Why this helps VORTA reason better</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    By understanding your common business questions, VORTA learns your language and priorities. 
                    This enables smarter responses, relevant suggestions, and faster insights aligned with your goals.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-slate-600/30 rounded-xl shadow-2xl backdrop-blur-sm"
          >
            <div className="p-8">
              {/* Header with suggestion button */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">Business Context Questions</h2>
                  <p className="text-sm text-slate-400 mt-1">Enter 3-5 questions you frequently ask about your data</p>
                </div>
                <button
                  onClick={generateSuggestions}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/40 rounded-lg text-sm text-slate-300 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                  <span>Generate ideas</span>
                </button>
              </div>

              {/* Prompts Input Section */}
              <div className="space-y-6">
                {prompts.map((prompt, index) => (
                  <motion.div
                    key={prompt.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-slate-600/40 border border-slate-500/30 rounded-full flex items-center justify-center mt-2">
                        <span className="text-sm text-slate-400 font-medium">{index + 1}</span>
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="relative">
                          <input
                            value={prompt.question}
                            onChange={(e) => updatePrompt(prompt.id, 'question', e.target.value)}
                            placeholder={`e.g., ${suggestedPrompts[index % suggestedPrompts.length]}`}
                            className="w-full px-4 py-3 bg-slate-700/20 border border-slate-600/40 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:border-slate-500/60 focus:bg-slate-700/30 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all duration-200 group-hover:bg-slate-700/25"
                          />
                        </div>
                        
                        {/* Tag Selection */}
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-500">Category:</span>
                          <select
                            value={prompt.tag || ''}
                            onChange={(e) => updatePrompt(prompt.id, 'tag', e.target.value)}
                            className="text-xs bg-slate-700/40 border border-slate-600/30 rounded-md px-2 py-1 text-slate-400 focus:outline-none focus:border-slate-500/60"
                          >
                            <option value="">Optional</option>
                            {promptTags.map(tag => (
                              <option key={tag} value={tag}>{tag}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {prompts.length > 1 && (
                        <button
                          onClick={() => removePrompt(prompt.id)}
                          className="flex-shrink-0 w-8 h-8 text-slate-500 hover:text-slate-400 hover:bg-slate-700/40 rounded-lg transition-colors mt-2 flex items-center justify-center"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Add Prompt Button */}
                {prompts.length < 5 && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={addPrompt}
                    className="flex items-center space-x-2 text-slate-400 hover:text-slate-300 transition-colors p-2"
                  >
                    <div className="w-8 h-8 border-2 border-dashed border-slate-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm">Add another question</span>
                  </motion.button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-600/20">
                <button
                  onClick={handleSkip}
                  className="px-6 py-2 text-slate-400 hover:text-slate-300 transition-colors text-sm"
                >
                  Skip for now
                </button>
                
                <div className="flex items-center space-x-4">
                  <div className="text-xs text-slate-500">
                    {prompts.filter(p => p.question.trim()).length} of {prompts.length} questions added
                  </div>
                  <button
                    onClick={handleContinue}
                    disabled={!hasValidPrompts()}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      hasValidPrompts()
                        ? 'bg-slate-600 hover:bg-slate-500 text-white shadow-lg'
                        : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Continue to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}