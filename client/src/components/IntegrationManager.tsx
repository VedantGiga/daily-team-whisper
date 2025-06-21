import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, CheckCircle, Clock, ExternalLink, RefreshCw, Calendar, Plus, X } from "lucide-react";
import { SiGithub, SiGooglecalendar, SiSlack, SiNotion, SiJira } from "react-icons/si";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import type { Integration } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface IntegrationManagerProps {
  userId: number;
}

const getProviderIcon = (provider: string) => {
  switch (provider) {
    case 'google_calendar':
      return <SiGooglecalendar className="h-5 w-5" />;
    case 'github':
      return <SiGithub className="h-5 w-5" />;
    case 'slack':
      return <SiSlack className="h-5 w-5" />;
    case 'notion':
      return <SiNotion className="h-5 w-5" />;
    default:
      return <CheckCircle className="h-5 w-5" />;
  }
};

const getProviderColor = (provider: string) => {
  switch (provider) {
    case 'google_calendar':
      return 'from-blue-500 to-blue-600';
    case 'github':
      return 'from-gray-800 to-black';
    case 'slack':
      return 'from-purple-500 to-purple-700';
    case 'notion':
      return 'from-black to-gray-800';
    default:
      return 'from-gray-500 to-gray-600';
  }
};

const formatProviderName = (provider: string) => {
  switch (provider) {
    case 'google_calendar':
      return 'Google Calendar';
    case 'github':
      return 'GitHub';
    case 'slack':
      return 'Slack';
    case 'notion':
      return 'Notion';
    default:
      return provider;
  }
};

const AVAILABLE_INTEGRATIONS = [
  {
    provider: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sync calendar events and meetings',
    color: 'from-blue-500 to-blue-600',
    icon: SiGooglecalendar,
  },
  {
    provider: 'github',
    name: 'GitHub',
    description: 'Track commits, pull requests, and issues',
    color: 'from-gray-800 to-black',
    icon: SiGithub,
  },
  {
    provider: 'jira',
    name: 'Jira',
    description: 'Track issues, tasks, and project progress',
    color: 'from-blue-600 to-blue-700',
    icon: SiJira,
  },
  {
    provider: 'notion',
    name: 'Notion',
    description: 'Create databases and sync work activities',
    color: 'from-black to-gray-800',
    icon: SiNotion,
  },
  {
    provider: 'slack',
    name: 'Slack',
    description: 'Import messages and workspace activity',
    color: 'from-purple-500 to-purple-700',
    icon: SiSlack,
  },
];

