import { useState, useRef, useEffect } from "react";
import { Paperclip, Globe, Mic, Search, Compass, BarChart2, ChevronDown, Target, TrendingUp } from "lucide-react";
import laDonaLogo from "@assets/Screenshot 2025-05-19 alle 15.08.46.png";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "Based on your La Doña sales data, I can see several areas requiring attention. The Colón region shows a 33% gap to target, primarily due to declining vinegar sales and delivery delays. Would you like me to provide a detailed breakdown of the underperforming SKUs or suggest specific action items?",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-white">
      
      {/* Fixed Vertical Sidebar - Perplexity Style */}
      <aside className="fixed left-0 top-0 h-full w-[180px] bg-[#2a2a2a] border-r border-[#3a3a3a] flex flex-col py-6" style={{ zIndex: 9999 }}>
        
        {/* Logo at Top */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 flex items-center justify-center">
            <img 
              src={laDonaLogo} 
              className="w-10 h-10 object-contain filter brightness-0 invert" 
              alt="La Doña" 
            />
          </div>
        </div>

        {/* Plus Button */}
        <div className="flex justify-center mb-12">
          <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all duration-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
        
        {/* Navigation Items */}
        <div className="flex flex-col space-y-6 px-4">
          {/* Home */}
          <button className="flex flex-col items-center space-y-2 text-gray-400 hover:text-white transition-colors group">
            <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-white/10 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-xs">Home</span>
          </button>

          {/* Scopri */}
          <button className="flex flex-col items-center space-y-2 text-gray-400 hover:text-white transition-colors group">
            <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-white/10 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
              </svg>
            </div>
            <span className="text-xs">Scopri</span>
          </button>

          {/* Spazi */}
          <button className="flex flex-col items-center space-y-2 text-gray-400 hover:text-white transition-colors group">
            <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-white/10 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span className="text-xs">Spazi</span>
          </button>
        </div>

        {/* Bottom Section - User */}
        <div className="mt-auto flex flex-col items-center space-y-4">
          {/* User Badge with PRO indicator */}
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-lg">
              E
            </div>
            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded text-[10px] font-bold">
              PRO
            </div>
          </div>
          
          {/* Status Indicator */}
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top KPI Dashboard - Always Visible */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <h3 className="text-sm font-medium text-gray-600 mb-4">Most Relevant Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sales Performance Card */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <BarChart2 size={16} className="text-green-600" />
                </div>
                <h4 className="text-sm font-medium text-gray-800">Sales vs Target</h4>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">82%</p>
              <p className="text-xs text-gray-500">Aderezo outperforming +6% above budget</p>
            </div>

            {/* Risk Alert Card */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h4 className="text-sm font-medium text-gray-800">Critical Backorders</h4>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">28 orders</p>
              <p className="text-xs text-gray-500">Zona Norte needs immediate reorder</p>
            </div>

            {/* Opportunity Card */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h4 className="text-sm font-medium text-gray-800">Growth Opportunity</h4>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">+26% ROI</p>
              <p className="text-xs text-gray-500">Scanner/Tonga campaigns surge this quarter</p>
            </div>
          </div>
        </div>

        <main className="flex flex-col items-center justify-center p-10 flex-1">
          {/* Vorta Logo */}
          {messages.length === 0 && !isTyping && (
            <div className="vortex-icon animate-pulse mb-4" style={{ width: '32px', height: '32px' }}>
              <div className="vortex-blade"></div>
              <div className="vortex-blade"></div>
              <div className="vortex-blade"></div>
              <div className="vortex-blade"></div>
              <div className="vortex-blade"></div>
              <div className="vortex-blade"></div>
            </div>
          )}

          {/* Messages Area */}
          {messages.length > 0 && (
            <div className="mb-8 space-y-6 max-h-[60vh] overflow-y-auto w-full max-w-3xl">
              {messages.map((message) => (
                <div key={message.id} className="animate-[fadeIn_0.3s_ease-out]">
                  {message.isUser ? (
                    <div className="text-xl text-gray-800 font-medium mb-4">
                      {message.content}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="vortex-icon active" style={{ width: '14px', height: '14px' }}>
                          <div className="vortex-blade"></div>
                          <div className="vortex-blade"></div>
                          <div className="vortex-blade"></div>
                          <div className="vortex-blade"></div>
                          <div className="vortex-blade"></div>
                          <div className="vortex-blade"></div>
                        </div>
                        <span>Vorta</span>
                      </div>
                      <div className="text-gray-800 leading-relaxed">
                        {message.content}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="mb-8 animate-[fadeIn_0.3s_ease-out]">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <div className="vortex-icon active" style={{ width: '14px', height: '14px' }}>
                  <div className="vortex-blade"></div>
                  <div className="vortex-blade"></div>
                  <div className="vortex-blade"></div>
                  <div className="vortex-blade"></div>
                  <div className="vortex-blade"></div>
                  <div className="vortex-blade"></div>
                </div>
                <span>Vorta</span>
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}

          {/* Chat Input */}
          <div className="w-full max-w-3xl bg-white border border-gray-200 shadow-md rounded-full px-6 py-4 flex items-center space-x-4">
            <input
              type="text"
              placeholder="Ask about KPIs or performance..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 outline-none text-gray-700 placeholder-gray-400"
            />
            <button className="text-gray-500 hover:text-gray-700 transition-colors">
              <Globe className="w-5 h-5" />
            </button>
            <button className="text-gray-500 hover:text-gray-700 transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsVoiceActive(!isVoiceActive)}
              className={`transition-colors ${isVoiceActive ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Mic className="w-5 h-5" />
            </button>
            <button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className={`ml-2 rounded-full px-4 py-2 transition-colors ${
                inputValue.trim() 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-red-300 text-white opacity-50 cursor-not-allowed'
              }`}
            >
              Ask
            </button>
          </div>

          <div ref={messagesEndRef} />
        </main>
      </div>
    </div>
  );
}