import { motion } from 'framer-motion';
import { AlertCircle, TrendingUp, Target, X, LucideIcon } from 'lucide-react';
import { useTranslation } from '@/config/i18n';

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
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '12px',
        width: '100%',
        maxWidth: '800px',
      }}>
        <span style={{ fontSize: '13px', color: '#9CA5B5', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
          {t('cards.title')}
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
      <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '800px', justifyContent: 'center' }}>
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
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                border: '1.2px solid rgba(103, 124, 153, 0.4)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.25s ease',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '10px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(103, 124, 153, 0.65)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(103, 124, 153, 0.4)';
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
                width: '100%',
                gap: '2px',
              }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 400, 
                  color: '#677C99', 
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: '1.3',
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
