import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SearchPage from "./pages/SearchPage";
import Profile from "./pages/Profile";
import Subscription from "./pages/Subscription";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex gap-1.5">
        {[0,1,2,3].map(i => (
          <div key={i} className="w-2.5 h-2.5 rounded-full animate-pulse-dot"
            style={{ animationDelay: `${i*0.15}s`, backgroundColor: ['#fff','#60a5fa','#fbbf24','#f87171'][i] }} />
        ))}
      </div>
    </div>
  );
  if (!user) return <Navigate to="/register" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* First screen for unauthenticated users is register */}
            <Route path="/" element={<AuthGate />} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/home" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

function AuthGate() {
  const { user, loading } = useAuth();
  if (loading) return null;
  // Unauthenticated → registration. Authenticated → landing/home page.
  if (!user) return <Navigate to="/register" replace />;
  return <Index />;
}

export default App;
