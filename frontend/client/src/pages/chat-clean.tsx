import { useState, useRef, useEffect } from "react";
import { Paperclip, Globe, Mic, Send, Copy, Expand, Pin, Bell, Home, BarChart2, Settings, LogOut, User, Search, Compass, FileText, ChevronDown } from "lucide-react";
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
    <div className="flex h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e]">
      
      {/* Fixed Vertical Sidebar - Perplexity Pro Style */}
      <aside className="fixed left-0 top-0 h-full w-20 bg-[#1E1E1E] border-r border-[#2C2C2C] flex flex-col items-center py-6 z-50">
        
        {/* Top Section - Branding + Navigation */}
        <div className="flex flex-col items-center space-y-6">
          {/* La Doña Logo */}
          <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-500/20 flex items-center justify-center">
            <img 
              src={laDonaLogo} 
              className="w-8 h-8 object-cover rounded-full" 
              alt="La Doña" 
            />
          </div>
          
          {/* Navigation Icons */}
          <div className="flex flex-col space-y-4">
            <button 
              className="w-10 h-10 rounded-md bg-transparent hover:bg-blue-500/20 flex items-center justify-center text-blue-200 hover:text-white transition-all duration-200"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            
            <button 
              className="w-10 h-10 rounded-md bg-transparent hover:bg-blue-500/20 flex items-center justify-center text-blue-200 hover:text-white transition-all duration-200"
              title="Discover"
            >
              <Compass className="w-5 h-5" />
            </button>
            
            <button 
              className="w-10 h-10 rounded-md bg-transparent hover:bg-blue-500/20 flex items-center justify-center text-blue-200 hover:text-white transition-all duration-200"
              title="Reports"
            >
              <BarChart2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bottom Section - User/Utility */}
        <div className="mt-auto flex flex-col items-center space-y-4">
          {/* User Badge */}
          <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-sm">
            C
          </div>
          
          {/* Dropdown Icon */}
          <button 
            className="w-8 h-8 rounded-md bg-transparent hover:bg-blue-500/20 flex items-center justify-center text-blue-200 hover:text-white transition-all duration-200"
            title="Settings"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {/* Version/Status */}
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
        </div>
      </aside>

      {/* Main Content with Left Margin */}
      <div className="flex-1 ml-20">
        {/* Main Content */}
        <main className="flex flex-col items-center justify-center p-10 min-h-screen">
        
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
                  <div className="text-xl text-white font-medium mb-4">
                    {message.content}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-blue-200">
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
                    <div className="text-white leading-relaxed">
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
            <div className="flex items-center gap-2 text-sm text-blue-200 mb-2">
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
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}

        {/* Chat Input */}
        <div className="w-full max-w-3xl bg-slate-800 border border-blue-500/30 shadow-md rounded-full px-6 py-4 flex items-center space-x-4">
          <input
            type="text"
            placeholder="Ask about KPIs or performance..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 outline-none text-white placeholder-blue-200/50 bg-transparent"
          />
          <button className="text-blue-200 hover:text-white transition-colors">
            <Globe className="w-5 h-5" />
          </button>
          <button className="text-blue-200 hover:text-white transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsVoiceActive(!isVoiceActive)}
            className={`transition-colors ${isVoiceActive ? 'text-red-500' : 'text-blue-200 hover:text-white'}`}
          >
            <Mic className="w-5 h-5" />
          </button>
          <button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className={`ml-2 rounded-full px-4 py-2 transition-colors ${
              inputValue.trim() 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white' 
                : 'bg-slate-600 text-slate-400 opacity-50 cursor-not-allowed'
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