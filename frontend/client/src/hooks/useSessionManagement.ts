import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { logout } from '../utils/auth';

/**
 * Session management hook that:
 * - Tracks user activity (mouse, keyboard, clicks)
 * - Auto-logout after 2 hours of inactivity
 * - Handles browser close events
 */
export function useSessionManagement() {
  const [, setLocation] = useLocation();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const [showWarning, setShowWarning] = useState(false);

  // 2 hours in milliseconds
  const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
  const WARNING_TIME = 30 * 1000; // 30 seconds warning before logout

  const resetInactivityTimer = () => {
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    
    // Hide warning if showing
    setShowWarning(false);

    // Update last activity time
    const now = Date.now();
    lastActivityRef.current = now;
    localStorage.setItem('lastActivityTime', now.toString());

    // Set timer to show warning (2 hours - 30 seconds)
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      
      // Set timer to logout after warning period
      timeoutRef.current = setTimeout(() => {
        console.log('🕐 Session expired due to inactivity (2 hours)');
        logout();
      }, WARNING_TIME);
    }, INACTIVITY_TIMEOUT - WARNING_TIME);
  };

  const handleStaySignedIn = () => {
    // Reset the timer and hide warning
    resetInactivityTimer();
  };

  const handleSignOut = () => {
    logout();
  };

  const handleCloseWarning = () => {
    // Close warning but don't reset timer - will auto logout
    setShowWarning(false);
  };

  const handleActivity = () => {
    resetInactivityTimer();
  };

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true' || localStorage.getItem('jwt_token');
    
    if (!isLoggedIn) {
      return; // Don't set up session management if not logged in
    }

    // Restore last activity time from localStorage
    const savedActivityTime = localStorage.getItem('lastActivityTime');
    if (savedActivityTime) {
      const timeSinceLastActivity = Date.now() - parseInt(savedActivityTime, 10);
      
      // If more than 2 hours have passed since last activity, logout immediately
      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
        console.log('🕐 Session expired - last activity was more than 2 hours ago');
        logout();
        return;
      }
      
      // Otherwise, set timer for remaining time
      const remainingTime = INACTIVITY_TIMEOUT - timeSinceLastActivity;
      
      if (remainingTime <= WARNING_TIME) {
        // Less than 30 seconds left - show warning immediately
        setShowWarning(true);
        timeoutRef.current = setTimeout(() => {
          console.log('🕐 Session expired due to inactivity');
          logout();
        }, remainingTime);
      } else {
        // More than 30 seconds left - schedule warning
        const warningTime = remainingTime - WARNING_TIME;
        warningTimeoutRef.current = setTimeout(() => {
          setShowWarning(true);
          timeoutRef.current = setTimeout(() => {
            console.log('🕐 Session expired due to inactivity');
            logout();
          }, WARNING_TIME);
        }, warningTime);
      }
      
      lastActivityRef.current = parseInt(savedActivityTime, 10);
    } else {
      // No saved activity time, start fresh
      resetInactivityTimer();
    }

    // Track user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Handle visibility change (tab switch, minimize window)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab/window hidden - save current time
        localStorage.setItem('lastActivityTime', Date.now().toString());
      } else {
        // Tab/window visible again - check if session expired
        const savedTime = localStorage.getItem('lastActivityTime');
        if (savedTime) {
          const timeSinceLastActivity = Date.now() - parseInt(savedTime, 10);
          if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
            console.log('🕐 Session expired while away');
            logout();
            return;
          }
          // Reset timer with remaining time (this will hide warning if showing)
          resetInactivityTimer();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle page unload (browser close, refresh)
    const handleBeforeUnload = () => {
      // Save current activity time
      localStorage.setItem('lastActivityTime', Date.now().toString());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [setLocation]);

  // Return the warning state and handlers
  return {
    showWarning,
    handleStaySignedIn,
    handleSignOut,
    handleCloseWarning,
  };
}
