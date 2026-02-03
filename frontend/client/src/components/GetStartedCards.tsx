import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      {/* Cards Grid */}
      <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '800px', justifyContent: 'center', margin: '0 auto' }}>
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={i}
              onClick={() => onCardClick(card.title, card.question || `Run ${card.workflow.replace(/_/g, ' ')} check`)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              style={{
                flex: '0 0 auto',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(103, 124, 153, 0.2)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.25s ease',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '7px',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(103, 124, 153, 0.35)';
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(103, 124, 153, 0.2)';
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: '22px',
                height: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={16} color="#677C99" strokeWidth={2.2} />
              </div>
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                gap: '2px',
              }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: '#677C99', 
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: '1.3',
                  whiteSpace: 'nowrap',
                }}>
                  {card.title}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
