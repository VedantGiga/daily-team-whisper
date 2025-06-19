import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitCommit, GitPullRequest, MessageSquare, Calendar, ExternalLink, RefreshCw } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { IntegrationService } from "@/lib/integrationService";
import type { WorkActivity } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface ActivityMetadata {
  url?: string;
  repository?: string;
  additions?: number;
  deletions?: number;
  state?: string;
  sha?: string;
  number?: number;
  [key: string]: any;
}

interface ActivityFeedProps {
  userId: number;
}

const getActivityIcon = (activityType: string) => {
  switch (activityType) {
    case 'commit':
      return <GitCommit className="h-4 w-4" />;
    case 'pr':
      return <GitPullRequest className="h-4 w-4" />;
    case 'issue':
      return <MessageSquare className="h-4 w-4" />;
    case 'meeting':
      return <Calendar className="h-4 w-4" />;
    default:
      return <GitCommit className="h-4 w-4" />;
  }
};

const getActivityColor = (activityType: string) => {
  switch (activityType) {
    case 'commit':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'pr':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'issue':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case 'meeting':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

export const ActivityFeed = ({ userId }: ActivityFeedProps) => {
  const { toast } = useToast();

  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/activities", userId],
    queryFn: () => IntegrationService.getUserActivities(userId, 20),
  });

  const refreshMutation = useMutation({
    mutationFn: () => refetch(),
    onSuccess: () => {
      toast({
        title: "Activities Refreshed",
        description: "Latest activity data has been loaded",
      });
    },
  });

  const formatTimestamp = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getRepositoryName = (metadata: unknown): string => {
    const meta = metadata as ActivityMetadata;
    if (meta?.repository) {
      return meta.repository.split('/').pop() || 'Unknown';
    }
    return 'Unknown';
  };

  const getMetadata = (metadata: unknown): ActivityMetadata => {
    return (metadata as ActivityMetadata) || {};
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Activities...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest work activities from your connected integrations
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>

      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <GitCommit className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-2">No Recent Activity</p>
            <p className="text-sm">
              Connect your integrations and sync data to see your work activities here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity: WorkActivity) => (
              <div key={activity.id} className="flex gap-4 p-4 rounded-lg border bg-card">
                <div className={`p-2 rounded-full ${getActivityColor(activity.activityType)}`}>
                  {getActivityIcon(activity.activityType)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm leading-5 truncate">
                        {activity.title}
                      </h4>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {activity.provider}
                      </Badge>
                      {getMetadata(activity.metadata).url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a 
                            href={getMetadata(activity.metadata).url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span>{formatTimestamp(activity.timestamp)}</span>
                    
                    {(() => {
                      const meta = getMetadata(activity.metadata);
                      return (
                        <>
                          {meta.repository && (
                            <span className="flex items-center gap-1">
                              <GitCommit className="h-3 w-3" />
                              {getRepositoryName(activity.metadata)}
                            </span>
                          )}
                          
                          {activity.activityType === 'commit' && meta.additions && (
                            <span className="text-green-600 dark:text-green-400">
                              +{meta.additions}
                            </span>
                          )}
                          
                          {activity.activityType === 'commit' && meta.deletions && (
                            <span className="text-red-600 dark:text-red-400">
                              -{meta.deletions}
                            </span>
                          )}
                          
                          {activity.activityType === 'pr' && meta.state && (
                            <Badge 
                              variant={meta.state === 'merged' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {meta.state}
                            </Badge>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};