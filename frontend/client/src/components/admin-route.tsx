import { useEffect } from "react";
import { useLocation } from "wouter";
import { getAuthToken, isAdmin } from "@/utils/auth";

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const token = getAuthToken();
    const userId = localStorage.getItem("userId");
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";

    if (!token || !userId || !loggedIn) {
      setLocation("/user-id-entry");
      return;
    }

    if (!isAdmin()) {
      setLocation("/chat");
    }
  }, [setLocation]);

  return <>{children}</>;
}
