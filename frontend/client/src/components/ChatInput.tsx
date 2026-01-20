import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Paperclip, Mic, ArrowRight, Globe, LayoutGrid } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, isLoading = false, placeholder = "Ask anything about your business..." }: ChatInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (value.trim() && !isLoading) {
      onSend(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: '#202A37',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '14px 16px',
      }}
    >
      {/* Input Area */}
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        style={{
          width: '100%',
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          color: '#E6EAF1',
          fontSize: '14px',
          lineHeight: '1.5',
          fontFamily: 'Inter, sans-serif',
          marginBottom: '12px',
        }}
        className="chat-input-textarea"
      />
      {/* Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left Icons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { icon: Globe, label: 'Globe' },
            { icon: LayoutGrid, label: 'Grid' },
            { icon: Paperclip, label: 'Attach' },
            { icon: Mic, label: 'Voice' },
          ].map((item, i) => (
            <button
              key={i}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.12s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            >
              <item.icon size={18} color="#9CA5B5" />
            </button>
          ))}
        </div>
        {/* Send Button */}
        <motion.button
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: value.trim() ? '#5B9EFF' : '#2A3544',
            border: 'none',
            cursor: value.trim() && !isLoading ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.12s',
          }}
        >
          {isLoading ? (
            <div style={{ 
              width: '18px', 
              height: '18px', 
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: 'white',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          ) : (
            <ArrowRight size={20} color={value.trim() ? 'white' : '#677C99'} />
          )}
        </motion.button>
      </div>
    </div>
  );
}
