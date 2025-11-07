import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { formatTimeShort } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Bot, User, ThumbsUp, ThumbsDown, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SmartCelebrationTrigger, ConfettiTestButton } from "./performance-celebration";
import type { Message } from "@shared/schema";

interface MessageListProps {
  conversationId: number | null;
}

export function MessageList({ conversationId }: MessageListProps) {
  const { toast } = useToast();

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/conversations", conversationId, "messages"],
    enabled: !!conversationId,
  });

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied to clipboard",
        description: "Message copied successfully",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy message to clipboard",
        variant: "destructive",
      });
    }
  };

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <h2 className="heading-secondary mb-2">
            How can I help you today?
          </h2>
          <p className="text-gray-600">
            Ask me anything, and I'll do my best to help!
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="flex justify-end">
                <div className="max-w-3xl w-full">
                  <div className="bg-gray-200 dark:bg-gray-800 rounded-2xl px-4 py-3 ml-12 animate-pulse">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-3xl w-full">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full animate-pulse"></div>
                    <div className="bg-gray-200 dark:bg-gray-800 rounded-2xl px-4 py-3 mr-12 flex-1 animate-pulse">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="max-w-4xl mx-auto px-4 pb-32 space-y-6">
        {messages.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <h2 className="heading-secondary mb-2">
              Start the conversation
            </h2>
            <p className="text-gray-600">
              Send a message to begin chatting
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id}>
              {message.role === "user" ? (
                <div className="flex justify-end">
                  <div className="max-w-3xl">
                    <div className="bg-gray-50 rounded-2xl px-4 py-3 ml-12">
                      <div className="message-content text-body">
                        {message.content.split('\n').map((line, i) => (
                          <p key={i}>{line || '\u00A0'}</p>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>You</span>
                      <span>•</span>
                      <span>{formatTimeShort(message.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-start">
                  <div className="max-w-3xl">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 mr-12 shadow-enterprise">
                        <div className="message-content text-body">
                          {message.content.split('\n').map((line, i) => (
                            <p key={i}>{line || '\u00A0'}</p>
                          ))}
                        </div>
                        <SmartCelebrationTrigger content={message.content} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 ml-11 text-xs text-gray-500 dark:text-gray-400">
                      <span>ChatGPT</span>
                      <span>•</span>
                      <span>{formatTimeShort(message.createdAt)}</span>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyMessage(message.content)}
                          className="h-6 w-6 p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <ConfettiTestButton />
    </ScrollArea>
  );
}
