import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  UserPlus, 
  Settings, 
  Activity,
  TrendingUp,
  Calendar,
  MessageSquare,
  GitBranch,
  CheckCircle,
  Clock,
  BarChart3,
  Shield,
  Mail,
  Phone,
  MapPin,
  Crown,
  Star
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  avatar?: string;
  status: 'active' | 'away' | 'offline';
  joinedAt: string;
  lastActive: string;
  integrations: string[];
  weeklyStats: {
    commits: number;
    meetings: number;
    tasksCompleted: number;
    collaborations: number;
  };
  location?: string;
  timezone: string;
}

interface TeamStats {
  totalMembers: number;
  activeToday: number;
  weeklyCommits: number;
  completedTasks: number;
  collaborationScore: number;
}

const Team = () => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Mock team data - in real app, this would come from API
  const mockTeamMembers: TeamMember[] = [
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      role: 'admin',
      avatar: '',
      status: 'active',
      joinedAt: '2024-01-15',
      lastActive: '2025-01-19T10:30:00Z',
      integrations: ['GitHub', 'Slack', 'Jira', 'Google Calendar'],
      weeklyStats: { commits: 23, meetings: 8, tasksCompleted: 12, collaborations: 15 },
      location: 'San Francisco, CA',
      timezone: 'PST'
    },
    {
      id: 2,
      name: 'Michael Chen',
      email: 'michael.chen@company.com',
      role: 'member',
      avatar: '',
      status: 'active',
      joinedAt: '2024-02-01',
      lastActive: '2025-01-19T09:45:00Z',
      integrations: ['GitHub', 'Slack', 'Notion'],
      weeklyStats: { commits: 18, meetings: 5, tasksCompleted: 9, collaborations: 11 },
      location: 'Austin, TX',
      timezone: 'CST'
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@company.com',
      role: 'member',
      avatar: '',
      status: 'away',
      joinedAt: '2024-01-20',
      lastActive: '2025-01-18T16:20:00Z',
      integrations: ['Slack', 'Google Calendar', 'Jira'],
      weeklyStats: { commits: 7, meetings: 12, tasksCompleted: 8, collaborations: 18 },
      location: 'New York, NY',
      timezone: 'EST'
    },
    {
      id: 4,
      name: 'David Kim',
      email: 'david.kim@company.com',
      role: 'viewer',
      avatar: '',
      status: 'offline',
      joinedAt: '2024-03-10',
      lastActive: '2025-01-18T14:00:00Z',
      integrations: ['GitHub', 'Jira'],
      weeklyStats: { commits: 15, meetings: 3, tasksCompleted: 6, collaborations: 8 },
      location: 'Seattle, WA',
      timezone: 'PST'
    }
  ];

  const teamStats: TeamStats = {
    totalMembers: 4,
    activeToday: 2,
    weeklyCommits: 63,
    completedTasks: 35,
    collaborationScore: 87
  };

  const filteredMembers = mockTeamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'member': return <Users className="h-4 w-4 text-blue-600" />;
      case 'viewer': return <Shield className="h-4 w-4 text-gray-600" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Team Management</h1>
            <p className="text-muted-foreground">
              Manage your team members and track collaboration
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold">{teamStats.totalMembers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Today</p>
                  <p className="text-2xl font-bold">{teamStats.activeToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <GitBranch className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Weekly Commits</p>
                  <p className="text-2xl font-bold">{teamStats.weeklyCommits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Tasks Done</p>
                  <p className="text-2xl font-bold">{teamStats.completedTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Collaboration</p>
                  <p className="text-2xl font-bold">{teamStats.collaborationScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="members" className="space-y-6">
          <TabsList>
            <TabsTrigger value="members">Team Members</TabsTrigger>
            <TabsTrigger value="activity">Team Activity</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            {/* Search */}
            <div className="flex gap-4">
              <Input
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {/* Team Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map((member) => (
                <Card key={member.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedMember(member)}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(member.status)}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{member.name}</h3>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {getRoleIcon(member.role)}
                        <Badge variant="outline" className="text-xs capitalize">
                          {member.role}
                        </Badge>
                      </div>
                    </div>

                    {member.location && (
                      <div className="flex items-center gap-1 mb-3 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {member.location} ({member.timezone})
                      </div>
                    )}

                    {/* Weekly Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-purple-600" />
                        <span className="text-sm">{member.weeklyStats.commits} commits</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{member.weeklyStats.tasksCompleted} tasks</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">{member.weeklyStats.meetings} meetings</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-orange-600" />
                        <span className="text-sm">{member.weeklyStats.collaborations} collabs</span>
                      </div>
                    </div>

                    {/* Integrations */}
                    <div className="flex flex-wrap gap-1">
                      {member.integrations.map((integration) => (
                        <Badge key={integration} variant="secondary" className="text-xs">
                          {integration}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Activity Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Weekly Productivity</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Code Commits</span>
                            <span>63/80</span>
                          </div>
                          <Progress value={78} />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Tasks Completed</span>
                            <span>35/40</span>
                          </div>
                          <Progress value={87} />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Team Meetings</span>
                            <span>28/30</span>
                          </div>
                          <Progress value={93} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Collaboration Metrics</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Cross-team Projects</span>
                            <span>12/15</span>
                          </div>
                          <Progress value={80} />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Knowledge Sharing</span>
                            <span>8/10</span>
                          </div>
                          <Progress value={80} />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Code Reviews</span>
                            <span>45/50</span>
                          </div>
                          <Progress value={90} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Integration Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {['GitHub', 'Slack', 'Jira', 'Notion', 'Google Calendar'].map((integration) => {
                    const connectedCount = mockTeamMembers.filter(m => m.integrations.includes(integration)).length;
                    const percentage = (connectedCount / mockTeamMembers.length) * 100;
                    
                    return (
                      <Card key={integration}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{integration}</h4>
                            <Badge variant={percentage > 50 ? "default" : "secondary"}>
                              {connectedCount}/{mockTeamMembers.length}
                            </Badge>
                          </div>
                          <Progress value={percentage} className="mb-2" />
                          <p className="text-xs text-muted-foreground">
                            {percentage.toFixed(0)}% team coverage
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Permissions</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Invite New Members</p>
                        <p className="text-sm text-muted-foreground">Allow team members to invite others</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Data Access</p>
                        <p className="text-sm text-muted-foreground">Control who can view team analytics</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Daily Summaries</p>
                        <p className="text-sm text-muted-foreground">Send team summary emails</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Activity Alerts</p>
                        <p className="text-sm text-muted-foreground">Notify on important team activities</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Team;