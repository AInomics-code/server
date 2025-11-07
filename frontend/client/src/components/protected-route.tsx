import { useEffect } from "react";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if user is logged in (sessionStorage is cleared on refresh)
    const isLoggedIn = sessionStorage.getItem("isLoggedIn");
    if (!isLoggedIn) {
      setLocation("/login");
    }
  }, [setLocation]);

  // Only render children if logged in
  const isLoggedIn = sessionStorage.getItem("isLoggedIn");
  if (!isLoggedIn) {
    return null; // Don't render anything while redirecting
  }

  return <>{children}</>;
}