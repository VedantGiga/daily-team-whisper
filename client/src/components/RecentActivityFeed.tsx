import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  GitBranch, 
  MessageSquare, 
  Calendar, 
  FileText, 
  Clock, 
  ExternalLink,
  Activity,
  RefreshCw,
  Filter
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface ActivityItem {
  id: number;
  type: string;
  title: string;
  description: string;
  provider: string;
  timestamp: string;
  metadata?: {
    url?: string;
    status?: string;
    participants?: string[];
    repository?: string;
  };
}

interface RecentActivityFeedProps {
  userId: number;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'commit':
    case 'pull_request':
    case 'issue':
      return <GitBranch className="h-4 w-4" />;
    case 'message':
    case 'channel_message':
      return <MessageSquare className="h-4 w-4" />;
    case 'meeting':
    case 'calendar_event':
      return <Calendar className="h-4 w-4" />;
    case 'document':
    case 'note':
      return <FileText className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getProviderColor = (provider: string) => {
  switch (provider.toLowerCase()) {
    case 'github':
      return 'bg-gray-900 text-white';
    case 'slack':
      return 'bg-purple-600 text-white';
    case 'google calendar':
      return 'bg-blue-600 text-white';
    case 'notion':
      return 'bg-black text-white';
    case 'jira':
      return 'bg-blue-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

export function RecentActivityFeed({ userId }: RecentActivityFeedProps) {
  const [filter, setFilter] = useState<string>('all');

  const { data: activities, isLoading, refetch } = useQuery<ActivityItem[]>({
    queryKey: ['/api/activities', userId, filter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '20' });
      if (filter !== 'all') params.append('provider', filter);
      
      const response = await fetch(`/api/activities/${userId}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch activities');
      return response.json();
    },
    enabled: !!userId,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const providers = ['all', 'github', 'slack', 'google calendar', 'notion', 'jira'];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest work activities across all integrations
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 pt-2">
          {providers.map((provider) => (
            <Button
              key={provider}
              variant={filter === provider ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(provider)}
              className="text-xs capitalize"
            >
              {provider}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-96">
          {!activities || activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Activity className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No recent activities found</p>
              <p className="text-sm text-muted-foreground">
                Connect integrations to see your work activity
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={activity.id}>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`p-2 rounded-full ${getProviderColor(activity.provider)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium truncate">
                          {activity.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {activity.provider}
                          </Badge>
                          {activity.metadata?.url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(activity.metadata?.url, '_blank')}
                              className="h-6 w-6 p-0"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {activity.description}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </span>
                        
                        {activity.metadata?.repository && (
                          <>
                            <span>•</span>
                            <span>{activity.metadata.repository}</span>
                          </>
                        )}
                        
                        {activity.metadata?.status && (
                          <>
                            <span>•</span>
                            <Badge variant="secondary" className="text-xs py-0 px-1">
                              {activity.metadata.status}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {index < activities.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {activities && activities.length > 0 && (
          <div className="mt-4 pt-4 border-t text-center">
            <Button variant="outline" size="sm">
              View All Activities
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}