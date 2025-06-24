import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Calendar, 
  MessageSquare, 
  GitBranch, 
  FileText, 
  Clock, 
  Zap,
  Settings,
  BarChart3,
  Users,
  Target
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface QuickActionsProps {
  userId: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
  badge?: string;
}

export function QuickActions({ userId }: QuickActionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/summaries/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          date: new Date().toISOString().split('T')[0],
          tone: 'professional',
          filter: 'all'
        }),
      });
      if (!response.ok) throw new Error('Failed to generate summary');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Summary Generated",
        description: "Your daily summary has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/summaries'] });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate summary. Please try again.",
        variant: "destructive"
      });
    },
    onMutate: () => setIsGenerating(true),
    onSettled: () => setIsGenerating(false),
  });

  const syncIntegrationsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/integrations/sync-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to sync integrations');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sync Complete",
        description: "All integrations have been synchronized successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync integrations. Please try again.",
        variant: "destructive"
      });
    },
  });

  const quickActions: QuickAction[] = [
    {
      id: 'generate-summary',
      title: 'Generate Daily Summary',
      description: 'Create AI-powered summary of today\'s activities',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      badge: 'AI',
      action: () => generateSummaryMutation.mutate(),
    },
    {
      id: 'sync-integrations',
      title: 'Sync All Integrations',
      description: 'Refresh data from GitHub, Slack, and other services',
      icon: <Zap className="h-5 w-5" />,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => syncIntegrationsMutation.mutate(),
    },
    {
      id: 'view-calendar',
      title: 'Today\'s Schedule',
      description: 'Quick view of your meetings and events',
      icon: <Calendar className="h-5 w-5" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => window.open('https://calendar.google.com', '_blank'),
    },
    {
      id: 'github-activity',
      title: 'GitHub Activity',
      description: 'Check recent commits and pull requests',
      icon: <GitBranch className="h-5 w-5" />,
      color: 'bg-gray-700 hover:bg-gray-800',
      action: () => window.open('https://github.com', '_blank'),
    },
    {
      id: 'slack-messages',
      title: 'Slack Messages',
      description: 'View recent team communications',
      icon: <MessageSquare className="h-5 w-5" />,
      color: 'bg-pink-500 hover:bg-pink-600',
      action: () => window.open('https://slack.com', '_blank'),
    },
    {
      id: 'productivity-goals',
      title: 'Set Daily Goals',
      description: 'Define objectives for today',
      icon: <Target className="h-5 w-5" />,
      color: 'bg-orange-500 hover:bg-orange-600',
      badge: 'New',
      action: () => toast({
        title: "Feature Coming Soon",
        description: "Goal setting will be available in the next update.",
      }),
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Quick Actions
        </CardTitle>
        <CardDescription>
          Shortcuts to common tasks and productivity tools
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className={`h-auto p-4 flex flex-col items-start space-y-2 hover:shadow-md transition-all ${
                (action.id === 'generate-summary' && isGenerating) || 
                (action.id === 'sync-integrations' && syncIntegrationsMutation.isPending)
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
              onClick={action.action}
              disabled={
                (action.id === 'generate-summary' && isGenerating) || 
                (action.id === 'sync-integrations' && syncIntegrationsMutation.isPending)
              }
            >
              <div className="flex items-center justify-between w-full">
                <div className={`p-2 rounded-md text-white ${action.color}`}>
                  {action.icon}
                </div>
                {action.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {action.badge}
                  </Badge>
                )}
              </div>
              <div className="text-left space-y-1">
                <h4 className="font-medium text-sm">{action.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {action.description}
                </p>
              </div>
            </Button>
          ))}
        </div>

        {/* Additional Quick Stats */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {isGenerating ? '...' : '12'}
              </p>
              <p className="text-xs text-muted-foreground">Activities Today</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {syncIntegrationsMutation.isPending ? '...' : '3'}
              </p>
              <p className="text-xs text-muted-foreground">Active Integrations</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">85%</p>
              <p className="text-xs text-muted-foreground">Productivity Score</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}