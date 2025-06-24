
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch } from "wouter";
import { useLocation } from "wouter";
import { Toaster as HotToaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
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
import Summaries from "./pages/Summaries";
import Team from "./pages/Team";
import ServiceProfiles from "./pages/Profiles";
import Account from "./pages/Account";
import AIInsights from "./pages/AIInsights";
import Settings from "./pages/Settings";
import Support from "./pages/Support";
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
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: false,
    },
  },
});

const App = () => {
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <ProfileProvider>
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

                <Route path="/profiles">
                  <ProtectedRoute>
                    <ServiceProfiles />
                  </ProtectedRoute>
                </Route>

                <Route path="/summaries">
                  <ProtectedRoute>
                    <Summaries />
                  </ProtectedRoute>
                </Route>

                <Route path="/team">
                  <ProtectedRoute>
                    <Team />
                  </ProtectedRoute>
                </Route>
                
                <Route path="/account">
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                </Route>
                
                <Route path="/ai-insights">
                  <ProtectedRoute>
                    <AIInsights />
                  </ProtectedRoute>
                </Route>
                
                <Route path="/settings">
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                </Route>
                
                <Route path="/support">
                  <ProtectedRoute>
                    <Support />
                  </ProtectedRoute>
                </Route>
                
                {/* Catch-all route */}
                <Route component={NotFound} />
              </Switch>
            </Router>
              </TooltipProvider>
            </ProfileProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('App error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Daily Team Whisper</h1>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }
};

export default App;
