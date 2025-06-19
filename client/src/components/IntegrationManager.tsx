import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, CheckCircle, Clock, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IntegrationService, INTEGRATION_PROVIDERS, type ProviderKey } from "@/lib/integrationService";
import type { Integration } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface IntegrationManagerProps {
  userId: number;
}

export const IntegrationManager = ({ userId }: IntegrationManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's integrations
  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ["/api/integrations", userId],
    queryFn: () => IntegrationService.getUserIntegrations(userId),
  });

  // Connect GitHub mutation
  const connectGitHubMutation = useMutation({
    mutationFn: () => IntegrationService.connectGitHub(userId),
    onSuccess: (data) => {
      window.open(data.authUrl, "_blank", "width=600,height=700");
      toast({
        title: "GitHub Connection",
        description: "Complete the authorization in the popup window",
      });
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Unable to connect to GitHub. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle integration mutation
  const toggleIntegrationMutation = useMutation({
    mutationFn: ({ id, isConnected }: { id: number; isConnected: boolean }) =>
      IntegrationService.updateIntegration(id, { isConnected }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations", userId] });
      toast({
        title: "Integration Updated",
        description: "Integration status has been changed",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Unable to update integration status",
        variant: "destructive",
      });
    },
  });

  // Sync integration mutation
  const syncIntegrationMutation = useMutation({
    mutationFn: (id: number) => IntegrationService.syncIntegration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations", userId] });
      toast({
        title: "Sync Complete",
        description: "Integration data has been synced",
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

  // Delete integration mutation
  const deleteIntegrationMutation = useMutation({
    mutationFn: (id: number) => IntegrationService.deleteIntegration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations", userId] });
      toast({
        title: "Integration Removed",
        description: "Integration has been disconnected",
      });
    },
    onError: () => {
      toast({
        title: "Removal Failed",
        description: "Unable to remove integration",
        variant: "destructive",
      });
    },
  });

  const getIntegrationByProvider = (provider: ProviderKey): Integration | undefined => {
    return integrations.find((integration) => integration.provider === provider);
  };

  const handleConnect = async (provider: ProviderKey) => {
    if (provider === "github") {
      connectGitHubMutation.mutate();
    } else {
      toast({
        title: "Coming Soon",
        description: `${INTEGRATION_PROVIDERS[provider].name} integration is coming soon!`,
      });
    }
  };

  const handleToggle = (integration: Integration, enabled: boolean) => {
    toggleIntegrationMutation.mutate({
      id: integration.id,
      isConnected: enabled,
    });
  };

  const handleSync = (integration: Integration) => {
    syncIntegrationMutation.mutate(integration.id);
  };

  const handleDelete = (integration: Integration) => {
    if (confirm(`Are you sure you want to disconnect ${integration.provider}?`)) {
      deleteIntegrationMutation.mutate(integration.id);
    }
  };

  const formatLastSync = (date: Date | string | null) => {
    if (!date) return "Never";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const diffMinutes = Math.ceil((dateObj.getTime() - Date.now()) / (1000 * 60));
    return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
      diffMinutes,
      "minute"
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Integrations</h2>
        <p className="text-muted-foreground">
          Connect your tools to automatically track your work activities
        </p>
      </div>

      <div className="grid gap-4">
        {(Object.keys(INTEGRATION_PROVIDERS) as ProviderKey[]).map((provider) => {
          const config = INTEGRATION_PROVIDERS[provider];
          const integration = getIntegrationByProvider(provider);
          const isConnected = integration?.isConnected ?? false;
          const isAvailable = provider === "github"; // Only GitHub is implemented

          return (
            <Card key={provider} className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center text-white text-lg`}>
                    {config.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{config.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {config.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {integration && (
                    <Badge variant={isConnected ? "default" : "secondary"}>
                      {isConnected ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <AlertCircle className="w-3 h-3 mr-1" />
                      )}
                      {isConnected ? "Connected" : "Disconnected"}
                    </Badge>
                  )}
                  {!isAvailable && (
                    <Badge variant="outline">Coming Soon</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {integration ? (
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={isConnected}
                            onCheckedChange={(checked) => handleToggle(integration, checked)}
                            disabled={toggleIntegrationMutation.isPending}
                          />
                          <span className="text-sm text-muted-foreground">
                            {isConnected ? "Active" : "Paused"}
                          </span>
                        </div>
                        
                        {isConnected && (
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>Last sync: {formatLastSync(integration.lastSyncAt)}</span>
                          </div>
                        )}

                        {integration.providerUsername && (
                          <Badge variant="outline" className="text-xs">
                            @{integration.providerUsername}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {isAvailable ? "Not connected" : "Available soon"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {integration ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(integration)}
                          disabled={!isConnected || syncIntegrationMutation.isPending}
                        >
                          <RefreshCw className={`w-3 h-3 mr-1 ${syncIntegrationMutation.isPending ? "animate-spin" : ""}`} />
                          Sync
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(integration)}
                          disabled={deleteIntegrationMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Remove
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => handleConnect(provider)}
                        disabled={!isAvailable || connectGitHubMutation.isPending}
                        size="sm"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        {isAvailable ? "Connect" : "Coming Soon"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {integrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Integration Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {integrations.filter((i) => i.isConnected).length}
                </div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {integrations.filter((i) => !i.isConnected).length}
                </div>
                <div className="text-sm text-muted-foreground">Paused</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {integrations.length}
                </div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {Object.keys(INTEGRATION_PROVIDERS).length - integrations.length}
                </div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};