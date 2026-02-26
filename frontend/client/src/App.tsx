import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastContainer } from "@/components/Toast";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import UserIdEntry from "@/pages/user-id-entry";
import Onboarding from "@/pages/onboarding";
import OnboardingDataForm from "@/pages/OnboardingDataForm";
import TableConfigDemo from "@/pages/table-config-demo";
import BusinessContextPrompts from "@/pages/BusinessContextPrompts";
import Chat from "@/pages/chat-clean-top";
import SmoothChat from "@/pages/chat-smooth";
import AgentChat from "@/pages/agent-chat";
import { LLMChatPage } from "@/pages/LLMChatPage";
import { DemoChatPage } from "@/pages/DemoChatPage";
import ScenarioSimulator from "@/pages/scenario-simulator";
import SidebarLayout from "@/components/sidebar-layout";
import Collaboration from "@/pages/collaboration";
import NotFound from "@/pages/not-found";
import ProtectedRoute from "@/components/protected-route";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import "./utils/env-check";
// Import storage utilities (makes them available in console for debugging)
import "./utils/clearStorage";
import { SessionManager } from "./components/SessionManager";

// ============================================================================
// Authentication flag - set to false to require real login
// ============================================================================
// TEMPORARY BYPASS - Set to false to require real authentication
// ============================================================================
// Componente para manejar la ruta raíz con lógica de autenticación
function RootRoute() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Authentication check
    const userId = localStorage.getItem("userId");
    const isLoggedIn = sessionStorage.getItem("isLoggedIn");
    const jwtToken = localStorage.getItem("jwt_token");
    
    const isAuthenticated = userId && (isLoggedIn === "true" || jwtToken);
    
    if (isAuthenticated) {
      setLocation("/llm-chat");
    } else {
      setLocation("/user-id-entry");
    }
  }, [setLocation]);

  // Show nothing while redirecting (the route will handle rendering)
  return null;
}

function Router() {
  const [location] = useLocation();
  
  // Debug: log current location
  useEffect(() => {
    console.log('📍 Current route:', location);
  }, [location]);
  
  return (
    <Switch>
      <Route path="/user-id-entry" component={UserIdEntry} />
      <Route path="/" component={RootRoute} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/onboarding/data" component={OnboardingDataForm} />
      <Route path="/onboarding/context" component={BusinessContextPrompts} />
      <Route path="/table-demo" component={TableConfigDemo} />
      <Route path="/demo" component={DemoChatPage} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <LLMChatPage />
        </ProtectedRoute>
      </Route>
      <Route path="/agent-chat">
        <ProtectedRoute>
          <AgentChat />
        </ProtectedRoute>
      </Route>
      <Route path="/collaboration">
        <ProtectedRoute>
          <Collaboration />
        </ProtectedRoute>
      </Route>
      <Route path="/chat-clean-top">
        <ProtectedRoute>
          <Chat />
        </ProtectedRoute>
      </Route>
      <Route path="/llm-chat">
        <ProtectedRoute>
          <LLMChatPage />
        </ProtectedRoute>
      </Route>
      <Route path="/sidebar">
        <ProtectedRoute>
          <SidebarLayout />
        </ProtectedRoute>
      </Route>
      <Route path="/smooth">
        <ProtectedRoute>
          <SmoothChat />
        </ProtectedRoute>
      </Route>
      <Route path="/scenario-simulator">
        <ProtectedRoute>
          <ScenarioSimulator />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <ToastContainer />
          <Router />
          <SessionManager />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
