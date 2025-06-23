import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitCommit, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface GitHubWidgetProps {
  activities: any[];
  onSync?: () => void;
  isLoading?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const GitHubWidget = ({ activities, onSync, isLoading, size = 'medium' }: GitHubWidgetProps) => {
  const githubActivities = activities.filter((a: any) => a.provider === 'github');
  const displayCount = size === 'small' ? 2 : size === 'medium' ? 3 : 5;

  return (
    <Card className="shadow-lg h-full">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gray-800 dark:bg-gray-600 rounded-lg">
              <GitCommit className="h-5 w-5 text-white" />
            </div>
            <span className={size === 'small' ? 'text-sm' : 'text-base'}>GitHub Activity</span>
          </div>
          <div className="flex items-center gap-2">
            {onSync && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onSync}
                disabled={isLoading}
                className="h-8 px-2"
              >
                <motion.div
                  animate={isLoading ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: isLoading ? Infinity : 0, ease: "linear" }}
                  className="mr-1"
                >
                  <RefreshCw className="h-3 w-3" />
                </motion.div>
                Sync
              </Button>
            )}
            <Badge variant="secondary">{githubActivities.length}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {githubActivities.slice(0, displayCount).map((activity: any) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
              <div className={`p-2 rounded-full ${
                activity.activityType === 'commit' ? 'bg-green-100 text-green-600' :
                activity.activityType === 'pr' ? 'bg-blue-100 text-blue-600' :
                'bg-orange-100 text-orange-600'
              }`}>
                <GitCommit className="h-3 w-3" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium mb-1 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
                  {activity.title}
                </p>
                {size !== 'small' && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {activity.description?.substring(0, 60)}...
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {activity.activityType}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {githubActivities.length === 0 && (
            <div className="text-center py-6">
              <GitCommit className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No GitHub activities</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};