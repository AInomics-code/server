import { useEffect } from "react";
import { useLocation } from "wouter";
import { getAuthToken } from "@/utils/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Authentication check
    const token = getAuthToken();
    const userId = localStorage.getItem("userId");
    const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";

    if (!token || !userId || !isLoggedIn) {
      setLocation("/user-id-entry");
    }
  }, [setLocation]);

  // While the redirect happens, just render children; the route will change if unauthenticated
  return <>{children}</>;
}
