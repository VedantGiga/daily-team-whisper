import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useUserId } from '@/lib/userService';
import { useToastNotification } from '@/hooks/useToastNotification';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// Components
import { DashboardHeader } from '@/components/DashboardHeader';
import { ActivityFeed } from '@/components/ActivityFeed';
import { ActivityFeedSkeleton } from '@/components/ActivityFeedSkeleton';
import { SimpleDraggableDashboard } from '@/components/SimpleDraggableDashboard';
import { MobileNavigation } from '@/components/MobileNavigation';
import { ActivityTrendsChart } from '@/components/charts/ActivityTrendsChart';
import { ActivityHeatmap } from '@/components/charts/ActivityHeatmap';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

// Icons
import { 
  RefreshCw, 
  Calendar, 
  GitCommit, 
  BarChart3, 
  Activity,
  Users,
  Settings
} from 'lucide-react';

const EnhancedDashboard = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || document.documentElement.classList.contains('dark');
    }
    return false;
  });
  
  const { currentUser } = useAuth();
  const userId = useUserId(currentUser?.uid);
  const toast = useToastNotification();
  const isMobile = useMediaQuery('(max-width: 1024px)');
  
  // Fetch user's activities for stats
  const { 
    data: activities = [], 
    isLoading: activitiesLoading,
    refetch: refetchActivities
  } = useQuery({
    queryKey: ['/api/activities', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`${process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api'}/activities?userId=${userId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!userId,
  });
  
  // Calculate stats from activities
  const stats = {
    totalActivities: activities.length,
    commits: activities.filter((a: any) => a.activityType === 'commit').length,
    meetings: activities.filter((a: any) => a.activityType === 'calendar_event').length,
    pullRequests: activities.filter((a: any) => a.activityType === 'pr').length,
  };
  
  // Prepare data for charts
  const activityTrendsData = (() => {
    const dateMap = new Map();
    
    // Initialize with empty data for the last 30 days
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, {
        date: dateStr,
        commits: 0,
        pullRequests: 0,
        issues: 0,
        meetings: 0
      });
    }
    
    // Fill with actual data
    activities.forEach((activity: any) => {
      const dateStr = new Date(activity.timestamp).toISOString().split('T')[0];
      if (dateMap.has(dateStr)) {
        const data = dateMap.get(dateStr);
        switch (activity.activityType) {
          case 'commit':
            data.commits += 1;
            break;
          case 'pr':
            data.pullRequests += 1;
            break;
          case 'issue':
            data.issues += 1;
            break;
          case 'calendar_event':
            data.meetings += 1;
            break;
        }
      }
    });
    
    return Array.from(dateMap.values());
  })();
  
  // Prepare data for heatmap
  const heatmapData = activities.reduce((acc: any[], activity: any) => {
    const dateStr = new Date(activity.timestamp).toISOString().split('T')[0];
    const existingEntry = acc.find(item => item.date === dateStr);
    
    if (existingEntry) {
      existingEntry.count += 1;
    } else {
      acc.push({
        date: dateStr,
        count: 1,
        type: activity.activityType
      });
    }
    
    return acc;
  }, []);
  
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    document.documentElement.classList.toggle('dark', newMode);
  };
  
  const handleRefresh = async () => {
    try {
      await refetchActivities();
      toast.success('Dashboard refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh dashboard');
    }
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <DashboardHeader onThemeToggle={toggleTheme} isDarkMode={isDarkMode} />
      
      <motion.main
        className="container mx-auto px-4 md:px-6 py-8 space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="mb-8" variants={itemVariants}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back!</h1>
              <p className="text-muted-foreground">Here's what's happening with your work today</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={activitiesLoading}
                className="hidden md:flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${activitiesLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={activitiesLoading}
                className="md:hidden"
              >
                <RefreshCw className={`h-4 w-4 ${activitiesLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </motion.div>
        
        {/* Stats Overview */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" 
          variants={itemVariants}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  {activitiesLoading ? (
                    <Skeleton className="h-8 w-16 mb-1" />
                  ) : (
                    <p className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.meetings}</p>
                  )}
                  <p className="text-xs md:text-sm font-medium text-blue-700 dark:text-blue-300">Calendar Events</p>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">This week</p>
                </div>
                <div className="p-2 md:p-3 bg-blue-600 dark:bg-blue-500 rounded-full">
                  <Calendar className="h-4 w-4 md:h-6 md:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  {activitiesLoading ? (
                    <Skeleton className="h-8 w-16 mb-1" />
                  ) : (
                    <p className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">{stats.commits}</p>
                  )}
                  <p className="text-xs md:text-sm font-medium text-green-700 dark:text-green-300">Code Commits</p>
                  <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">This week</p>
                </div>
                <div className="p-2 md:p-3 bg-green-600 dark:bg-green-500 rounded-full">
                  <GitCommit className="h-4 w-4 md:h-6 md:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-200 dark:border-orange-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  {activitiesLoading ? (
                    <Skeleton className="h-8 w-16 mb-1" />
                  ) : (
                    <p className="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.pullRequests}</p>
                  )}
                  <p className="text-xs md:text-sm font-medium text-orange-700 dark:text-orange-300">Pull Requests</p>
                  <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-1">This week</p>
                </div>
                <div className="p-2 md:p-3 bg-orange-600 dark:bg-orange-500 rounded-full">
                  <GitCommit className="h-4 w-4 md:h-6 md:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  {activitiesLoading ? (
                    <Skeleton className="h-8 w-16 mb-1" />
                  ) : (
                    <p className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalActivities}</p>
                  )}
                  <p className="text-xs md:text-sm font-medium text-purple-700 dark:text-purple-300">Total Activities</p>
                  <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">All time</p>
                </div>
                <div className="p-2 md:p-3 bg-purple-600 dark:bg-purple-500 rounded-full">
                  <BarChart3 className="h-4 w-4 md:h-6 md:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Tabs for different views */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid grid-cols-3 md:w-[400px] mb-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="customize">Customize</TabsTrigger>
          </TabsList>
          
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* GitHub Activities */}
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gray-800 dark:bg-gray-600 rounded-lg">
                        <GitCommit className="h-5 w-5 text-white" />
                      </div>
                      GitHub Activity
                    </div>
                    <Button variant="outline" size="sm" onClick={() => refetchActivities()}>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Sync
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {activitiesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            <div className="flex gap-2 pt-1">
                              <Skeleton className="h-5 w-16" />
                              <Skeleton className="h-5 w-24" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activities
                        .filter((a: any) => a.provider === 'github')
                        .slice(0, 5)
                        .map((activity: any) => (
                          <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-colors"
                          >
                            <div
                              className={`p-2 rounded-full ${
                                activity.activityType === 'commit'
                                  ? 'bg-green-100 text-green-600'
                                  : activity.activityType === 'pr'
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-orange-100 text-orange-600'
                              }`}
                            >
                              <GitCommit className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm mb-1">{activity.title}</p>
                              <p className="text-xs text-muted-foreground mb-2">
                                {activity.description?.substring(0, 80)}...
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                                  {activity.activityType}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(activity.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      {activities.filter((a: any) => a.provider === 'github').length === 0 && (
                        <div className="text-center py-8">
                          <GitCommit className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                          <p className="text-sm text-muted-foreground">No GitHub activities yet</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Connect GitHub to see your commits and PRs
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Calendar Activities */}
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-800/50 dark:to-blue-700/50">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-lg">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      Calendar Events
                    </div>
                    <Button variant="outline" size="sm" onClick={() => refetchActivities()}>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Sync
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {activitiesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            <div className="flex gap-2 pt-1">
                              <Skeleton className="h-5 w-16" />
                              <Skeleton className="h-5 w-24" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activities
                        .filter((a: any) => a.provider === 'google_calendar')
                        .slice(0, 5)
                        .map((activity: any) => (
                          <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-4 p-4 rounded-lg border border-blue-100 dark:border-blue-800 hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
                          >
                            <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                              <Calendar className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm mb-1">{activity.title}</p>
                              <p className="text-xs text-muted-foreground mb-2">
                                {activity.metadata?.duration ? `${activity.metadata.duration} minutes` : 'Event'}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded">
                                  Meeting
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(activity.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      {activities.filter((a: any) => a.provider === 'google_calendar').length === 0 && (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                          <p className="text-sm text-muted-foreground">No calendar events yet</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Connect Google Calendar to see your meetings
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* All Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  All Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? <ActivityFeedSkeleton /> : <ActivityFeed userId={userId} />}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ActivityTrendsChart data={activityTrendsData} />
              <ActivityHeatmap data={heatmapData} />
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Activity Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-[300px] w-full" />
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-md">
                    <p className="text-muted-foreground">Activity breakdown chart will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Customize Tab */}
          <TabsContent value="customize" className="space-y-6">
            <SimpleDraggableDashboard userId={userId} />
          </TabsContent>
        </Tabs>
      </motion.main>
      
      {/* Mobile navigation */}
      {isMobile && <MobileNavigation />}
    </div>
  );
};

export default EnhancedDashboard;