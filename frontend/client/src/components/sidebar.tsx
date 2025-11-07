import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "./theme-provider";
import { apiRequest } from "@/lib/queryClient";
import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Plus, User, Moon, Sun, Trash2, Menu, X } from "lucide-react";
import type { Conversation } from "@shared/schema";

interface SidebarProps {
  selectedConversationId: number | null;
  onSelectConversation: (id: number | null) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ 
  selectedConversationId, 
  onSelectConversation, 
  isOpen, 
  onToggle 
}: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/conversations", {
        title: "New conversation",
      });
      return response.json();
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      onSelectConversation(newConversation.id);
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/conversations/${id}`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (selectedConversationId === deletedId) {
        onSelectConversation(null);
      }
    },
  });

  const handleNewChat = () => {
    createConversationMutation.mutate();
  };

  const handleDeleteConversation = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteConversationMutation.mutate(id);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className="w-full bg-white flex flex-col h-full">
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 lg:hidden">
          <h1 className="text-lg font-semibold">ChatGPT</h1>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <Button 
            onClick={handleNewChat}
            disabled={createConversationMutation.isPending}
            className="w-full justify-start gap-2 bg-la-dona-green hover:bg-la-dona-green/90 text-white border-0"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            Nuevo chat
          </Button>
        </div>

        {/* Conversation History */}
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                Aún no hay conversaciones. ¡Inicia un nuevo chat para comenzar!
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={cn(
                    "px-3 py-2.5 rounded-lg cursor-pointer transition-colors group hover:bg-gray-50",
                    selectedConversationId === conversation.id && "bg-gray-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-gray-800">
                        {conversation.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatTime(conversation.updatedAt)}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteConversation(e, conversation.id)}
                        disabled={deleteConversationMutation.isPending}
                        className="h-6 w-6 p-1 hover:bg-gray-200"
                      >
                        <Trash2 className="h-3 w-3 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-gray-800">
                Juan Pérez
              </p>
              <p className="text-xs text-gray-500">
                Plan gratuito
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-8 w-8 p-1 hover:bg-gray-200"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-yellow-400" />
              ) : (
                <Moon className="h-4 w-4 text-gray-500" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
