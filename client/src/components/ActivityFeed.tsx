import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitCommit, Calendar, ExternalLink, RefreshCw, Clock, GitPullRequest, AlertCircle, Search, Download } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import type { WorkActivity } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { exportToPDF, exportToCSV } from "@/lib/exportUtils";

interface ActivityFeedProps {
  userId: number;
}

const getActivityIcon = (activityType: string) => {
  switch (activityType) {
    case 'calendar_event':
      return <Calendar className="h-4 w-4" />;
    case 'commit':
      return <GitCommit className="h-4 w-4" />;
    case 'pr':
      return <GitPullRequest className="h-4 w-4" />;
    case 'issue':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <GitCommit className="h-4 w-4" />;
  }
};

const getActivityColor = (activityType: string) => {
  switch (activityType) {
    case 'calendar_event':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'commit':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'pr':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'issue':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

export const ActivityFeed = ({ userId }: ActivityFeedProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/activities", userId],
    queryFn: async () => {
      const response = await fetch(`${process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api'}/activities?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch activities');
      return response.json();
    },
  });

  // Filter activities
  const filteredActivities = activities.filter((activity: WorkActivity) => {
    const matchesSearch = !searchTerm || 
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProvider = filterProvider === 'all' || activity.provider === filterProvider;
    const matchesType = filterType === 'all' || activity.activityType === filterType;
    
    const matchesDate = !dateFilter || 
      new Date(activity.timestamp).toISOString().split('T')[0] === dateFilter;
    
    return matchesSearch && matchesProvider && matchesType && matchesDate;
  });

  // Get unique providers and types
  const providers = [...new Set(activities.map((a: WorkActivity) => a.provider))];
  const activityTypes = [...new Set(activities.map((a: WorkActivity) => a.activityType))];

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

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 p-4 rounded-lg bg-muted/50"
          >
            <motion.div 
              className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <div className="flex-1 space-y-2">
              <motion.div 
                className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div 
                className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Latest Activities</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(filteredActivities, 'activities')}
              className="h-8"
            >
              <Download className="h-3 w-3 mr-1" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToPDF(filteredActivities, 'Activity Report')}
              className="h-8"
            >
              <Download className="h-3 w-3 mr-1" />
              PDF
            </Button>
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
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Quick filter buttons */}
            <div className="flex gap-1">
              <Button
                variant={filterProvider === 'github' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterProvider(filterProvider === 'github' ? 'all' : 'github')}
                className="h-8 px-3"
              >
                GitHub
              </Button>
              <Button
                variant={filterProvider === 'google_calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterProvider(filterProvider === 'google_calendar' ? 'all' : 'google_calendar')}
                className="h-8 px-3"
              >
                Calendar
              </Button>
              <Button
                variant={filterProvider === 'slack' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterProvider(filterProvider === 'slack' ? 'all' : 'slack')}
                className="h-8 px-3"
              >
                Slack
              </Button>
            </div>
            <Select value={filterProvider} onValueChange={setFilterProvider}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {providers.map(provider => (
                  <SelectItem key={provider} value={provider}>
                    {provider.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {activityTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-36 h-8"
            />
            {(searchTerm || filterProvider !== 'all' || filterType !== 'all' || dateFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterProvider('all');
                  setFilterType('all');
                  setDateFilter('');
                }}
                className="h-8 px-2"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {filteredActivities.length === 0 && activities.length === 0 ? (
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
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
            </motion.div>
            <motion.p 
              className="text-lg font-medium mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              No Recent Activity
            </motion.p>
            <motion.p 
              className="text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Your calendar events and work activities will appear here
            </motion.p>
          </motion.div>
        ) : (
          <motion.div 
            key="activities"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {filteredActivities.map((activity: WorkActivity, index: number) => {
              const metadata = (activity.metadata as any) || {};
              
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border/40 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <motion.div 
                    className={`p-2 rounded-full flex-shrink-0 ${getActivityColor(activity.activityType)}`}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {getActivityIcon(activity.activityType)}
                  </motion.div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <motion.h4 
                          className="font-medium text-sm text-foreground truncate"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          {activity.title}
                        </motion.h4>
                        <motion.p 
                          className="text-xs text-muted-foreground mt-1 line-clamp-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 + 0.1 }}
                        >
                          {activity.description}
                        </motion.p>
                      </div>
                      
                      <motion.div 
                        className="flex items-center gap-2 flex-shrink-0"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 + 0.2 }}
                      >
                        <Badge variant="secondary" className="text-xs">
                          {activity.provider}
                        </Badge>
                        {metadata.htmlLink && (
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => window.open(metadata.htmlLink, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </motion.div>
                        )}
                      </motion.div>
                    </div>
                    
                    <motion.div 
                      className="flex items-center gap-4 mt-2 text-xs text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 + 0.3 }}
                    >
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(activity.timestamp)}
                      </div>
                      
                      {metadata.duration && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {metadata.duration}m
                        </div>
                      )}
                      
                      {metadata.calendarName && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {metadata.calendarName}
                        </div>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
        
        {filteredActivities.length === 0 && activities.length > 0 && (
          <motion.div 
            key="no-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8 text-muted-foreground"
          >
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No activities match your filters</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};