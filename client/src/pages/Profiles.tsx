import { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { GitHubUserInfo } from "@/components/GitHubUserInfo";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IntegrationService } from "@/lib/integrationService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUserId } from "@/lib/userService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Settings, User, ExternalLink } from "lucide-react";
import { SiGithub, SiGooglecalendar, SiNotion, SiSlack, SiJira } from "react-icons/si";
import { motion, AnimatePresence } from "framer-motion";

const Profiles = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentUser, userProfile } = useAuth();
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Get user ID from Firebase UID
  const userId = useUserId(currentUser?.uid);

  // Fetch user's integrations
  const { data: integrations = [] } = useQuery({
    queryKey: ["/api/integrations", userId],
    queryFn: () => IntegrationService.getUserIntegrations(userId!),
    enabled: !!userId,
  });

  // Sync integration mutation
  const syncIntegrationMutation = useMutation({
    mutationFn: (id: number) => IntegrationService.syncIntegration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations", userId] });
      toast({
        title: "Sync Complete",
        description: "Profile data has been synced successfully",
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Unable to sync profile data",
        variant: "destructive",
      });
    },
  });

  const connectedIntegrations = integrations.filter(i => i.isConnected);
  const githubIntegration = integrations.find(i => i.provider === "github" && i.isConnected);
  const calendarIntegration = integrations.find(i => i.provider === "google_calendar" && i.isConnected);
  const notionIntegration = integrations.find(i => i.provider === "notion" && i.isConnected);
  const jiraIntegration = integrations.find(i => i.provider === "jira" && i.isConnected);
  const slackIntegration = integrations.find(i => i.provider === "slack" && i.isConnected);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader onThemeToggle={toggleTheme} isDarkMode={isDarkMode} />
      
      <main className="container mx-auto px-6 py-8">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1 
            className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-500 bg-clip-text text-transparent mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Your Connected Profiles
          </motion.h1>
          <motion.p 
            className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Manage and view detailed information about your connected service accounts
          </motion.p>
        </motion.div>

        <AnimatePresence mode="wait">
          {connectedIntegrations.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border-dashed">
                <CardContent>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  >
                    <User className="h-20 w-20 text-muted-foreground/40 mx-auto mb-6" />
                  </motion.div>
                  <motion.h3 
                    className="text-xl font-semibold mb-3 text-foreground"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    No Connected Profiles Yet
                  </motion.h3>
                  <motion.p 
                    className="text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    Connect your favorite services to see detailed profile information and manage your accounts
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <Badge variant="outline" className="px-4 py-2 text-sm">
                      Visit Integrations to get started
                    </Badge>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div 
              key="profiles"
              className="space-y-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {/* GitHub Profile */}
              {githubIntegration && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <GitHubUserInfo 
                    integration={githubIntegration}
                    onSync={() => syncIntegrationMutation.mutate(githubIntegration.id)}
                    isSyncing={syncIntegrationMutation.isPending}
                  />
                </motion.div>
              )}

              {/* Google Calendar Profile */}
              {calendarIntegration && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  whileHover={{ scale: 1.01, y: -2 }}
                >
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50/80 to-blue-100/80 dark:from-blue-900/20 dark:to-blue-800/20 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3">
                        <motion.div
                          className="p-2 bg-blue-600 rounded-lg shadow-md"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <SiGooglecalendar className="h-6 w-6 text-white" />
                        </motion.div>
                        <div>
                          <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100">Google Calendar</h3>
                          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Calendar Integration</p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="space-y-3">
                          <div>
                            <p className="font-semibold text-foreground mb-1">Account Status</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              Last synchronized: {calendarIntegration.lastSyncAt ? 
                                new Date(calendarIntegration.lastSyncAt).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 
                                'Never synchronized'
                              }
                            </p>
                          </div>
                          <motion.a 
                            href="https://calendar.google.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors group"
                            whileHover={{ x: 2 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Calendar className="h-4 w-4" />
                            Open Google Calendar
                            <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </motion.a>
                        </div>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                        >
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-3 py-1.5 font-medium">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                            Active
                          </Badge>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Notion Profile */}
              {notionIntegration && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  whileHover={{ scale: 1.01, y: -2 }}
                >
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3">
                        <motion.div
                          className="p-2 bg-black dark:bg-white rounded-lg shadow-md"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <SiNotion className="h-6 w-6 text-white dark:text-black" />
                        </motion.div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            {notionIntegration.metadata?.workspace_name || 'Notion Workspace'}
                          </h3>
                          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Productivity Integration</p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-3">
                            <div>
                              <p className="font-semibold text-foreground mb-1">Workspace Details</p>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                Workspace: <span className="font-medium">{notionIntegration.metadata?.workspace_name || 'Connected'}</span>
                              </p>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                Bot ID: <span className="font-mono text-xs">{notionIntegration.metadata?.bot_id || 'N/A'}</span>
                              </p>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                Last synchronized: {notionIntegration.lastSyncAt ? 
                                  new Date(notionIntegration.lastSyncAt).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : 
                                  'Never synchronized'
                                }
                              </p>
                            </div>
                            <motion.a 
                              href="https://www.notion.so" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors group"
                              whileHover={{ x: 2 }}
                              transition={{ duration: 0.2 }}
                            >
                              <SiNotion className="h-4 w-4" />
                              Open Notion Workspace
                              <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </motion.a>
                          </div>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                          >
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-3 py-1.5 font-medium">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                              Active
                            </Badge>
                          </motion.div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Jira Profile */}
              {jiraIntegration && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  whileHover={{ scale: 1.01, y: -2 }}
                >
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50/80 to-blue-100/80 dark:from-blue-900/20 dark:to-blue-800/20 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3">
                        <motion.div
                          className="p-2 bg-blue-600 dark:bg-blue-500 rounded-lg shadow-md"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <SiJira className="h-6 w-6 text-white" />
                        </motion.div>
                        <div>
                          <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100">
                            {jiraIntegration.metadata?.jiraSiteName || 'Jira Workspace'}
                          </h3>
                          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Project Management</p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-3">
                            <div>
                              <p className="font-semibold text-foreground mb-1">Account Details</p>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                User: <span className="font-medium">{jiraIntegration.providerUsername || 'Connected User'}</span>
                              </p>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                Site: <span className="font-medium">{jiraIntegration.metadata?.jiraSiteName || 'Jira Site'}</span>
                              </p>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                Last synchronized: {jiraIntegration.lastSyncAt ? 
                                  new Date(jiraIntegration.lastSyncAt).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : 
                                  'Never synchronized'
                                }
                              </p>
                            </div>
                            <motion.a 
                              href={jiraIntegration.metadata?.jiraUrl || 'https://atlassian.com'} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors group"
                              whileHover={{ x: 2 }}
                              transition={{ duration: 0.2 }}
                            >
                              <SiJira className="h-4 w-4" />
                              Open Jira Workspace
                              <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </motion.a>
                          </div>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                          >
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-3 py-1.5 font-medium">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                              Active
                            </Badge>
                          </motion.div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Slack Profile */}
              {slackIntegration && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  whileHover={{ scale: 1.01, y: -2 }}
                >
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50/80 to-purple-100/80 dark:from-purple-900/20 dark:to-purple-800/20 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3">
                        <motion.div
                          className="p-2 bg-purple-600 dark:bg-purple-500 rounded-lg shadow-md"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <SiSlack className="h-6 w-6 text-white" />
                        </motion.div>
                        <div>
                          <h3 className="text-xl font-semibold text-purple-900 dark:text-purple-100">
                            {slackIntegration.metadata?.teamName || 'Slack Workspace'}
                          </h3>
                          <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">Team Communication</p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-3">
                            <div>
                              <p className="font-semibold text-foreground mb-1">Workspace Details</p>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                Team: <span className="font-medium">{slackIntegration.metadata?.teamName || 'Connected Team'}</span>
                              </p>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                Bot ID: <span className="font-mono text-xs">{slackIntegration.metadata?.botUserId || 'N/A'}</span>
                              </p>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                Last synchronized: {slackIntegration.lastSyncAt ? 
                                  new Date(slackIntegration.lastSyncAt).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : 
                                  'Never synchronized'
                                }
                              </p>
                            </div>
                            <motion.a 
                              href="https://slack.com" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors group"
                              whileHover={{ x: 2 }}
                              transition={{ duration: 0.2 }}
                            >
                              <SiSlack className="h-4 w-4" />
                              Open Slack Workspace
                              <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </motion.a>
                          </div>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                          >
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-3 py-1.5 font-medium">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                              Active
                            </Badge>
                          </motion.div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Profiles;