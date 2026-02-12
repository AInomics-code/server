import { motion } from 'framer-motion';
import { LucideIcon, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Card {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  workflow: string;
  question?: string;
}

interface GetStartedCardsProps {
  cards: Card[];
  onCardClick: (cardTitle: string, question: string) => void;
}

export function GetStartedCards({ cards, onCardClick }: GetStartedCardsProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      style={{
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Header with title and close button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: 500,
          color: '#9CA3AF',
          margin: 0,
          fontFamily: 'Inter, sans-serif',
        }}>
          Get Started
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9CA3AF',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#E5E7EB';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#9CA3AF';
          }}
          aria-label="Close Get Started section"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Pills Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '12px',
        width: 'fit-content',
        justifyContent: 'flex-start',
      }}>
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={i}
              onClick={() => onCardClick(card.title, card.question || `Run ${card.workflow.replace(/_/g, ' ')} check`)}
              whileHover={{
                backgroundColor: '#3A4149',
                transition: {
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1],
                },
              }}
              whileTap={{ 
                translateY: 0.5,
                scale: 0.98,
                transition: {
                  duration: 0.15,
                  ease: [0.4, 0, 0.2, 1],
                },
              }}
              transition={{
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1],
              }}
              style={{
                height: '40px',
                padding: '0 14px',
                borderRadius: '10px',
                backgroundColor: '#2F343B',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '8px',
                position: 'relative',
                overflow: 'hidden',
                outline: 'none',
                width: '180px',
                flexShrink: 0,
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
            >
              {/* Icon */}
              <div style={{
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={16} color="#757C8A" strokeWidth={2} />
              </div>
              
              {/* Text Label */}
              <span style={{
                fontSize: '13px',
                fontWeight: 500,
                color: '#757C8A',
                fontFamily: 'Inter, sans-serif',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1,
                textAlign: 'left',
              }}>
                {card.title}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
