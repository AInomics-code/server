import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TypewriterMessageProps {
  content: string;
  isUser: boolean;
  timestamp: Date;
  isLatest?: boolean;
}

export function TypewriterMessage({ content, isUser, timestamp, isLatest = false }: TypewriterMessageProps) {
  const [displayedContent, setDisplayedContent] = useState(isLatest && !isUser ? "" : content);
  const [isComplete, setIsComplete] = useState(!isLatest || isUser);

  useEffect(() => {
    if (isLatest && !isUser && !isComplete) {
      let i = 0;
      const typeInterval = setInterval(() => {
        if (i < content.length) {
          setDisplayedContent(content.slice(0, i + 1));
          i++;
        } else {
          setIsComplete(true);
          clearInterval(typeInterval);
        }
      }, 15); // Typing speed

      return () => clearInterval(typeInterval);
    }
  }, [content, isLatest, isUser, isComplete]);

  return (
    <div
      className={cn(
        "max-w-[80%] mb-4 animate-fadeInUp",
        isUser ? "ml-auto" : "mr-auto"
      )}
    >
      <div
        className={cn(
          "px-4 py-3 rounded-2xl leading-relaxed shadow-sm",
          isUser
            ? "bg-gray-100 text-gray-900 rounded-br-sm"
            : "bg-gray-50 text-gray-800 rounded-bl-sm border border-gray-100"
        )}
      >
        <div className="whitespace-pre-wrap break-words">
          {displayedContent}
          {isLatest && !isUser && !isComplete && (
            <span className="inline-block w-2 h-5 bg-gray-400 animate-pulse ml-1" />
          )}
        </div>
      </div>
      <div className={cn(
        "text-xs text-gray-400 mt-1 px-1",
        isUser ? "text-right" : "text-left"
      )}>
        {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}