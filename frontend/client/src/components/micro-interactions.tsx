import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";

interface FeedbackToastProps {
  type: 'success' | 'error' | 'info';
  message: string;
  show: boolean;
  onHide: () => void;
}

export function FeedbackToast({ type, message, show, onHide }: FeedbackToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onHide, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  if (!show) return null;

  const icons = {
    success: <CheckCircle2 size={20} className="text-green-600" />,
    error: <AlertCircle size={20} className="text-red-600" />,
    info: <TrendingUp size={20} className="text-blue-600" />
  };

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border ${styles[type]} animate-slideInRight shadow-lg`}>
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
}

export function AnimatedCounter({ value, duration = 1000, suffix = '' }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const startValue = displayValue;

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(startValue + (value - startValue) * easeOutCubic);
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span className="tabular-nums">{displayValue}{suffix}</span>;
}

interface PulseIndicatorProps {
  color?: 'green' | 'red' | 'blue' | 'yellow';
  size?: 'sm' | 'md' | 'lg';
}

export function PulseIndicator({ color = 'green', size = 'sm' }: PulseIndicatorProps) {
  const colors = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500'
  };

  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className={`${sizes[size]} ${colors[color]} rounded-full animate-pulse relative`}>
      <div className={`absolute inset-0 ${colors[color]} rounded-full animate-ping opacity-75`}></div>
    </div>
  );
}

interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function HoverCard({ children, className = '', onClick }: HoverCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <div
      className={`interactive-hover button-press ripple-effect cursor-pointer ${className} ${
        isPressed ? 'animate-scaleIn' : ''
      }`}
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      {children}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max: number;
  color?: 'green' | 'blue' | 'red' | 'yellow';
  animated?: boolean;
}

export function ProgressBar({ value, max, color = 'green', animated = true }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colors = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500'
  };

  return (
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full ${colors[color]} ${animated ? 'transition-all duration-700 ease-out' : ''} rounded-full relative`}
        style={{ width: `${percentage}%` }}
      >
        {animated && (
          <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full"></div>
        )}
      </div>
    </div>
  );
}

interface FloatingButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  tooltip?: string;
  color?: 'blue' | 'green' | 'red';
}

export function FloatingButton({ icon, onClick, tooltip, color = 'blue' }: FloatingButtonProps) {
  const colors = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    red: 'bg-red-500 hover:bg-red-600'
  };

  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={`fixed bottom-6 right-6 w-14 h-14 ${colors[color]} text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center animate-bounceIn button-press ripple-effect z-50`}
    >
      {icon}
    </button>
  );
}