import { useState, useRef, useEffect } from "react";
import { Paperclip, Globe, Mic, Send, Copy, Expand, Pin, Bell, Home, BarChart2, Settings, LogOut, User } from "lucide-react";
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
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

  const suggestedPrompts = [
    "Which products underperformed last week?",
    "Show me current inventory gaps by region", 
    "What are the top-selling SKUs this month?",
    "Analyze delivery performance trends",
    "Compare sales targets vs actual results",
    "Which stores need immediate attention?",
    "Show competitor pricing analysis",
    "What's driving the revenue decline in Colón?"
  ];

  return (
    <div className="flex h-screen bg-white">
      
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 p-4 flex flex-col items-start">
        <img 
          src={laDonaLogo} 
          className="w-24 mb-2" 
          alt="La Doña logo" 
        />
        <h1 className="text-lg font-semibold text-gray-800 leading-tight">
          La Doña <br /> Business <br /> Intelligence
        </h1>

        <div className="mt-8 text-sm text-gray-600">
          <div className="font-medium text-gray-900">Carlos Mendoza</div>
          <div className="text-xs text-gray-500">General Manager</div>
        </div>

        <button className="mt-auto text-sm text-red-500 hover:text-red-700 transition-colors">
          Logout →
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-10">
        {/* Alert Bell - Top Right */}
        <div className="absolute top-6 right-6 z-20">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 relative"
          >
          <Bell className="w-5 h-5 text-gray-600" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
        </button>
        
        {showNotifications && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border p-3 animate-[fadeInUp_0.2s_ease-out]">
            <div className="text-xs text-gray-500 mb-2 font-medium">Business Alerts</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-red-600">3 Zones Below Target</span>
                <span className="text-xs text-red-500">●</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-orange-600">2 SKUs Missing</span>
                <span className="text-xs text-orange-500">●</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Container */}
      <div className="w-full max-w-[600px] px-4">
        
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
            <div className="mb-8 space-y-6 max-h-[60vh] overflow-y-auto">
              {messages.map((message) => (
                <div key={message.id} className="animate-[fadeIn_0.3s_ease-out]">
                  {message.isUser ? (
                    /* User Message - Simple Text */
                    <div className="text-xl text-gray-800 font-medium mb-4">
                      {message.content}
                    </div>
                  ) : (
                    /* AI Response */
                    <div className="space-y-4">
                      {/* Vorta Logo - Only appears with responses */}
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="vortex-icon active" style={{ width: '14px', height: '14px', filter: 'drop-shadow(0 0 6px rgba(225, 29, 72, 0.3))' }}>
                          <div className="vortex-blade"></div>
                          <div className="vortex-blade"></div>
                          <div className="vortex-blade"></div>
                          <div className="vortex-blade"></div>
                          <div className="vortex-blade"></div>
                          <div className="vortex-blade"></div>
                        </div>
                        <span>Vorta</span>
                      </div>
                      
                      {/* Response Content */}
                      <div className="text-gray-800 leading-relaxed">
                        {message.content}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-3 mt-4">
                        <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors">
                          View SKU List
                        </button>
                        <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors">
                          Compare Chains
                        </button>
                        <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors">
                          View Dashboard
                        </button>
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
              <div className="vortex-icon active" style={{ width: '14px', height: '14px', filter: 'drop-shadow(0 0 6px rgba(225, 29, 72, 0.3))' }}>
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

        {/* Chat Input Area - Clean White Style */}
        <div className={`flex items-center gap-3 w-full px-4 py-3 bg-[#f9f9f9] rounded-xl shadow-sm transition-shadow duration-300 ${
          isFocused ? 'shadow-[0_0_0_2px_#e11d48]' : ''
        }`}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask about KPIs or performance..."
            className="flex-1 bg-transparent border-none outline-none text-gray-800 text-base placeholder-gray-500"
          />
          
          {/* Icons */}
          <div className="flex items-center gap-2 text-gray-500">
            <button 
              className="p-1 hover:text-gray-700 transition-colors" 
              title="Attach files"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            
            <button 
              className="p-1 hover:text-gray-700 transition-colors" 
              title="Language"
            >
              <Globe className="w-4 h-4" />
            </button>
            
            <button 
              onClick={() => setIsVoiceActive(!isVoiceActive)}
              className={`p-1 transition-all duration-200 ${
                isVoiceActive 
                  ? 'text-[#e11d48] shadow-[0_0_8px_rgba(225,29,72,0.4)] animate-pulse' 
                  : 'hover:text-gray-700'
              }`}
              title="Voice input"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
          
          {/* Ask Button */}
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className={`bg-[#e11d48] hover:bg-[#d11d47] text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 ${
              !inputValue.trim() || isTyping ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Ask
          </button>
        </div>

        <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}