import { motion } from 'framer-motion';
import { AlertCircle, TrendingUp, Target, X, LucideIcon } from 'lucide-react';

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
  onClose?: () => void;
}

export function GetStartedCards({ cards, onCardClick, onClose }: GetStartedCardsProps) {

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      style={{ width: '100%' }}
    >
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <span style={{ fontSize: '13px', color: '#9CA5B5', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
          Daily Commercial Checks
        </span>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '4px',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} color="#677C99" />
          </button>
        )}
      </div>
      {/* Cards Grid */}
      <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '520px' }}>
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={i}
              onClick={() => onCardClick(card.title, card.question || `Run ${card.workflow.replace(/_/g, ' ')} check`)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              style={{
                flex: 1,
                padding: '20px 16px',
                borderRadius: '12px',
                backgroundColor: '#202A37',
                border: '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.12s ease',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(91, 158, 255, 0.3)';
                e.currentTarget.style.backgroundColor = '#242E3D';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.backgroundColor = '#202A37';
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: 'rgba(91, 158, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}>
                <Icon size={15} color="rgba(91, 158, 255, 0.7)" strokeWidth={1.5} />
              </div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 500, 
                color: '#E6EAF1', 
                marginTop: '12px', 
                marginBottom: '4px',
                fontFamily: 'Inter, sans-serif',
              }}>
                {card.title}
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#9CA5B5',
                fontFamily: 'Inter, sans-serif',
              }}>
                {card.description}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
