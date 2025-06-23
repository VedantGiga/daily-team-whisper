import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";

const HomePage = () => {
  try {
    const { currentUser, loading } = useAuth();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }

    return <Landing />;
  } catch (error) {
    console.error('HomePage error:', error);
    return <Landing />;
  }
};

export default HomePage;