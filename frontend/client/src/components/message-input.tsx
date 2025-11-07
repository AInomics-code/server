import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { Send, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  conversationId: number | null;
  onSendMessage: () => void;
  language?: 'en' | 'es';
}

export function MessageInput({ conversationId, onSendMessage, language }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversationId) {
        throw new Error("No conversation selected");
      }

      const response = await apiRequest("POST", `/api/conversations/${conversationId}/messages`, {
        role: "user",
        content,
        language,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations", conversationId, "messages"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations"] 
      });
      onSendMessage();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (trimmedMessage && conversationId && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(trimmedMessage);
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [conversationId]);

  const isDisabled = !conversationId || sendMessageMutation.isPending || !message.trim();

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end gap-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-3 shadow-sm focus-within:shadow-md transition-shadow">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
              disabled={!conversationId}
            >
              <Paperclip className="h-4 w-4 text-gray-400" />
            </Button>
            
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Mensaje a ChatGPT..."
                className="w-full resize-none bg-transparent border-none outline-none text-sm leading-relaxed min-h-[20px] max-h-32 p-0 focus-visible:ring-0 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                rows={1}
                disabled={!conversationId || sendMessageMutation.isPending}
              />
            </div>
            
            <Button
              type="submit"
              size="sm"
              disabled={isDisabled}
              className={cn(
                "p-2 bg-la-dona-green hover:bg-la-dona-green/90 text-white rounded-lg transition-colors flex-shrink-0",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
            ChatGPT puede cometer errores. Considera verificar información importante.
          </div>
        </form>
      </div>
    </div>
  );
}
