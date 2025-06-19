import { IntegrationManager } from "@/components/IntegrationManager";
import { GitHubConfigStatus } from "@/components/GitHubConfigStatus";
import { ActivityFeed } from "@/components/ActivityFeed";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useState } from "react";

const Integrations = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Mock user ID for now - in a real app this would come from auth context
  const userId = 1;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader onThemeToggle={toggleTheme} isDarkMode={isDarkMode} />
      
      <main className="container mx-auto px-6 py-8 space-y-8">
        <GitHubConfigStatus />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <IntegrationManager userId={userId} />
          <ActivityFeed userId={userId} />
        </div>
      </main>
    </div>
  );
};

export default Integrations;