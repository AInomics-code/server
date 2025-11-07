import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { TypewriterMessage } from "@/components/typewriter-message";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function SmoothChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const messageContent = inputValue.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      // Send message to API
      const response = await fetch('/api/conversations/1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent,
          role: 'user'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Get updated messages including AI response
      const messagesResponse = await fetch('/api/conversations/1/messages');
      if (messagesResponse.ok) {
        const data = await messagesResponse.json();
        setMessages(data.map((msg: any) => ({
          id: msg.id.toString(),
          content: msg.content,
          isUser: msg.role === 'user',
          timestamp: new Date(msg.timestamp),
        })));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm experiencing connection issues. Please check your network and try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
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

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-100 px-6 py-4 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">La Doña AI</h1>
            <p className="text-sm text-gray-500">Sales Dashboard Assistant</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Online</span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 smooth-scroll">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fadeInUp">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to La Doña AI</h2>
            <p className="text-gray-500 max-w-md">
              I'm your sales dashboard assistant. Ask me about regions, products, performance metrics, 
              or any business data from your dashboard.
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
              <button 
                onClick={() => setInputValue("What regions are at risk?")}
                className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors"
              >
                <p className="font-medium text-gray-900 text-sm">What regions are at risk?</p>
                <p className="text-gray-500 text-xs mt-1">Get insights on underperforming areas</p>
              </button>
              <button 
                onClick={() => setInputValue("Show me our best performing products")}
                className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors"
              >
                <p className="font-medium text-gray-900 text-sm">Show me our best performing products</p>
                <p className="text-gray-500 text-xs mt-1">Identify top revenue generators</p>
              </button>
              <button 
                onClick={() => setInputValue("How is Chiriquí performing?")}
                className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors"
              >
                <p className="font-medium text-gray-900 text-sm">How is Chiriquí performing?</p>
                <p className="text-gray-500 text-xs mt-1">Regional performance analysis</p>
              </button>
              <button 
                onClick={() => setInputValue("What should I focus on today?")}
                className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors"
              >
                <p className="font-medium text-gray-900 text-sm">What should I focus on today?</p>
                <p className="text-gray-500 text-xs mt-1">Get actionable recommendations</p>
              </button>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <TypewriterMessage
            key={message.id}
            content={message.content}
            isUser={message.isUser}
            timestamp={message.timestamp}
            isLatest={index === messages.length - 1}
          />
        ))}

        {isTyping && (
          <div className="flex items-center gap-3 mb-4 animate-fadeInUp">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                <span className="text-gray-500 text-sm">La Doña AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-100 p-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about sales dashboard, regions, products..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isTyping}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            La Doña AI can help with sales dashboard questions. Press Enter to send.
          </p>
        </div>
      </div>
    </div>
  );
}