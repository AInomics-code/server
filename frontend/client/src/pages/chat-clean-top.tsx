import { useState, useRef, useEffect } from "react";
import {
  Paperclip,
  Globe,
  Mic,
  Search,
  BarChart2,
  ChevronDown,
  ChevronUp,
  ArrowUp,
} from "lucide-react";
import { TypingMessage } from "@/components/typing-message";
import {
  AnimatedCounter,
  PulseIndicator,
  HoverCard,
  ProgressBar,
  FeedbackToast,
} from "@/components/micro-interactions";
import { PromptGenerator } from "@/components/prompt-generator";

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
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speechLanguage, setSpeechLanguage] = useState("es-ES");
  
  // Language-dependent text content
  const isEnglish = speechLanguage === "en-US";
  const text = {
    performanceScore: isEnglish ? "Performance Score" : "Puntuación de Rendimiento",
    zonesAtRisk: isEnglish ? "Zones at Risk" : "Zonas en Riesgo", 
    productOpportunity: isEnglish ? "Product Opportunity" : "Oportunidad de Producto",
    salesTarget: isEnglish ? "of sales target achieved" : "del objetivo de ventas cumplido",
    clickForDetails: isEnglish ? "Click for details" : "Haz clic para ver detalles",
    salesPerformance: isEnglish ? "Sales Performance" : "Rendimiento de Ventas",
    of: isEnglish ? "of" : "de",
    target: isEnglish ? "target" : "objetivo",
    topPerformers: isEnglish ? "Top Performers" : "Mejores Resultados",
    regions: isEnglish ? "Regions" : "Regiones",
    reps: isEnglish ? "Reps" : "Representantes",
    products: isEnglish ? "Products" : "Productos",
    criticalAlerts: isEnglish ? "Critical Alerts" : "Alertas Críticas",
    stockouts: isEnglish ? "stockouts reported" : "agotamientos reportados",
    overdueAccounts: isEnglish ? "overdue accounts" : "cuentas morosas",
    lowInventory: isEnglish ? "low inventory alerts" : "alertas de inventario bajo",
    opportunities: isEnglish ? "Opportunities" : "Oportunidades",
    newClients: isEnglish ? "new client prospects" : "nuevos prospectos de clientes",
    productLaunches: isEnglish ? "product launch opportunities" : "oportunidades de lanzamiento",
    expansions: isEnglish ? "expansion territories" : "territorios de expansión",
    listening: isEnglish ? "Listening..." : "Escuchando...",
    askAnything: isEnglish ? "Ask anything..." : "Pregunta lo que quieras…",
    sendMessage: isEnglish ? "Send message" : "Enviar mensaje",
    language: isEnglish ? "Switch to Spanish" : "Cambiar idioma a Inglés"
  };
  const [inputFeedback, setInputFeedback] = useState<
    "success" | "error" | null
  >(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showPromptGenerator, setShowPromptGenerator] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Keyboard shortcuts for voice control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + M to toggle voice
      if ((e.ctrlKey || e.metaKey) && e.key === "m") {
        e.preventDefault();
        toggleVoice();
      }
      // Ctrl/Cmd + L to toggle language
      if ((e.ctrlKey || e.metaKey) && e.key === "l") {
        e.preventDefault();
        toggleLanguage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [speechSupported, isListening, speechLanguage]);

  // Initialize speech recognition
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      setSpeechSupported(true);
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = speechLanguage;
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setInterimTranscript("");

        // Set a timeout to automatically stop listening after 30 seconds
        speechTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
          }
        }, 30000);
      };

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = "";
        let interimText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimText += transcript;
          }
        }

        if (finalTranscript) {
          setInputValue((prev) => prev + finalTranscript);
          setInterimTranscript("");
        } else {
          setInterimTranscript(interimText);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        setInterimTranscript("");

        // Handle specific errors with user-friendly messages
        if (event.error === "not-allowed") {
          alert(
            "Acceso al micrófono denegado. Por favor permite el acceso al micrófono e intenta de nuevo.",
          );
        } else if (event.error === "no-speech") {
          // Restart listening automatically if no speech detected
          setTimeout(() => {
            if (recognitionRef.current && isListening) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.log("Recognition restart failed:", e);
              }
            }
          }, 100);
        } else if (event.error === "network") {
          alert("Error de conexión. Verifica tu conexión a internet.");
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setInterimTranscript("");

        // Clear timeout
        if (speechTimeoutRef.current) {
          clearTimeout(speechTimeoutRef.current);
          speechTimeoutRef.current = null;
        }
      };
    } else {
      setSpeechSupported(false);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const messageContent = inputValue.trim();

    // Show success feedback
    setInputFeedback("success");
    setTimeout(() => setInputFeedback(null), 600);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      // Send message to API
      const response = await fetch("/api/conversations/1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: messageContent,
          role: "user",
          language: speechLanguage === "es-ES" ? "es" : "en",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Get only the latest AI response instead of all messages
      const messagesResponse = await fetch("/api/conversations/1/messages");
      if (messagesResponse.ok) {
        const data = await messagesResponse.json();
        // Find the latest AI response
        const latestAiMessage = data
          .filter((msg: any) => msg.role === "assistant")
          .pop();
        if (latestAiMessage) {
          const aiMessage: Message = {
            id: latestAiMessage.id.toString(),
            content: latestAiMessage.content,
            isUser: false,
            timestamp: new Date(latestAiMessage.timestamp),
          };
          setMessages((prev) => [...prev, aiMessage]);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // Show error feedback
      setInputFeedback("error");
      setToastMessage("Error de conexión. Verifica tu red e intenta de nuevo.");
      setShowToast(true);
      setTimeout(() => setInputFeedback(null), 600);

      // Show error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I'm experiencing connection issues. Please check your network and try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoice = async () => {
    if (!speechSupported) {
      alert(
        "Reconocimiento de voz no compatible con este navegador. Prueba con Chrome o Firefox.",
      );
      return;
    }

    if (!recognitionRef.current) {
      alert(
        "Error al inicializar el reconocimiento de voz. Recarga la página e intenta de nuevo.",
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
      }
    } else {
      try {
        // Request microphone permission first
        await navigator.mediaDevices.getUserMedia({ audio: true });
        // Update language setting before starting
        recognitionRef.current.lang = speechLanguage;
        recognitionRef.current.start();
      } catch (error) {
        console.error("Speech recognition error:", error);
        setIsListening(false);
        alert(
          "No se pudo acceder al micrófono. Verifica los permisos del navegador.",
        );
      }
    }
  };

  const toggleLanguage = () => {
    const newLang = speechLanguage === "es-ES" ? "en-US" : "es-ES";
    setSpeechLanguage(newLang);

    // If currently listening, restart with new language
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.lang = newLang;
          recognitionRef.current.start();
        }
      }, 100);
    }
  };

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const handlePromptSelect = (prompt: string) => {
    setInputValue(prompt);
    // Automatically send the selected prompt
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e]">
      {/* Feedback Toast */}
      <FeedbackToast
        type="error"
        message={toastMessage}
        show={showToast}
        onHide={() => setShowToast(false)}
      />
      {/* Top KPI Dashboard - Dark Theme */}
      <div className="bg-gradient-to-r from-[#1a1a2e]/80 to-[#16213e]/80 px-6 py-4 backdrop-blur-md border-b border-blue-500/20">
        <div className="flex flex-col md:flex-row gap-3 justify-between">
          {/* Performance Card */}
          <div
            onClick={() => toggleCard("performance")}
            className={`group bg-gradient-to-br from-[#1c2340]/80 to-[#2a3b5c]/80 rounded-lg shadow-lg hover:shadow-xl p-2 cursor-pointer transition-all duration-500 border border-blue-500/20 hover:border-blue-400/30 flex-1 backdrop-blur-sm ${
              expandedCard === "performance"
                ? "min-h-[200px] shadow-xl animate-scaleIn"
                : "min-h-[50px]"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-400 rounded-full shadow-sm"></div>
                <h4 className="text-sm font-medium text-white group-hover:text-blue-200 transition">
                  {text.performanceScore}
                </h4>
              </div>
              {expandedCard === "performance" ? (
                <ChevronUp size={16} className="text-blue-300" />
              ) : (
                <ChevronDown
                  size={14}
                  className="text-blue-400/70 group-hover:text-blue-300 transition"
                />
              )}
            </div>

            {expandedCard !== "performance" ? (
              <>
                <p className="text-3xl font-semibold text-white">
                  <AnimatedCounter value={88} duration={1500} />
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-blue-200/70">
                    <AnimatedCounter value={82} duration={1200} suffix="%" /> {text.salesTarget}
                  </p>
                  <PulseIndicator color="green" size="sm" />
                </div>
                <p className="text-xs text-blue-300/60 mt-2 italic">
                  Haz clic para ver detalles
                </p>
              </>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className="bg-slate-800 rounded-lg p-3 intelligence-clickable border border-slate-600"
                    onClick={() =>
                      setInputValue(
                        "What is our current sales performance and how close are we to target?",
                      )
                    }
                  >
                    <h5 className="text-sm font-semibold text-blue-200 mb-2">
                      {text.salesPerformance}
                    </h5>
                    <p className="text-2xl font-bold text-green-400">
                      <AnimatedCounter value={82} duration={1300} suffix="%" />
                    </p>
                    <p className="text-sm text-blue-200">
                      $<AnimatedCounter value={369} duration={1500} />K {text.of} $450K {text.target}
                    </p>
                    <div className="mt-2">
                      <ProgressBar value={82} max={100} color="green" />
                    </div>
                  </div>
                  <div
                    className="bg-slate-800 rounded-lg p-3 intelligence-clickable border border-slate-600"
                    onClick={() =>
                      setInputValue(
                        "Which region, rep, and SKU are driving the strongest results and why?",
                      )
                    }
                  >
                    <h5 className="text-sm font-semibold text-blue-200 mb-2">
                      {text.topPerformers}
                    </h5>
                    <p className="text-sm text-blue-200 mb-1">
                      <strong>Best SKU:</strong> SKU 183 – Bananas
                    </p>
                    <p className="text-sm text-blue-200 mb-1">
                      <strong>Best Region:</strong> Chiriquí (+8%)
                    </p>
                    <p className="text-sm text-blue-200">
                      <strong>Best Rep:</strong> Carlos Mendez
                    </p>
                  </div>
                </div>
                <div
                  className="bg-slate-800 rounded-lg p-3 intelligence-clickable border border-slate-600"
                  onClick={() =>
                    setInputValue(
                      "Explain this month's key insights and what actions we should take.",
                    )
                  }
                >
                  <h5 className="text-sm font-semibold text-blue-200 mb-2">
                    Key Insights
                  </h5>
                  <ul className="text-sm text-blue-200 space-y-1">
                    <li>• Revenue up 12% vs last month</li>
                    <li>• 5 new clients acquired this quarter</li>
                    <li>• Premium products showing 15% growth</li>
                    <li>• Export sales exceeding expectations by 18%</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Risk Card */}
          <div
            onClick={() => toggleCard("risks")}
            className={`group bg-gradient-to-br from-[#1c2340]/80 to-[#2a3b5c]/80 rounded-lg shadow-lg hover:shadow-xl p-2 cursor-pointer transition-all duration-500 border border-blue-500/20 hover:border-red-400/30 flex-1 backdrop-blur-sm ${
              expandedCard === "risks"
                ? "min-h-[200px] shadow-xl animate-scaleIn"
                : "min-h-[50px]"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full shadow-sm"></div>
                <h4 className="text-sm font-medium text-white group-hover:text-blue-200 transition">
                  {text.zonesAtRisk}
                </h4>
              </div>
              {expandedCard === "risks" ? (
                <ChevronUp size={16} className="text-blue-300" />
              ) : (
                <ChevronDown
                  size={14}
                  className="text-blue-400/70 group-hover:text-blue-300 transition"
                />
              )}
            </div>

            {expandedCard !== "risks" ? (
              <>
                <p className="text-2xl font-semibold text-white">3 {isEnglish ? "Zones" : "Zonas"}</p>
                <p className="text-xs text-blue-200/70">
                  Chiriquí, Colón, San Miguelito
                </p>
                <p className="text-xs text-blue-300/60 mt-2 italic">
                  Haz clic para ver detalles
                </p>
              </>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    className="bg-slate-800 rounded-lg p-3 intelligence-clickable border border-red-500/30"
                    onClick={() =>
                      setInputValue(
                        "What are our critical issues and backorders? How can we resolve them?",
                      )
                    }
                  >
                    <h5 className="text-sm font-semibold text-red-400 mb-2">
                      Critical Issues
                    </h5>
                    <p className="text-xl font-bold text-red-400">28</p>
                    <p className="text-sm text-red-300">Total backorders</p>
                  </div>
                  <div
                    className="bg-slate-800 rounded-lg p-3 intelligence-clickable border border-orange-500/30"
                    onClick={() =>
                      setInputValue(
                        "Which products are out of stock and what's the urgency level?",
                      )
                    }
                  >
                    <h5 className="text-sm font-semibold text-orange-400 mb-2">
                      Out of Stock
                    </h5>
                    <p className="text-xl font-bold text-orange-400">14</p>
                    <p className="text-sm text-orange-300">Urgent items</p>
                  </div>
                  <div
                    className="bg-slate-800 rounded-lg p-3 intelligence-clickable border border-yellow-500/30"
                    onClick={() =>
                      setInputValue(
                        "Show me details about overdue payments and recovery strategies.",
                      )
                    }
                  >
                    <h5 className="text-sm font-semibold text-yellow-400 mb-2">
                      Overdue
                    </h5>
                    <p className="text-lg font-bold text-yellow-400">$24.3K</p>
                    <p className="text-sm text-yellow-300">120+ days</p>
                  </div>
                </div>
                <div
                  className="bg-slate-800 rounded-lg p-3 intelligence-clickable border border-slate-600"
                  onClick={() =>
                    setInputValue(
                      "Analyze risk zones Chiriquí, Colón, and San Miguelito. What actions should we take?",
                    )
                  }
                >
                  <h5 className="text-sm font-semibold text-blue-200 mb-2">
                    Risk Zones Details
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-200">Chiriquí</span>
                      <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs border border-red-500/30">
                        High Risk
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-200">Colón</span>
                      <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full text-xs border border-orange-500/30">
                        Medium Risk
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-200">San Miguelito</span>
                      <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs border border-yellow-500/30">
                        Low Risk
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Opportunity Card */}
          <div
            onClick={() => toggleCard("opportunities")}
            className={`group bg-gradient-to-br from-[#1c2340]/80 to-[#2a3b5c]/80 rounded-lg shadow-lg hover:shadow-xl p-2 cursor-pointer transition-all duration-500 border border-blue-500/20 hover:border-yellow-400/30 flex-1 backdrop-blur-sm ${
              expandedCard === "opportunities"
                ? "min-h-[200px] shadow-xl"
                : "min-h-[50px]"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full shadow-sm"></div>
                <h4 className="text-sm font-medium text-white group-hover:text-blue-200 transition">
                  {text.productOpportunity}
                </h4>
              </div>
              {expandedCard === "opportunities" ? (
                <ChevronUp size={16} className="text-blue-300" />
              ) : (
                <ChevronDown
                  size={14}
                  className="text-blue-400/70 group-hover:text-blue-300 transition"
                />
              )}
            </div>

            {expandedCard !== "opportunities" ? (
              <>
                <p className="text-lg font-semibold text-white">
                  Vinagre Premium
                </p>
                <p className="text-xs text-blue-200/70">
                  {isEnglish ? "High potential • Weak: Mango Salsa" : "Alto potencial • Débil: Mango Salsa"}
                </p>
                <p className="text-xs text-blue-300/60 mt-2 italic">
                  {text.clickForDetails}
                </p>
              </>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className="bg-slate-800 rounded-lg p-3 intelligence-clickable border border-green-500/30"
                    onClick={() =>
                      setInputValue(
                        "Tell me about Vinagre Premium opportunity and how to maximize the $45K potential revenue.",
                      )
                    }
                  >
                    <h5 className="text-sm font-semibold text-green-400 mb-2">
                      {isEnglish ? "High Opportunity" : "Alta Oportunidad"}
                    </h5>
                    <p className="text-lg font-bold text-green-400">
                      Vinagre Premium
                    </p>
                    <p className="text-sm text-green-300 mb-2">
                      +$45K {isEnglish ? "potential revenue" : "ingresos potenciales"}
                    </p>
                    <div className="text-xs text-green-300">
                      <p>• {isEnglish ? "Increase distribution to 15 new stores" : "Incrementar distribución a 15 tiendas nuevas"}</p>
                      <p>• {isEnglish ? "Focus on premium market segment" : "Enfoque en segmento premium"}</p>
                    </div>
                  </div>
                  <div
                    className="bg-slate-800 rounded-lg p-3 intelligence-clickable border border-red-500/30"
                    onClick={() =>
                      setInputValue(
                        "Analyze Mango Salsa underperformance and suggest solutions or discontinuation strategy.",
                      )
                    }
                  >
                    <h5 className="text-sm font-semibold text-red-400 mb-2">
                      {isEnglish ? "Underperforming" : "Bajo Rendimiento"}
                    </h5>
                    <p className="text-lg font-bold text-red-400">
                      Mango Salsa
                    </p>
                    <p className="text-sm text-red-300 mb-2">
                      -$12K {isEnglish ? "revenue impact" : "impacto en ingresos"}
                    </p>
                    <div className="text-xs text-red-300">
                      <p>• {isEnglish ? "Consider discontinuation" : "Considerar descontinuación"}</p>
                      <p>• {isEnglish ? "Low demand across all regions" : "Baja demanda en todas las regiones"}</p>
                    </div>
                  </div>
                </div>
                <div
                  className="bg-slate-800 rounded-lg p-3 intelligence-clickable border border-slate-600"
                  onClick={() =>
                    setInputValue(
                      "Detail the strategic actions for Vinagre Premium launch and Aceite de Coco promotion timeline.",
                    )
                  }
                >
                  <h5 className="text-sm font-semibold text-blue-200 mb-2">
                    Strategic Actions
                  </h5>
                  <div className="space-y-2 text-sm text-blue-200">
                    <div
                      className="flex items-center gap-2 animate-slideInLeft"
                      style={{ animationDelay: "0ms" }}
                    >
                      <PulseIndicator color="blue" size="sm" />
                      <span>
                        Launch Vinagre Premium in Panamá Centro (+8 stores)
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-2 animate-slideInLeft"
                      style={{ animationDelay: "150ms" }}
                    >
                      <PulseIndicator color="green" size="sm" />
                      <span>Promotional campaign for Aceite de Coco</span>
                    </div>
                    <div
                      className="flex items-center gap-2 animate-slideInLeft"
                      style={{ animationDelay: "300ms" }}
                    >
                      <PulseIndicator color="yellow" size="sm" />
                      <span>Review Mango Salsa pricing strategy</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Main Chat Interface */}
      <div className="flex flex-col h-[calc(100vh-120px)]">
        <main className="flex flex-col items-center p-8 flex-1 relative">
          {/* 1. BRAND SECTION (Top Centered) */}
          {messages.length === 0 && !isTyping && (
            <>
              <div className="flex flex-col items-center mt-8 mb-4">
                <div
                  className="vortex-icon mb-2"
                  style={
                    {
                      width: "32px",
                      height: "32px",
                      "--vortex-size": "32px",
                      animation: "vortex-slow-rotate 20s linear infinite",
                    } as React.CSSProperties
                  }
                >
                  <div className="vortex-blade"></div>
                  <div className="vortex-blade"></div>
                  <div className="vortex-blade"></div>
                  <div className="vortex-blade"></div>
                  <div className="vortex-blade"></div>
                </div>
                <h1 className="text-xl font-semibold tracking-wide text-[#CBD5E1]">VORTA</h1>
                <p className="text-xs tracking-widest text-slate-400 uppercase">Ainomics</p>
              </div>

              {/* 2. PAGE TITLE + SUBTITLE */}
              <div className="text-center mt-6">
                <h2 className="text-3xl font-bold text-white mb-1">KPIs</h2>
                <h3 className="text-xl font-medium text-slate-300">Try these prompts</h3>
              </div>

              {/* 3. PROMPTS SECTION (4-6 tiles, like Copilot) */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 max-w-4xl mx-auto">
                <div 
                  className="bg-slate-800 rounded-2xl p-4 hover:bg-slate-700 transition cursor-pointer"
                  onClick={() => setInputValue("What are my top performing regions?")}
                >
                  <p className="text-white font-semibold">💡 What are my top performing regions?</p>
                  <p className="text-slate-400 text-sm">Get a breakdown by performance</p>
                </div>
                <div 
                  className="bg-slate-800 rounded-2xl p-4 hover:bg-slate-700 transition cursor-pointer"
                  onClick={() => setInputValue("Where are we underperforming?")}
                >
                  <p className="text-white font-semibold">📉 Where are we underperforming?</p>
                  <p className="text-slate-400 text-sm">See KPIs not meeting targets</p>
                </div>
                <div 
                  className="bg-slate-800 rounded-2xl p-4 hover:bg-slate-700 transition cursor-pointer"
                  onClick={() => setInputValue("What products aren't moving?")}
                >
                  <p className="text-white font-semibold">📦 What products aren't moving?</p>
                  <p className="text-slate-400 text-sm">Low SKU turnover detection</p>
                </div>
                <div 
                  className="bg-slate-800 rounded-2xl p-4 hover:bg-slate-700 transition cursor-pointer"
                  onClick={() => setInputValue("Forecast next quarter")}
                >
                  <p className="text-white font-semibold">📊 Forecast next quarter</p>
                  <p className="text-slate-400 text-sm">Predict based on current trend</p>
                </div>
                <div 
                  className="bg-slate-800 rounded-2xl p-4 hover:bg-slate-700 transition cursor-pointer"
                  onClick={() => setInputValue("Show me budget variance analysis")}
                >
                  <p className="text-white font-semibold">💰 Budget variance analysis</p>
                  <p className="text-slate-400 text-sm">Compare actual vs planned spending</p>
                </div>
                <div 
                  className="bg-slate-800 rounded-2xl p-4 hover:bg-slate-700 transition cursor-pointer"
                  onClick={() => setInputValue("Which channels need attention?")}
                >
                  <p className="text-white font-semibold">🎯 Channel performance</p>
                  <p className="text-slate-400 text-sm">Identify improvement opportunities</p>
                </div>
              </div>

              {/* 4. KPI CARDS GRID (cleaner spacing) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 px-6 w-full max-w-4xl">
                <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 shadow-sm">
                  <p className="text-slate-400 text-sm">Puntuación de Rendimiento</p>
                  <h2 className="text-white text-3xl font-bold mt-1">88</h2>
                  <p className="text-slate-500 text-sm">82% del objetivo de ventas cumplido</p>
                </div>
                <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 shadow-sm">
                  <p className="text-red-400 text-sm">Zonas en Riesgo</p>
                  <h2 className="text-white text-2xl font-semibold mt-1">3 Zonas</h2>
                  <p className="text-slate-500 text-sm">Chiriquí, Colón, San Miguelito</p>
                </div>
                <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 shadow-sm">
                  <p className="text-yellow-400 text-sm">Oportunidad de Producto</p>
                  <h2 className="text-white text-md font-semibold mt-1">Vinagre Premium</h2>
                  <p className="text-slate-500 text-sm">Alto potencial · Débil: Mango Salsa</p>
                </div>
              </div>
            </>
          )}

          {/* Messages Area */}
          {messages.length > 0 && (
            <div className="flex-1 w-full max-w-4xl overflow-y-auto mb-8 px-8">
              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className="animate-fadeInUp"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {message.isUser ? (
                      <div className="flex justify-end">
                        <div className="user-bubble bg-gradient-to-br from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-2xl rounded-bl-md max-w-[70%] animate-slideInRight text-sm font-normal leading-relaxed shadow-sm interactive-hover">
                          {message.content}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-blue-200/70">
                          <div
                            className="vortex-icon active"
                            style={
                              {
                                width: "14px",
                                height: "14px",
                                "--vortex-size": "14px",
                              } as React.CSSProperties
                            }
                          >
                            <div className="vortex-blade"></div>
                            <div className="vortex-blade"></div>
                            <div className="vortex-blade"></div>
                            <div className="vortex-blade"></div>
                            <div className="vortex-blade"></div>
                          </div>
                          <span>La Doña AI</span>
                        </div>
                        <TypingMessage
                          content={message.content}
                          isLatestMessage={
                            messages.indexOf(message) === messages.length - 1 &&
                            !message.isUser
                          }
                          messageId={message.id}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Typing Indicator */}
          {isTyping && (
            <div className="mb-8 animate-bounceIn">
              <div className="flex items-center gap-2 text-sm text-blue-200/70 mb-3 animate-slideInLeft">
                <div
                  className="vortex-icon active animate-glow"
                  style={
                    {
                      width: "14px",
                      height: "14px",
                      "--vortex-size": "14px",
                    } as React.CSSProperties
                  }
                >
                  <div className="vortex-blade"></div>
                  <div className="vortex-blade"></div>
                  <div className="vortex-blade"></div>
                  <div className="vortex-blade"></div>
                  <div className="vortex-blade"></div>
                </div>
                <span className="shimmer-loading text-blue-200">
                  La Doña AI está analizando...
                </span>
              </div>
              <div className="typing-indicator animate-fadeInUp">
                <span
                  className="animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></span>
                <span
                  className="animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></span>
                <span
                  className="animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></span>
              </div>
            </div>
          )}

          {/* 5. TEXT INPUT SECTION (Copilot-style) */}
          <div className="mt-12 flex justify-center w-full">
            <div 
              className={`bg-slate-800 rounded-full flex items-center px-4 py-2 w-[600px] max-w-full shadow-inner transition-all duration-200 ${
                inputFeedback === "success"
                  ? "feedback-success border-green-400/50"
                  : inputFeedback === "error"
                    ? "feedback-error border-red-400/50"
                    : isListening
                      ? "bg-red-500/20 shadow-lg shadow-red-500/20 animate-glow"
                      : ""
              }`}
            >
              {/* Input field with speech overlay */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    isListening ? text.listening : "Ask anything about your business..."
                  }
                  className="flex-grow bg-transparent outline-none text-white placeholder-slate-400 px-2 text-lg"
                  disabled={isTyping}
                />

                {/* Interim speech results overlay */}
                {isListening && interimTranscript && (
                  <div className="absolute inset-0 px-2 py-2 text-lg text-slate-300 italic pointer-events-none">
                    {inputValue}
                    {interimTranscript}
                  </div>
                )}

                {/* Voice recording indicator */}
                {isListening && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    <div className="flex gap-1">
                      <div
                        className="w-1 h-3 bg-red-400 rounded-full animate-pulse"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-1 h-4 bg-red-500 rounded-full animate-pulse"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-1 h-2 bg-red-400 rounded-full animate-pulse"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                    <span className="text-xs text-red-500 font-medium">
                      REC
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {/* Language toggle for speech recognition */}
                {speechSupported && (
                  <button
                    onClick={toggleLanguage}
                    title={text.language}
                    className="px-2 py-1 text-xs font-medium text-slate-400 hover:text-white rounded-md transition-all duration-150 button-press ripple-effect"
                  >
                    {speechLanguage === "es-ES" ? "ES" : "EN"}
                  </button>
                )}

                {/* Attachment button */}
                <button
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                {/* Voice button */}
                <button
                  onClick={toggleVoice}
                  title={
                    !speechSupported
                      ? "Reconocimiento de voz no disponible"
                      : isListening
                        ? "Hacer clic para detener grabación (Ctrl+M)"
                        : "Hacer clic y hablar (Ctrl+M)"
                  }
                  disabled={!speechSupported}
                  className={`relative transition-colors ${
                    !speechSupported
                      ? "text-slate-600 cursor-not-allowed"
                      : isListening
                        ? "text-white bg-red-500 rounded-full p-1 shadow-lg shadow-red-500/50 scale-105 animate-glow"
                        : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Mic className="w-5 h-5" />
                  {isListening && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-ping"></div>
                  )}
                </button>

                {/* Send arrow button */}
                <button
                  onClick={handleSendMessage}
                  title={text.sendMessage}
                  className={`transition-colors ${
                    inputValue.trim() && !isTyping
                      ? "text-blue-500 hover:text-blue-400"
                      : "text-slate-600 cursor-not-allowed"
                  }`}
                  disabled={!inputValue.trim() || isTyping}
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div ref={messagesEndRef} />
        </main>
      </div>

      {/* AI Prompt Generator */}
      <PromptGenerator
        onPromptSelect={handlePromptSelect}
        isVisible={showPromptGenerator}
        onToggle={() => setShowPromptGenerator(!showPromptGenerator)}
      />
    </div>
  );
}
