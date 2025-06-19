import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, RefreshCw, ExternalLink, Copy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface GitHubConfig {
  configured: boolean;
  clientId: string | null;
  hasSecret: boolean;
  callbackUrl: string;
}

export const GitHubConfigStatus = () => {
  const { toast } = useToast();

  const { data: config, isLoading, refetch } = useQuery<GitHubConfig>({
    queryKey: ["/api/integrations/github/test"],
    queryFn: async () => {
      const response = await fetch("/api/integrations/github/test");
      if (!response.ok) throw new Error("Failed to check configuration");
      return response.json();
    },
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Callback URL copied successfully",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy the URL manually",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Checking GitHub Configuration...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Configuration Check Failed
          </CardTitle>
          <CardDescription>Unable to verify GitHub OAuth setup</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const allConfigured = config.configured && config.clientId && config.hasSecret;

  return (
    <Card className={allConfigured ? "border-green-200 dark:border-green-800" : "border-yellow-200 dark:border-yellow-800"}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {allConfigured ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
            GitHub OAuth Configuration
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          {allConfigured 
            ? "GitHub integration is properly configured and ready to use"
            : "Some configuration steps are missing for GitHub integration"
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Client ID</span>
              <Badge variant={config.clientId ? "default" : "destructive"}>
                {config.clientId ? "Set" : "Missing"}
              </Badge>
            </div>
            {config.clientId && (
              <p className="text-xs text-muted-foreground font-mono">
                {config.clientId}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Client Secret</span>
              <Badge variant={config.hasSecret ? "default" : "destructive"}>
                {config.hasSecret ? "Set" : "Missing"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {config.hasSecret ? "••••••••••••••••" : "Not configured"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Callback URL</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => copyToClipboard(config.callbackUrl)}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
          </div>
          <p className="text-xs text-muted-foreground font-mono break-all">
            {config.callbackUrl}
          </p>
        </div>

        {!allConfigured && (
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Setup Required
              </span>
            </div>
            
            <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
              <p>To enable GitHub integration:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Create a GitHub OAuth app at github.com/settings/developers</li>
                <li>Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to Replit Secrets</li>
                <li>Set the callback URL in your GitHub app settings</li>
              </ol>
            </div>

            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://github.com/settings/developers" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Open GitHub Settings
              </a>
            </Button>
          </div>
        )}

        {allConfigured && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Ready to Connect
              </span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              GitHub OAuth is properly configured. Users can now connect their GitHub accounts.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};