export const IntegrationManager = ({ userId }: IntegrationManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();


  // Handle OAuth callback messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'OAUTH_SUCCESS') {
        queryClient.invalidateQueries({ queryKey: ["/api/integrations", userId] });
        toast({
          title: "Integration Connected",
          description: "Successfully connected to your service",
        });
      } else if (event.data.type === 'OAUTH_ERROR') {
        toast({
          title: "Connection Failed",
          description: event.data.error || "Failed to connect integration",
          variant: "destructive",
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [queryClient, userId, toast]);

  // Fetch user's integrations
  const { data: integrations = [], isLoading, refetch } = useQuery<Integration[]>({
    queryKey: ["/api/integrations", userId],
    queryFn: async () => {
      const response = await fetch(`/api/integrations?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch integrations');
      return response.json();
    },
  });

  // Check GitHub configuration
  const { data: githubConfig } = useQuery({
    queryKey: ["/api/integrations/github/test"],
    queryFn: async () => {
      const response = await fetch('/api/integrations/github/test');
      if (!response.ok) throw new Error('Failed to check GitHub config');
      return response.json();
    },
  });

  // Check Google Calendar configuration
  const { data: googleCalendarConfig } = useQuery({
    queryKey: ["/api/integrations/google-calendar/test"],
    queryFn: async () => {
      const response = await fetch('/api/integrations/google-calendar/test');
      if (!response.ok) throw new Error('Failed to check Google Calendar config');
      return response.json();
    },
  });

  // Check Notion configuration
  const { data: notionConfig } = useQuery({
    queryKey: ["/api/integrations/notion/test"],
    queryFn: async () => {
      const response = await fetch('/api/integrations/notion/test');
      if (!response.ok) throw new Error('Failed to check Notion config');
      return response.json();
    },
  });

  // Check Jira configuration
  const { data: jiraConfig } = useQuery({
    queryKey: ["/api/integrations/jira/test"],
    queryFn: async () => {
      const response = await fetch('/api/integrations/jira/test');
      if (!response.ok) throw new Error('Failed to check Jira config');
      return response.json();
    },
  });

  // Check Slack configuration
  const { data: slackConfig } = useQuery({
    queryKey: ["/api/integrations/slack/test"],
    queryFn: async () => {
      const response = await fetch('/api/integrations/slack/test');
      if (!response.ok) throw new Error('Failed to check Slack config');
      return response.json();
    },
  });

  // Connect GitHub mutation
  const connectGitHubMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/integrations/github/connect?userId=${userId}`, {
        method: 'GET',
      });
      if (!response.ok) throw new Error('Failed to connect GitHub');
      return response.json();
    },
    onSuccess: (data) => {
      const popup = window.open(
        data.authUrl, 
        "github-oauth", 
        "width=600,height=700,scrollbars=yes,resizable=yes"
      );
      
      if (!popup) {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site and try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "GitHub Connection",
        description: "Complete the authorization in the popup window",
      });

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setTimeout(() => {
            // Force refresh all queries when connecting
            queryClient.removeQueries({ queryKey: ["/api/integrations", userId] });
            queryClient.removeQueries({ queryKey: ["/api/activities", userId] });
            queryClient.invalidateQueries({ queryKey: ["/api/integrations", userId] });
            queryClient.invalidateQueries({ queryKey: ["/api/activities", userId] });
          }, 1000);
        }
      }, 1000);
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Unable to connect to GitHub. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Connect Google Calendar mutation
  const connectGoogleCalendarMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/integrations/google-calendar/connect?userId=${userId}`, {
        method: 'GET',
      });
      if (!response.ok) throw new Error('Failed to connect Google Calendar');
      return response.json();
    },
    onSuccess: (data) => {
      const popup = window.open(data.authUrl, '_blank', 'width=600,height=700');
      
      if (!popup) {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site and try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Google Calendar Connection",
        description: "Complete the authorization in the popup window",
      });

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["/api/integrations", userId] });
          }, 1000);
        }
      }, 1000);
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Unable to connect to Google Calendar. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Connect Notion mutation
  const connectNotionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/integrations/notion/connect?userId=${userId}`, {
        method: 'GET',
      });
      if (!response.ok) throw new Error('Failed to connect Notion');
      return response.json();
    },
    onSuccess: (data) => {
      const popup = window.open(data.authUrl, '_blank', 'width=600,height=700');
      
      if (!popup) {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site and try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Notion Connection",
        description: "Complete the authorization in the popup window",
      });

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["/api/integrations", userId] });
          }, 1000);
        }
      }, 1000);
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Unable to connect to Notion. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Connect Jira mutation
  const connectJiraMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/integrations/jira/connect?userId=${userId}`, {
        method: 'GET',
      });
      if (!response.ok) throw new Error('Failed to connect Jira');
      return response.json();
    },
    onSuccess: (data) => {
      const popup = window.open(data.authUrl, '_blank', 'width=600,height=700');
      
      if (!popup) {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site and try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Jira Connection",
        description: "Complete the authorization in the popup window",
      });

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["/api/integrations", userId] });
          }, 1000);
        }
      }, 1000);
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Unable to connect to Jira. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Connect Slack mutation
  const connectSlackMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/integrations/slack/connect?userId=${userId}`, {
        method: 'GET',
      });
      if (!response.ok) throw new Error('Failed to connect Slack');
      return response.json();
    },
    onSuccess: (data) => {
      const popup = window.open(data.authUrl, '_blank', 'width=600,height=700');
      
      if (!popup) {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site and try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Slack Connection",
        description: "Complete the authorization in the popup window",
      });

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["/api/integrations", userId] });
          }, 1000);
        }
      }, 1000);
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Unable to connect to Slack. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Track syncing state for each integration
  const [syncingIntegrations, setSyncingIntegrations] = useState<Set<number>>(new Set());

  // Sync integration function
  const syncIntegration = async (integrationId: number) => {
    setSyncingIntegrations(prev => new Set(prev).add(integrationId));
    try {
      const response = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to sync integration');
      
      queryClient.invalidateQueries({ queryKey: ["/api/integrations", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities", userId] });
      toast({
        title: "Sync Complete",
        description: "Integration data has been synchronized",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Unable to sync integration data",
        variant: "destructive",
      });
    } finally {
      setSyncingIntegrations(prev => {
        const newSet = new Set(prev);
        newSet.delete(integrationId);
        return newSet;
      });
    }
  };

  // Disconnect integration mutation
  const disconnectMutation = useMutation({
    mutationFn: async (integrationId: number) => {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to disconnect integration');
    },
    onSuccess: () => {
      // Force refresh all queries
      queryClient.removeQueries({ queryKey: ["/api/integrations", userId] });
      queryClient.removeQueries({ queryKey: ["/api/activities", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities", userId] });
      toast({
        title: "Integration Disconnected",
        description: "Successfully disconnected from service",
      });
    },
    onError: () => {
      toast({
        title: "Disconnect Failed",
        description: "Unable to disconnect integration",
        variant: "destructive",
      });
    },
  });

  const refreshMutation = useMutation({
    mutationFn: () => refetch(),
    onSuccess: () => {
      toast({
        title: "Integrations Refreshed",
        description: "Latest integration data has been loaded",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-lg border bg-card/50"
          >
            <div className="flex items-center gap-3">
              <motion.div 
                className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <div className="flex-1 space-y-2">
                <motion.div 
                  className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div 
                  className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-sm font-medium text-muted-foreground">Active Integrations</h3>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="h-8 px-2"
          >
            <motion.div
              animate={refreshMutation.isPending ? { rotate: 360 } : {}}
              transition={{ duration: 1, repeat: refreshMutation.isPending ? Infinity : 0, ease: "linear" }}
            >
              <RefreshCw className="h-3 w-3" />
            </motion.div>
          </Button>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-3"
      >
        {AVAILABLE_INTEGRATIONS.map((availableIntegration, index) => {
          const connectedIntegration = integrations.find((i: Integration) => i.provider === availableIntegration.provider);
          const isConnected = connectedIntegration?.isConnected || false;
          const canConnect = availableIntegration.provider === 'github' ? githubConfig?.configured : 
                            availableIntegration.provider === 'google_calendar' ? googleCalendarConfig?.configured :
                            availableIntegration.provider === 'notion' ? notionConfig?.configured :
                            availableIntegration.provider === 'jira' ? jiraConfig?.configured :
                            availableIntegration.provider === 'slack' ? slackConfig?.configured : true;
          
          return (
            <motion.div
              key={availableIntegration.provider}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="group p-4 rounded-lg border bg-card/80 backdrop-blur-sm hover:bg-card transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <motion.div 
                  className={`p-3 rounded-full bg-gradient-to-r ${availableIntegration.color} text-white flex-shrink-0`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <availableIntegration.icon className="h-5 w-5" />
                </motion.div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <motion.h4 
                      className="font-semibold text-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {availableIntegration.name}
                    </motion.h4>
                    <AnimatePresence>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        <Badge 
                          variant={isConnected ? "default" : "secondary"}
                          className={isConnected ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : ""}
                        >
                          {isConnected ? (
                            <motion.div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Connected
                            </motion.div>
                          ) : (
                            <motion.div className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Not Connected
                            </motion.div>
                          )}
                        </Badge>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  
                  <motion.p 
                    className="text-sm text-muted-foreground mb-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 + 0.1 }}
                  >
                    {availableIntegration.description}
                  </motion.p>
                  
                  {connectedIntegration?.lastSyncAt && (
                    <motion.div 
                      className="flex items-center gap-1 text-xs text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 + 0.2 }}
                    >
                      <Clock className="h-3 w-3" />
                      Last sync: {new Date(connectedIntegration.lastSyncAt).toLocaleString()}
                    </motion.div>
                  )}
                </div>
                
                <motion.div 
                  className="flex items-center gap-2 flex-shrink-0"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.3 }}
                >
                  {isConnected ? (
                    <div className="flex items-center gap-2">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => connectedIntegration && syncIntegration(connectedIntegration.id)}
                          disabled={syncingIntegrations.has(connectedIntegration?.id || 0)}
                          className="h-8 px-3"
                        >
                          <motion.div
                            animate={syncingIntegrations.has(connectedIntegration?.id || 0) ? { rotate: 360 } : {}}
                            transition={{ duration: 1, repeat: syncingIntegrations.has(connectedIntegration?.id || 0) ? Infinity : 0, ease: "linear" }}
                            className="mr-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </motion.div>
                          Sync
                        </Button>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => connectedIntegration && disconnectMutation.mutate(connectedIntegration.id)}
                          disabled={disconnectMutation.isPending}
                          className="h-8 px-3"
                        >
                          Disconnect
                        </Button>
                      </motion.div>
                    </div>
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        size="sm"
                        onClick={() => {
                          if (availableIntegration.provider === 'github') {
                            connectGitHubMutation.mutate();
                          } else if (availableIntegration.provider === 'google_calendar') {
                            connectGoogleCalendarMutation.mutate();
                          } else if (availableIntegration.provider === 'notion') {
                            connectNotionMutation.mutate();
                          } else if (availableIntegration.provider === 'jira') {
                            connectJiraMutation.mutate();
                          } else if (availableIntegration.provider === 'slack') {
                            connectSlackMutation.mutate();
                          }
                        }}
                        disabled={
                          !canConnect || 
                          connectGitHubMutation.isPending || 
                          connectGoogleCalendarMutation.isPending ||
                          connectNotionMutation.isPending ||
                          connectJiraMutation.isPending ||
                          connectSlackMutation.isPending
                        }
                        className="h-8 px-3"
                      >
                        {!canConnect ? 'Not Configured' : 'Connect'}
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Add more integrations button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="pt-4 border-t border-border/40"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            variant="outline" 
            className="w-full border-dashed border-2 h-12 text-muted-foreground hover:text-foreground transition-colors"
            disabled
          >
            <Plus className="h-4 w-4 mr-2" />
            More integrations coming soon
          </Button>
        </motion.div>
      </motion.div>


    </div>
  );
};