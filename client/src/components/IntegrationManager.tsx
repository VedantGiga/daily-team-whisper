import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, CheckCircle, Clock, ExternalLink, RefreshCw, Calendar, Github, Mail, Plus } from "lucide-react";
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
      return <Calendar className="h-5 w-5" />;
    case 'github':
      return <Github className="h-5 w-5" />;
    case 'slack':
      return <Mail className="h-5 w-5" />;
    default:
      return <CheckCircle className="h-5 w-5" />;
  }
};

const getProviderColor = (provider: string) => {
  switch (provider) {
    case 'google_calendar':
      return 'from-blue-500 to-blue-600';
    case 'github':
      return 'from-gray-700 to-gray-900';
    case 'slack':
      return 'from-purple-500 to-purple-600';
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
    default:
      return provider;
  }
};

export const IntegrationManager = ({ userId }: IntegrationManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's integrations
  const { data: integrations = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/integrations", userId],
    queryFn: async () => {
      const response = await fetch(`/api/integrations?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch integrations');
      return response.json();
    },
  });

  // Sync integration mutation
  const syncMutation = useMutation({
    mutationFn: async (integrationId: number) => {
      const response = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to sync integration');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities", userId] });
      toast({
        title: "Sync Complete",
        description: "Integration data has been synchronized",
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Unable to sync integration data",
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

      <AnimatePresence mode="wait">
        {integrations.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-12 text-muted-foreground"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <Plus className="h-12 w-12 mx-auto mb-4 opacity-20" />
            </motion.div>
            <motion.p 
              className="text-lg font-medium mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              No Integrations Yet
            </motion.p>
            <motion.p 
              className="text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Connect your tools to start tracking work activities
            </motion.p>
          </motion.div>
        ) : (
          <motion.div 
            key="integrations"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {integrations.map((integration: Integration, index: number) => (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="group p-4 rounded-lg border bg-card/80 backdrop-blur-sm hover:bg-card transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <motion.div 
                    className={`p-3 rounded-full bg-gradient-to-r ${getProviderColor(integration.provider)} text-white flex-shrink-0`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    {getProviderIcon(integration.provider)}
                  </motion.div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <motion.h4 
                        className="font-semibold text-foreground"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        {formatProviderName(integration.provider)}
                      </motion.h4>
                      <AnimatePresence>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ type: "spring", stiffness: 500 }}
                        >
                          <Badge 
                            variant={integration.isConnected ? "default" : "secondary"}
                            className={integration.isConnected ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : ""}
                          >
                            {integration.isConnected ? (
                              <motion.div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Connected
                              </motion.div>
                            ) : (
                              <motion.div className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Disconnected
                              </motion.div>
                            )}
                          </Badge>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    
                    <motion.div 
                      className="flex items-center gap-4 text-xs text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 + 0.2 }}
                    >
                      {integration.lastSyncAt ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last sync: {new Date(integration.lastSyncAt).toLocaleString()}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Never synced
                        </div>
                      )}
                    </motion.div>
                  </div>
                  
                  <motion.div 
                    className="flex items-center gap-2 flex-shrink-0"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 + 0.3 }}
                  >
                    {integration.isConnected && (
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => syncMutation.mutate(integration.id)}
                          disabled={syncMutation.isPending}
                          className="h-8 px-3"
                        >
                          <motion.div
                            animate={syncMutation.isPending ? { rotate: 360 } : {}}
                            transition={{ duration: 1, repeat: syncMutation.isPending ? Infinity : 0, ease: "linear" }}
                            className="mr-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </motion.div>
                          Sync
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

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