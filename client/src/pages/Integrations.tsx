import { IntegrationManager } from "@/components/IntegrationManager";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IntegrationService } from "@/lib/integrationService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUserId } from "@/lib/userService";

const Integrations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentUser, userProfile } = useAuth();
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Get user ID from Firebase UID
  const userId = useUserId(currentUser?.uid);

  // Fetch user's integrations
  const { data: integrations = [] } = useQuery({
    queryKey: ["/api/integrations", userId],
    queryFn: () => IntegrationService.getUserIntegrations(userId!),
    enabled: !!userId, // Only fetch when we have a valid userId
  });

  // Sync integration mutation
  const syncIntegrationMutation = useMutation({
    mutationFn: (id: number) => IntegrationService.syncIntegration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities", userId] });
      toast({
        title: "Sync Complete",
        description: "GitHub data has been synced successfully",
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Unable to sync GitHub data",
        variant: "destructive",
      });
    },
  });



  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader onThemeToggle={toggleTheme} isDarkMode={isDarkMode} />
      
      <main className="container mx-auto px-6 py-8 space-y-8">
        <div className="max-w-4xl mx-auto">
          {userId && <IntegrationManager userId={userId} />}
        </div>
      </main>
    </div>
  );
};

export default Integrations;