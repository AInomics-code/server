import { useState, useEffect } from "react";

interface TypingMessageProps {
  content: string;
  isLatestMessage: boolean;
  onComplete?: () => void;
  messageId?: string;
}

export function TypingMessage({ content, isLatestMessage, onComplete, messageId }: TypingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isLatestMessage && !isComplete) {
      let i = 0;
      const typingSpeed = 12;
      
      const typeInterval = setInterval(() => {
        if (i < content.length) {
          setDisplayedContent(content.slice(0, i + 1));
          i++;
        } else {
          setIsComplete(true);
          clearInterval(typeInterval);
          onComplete?.();
        }
      }, typingSpeed);

      return () => clearInterval(typeInterval);
    } else if (!isLatestMessage) {
      setDisplayedContent(content);
      setIsComplete(true);
    }
  }, [content, isLatestMessage, isComplete, onComplete]);

  return (
    <div className="message bot">
      <div 
        className="leading-relaxed prose prose-gray max-w-none [&>*]:mb-3 [&>*:last-child]:mb-0"
        dangerouslySetInnerHTML={{ 
          __html: displayedContent
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/🔎 \*\*(.*?)\*\*/g, '<h3 class="section-header">🔎 $1</h3>')
            .replace(/✅ \*\*(.*?)\*\*/g, '<h3 class="section-header">✅ $1</h3>')
            .replace(/📊 \*\*(.*?)\*\*/g, '<h3 class="section-header">📊 $1</h3>')
            .replace(/⚖️ \*\*(.*?)\*\*/g, '<h3 class="section-header">⚖️ $1</h3>')
            .replace(/- 🔸 \*\*(.*?)\*\*/g, '<div class="ml-4 mb-1">• <strong>$1</strong>')
            .replace(/\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|/g, '<table><tr><th>$1</th><th>$2</th><th>$3</th><th>$4</th></tr></table>')
            .replace(/\n/g, '<br/>')
        }}
      />
      {/* Chart generation removed */}
    </div>
  );
}