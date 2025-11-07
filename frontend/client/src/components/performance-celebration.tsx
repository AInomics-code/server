import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ConfettiAnimation } from "./confetti-animation";
import { Sparkles, TrendingUp } from "lucide-react";

interface PerformanceCelebrationProps {
  trigger?: boolean;
  onCelebrate?: () => void;
}

export function PerformanceCelebration({ trigger = false, onCelebrate }: PerformanceCelebrationProps) {
  const [isTriggered, setIsTriggered] = useState(false);
  const [celebrationCount, setCelebrationCount] = useState(0);

  const handleCelebrate = () => {
    setIsTriggered(true);
    setCelebrationCount(prev => prev + 1);
    onCelebrate?.();
    
    // Reset after animation
    setTimeout(() => {
      setIsTriggered(false);
    }, 3000);
  };

  React.useEffect(() => {
    if (trigger) {
      handleCelebrate();
    }
  }, [trigger]);

  return (
    <>
      <ConfettiAnimation
        trigger={isTriggered}
        duration={2500}
        particleCount={60}
        colors={['#22c55e', '#10b981', '#059669', '#34d399', '#6ee7b7', '#a7f3d0']}
        onComplete={() => setIsTriggered(false)}
      />
    </>
  );
}

// Enhanced performance metrics detector
export function detectPositiveMetrics(content: string): boolean {
  const positivePatterns = [
    /performance-positive/i,
    /95\.96%/,
    /300% volume increase/i,
    /spacial foods/i,
    /success framework/i,
    /recovery targets/i,
    /\$65\+ monthly/i,
    /within 60 days/i,
    /45% achievement/i,
    /top 5 xtra locations/i,
    /backup supplier/i,
    /daily reporting protocols/i,
    /60% recovery/i,
    /50\+ sales performance/i,
    /\$3\.5M\+ monthly/i,
    /achieves/i,
    /success/i,
    /positive/i,
    /recovery/i,
    /target:/i
  ];

  return positivePatterns.some(pattern => pattern.test(content));
}

// Smart celebration trigger component
export function SmartCelebrationTrigger({ content }: { content: string }) {
  const [shouldCelebrate, setShouldCelebrate] = useState(false);

  React.useEffect(() => {
    const hasPositiveMetrics = detectPositiveMetrics(content);
    
    if (hasPositiveMetrics) {
      // Add delay to ensure content is rendered
      const timer = setTimeout(() => {
        setShouldCelebrate(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [content]);

  React.useEffect(() => {
    if (shouldCelebrate) {
      // Reset after triggering
      const timer = setTimeout(() => {
        setShouldCelebrate(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [shouldCelebrate]);

  return <PerformanceCelebration trigger={shouldCelebrate} />;
}

// Test button for manual confetti triggering
export function ConfettiTestButton() {
  const [trigger, setTrigger] = useState(false);

  const handleTest = () => {
    setTrigger(true);
    setTimeout(() => setTrigger(false), 100);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleTest}
        className="bg-green-500 hover:bg-green-600 text-white shadow-lg"
        size="sm"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Test Confetti
      </Button>
      <PerformanceCelebration trigger={trigger} />
    </div>
  );
}