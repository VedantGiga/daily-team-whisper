
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch } from "wouter";
import { Toaster as HotToaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import NetworkStatus from "@/components/NetworkStatus";

// Test Firebase connection in development
if (import.meta.env.DEV) {
  import("@/lib/firebase-test");
}

// Pages
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Integrations from "./pages/Integrations";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import HomePage from "./components/HomePage";

// Auth Pages
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HotToaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        <Router>
          <NetworkStatus />
          <Switch>
            {/* Public Routes */}
            <Route path="/" component={HomePage} />
            <Route path="/privacy" component={Privacy} />
            <Route path="/terms" component={Terms} />
            <Route path="/contact" component={Contact} />
            
            {/* Auth Routes */}
            <Route path="/auth/login" component={Login} />
            <Route path="/auth/signup" component={Signup} />
            <Route path="/auth/forgot-password" component={ForgotPassword} />
            <Route path="/auth/verify-email" component={VerifyEmail} />
            
            {/* Protected Routes */}
            <Route path="/dashboard">
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            </Route>
            
            <Route path="/integrations">
              <ProtectedRoute>
                <Integrations />
              </ProtectedRoute>
            </Route>
            
            {/* Catch-all route */}
            <Route component={NotFound} />
          </Switch>
        </Router>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
