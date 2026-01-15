import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profiles";
import { Loader2 } from "lucide-react";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import ProfileSetup from "@/pages/ProfileSetup";
import RequestList from "@/pages/RequestList";
import RequestDetail from "@/pages/RequestDetail";
import NewRequest from "@/pages/NewRequest";
import TestLogin from "@/pages/TestLogin";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const { data: profile, isLoading: isLoadingProfile } = useProfile();

  if (isLoading || (user && isLoadingProfile)) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  if (!profile) {
    // If authenticated but no profile, force to setup
    return <ProfileSetup />;
  }

  return <Component />;
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Public Landing */}
      <Route path="/">
        {user ? <Redirect to="/dashboard" /> : <Landing />}
      </Route>

      {/* Protected Routes */}
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      
      <Route path="/requests">
        <ProtectedRoute component={RequestList} />
      </Route>

      <Route path="/requests/new">
        <ProtectedRoute component={NewRequest} />
      </Route>

      <Route path="/requests/:id">
        <ProtectedRoute component={RequestDetail} />
      </Route>

      <Route path="/profile-setup">
        {user ? <ProfileSetup /> : <Redirect to="/" />}
      </Route>

      {/* Test Login (for development/testing) */}
      <Route path="/test-login">
        <TestLogin />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
