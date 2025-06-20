
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Github, 
  Calendar, 
  Settings, 
  User, 
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  BarChart3,
  Plus,
  Moon,
  Sun,
  TrendingUp,
  Activity
} from "lucide-react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { IntegrationManager } from "@/components/IntegrationManager";
import { ActivityFeed } from "@/components/ActivityFeed";
import { QuickStats } from "@/components/QuickStats";
import { useAuth } from "@/contexts/AuthContext";
import { useUserId } from "@/lib/userService";

const Dashboard = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { currentUser } = useAuth();
  const userId = useUserId(currentUser?.uid);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
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
        {/* Welcome Section */}
        <motion.div 
          className="text-center space-y-4"
          variants={heroVariants}
        >
          <motion.h1 
            className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-teal-500 bg-clip-text text-transparent"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            AutoBrief AI Dashboard
          </motion.h1>
          <motion.p 
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Track your work activities and generate automated daily briefs with AI-powered insights.
          </motion.p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div variants={itemVariants}>
          <QuickStats />
        </motion.div>

        {/* Real-time sections with actual data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Integrations */}
          <motion.div
            variants={itemVariants}
            whileHover="hover"
            initial="rest"
          >
            <motion.div variants={cardHoverVariants}>
              <Card className="shadow-lg border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Settings className="h-5 w-5 text-purple-600" />
                      </motion.div>
                      Connected Services
                    </CardTitle>
                    <CardDescription>
                      Manage your third-party integrations
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {userId && <IntegrationManager userId={userId} />}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Real Activity Feed */}
          <motion.div
            variants={itemVariants}
            whileHover="hover"
            initial="rest"
          >
            <motion.div variants={cardHoverVariants}>
              <Card className="shadow-lg border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Activity className="h-5 w-5 text-green-600" />
                    </motion.div>
                    Live Activity Feed
                  </CardTitle>
                  <CardDescription>
                    Real-time updates from your connected services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userId && <ActivityFeed userId={userId} />}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>

        {/* Enhanced Statistics Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={itemVariants}
        >
          <motion.div whileHover={{ scale: 1.05, y: -5 }} transition={{ duration: 0.2 }}>
            <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="p-3 bg-blue-600 text-white rounded-full"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Calendar className="h-6 w-6" />
                  </motion.div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">4</p>
                    <p className="text-sm text-muted-foreground">Calendar Events</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05, y: -5 }} transition={{ duration: 0.2 }}>
            <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="p-3 bg-green-600 text-white rounded-full"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <CheckCircle className="h-6 w-6" />
                  </motion.div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">1</p>
                    <p className="text-sm text-muted-foreground">Active Integration</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05, y: -5 }} transition={{ duration: 0.2 }}>
            <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="p-3 bg-purple-600 text-white rounded-full"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <TrendingUp className="h-6 w-6" />
                  </motion.div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">100%</p>
                    <p className="text-sm text-muted-foreground">Sync Success Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Enhanced CTA Section */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="shadow-2xl border-0 bg-gradient-to-r from-purple-500 via-blue-500 to-teal-500 text-white overflow-hidden relative">
            <motion.div
              className="absolute inset-0 bg-white/10"
              animate={{
                background: [
                  "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                  "linear-gradient(45deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 100%)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
            />
            <CardContent className="p-8 text-center relative z-10">
              <motion.h3 
                className="text-2xl md:text-3xl font-bold mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                Your AI Work Assistant is Ready
              </motion.h3>
              <motion.p 
                className="text-purple-100 mb-6 text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                Google Calendar integration is active and syncing your events automatically.
              </motion.p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="bg-white text-purple-600 hover:bg-gray-100 shadow-lg font-semibold px-8 py-3"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add More Integrations
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.main>
    </div>
  );
};

export default Dashboard;
