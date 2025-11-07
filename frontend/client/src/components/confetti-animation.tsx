import React, { useEffect, useRef } from 'react';

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  size: number;
  life: number;
  maxLife: number;
}

interface ConfettiAnimationProps {
  trigger: boolean;
  onComplete?: () => void;
  duration?: number;
  particleCount?: number;
  colors?: string[];
}

export function ConfettiAnimation({ 
  trigger, 
  onComplete, 
  duration = 3000,
  particleCount = 50,
  colors = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']
}: ConfettiAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<ConfettiParticle[]>([]);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!trigger) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 3 + 2,
        gravity: 0.15,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        size: Math.random() * 8 + 4,
        life: 0,
        maxLife: duration
      });
    }

    startTimeRef.current = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTimeRef.current;

      if (elapsed >= duration) {
        window.removeEventListener('resize', resizeCanvas);
        onComplete?.();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, index) => {
        // Update physics
        particle.vy += particle.gravity;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rotation += particle.rotationSpeed;
        particle.life = elapsed;

        // Calculate opacity based on life
        const opacity = Math.max(0, 1 - (particle.life / particle.maxLife));

        // Draw particle
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        ctx.globalAlpha = opacity;
        
        // Draw as a small rectangle (confetti piece)
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
        
        ctx.restore();

        // Remove particles that are off screen or faded
        if (particle.y > canvas.height + 50 || opacity <= 0) {
          particlesRef.current.splice(index, 1);
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [trigger, duration, particleCount, colors, onComplete]);

  if (!trigger) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ background: 'transparent' }}
    />
  );
}

// Hook to trigger confetti when positive metrics are detected
export function usePerformanceConfetti() {
  const [shouldTrigger, setShouldTrigger] = React.useState(false);

  const triggerConfetti = React.useCallback(() => {
    setShouldTrigger(true);
    setTimeout(() => setShouldTrigger(false), 100);
  }, []);

  const resetConfetti = React.useCallback(() => {
    setShouldTrigger(false);
  }, []);

  return {
    shouldTrigger,
    triggerConfetti,
    resetConfetti
  };
}

// Component to detect positive performance indicators and trigger confetti
export function PerformanceConfettiTrigger({ content }: { content: string }) {
  const { shouldTrigger, triggerConfetti } = usePerformanceConfetti();

  useEffect(() => {
    // Detect positive performance indicators in the content
    const positiveIndicators = [
      'performance-positive',
      '95.96%',
      '300% volume increase',
      'achieves',
      'recovery',
      'success',
      '75% of historical performance',
      'within 60 days',
      'positive',
      'top 5 xtra locations',
      '$65+ monthly',
      '45% achievement',
      'spacial foods',
      'backup supplier',
      'reformulate',
      'daily reporting protocols',
      'target:',
      'recovery targets',
      'success metrics'
    ];

    const hasPositiveIndicator = positiveIndicators.some(indicator => 
      content.toLowerCase().includes(indicator.toLowerCase())
    );

    // Also trigger on span elements with positive classes
    const hasPositiveClass = content.includes('performance-positive') || 
                            content.includes('class="performance-positive"');

    if (hasPositiveIndicator || hasPositiveClass) {
      // Delay to allow content to render first
      setTimeout(() => {
        triggerConfetti();
      }, 800);
    }
  }, [content, triggerConfetti]);

  return (
    <ConfettiAnimation
      trigger={shouldTrigger}
      duration={2500}
      particleCount={40}
      colors={['#22c55e', '#10b981', '#059669', '#34d399', '#6ee7b7']}
    />
  );
}