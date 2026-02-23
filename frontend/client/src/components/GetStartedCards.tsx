import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Card {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  workflow: string;
  question?: string;
  healthScore?: number; // Health score (0-100), undefined means loading
}

// Helper function to get health color
const getHealthColor = (score: number): string => {
  if (score >= 70) return '#33C481'; // Green
  if (score >= 40) return '#C48333'; // Orange
  return '#DC2626'; // Red
};

interface GetStartedCardsProps {
  cards: Card[];
  onCardClick: (cardTitle: string, question: string) => void;
}

export function GetStartedCards({ cards, onCardClick }: GetStartedCardsProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

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
          Daily Reports
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
        alignItems: 'stretch',
      }}>
        {cards.map((card, i) => {
          const Icon = card.icon;
          const isHovered = hoveredCard === card.id;
          const healthScore = card.healthScore;
          const isLoading = healthScore === undefined;
          const healthColor = healthScore !== undefined && healthScore > 0 ? getHealthColor(healthScore) : '#5CA2F9';
          
          return (
            <motion.div
              key={i}
              animate={{
                height: isHovered && healthScore !== undefined && healthScore > 0 ? '64px' : '48px',
              }}
              transition={{
                duration: isHovered ? 0.5 : 0.2,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              style={{
                width: '180px',
                flexShrink: 0,
                position: 'relative',
                contain: 'layout style paint',
                borderRadius: '10px',
                overflow: 'hidden',
              }}
            >
              <motion.button
                onClick={() => onCardClick(card.title, card.question || `Run ${card.workflow.replace(/_/g, ' ')} check`)}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                whileTap={{ 
                  scale: 0.98,
                  transition: {
                    duration: 0.08,
                    ease: [0.32, 0.72, 0, 1],
                  },
                }}
                animate={{
                  backgroundColor: isHovered ? '#3A4149' : '#2F343B',
                  scale: isHovered ? 1.05 : 1,
                  boxShadow: isHovered ? '0 8px 24px rgba(0, 0, 0, 0.3)' : '0 0 0 rgba(0, 0, 0, 0)',
                }}
                transition={{
                  duration: isHovered ? 0.5 : 0.2,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                  outline: 'none',
                  width: '100%',
                  height: '100%',
                  willChange: 'transform, background-color, box-shadow',
                  contain: 'layout style paint',
                  boxSizing: 'border-box',
                }}
              onFocus={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
            >
              {/* Progress Bar Container - Always visible */}
              <div style={{
                width: '100%',
                flexShrink: 0,
              }}>
                <motion.div
                  animate={{
                    height: (healthScore !== undefined && healthScore > 0) || isLoading ? '2.5px' : '0px',
                    opacity: (healthScore !== undefined && healthScore > 0) || isLoading ? 1 : 0,
                  }}
                  transition={{
                    duration: 0.3,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: '#1F2227',
                    borderRadius: '2px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Loading Animation */}
                  {isLoading && (
                    <>
                      {/* Base elegant fade background */}
                      <motion.div
                        animate={{
                          opacity: [0.1, 0.25, 0.1],
                        }}
                        transition={{
                          duration: 4.5,
                          repeat: Infinity,
                          ease: [0.2, 0, 0.8, 1],
                        }}
                        style={{
                          height: '100%',
                          width: '100%',
                          background: 'linear-gradient(90deg, transparent 0%, rgba(91, 158, 255, 0.05) 50%, transparent 100%)',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                        }}
                      />
                      {/* Elegant smooth line shimmer */}
                      <motion.div
                        animate={{
                          x: ['-100%', '100%'],
                        }}
                        transition={{
                          duration: 4.5,
                          repeat: Infinity,
                          ease: [0.12, 0, 0.39, 1],
                        }}
                        style={{
                          height: '100%',
                          width: '100%',
                          background: 'linear-gradient(90deg, transparent 0%, rgba(91, 158, 255, 0.1) 35%, rgba(91, 158, 255, 0.5) 50%, rgba(91, 158, 255, 0.1) 65%, transparent 100%)',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          filter: 'blur(0.2px)',
                        }}
                      />
                    </>
                  )}
                  
                  {/* Health Bar - Only show when score is loaded */}
                  {!isLoading && healthScore !== undefined && healthScore > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${healthScore}%`,
                        backgroundColor: isHovered ? healthColor : '#5CA2F9',
                      }}
                      transition={{
                        duration: 0.6,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                      style={{
                        height: '100%',
                        borderRadius: '2px',
                        willChange: 'background-color, width',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                      }}
                    />
                  )}
                </motion.div>

                {/* Health Label (appears on hover) - Far left, close to bar */}
                {!isLoading && healthScore !== undefined && healthScore > 0 && (
                  <motion.div
                    animate={{
                      opacity: isHovered ? 1 : 0,
                      height: isHovered ? '14px' : '0px',
                      marginTop: isHovered ? '3px' : '0px',
                      marginBottom: isHovered ? '8px' : '0px',
                    }}
                    transition={{
                      opacity: {
                        duration: isHovered ? 0.5 : 0.2,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      },
                      height: {
                        duration: isHovered ? 0.5 : 0.2,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      },
                      marginTop: {
                        duration: isHovered ? 0.5 : 0.2,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      },
                      marginBottom: {
                        duration: isHovered ? 0.5 : 0.2,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      },
                    }}
                    style={{
                      padding: 0,
                      marginLeft: '0px',
                      alignSelf: 'flex-start',
                      overflow: 'hidden',
                      width: '100%',
                      textAlign: 'left',
                      willChange: 'opacity, height, margin-top, margin-bottom',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 500,
                        color: healthColor,
                        fontFamily: 'Inter, sans-serif',
                        lineHeight: '1.2',
                        display: 'block',
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {healthScore}% health
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Icon + Title Row - Always visible at bottom, moves up slightly on hover */}
              <motion.div
                animate={{
                  marginBottom: isHovered && healthScore !== undefined && healthScore > 0 ? '4px' : '0px',
                }}
                transition={{
                  duration: isHovered ? 0.5 : 0.2,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '8px',
                  padding: 0,
                  marginTop: 'auto',
                  flexShrink: 0,
                  minHeight: '20px',
                  willChange: 'margin-bottom',
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
              </motion.div>
            </motion.button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
