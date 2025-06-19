import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Github, 
  Calendar, 
  Settings, 
  User, 
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  BarChart3,
  Plus,
  Moon,
  Sun
} from "lucide-react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { IntegrationCard } from "@/components/IntegrationCard";
import { SummaryCard } from "@/components/SummaryCard";
import { QuickStats } from "@/components/QuickStats";

const Index = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const integrations = [
    { name: "GitHub", icon: Github, status: "connected" as const, lastSync: "2 hours ago", color: "bg-gray-900" },
    { name: "Slack", icon: Mail, status: "disconnected" as const, lastSync: "Never", color: "bg-purple-600" },
    { name: "Google Calendar", icon: Calendar, status: "connected" as const, lastSync: "1 hour ago", color: "bg-blue-600" },
    { name: "Jira", icon: FileText, status: "disconnected" as const, lastSync: "Never", color: "bg-blue-500" },
    { name: "Notion", icon: FileText, status: "connected" as const, lastSync: "3 hours ago", color: "bg-black" },
  ];

  const todaySummary = {
    date: "December 18, 2025",
    tasksCompleted: 8,
    blockers: 2,
    meetings: 4,
    summary: "Productive day focusing on the AutoBrief AI integration features. Completed the GitHub API setup and made significant progress on the dashboard UI. Two blockers identified around rate limiting that need attention tomorrow."
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <DashboardHeader onThemeToggle={toggleTheme} isDarkMode={isDarkMode} />
      
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Welcome to AutoBrief AI
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your AI-powered work summary tool that keeps remote teams in sync with automated daily briefs.
          </p>
        </div>

        {/* Quick Stats */}
        <QuickStats />

        {/* Today's Summary */}
        <SummaryCard summary={todaySummary} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Integrations */}
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Connected Services
                </CardTitle>
                <CardDescription>
                  Manage your third-party integrations
                </CardDescription>
              </div>
              <Button size="sm" className="gradient-primary text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Integration
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {integrations.map((integration) => (
                <IntegrationCard key={integration.name} integration={integration} />
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest updates from your connected services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Github className="h-4 w-4 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Pushed 3 commits to AutoBrief</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Team standup meeting completed</p>
                    <p className="text-xs text-muted-foreground">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <FileText className="h-4 w-4 text-black" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Updated project documentation</p>
                    <p className="text-xs text-muted-foreground">6 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="shadow-lg bg-gradient-to-r from-purple-500 to-blue-600 text-white">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to get your first AI summary?</h3>
            <p className="text-purple-100 mb-6">
              Connect your tools and let AutoBrief AI generate your daily work summary automatically.
            </p>
            <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
              Set up Integrations
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;
