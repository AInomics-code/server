import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./sidebar";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import {
  Menu,
  TrendingUp,
  AlertTriangle,
  Star,
  Mic,
  Send,
  BarChart3,
  User,
  Phone,
  Package,
  MapPin,
  ArrowRight,
  Search,
  Globe,
  Target,
  TrendingDown,
  Check,
  ArrowDown,
  Paperclip,
  MoreHorizontal,
  Copy,
  FileText,
  RotateCcw,
  Plus,
  BarChart,
  Brain,
  Info,
  Home,
  BarChart2,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import vortexLogo from "@assets/Screenshot 2025-05-26 alle 13.53.01.png";
import laDonaLogo from "@assets/Screenshot 2025-05-19 alle 15.08.46.png";

export function ChatInterface() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  const [showResponse, setShowResponse] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [typingText, setTypingText] = useState("");
  const [showActions, setShowActions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [isLoading]);

  const typewriterEffect = (text: string, callback: () => void) => {
    let index = 0;
    setTypingText("");
    const timer = setInterval(() => {
      if (index < text.length) {
        setTypingText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(timer);
        callback();
      }
    }, 30);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    setIsProcessing(true);
    setShowResponse(true);
    setShowActions(false);

    // Simulate processing delay
    setTimeout(() => {
      const response =
        "Based on your La Doña regional performance data, I can see that Colón region is currently at 67% of target with some challenges in vinegar sales and delivery timelines. Would you like me to analyze the specific factors contributing to this performance gap?";

      typewriterEffect(response, () => {
        setCurrentResponse(response);
        setIsProcessing(false);
        setTimeout(() => setShowActions(true), 500);
      });
    }, 2000);

    setInputValue("");
  };

  const handleVoiceToggle = () => {
    setIsVoiceActive(!isVoiceActive);
  };

  const handleFileAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setAttachedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleSelectConversation = (id: number | null) => {
    setSelectedConversationId(id);
    // Close sidebar on mobile when selecting a conversation
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Chat Container - Centered Layout */}
      <main className="flex flex-col items-center pt-[10vh] pb-[5vh] bg-white min-h-screen justify-center">
        {/* Floating Vorta Logo with Pulse */}
        {/* <div className="vortex-icon animate-pulse mb-4" style={{ width: '40px', height: '40px' }}>
          <div className="vortex-blade"></div>
          <div className="vortex-blade"></div>
          <div className="vortex-blade"></div>
          <div className="vortex-blade"></div>
          <div className="vortex-blade"></div>
          <div className="vortex-blade"></div>
        </div> */}

        {/* Chat Input Container */}
        <div className="flex items-center w-[640px] max-w-[90%] px-6 py-[14px] rounded-[40px] border border-gray-300 shadow-[0_8px_20px_rgba(0,0,0,0.05)] bg-white gap-3 pt-[23px] pb-[23px]">
          {/* Text Input Field */}
          <input
            type="text"
            placeholder="Pregunta sobre KPIs o rendimiento..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 text-lg border-none outline-none text-gray-600 bg-transparent placeholder:text-gray-400"
          />

          {/* Chat Actions - Icons and Ask Button */}
          <div className="flex items-center gap-3">
            {/* Icon Buttons */}
            <button
              className="bg-none border-none text-lg text-gray-400 cursor-pointer transition-transform duration-200 hover:scale-110"
              title="Adjuntar archivo"
            >
              <Paperclip className="w-[18px] h-[18px]" />
            </button>

            <button
              className="bg-none border-none text-lg text-gray-400 cursor-pointer transition-transform duration-200 hover:scale-110"
              title="Idioma"
            >
              <Globe className="w-[18px] h-[18px]" />
            </button>

            <button
              className="bg-none border-none text-lg text-gray-400 cursor-pointer transition-transform duration-200 hover:scale-110"
              title="Voz"
              onClick={() => setIsVoiceActive(!isVoiceActive)}
            >
              <Mic
                className={`w-[18px] h-[18px] ${isVoiceActive ? "text-rose-400" : ""}`}
              />
            </button>

            {/* Ask Button - Dynamic Active State */}
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isProcessing}
              className={`text-white font-medium border-none rounded-[18px] cursor-pointer transition-all duration-[250ms] ease-in-out disabled:opacity-50 disabled:cursor-not-allowed ${
                inputValue.trim().length > 0
                  ? "bg-red-500 py-3 px-[26px] shadow-[0_6px_16px_rgba(239,68,68,0.35)]"
                  : "bg-rose-300 py-[10px] px-5 shadow-[0_4px_12px_rgba(249,168,168,0.3)] hover:bg-red-400"
              }`}
            >
              {isProcessing ? "Procesando..." : "Preguntar"}
            </button>
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="mt-4 flex items-center gap-2">
            <div className="vortex-icon active scale-75">
              <div className="vortex-blade"></div>
              <div className="vortex-blade"></div>
              <div className="vortex-blade"></div>
              <div className="vortex-blade"></div>
              <div className="vortex-blade"></div>
              <div className="vortex-blade"></div>
            </div>
            <p className="text-sm text-gray-400 italic animate-pulse">
              Preparando insights…
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
