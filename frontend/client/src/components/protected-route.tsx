import { useEffect } from "react";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if user has entered their user ID
    const userId = localStorage.getItem("userId");
    const isLoggedIn = sessionStorage.getItem("isLoggedIn");
    
    if (!userId || !isLoggedIn) {
      setLocation("/user-id-entry");
    }
  }, [setLocation]);

  // Only render children if user ID exists
  const userId = localStorage.getItem("userId");
  const isLoggedIn = sessionStorage.getItem("isLoggedIn");
  
  if (!userId || !isLoggedIn) {
    return null; // Don't render anything while redirecting
  }

  return <>{children}</>;
}