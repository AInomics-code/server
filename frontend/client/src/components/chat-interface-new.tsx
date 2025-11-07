import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./sidebar";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { Menu, TrendingUp, AlertTriangle, Star, Mic, Send, BarChart3, User, Phone, Package, MapPin, ArrowRight, Search, Globe, Target, TrendingDown, Check, ArrowDown, Paperclip, MoreHorizontal, Copy, FileText, RotateCcw, Plus, BarChart, Brain, Info, Home, BarChart2, Bell, Settings, LogOut } from "lucide-react";
import vortexLogo from "@assets/Screenshot 2025-05-26 alle 13.53.01.png";
import laDonaLogo from "@assets/Screenshot 2025-05-19 alle 15.08.46.png";

export function ChatInterface() {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    setIsProcessing(true);
    setIsLoading(true);
    
    try {
      // Simulate message processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      setInputValue('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsProcessing(false);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      
      {/* Vertical Sidebar Navigation */}
      <aside className="w-16 bg-gray-900 flex flex-col items-center py-6">
        {/* La Doña Logo at Top */}
        <div className="mb-8">
          <img 
            src={laDonaLogo} 
            alt="La Doña" 
            className="h-8 w-8 rounded"
          />
        </div>

        {/* Vertical Icon Stack */}
        <nav className="flex flex-col gap-6 flex-1">
          <button 
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Home"
          >
            <Home className="w-5 h-5" />
          </button>
          <button 
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Dashboard"
          >
            <BarChart2 className="w-5 h-5" />
          </button>
          <button 
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>
          <button 
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </nav>

        {/* User Profile & Logout at Bottom */}
        <div className="flex flex-col gap-4 mt-auto">
          <button 
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Carlos Mendoza"
          >
            <User className="w-5 h-5" />
          </button>
          <button 
            className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main Content Area - Chat Centered */}
      <main className="flex-1 flex flex-col items-center justify-center pt-[12vh] pb-[8vh] bg-white">

        {/* Floating Vorta Logo with Pulse */}
        <div className="vortex-icon animate-pulse mb-4" style={{ width: '40px', height: '40px' }}>
          <div className="vortex-blade"></div>
          <div className="vortex-blade"></div>
          <div className="vortex-blade"></div>
          <div className="vortex-blade"></div>
          <div className="vortex-blade"></div>
          <div className="vortex-blade"></div>
        </div>

        {/* Chat Input Container with Focus Expansion */}
        <div className={`flex items-center w-[640px] max-w-[90%] px-6 py-[14px] rounded-[40px] border border-gray-300 shadow-[0_8px_20px_rgba(0,0,0,0.05)] bg-white gap-3 transition-all duration-300 ${
          inputValue.trim() ? 'transform scale-105' : ''
        }`}>
          
          {/* Text Input Field */}
          <input
            type="text"
            placeholder="Ask about KPIs or performance..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 text-lg border-none outline-none text-gray-600 bg-transparent placeholder:text-gray-400"
          />

          {/* Chat Actions - Icons and Ask Button */}
          <div className="flex items-center gap-3">
            
            {/* Icon Buttons */}
            <button 
              className="bg-none border-none text-lg text-gray-400 cursor-pointer transition-transform duration-200 hover:scale-110 hover:text-gray-600"
              title="Attachment"
            >
              <Paperclip className="w-[18px] h-[18px]" />
            </button>
            
            <button 
              className="bg-none border-none text-lg text-gray-400 cursor-pointer transition-transform duration-200 hover:scale-110 hover:text-gray-600"
              title="Globe"
            >
              <Globe className="w-[18px] h-[18px]" />
            </button>
            
            <button 
              className="bg-none border-none text-lg text-gray-400 cursor-pointer transition-transform duration-200 hover:scale-110 hover:text-gray-600"
              title="Voice"
              onClick={() => setIsVoiceActive(!isVoiceActive)}
            >
              <Mic className={`w-[18px] h-[18px] ${isVoiceActive ? 'text-rose-400' : ''}`} />
            </button>

            {/* Ask Button - Dynamic Active State */}
            <button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isProcessing}
              className={`text-white font-medium border-none rounded-[18px] cursor-pointer transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed ${
                inputValue.trim().length > 0 
                  ? 'bg-red-500 py-3 px-[26px] shadow-[0_6px_16px_rgba(239,68,68,0.35)] scale-110' 
                  : 'bg-rose-300 py-[10px] px-5 shadow-[0_4px_12px_rgba(249,168,168,0.3)] hover:bg-red-400'
              }`}
            >
              {isProcessing ? 'Processing...' : 'Ask'}
            </button>
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="mt-4 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-rose-500"></div>
            <span className="text-sm text-gray-600">Analyzing your request...</span>
          </div>
        )}
      </main>
    </div>
  );
}