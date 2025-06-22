
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  CheckCircle,
  BarChart3,
  Activity,
  GitCommit
} from "lucide-react";
import { DashboardHeader } from "@/components/DashboardHeader";

import { ActivityFeed } from "@/components/ActivityFeed";
import { AIInsights } from "@/components/AIInsights";
import { QuickStats } from "@/components/QuickStats";
import { useAuth } from "@/contexts/AuthContext";
import { useUserId } from "@/lib/userService";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || document.documentElement.classList.contains('dark');
    }
    return false;
  });
  const { currentUser } = useAuth();
  const userId = useUserId(currentUser?.uid);

  // Fetch user's activities for stats
  const { data: activities = [] } = useQuery({
    queryKey: ["/api/activities", userId],
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

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    document.documentElement.classList.toggle('dark', newMode);
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
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const cardHoverVariants = {
    rest: { scale: 1, y: 0 },
    hover: { 
      scale: 1.02, 
      y: -5,
      transition: { duration: 0.2, ease: "easeOut" }
    }
  };

  const heroVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <DashboardHeader onThemeToggle={toggleTheme} isDarkMode={isDarkMode} />
      
      <motion.main 
        className="container mx-auto px-6 py-8 space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="mb-8" variants={heroVariants}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
              <p className="text-muted-foreground">Here's what's happening with your work today</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Today</p>
              <p className="text-lg font-semibold">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" variants={itemVariants}>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.meetings}</p>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Calendar Events</p>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">This week</p>
                </div>
                <div className="p-3 bg-blue-600 dark:bg-blue-500 rounded-full">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.commits}</p>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Code Commits</p>
                  <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">This week</p>
                </div>
                <div className="p-3 bg-green-600 dark:bg-green-500 rounded-full">
                  <GitCommit className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-200 dark:border-orange-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.pullRequests}</p>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Pull Requests</p>
                  <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-1">This week</p>
                </div>
                <div className="p-3 bg-orange-600 dark:bg-orange-500 rounded-full">
                  <GitCommit className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalActivities}</p>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Activities</p>
                  <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">All time</p>
                </div>
                <div className="p-3 bg-purple-600 dark:bg-purple-500 rounded-full">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Service Activities */}
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
                <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-200">{activities.filter((a: any) => a.provider === 'github').length}</Badge>
              </CardTitle>
              <CardDescription>Recent commits, pull requests, and issues</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {activities.filter((a: any) => a.provider === 'github').slice(0, 5).map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
                    <div className={`p-2 rounded-full ${
                      activity.activityType === 'commit' ? 'bg-green-100 text-green-600' :
                      activity.activityType === 'pr' ? 'bg-blue-100 text-blue-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      <GitCommit className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm mb-1">{activity.title}</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {activity.description?.substring(0, 80)}...
                      </p>
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
                {activities.filter((a: any) => a.provider === 'github').length === 0 && (
                  <div className="text-center py-8">
                    <GitCommit className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No GitHub activities yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Connect GitHub to see your commits and PRs</p>
                  </div>
                )}
              </div>
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
                <Badge variant="secondary" className="dark:bg-blue-700 dark:text-blue-200">{activities.filter((a: any) => a.provider === 'google_calendar').length}</Badge>
              </CardTitle>
              <CardDescription>Upcoming meetings and scheduled events</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {activities.filter((a: any) => a.provider === 'google_calendar').slice(0, 5).map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg border border-blue-100 dark:border-blue-800 hover:border-blue-200 dark:hover:border-blue-700 transition-colors">
                    <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm mb-1">{activity.title}</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {activity.metadata?.duration ? `${activity.metadata.duration} minutes` : 'Event'}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/30 dark:border-blue-700">
                          Meeting
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {activities.filter((a: any) => a.provider === 'google_calendar').length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No calendar events yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Connect Google Calendar to see your meetings</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">AI Insights</h2>
          {userId && <AIInsights userId={userId} />}
        </div>

        {/* All Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              All Recent Activity
            </CardTitle>
            <CardDescription>Combined feed from all services</CardDescription>
          </CardHeader>
          <CardContent>
            {userId && <ActivityFeed userId={userId} />}
          </CardContent>
        </Card>
      </motion.main>
    </div>
  );
};

export default Dashboard;
