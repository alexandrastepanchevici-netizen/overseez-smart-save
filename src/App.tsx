import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DeepLinkHandler } from "@/components/DeepLinkHandler";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import PageTransition from "@/components/PageTransition";
import BadgeUnlockCelebration from "@/components/BadgeUnlockCelebration";
import StreakMilestoneCelebration from "@/components/StreakMilestoneCelebration";
import SplashScreen from "@/components/SplashScreen";

// Capture referral param from ?ref=NICKNAME (before the #) and persist to localStorage
const refParam = new URLSearchParams(window.location.search).get('ref');
if (refParam) localStorage.setItem('overseez_ref', refParam);
import Index from "./pages/Index";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SearchPage from "./pages/SearchPage";
import Profile from "./pages/Profile";
import Subscription from "./pages/Subscription";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import Movement from "./pages/Movement";
import StreakPage from "./pages/StreakPage";

const queryClient = new QueryClient();

function AppInner() {
  usePushNotifications();
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <SplashScreen />;
  if (!user) return <Navigate to="/register" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <SplashScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AuthProvider>
        <HashRouter>
          <DeepLinkHandler />
          <AppInner />
          <BadgeUnlockCelebration />
          <StreakMilestoneCelebration />
          <PageTransition>
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
            <Route path="/movement" element={<Movement />} />
            <Route path="/streak" element={<ProtectedRoute><StreakPage /></ProtectedRoute>} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </PageTransition>
        </HashRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

function AuthGate() {
  const { user, loading } = useAuth();
  if (loading) return <SplashScreen />;
  if (!user) return <Navigate to="/register" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default App;
