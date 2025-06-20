import { IntegrationManager } from "@/components/IntegrationManager";
import { GitHubConfigStatus } from "@/components/GitHubConfigStatus";
import { GitHubUserInfo } from "@/components/GitHubUserInfo";
import { ActivityFeed } from "@/components/ActivityFeed";
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

  const githubIntegration = integrations.find(i => i.provider === "github" && i.isConnected);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader onThemeToggle={toggleTheme} isDarkMode={isDarkMode} />
      
      <main className="container mx-auto px-6 py-8 space-y-8">
        <GitHubConfigStatus />
        
        {githubIntegration ? (
          <div className="space-y-8">
            <GitHubUserInfo 
              integration={githubIntegration}
              onSync={() => syncIntegrationMutation.mutate(githubIntegration.id)}
              isSyncing={syncIntegrationMutation.isPending}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {userId && <IntegrationManager userId={userId} />}
              {userId && <ActivityFeed userId={userId} />}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {userId && <IntegrationManager userId={userId} />}
            {userId && <ActivityFeed userId={userId} />}
          </div>
        )}
      </main>
    </div>
  );
};

export default Integrations;