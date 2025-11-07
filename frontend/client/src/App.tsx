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
import Onboarding from "@/pages/onboarding";
import OnboardingDataForm from "@/pages/OnboardingDataForm";
import TableConfigDemo from "@/pages/table-config-demo";
import BusinessContextPrompts from "@/pages/BusinessContextPrompts";
import Chat from "@/pages/chat-clean-top";
import SmoothChat from "@/pages/chat-smooth";
import AgentChat from "@/pages/agent-chat";
import ScenarioSimulator from "@/pages/scenario-simulator";
import SidebarLayout from "@/components/sidebar-layout";
import Collaboration from "@/pages/collaboration";
import NotFound from "@/pages/not-found";
import ProtectedRoute from "@/components/protected-route";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import "./utils/env-check";

// Componente para manejar la ruta raíz con lógica de autenticación
function RootRoute() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setLocation("/dashboard");
    // const isLoggedIn = sessionStorage.getItem("isLoggedIn");

    // if (isLoggedIn) {
    //   setLocation("/dashboard");
    // } else {
    //   setLocation("/login");
    // }

    setIsLoading(false);
  }, []);

  // Mostrar un loading mientras se decide la redirección
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRoute} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/onboarding/data" component={OnboardingDataForm} />
      <Route path="/onboarding/context" component={BusinessContextPrompts} />
      <Route path="/table-demo" component={TableConfigDemo} />
      <Route path="/dashboard" component={Dashboard} />
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
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
