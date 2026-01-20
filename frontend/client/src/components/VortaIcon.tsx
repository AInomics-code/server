import { motion } from 'framer-motion';

interface VortaIconProps {
  size?: number;
  isAnimating?: boolean;
}

export function VortaIcon({ size = 48, isAnimating = false }: VortaIconProps) {
  return (
    <motion.div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.6,
        color: '#5B9EFF',
        filter: 'drop-shadow(0 0 20px rgba(91, 158, 255, 0.3))',
      }}
      animate={isAnimating ? { rotate: 360 } : {}}
      transition={isAnimating ? { duration: 8, repeat: Infinity, ease: 'linear' } : {}}
    >
      ✱
    </motion.div>
  );
}
