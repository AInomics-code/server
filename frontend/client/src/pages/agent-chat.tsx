import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { agentService, QueryResponse } from "@/services/agentService";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  data?: any;
  metadata?: QueryResponse['metadata'];
}

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Don't generate session_id - let backend create it for new conversations
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId] = useState(() => {
    return localStorage.getItem('userId') || 'user';
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    setMessages([
      {
        id: "welcome",
        content: "¡Hola! Soy tu asistente de análisis de datos. Puedo ayudarte con consultas sobre inventario, ventas, backorders y más. ¿En qué puedo ayudarte hoy?",
        isUser: false,
        timestamp: new Date(),
      },
    ]);
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await agentService.sendQuery(
        inputValue,
        userId,
        sessionId || ''
      );

      // Save the conversation_id from the backend for subsequent messages
      if (response.metadata?.conversation_id && !sessionId) {
        setSessionId(response.metadata.conversation_id);
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: response.message,
        isUser: false,
        timestamp: new Date(),
        data: response.data,
        metadata: response.metadata,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: `Lo siento, hubo un error al procesar tu consulta. ${error instanceof Error ? error.message : "Por favor, intenta de nuevo."}`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatData = (data: any) => {
    if (!data) return null;

    return (
      <Card className="mt-3 p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
            Datos del Análisis
          </h4>
        </div>
        <div className="space-y-2 text-sm">
          {data.record_count !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Registros:</span>
              <span className="font-semibold">{data.record_count}</span>
            </div>
          )}
          {data.total_quantity !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Cantidad Total:</span>
              <span className="font-semibold">{data.total_quantity.toLocaleString()}</span>
            </div>
          )}
          {data.total_value !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Valor Total:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                ${data.total_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          {data.total_net !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Neto:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                ${data.total_net.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          {data.top_products && data.top_products.length > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
              <h5 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                Principales Productos:
              </h5>
              <div className="space-y-2">
                {data.top_products.slice(0, 5).map((product: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="truncate flex-1">
                      {idx + 1}. {product.product_name} ({product.brand})
                    </span>
                    <span className="font-semibold ml-2">
                      {product.quantity?.toLocaleString() || product.value?.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Asistente de Datos
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Análisis en tiempo real
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            Session: {sessionId ? sessionId.substring(0, 15) + '...' : 'New chat'}
          </Badge>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-6 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${
                message.isUser ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.isUser
                    ? "bg-gradient-to-br from-green-500 to-emerald-600"
                    : "bg-gradient-to-br from-blue-500 to-purple-600"
                }`}
              >
                {message.isUser ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>

              {/* Message Content */}
              <div
                className={`flex-1 ${
                  message.isUser ? "flex justify-end" : "flex justify-start"
                }`}
              >
                <div
                  className={`max-w-3xl rounded-2xl px-5 py-4 ${
                    message.isUser
                      ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {message.isUser ? (
                      <p className="text-white m-0">{message.content}</p>
                    ) : (
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    )}
                  </div>

                  {/* Data Display */}
                  {message.data && formatData(message.data)}

                  {/* Metadata */}
                  {message.metadata && (
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                      <Badge variant="secondary" className="text-xs">
                        {message.metadata.query_type}
                      </Badge>
                      <span>{message.metadata.latency_ms.toFixed(0)}ms</span>
                      {message.metadata.type && (
                        <span className="capitalize">{message.metadata.type.replace('_', ' ')}</span>
                      )}
                    </div>
                  )}

                  <div className="text-xs mt-2 opacity-70">
                    {message.timestamp.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Analizando...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex gap-3">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregunta sobre inventario, ventas, backorders..."
              className="min-h-[60px] max-h-[200px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
              className="h-[60px] w-[60px] rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <AlertCircle className="w-3 h-3" />
            <span>Presiona Enter para enviar, Shift+Enter para nueva línea</span>
          </div>
        </div>
      </div>
    </div>
  );
}

