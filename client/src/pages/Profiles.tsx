import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserId } from '@/lib/userService';
import { useQuery } from '@tanstack/react-query';
import { 
  Github, 
  Calendar, 
  MessageSquare, 
  FileText, 
  Settings,
  ExternalLink,
  User,
  Mail,
  MapPin,
  Building,
  Star,
  GitBranch,
  Users,
  Clock,
  Activity
} from 'lucide-react';

const Profiles = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { currentUser } = useAuth();
  const userId = useUserId(currentUser?.uid);

  // Fetch user's integrations
  const { data: integrations = [] } = useQuery({
    queryKey: ['/api/integrations', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`${process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api'}/integrations?userId=${userId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!userId,
  });

  // Fetch activities for stats
  const { data: activities = [] } = useQuery({
    queryKey: ['/api/activities', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`${process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api'}/activities?userId=${userId}&limit=100`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!userId,
  });

  const renderGitHubProfile = (integration: any) => {
    const githubUser = integration.metadata?.githubUser;
    const stats = activities.filter(a => a.provider === 'github');
    const commits = stats.filter(a => a.activityType === 'commit').length;
    const prs = stats.filter(a => a.activityType === 'pr').length;

    return (
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20"></div>
          <CardHeader className="relative z-10 text-center pb-6">
            <div className="flex justify-center mb-4">
              <Avatar className="w-20 h-20 border-4 border-white/20">
                <AvatarImage src={githubUser?.avatar_url} alt={githubUser?.name || githubUser?.login} />
                <AvatarFallback className="bg-gray-700 text-white text-xl">
                  <Github className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              {githubUser?.name || githubUser?.login || 'GitHub User'}
            </CardTitle>
            <p className="text-gray-300">@{githubUser?.login}</p>
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 mt-2">
              <Github className="w-3 h-3 mr-1" />
              GitHub Connected
            </Badge>
          </CardHeader>
          
          <CardContent className="relative z-10 space-y-4">
            {githubUser?.bio && (
              <p className="text-gray-300 text-center text-sm">{githubUser.bio}</p>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">{commits}</div>
                <div className="text-xs text-gray-300">Commits</div>
              </div>
              <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">{prs}</div>
                <div className="text-xs text-gray-300">Pull Requests</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-4 text-sm text-gray-300">
              {githubUser?.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{githubUser.location}</span>
                </div>
              )}
              {githubUser?.company && (
                <div className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  <span>{githubUser.company}</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30" 
                variant="outline"
                asChild
              >
                <a href={githubUser?.html_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Profile
                </a>
              </Button>
              <Button 
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" 
                asChild
              >
                <a href="/integrations">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage
                </a>
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  };

  const renderCalendarProfile = (integration: any) => {
    const stats = activities.filter(a => a.provider === 'google_calendar');
    const meetings = stats.filter(a => a.activityType === 'calendar_event').length;
    const todayMeetings = stats.filter(a => 
      a.activityType === 'calendar_event' && 
      new Date(a.timestamp).toDateString() === new Date().toDateString()
    ).length;

    return (
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Calendar className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">Google Calendar</CardTitle>
          <p className="text-blue-200">Schedule & Meetings</p>
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 mt-2">
            <Calendar className="w-3 h-3 mr-1" />
            Calendar Connected
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{meetings}</div>
              <div className="text-xs text-blue-200">Total Meetings</div>
            </div>
            <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{todayMeetings}</div>
              <div className="text-xs text-blue-200">Today</div>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-4 text-sm text-blue-200">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Last sync: {integration.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleDateString() : 'Never'}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30" 
              variant="outline"
              asChild
            >
              <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Calendar
              </a>
            </Button>
            <Button 
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" 
              asChild
            >
              <a href="/integrations">
                <Settings className="w-4 h-4 mr-2" />
                Manage
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSlackProfile = (integration: any) => {
    const stats = activities.filter(a => a.provider === 'slack');
    const messages = stats.length;
    const teamName = integration.metadata?.teamName;

    return (
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-600 to-purple-800 text-white">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">Slack</CardTitle>
          <p className="text-purple-200">{teamName || 'Team Communication'}</p>
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 mt-2">
            <MessageSquare className="w-3 h-3 mr-1" />
            Slack Connected
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{messages}</div>
              <div className="text-xs text-purple-200">Messages</div>
            </div>
            <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{teamName ? 1 : 0}</div>
              <div className="text-xs text-purple-200">Workspaces</div>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-4 text-sm text-purple-200">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{teamName || 'Team Workspace'}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30" 
              variant="outline"
              asChild
            >
              <a href="https://slack.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Slack
              </a>
            </Button>
            <Button 
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white" 
              asChild
            >
              <a href="/integrations">
                <Settings className="w-4 h-4 mr-2" />
                Manage
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderNotionProfile = (integration: any) => {
    const workspaceName = integration.metadata?.workspace_name;

    return (
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-gray-800 to-black text-white">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <FileText className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">Notion</CardTitle>
          <p className="text-gray-300">{workspaceName || 'Workspace & Notes'}</p>
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 mt-2">
            <FileText className="w-3 h-3 mr-1" />
            Notion Connected
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-1">
              <Building className="w-4 h-4" />
              <span>{workspaceName || 'Personal Workspace'}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30" 
              variant="outline"
              asChild
            >
              <a href="https://notion.so" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Notion
              </a>
            </Button>
            <Button 
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white" 
              asChild
            >
              <a href="/integrations">
                <Settings className="w-4 h-4 mr-2" />
                Manage
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <DashboardHeader onThemeToggle={toggleTheme} isDarkMode={isDarkMode} />
      
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Service Profiles</h1>
          <p className="text-muted-foreground">Your connected accounts and their profiles</p>
        </div>

        {integrations.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="text-center py-12">
              <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-medium mb-2">No Connected Services</h3>
              <p className="text-muted-foreground mb-6">
                Connect your favorite services to see their profiles here
              </p>
              <Button size="lg" asChild>
                <a href="/integrations">
                  <Settings className="w-4 h-4 mr-2" />
                  Connect Services
                </a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration: any) => {
              if (!integration.isConnected) return null;
              
              switch (integration.provider) {
                case 'github':
                  return <div key={integration.id}>{renderGitHubProfile(integration)}</div>;
                case 'google_calendar':
                  return <div key={integration.id}>{renderCalendarProfile(integration)}</div>;
                case 'slack':
                  return <div key={integration.id}>{renderSlackProfile(integration)}</div>;
                case 'notion':
                  return <div key={integration.id}>{renderNotionProfile(integration)}</div>;
                default:
                  return null;
              }
            })}
          </div>
        )}
        
        {integrations.length > 0 && (
          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <a href="/integrations">
                <Settings className="w-4 h-4 mr-2" />
                Manage All Connections
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profiles;