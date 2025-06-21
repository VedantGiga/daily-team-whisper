import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DashboardHeader } from '@/components/DashboardHeader';
import { 
  Users, 
  UserPlus, 
  Settings, 
  Activity,
  TrendingUp,
  Mail,
  MapPin,
  Crown,
  Shield,
  User,
  Edit,
  Trash2,
  Search,
  Download,
  BarChart3,
  Clock,
  CheckCircle,
  GitBranch,
  MessageSquare
} from 'lucide-react';
import { SiGithub, SiSlack, SiNotion, SiJira } from 'react-icons/si';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useUserId } from '@/lib/userService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { exportToPDF, exportToCSV } from '@/lib/exportUtils';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
  department: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'pending';
  joinedAt: string;
  lastActive: string;
  permissions: string[];
  stats: {
    tasksCompleted: number;
    hoursWorked: number;
    projectsActive: number;
    activitiesCount: number;
  };
  source?: string;
}

interface TeamStats {
  totalMembers: number;
  activeToday: number;
  weeklyCommits: number;
  completedTasks: number;
  collaborationScore: number;
}

const Team = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || document.documentElement.classList.contains('dark');
    }
    return false;
  });
  const { currentUser } = useAuth();
  const userId = useUserId(currentUser?.uid);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'member' as 'admin' | 'manager' | 'member',
    department: ''
  });

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    document.documentElement.classList.toggle('dark', newMode);
  };

  // Fetch team members
  const { data: teamMembers = [], isLoading, error } = useQuery({
    queryKey: ['/api/team', userId],
    queryFn: async () => {
      if (!userId) return [];
      console.log('Fetching team members for userId:', userId);
      const response = await fetch(`/api/team/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch team members');
      const data = await response.json();
      console.log('Team members loaded:', data);
      return data;
    },
    enabled: !!userId,
  });

  // Debug logging
  console.log('Team page state:', { userId, isLoading, teamMembersCount: teamMembers.length, error });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (member: typeof newMember) => {
      const response = await fetch(`/api/team/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member),
      });
      if (!response.ok) throw new Error('Failed to add team member');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team', userId] });
      setIsAddMemberOpen(false);
      setNewMember({ name: '', email: '', role: 'member', department: '' });
      toast({ title: "Member Added", description: "Team member has been invited successfully" });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      const response = await fetch(`/api/team/${userId}/${memberId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove team member');
      return memberId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team', userId] });
      toast({ title: "Member Removed", description: "Team member has been removed" });
    },
  });



  // Filter members
  const filteredMembers = teamMembers.filter((member: TeamMember) => {
    const matchesSearch = !searchTerm || 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    const matchesDepartment = filterDepartment === 'all' || member.department === filterDepartment;
    
    return matchesSearch && matchesRole && matchesDepartment;
  });

  // Get unique departments
  const departments = [...new Set(teamMembers.map((m: TeamMember) => m.department))];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'manager': return <Shield className="h-4 w-4" />;
      case 'member': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'manager': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'member': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'github': return <SiGithub className="h-3 w-3" />;
      case 'slack': return <SiSlack className="h-3 w-3" />;
      case 'notion': return <SiNotion className="h-3 w-3" />;
      case 'jira': return <SiJira className="h-3 w-3" />;
      case 'current': return <User className="h-3 w-3" />;
      default: return <User className="h-3 w-3" />;
    }
  };

  const getSourceColor = (source?: string) => {
    switch (source) {
      case 'github': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'slack': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'notion': return 'bg-black text-white dark:bg-white dark:text-black';
      case 'jira': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'current': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader onThemeToggle={toggleTheme} isDarkMode={isDarkMode} />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-500 bg-clip-text text-transparent">
                Team Management
              </h1>
              <p className="text-lg text-muted-foreground">
                Manage your team members, roles, and permissions
              </p>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <Button 
                variant="outline" 
                onClick={() => exportToCSV(filteredMembers, 'team-members')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                    <DialogDescription>Invite a new member to join your team</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        placeholder="Enter full name" 
                        value={newMember.name}
                        onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="Enter email address" 
                        value={newMember.email}
                        onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={newMember.role} onValueChange={(value: 'admin' | 'manager' | 'member') => setNewMember(prev => ({ ...prev, role: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Input 
                        id="department" 
                        placeholder="Enter department" 
                        value={newMember.department}
                        onChange={(e) => setNewMember(prev => ({ ...prev, department: e.target.value }))}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>Cancel</Button>
                      <Button 
                        onClick={() => addMemberMutation.mutate(newMember)}
                        disabled={!newMember.name || !newMember.email || addMemberMutation.isPending}
                      >
                        {addMemberMutation.isPending ? 'Sending...' : 'Send Invitation'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Members</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{filteredMembers.length}</p>
                </div>
                <div className="p-3 bg-blue-600 rounded-full">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Active Members</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{filteredMembers.filter(m => m.status === 'active').length}</p>
                </div>
                <div className="p-3 bg-green-600 rounded-full">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border-yellow-200 dark:border-yellow-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Pending Invites</p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{filteredMembers.filter(m => m.status === 'pending').length}</p>
                </div>
                <div className="p-3 bg-yellow-600 rounded-full">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Activities</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {filteredMembers.reduce((acc, m) => acc + m.stats.activitiesCount, 0)}
                  </p>
                </div>
                <div className="p-3 bg-purple-600 rounded-full">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search and Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Team Members Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-lg border bg-card/50"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="h-14 w-14 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="text-center">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-1 animate-pulse" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
          <AnimatePresence>
            {filteredMembers.map((member: TeamMember, index: number) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <Card className="h-full shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-14 w-14 ring-2 ring-border">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">{member.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`text-xs ${getRoleColor(member.role)}`}>
                              {getRoleIcon(member.role)}
                              <span className="ml-1 capitalize">{member.role}</span>
                            </Badge>
                            <Badge className={`text-xs ${getStatusColor(member.status)}`}>
                              {member.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {member.department}
                            </Badge>
                            {member.source && (
                              <Badge className={`text-xs ${getSourceColor(member.source)}`}>
                                {getSourceIcon(member.source)}
                                <span className="ml-1 capitalize">{member.source}</span>
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => removeMemberMutation.mutate(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-border/40">
                      <div className="text-center">
                        <p className="text-xl font-bold text-green-600">{member.stats.tasksCompleted}</p>
                        <p className="text-xs text-muted-foreground">Tasks</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-blue-600">{member.stats.hoursWorked}</p>
                        <p className="text-xs text-muted-foreground">Hours</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-purple-600">{member.stats.projectsActive}</p>
                        <p className="text-xs text-muted-foreground">Projects</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-orange-600">{member.stats.activitiesCount}</p>
                        <p className="text-xs text-muted-foreground">Activities</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-border/40">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Joined: {new Date(member.joinedAt).toLocaleDateString()}</span>
                        <span>Last active: {member.lastActive}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            </AnimatePresence>
          </motion.div>
        )}

        {filteredMembers.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
            <h3 className="text-xl font-semibold mb-2">No Team Members Found</h3>
            <p className="text-muted-foreground mb-6">
              {teamMembers.length === 0 
                ? 'Connect GitHub or Slack to see team members' 
                : 'Try adjusting your search or filters'
              }
            </p>
            {error && (
              <p className="text-red-500 text-sm mt-2">Error: {error.message}</p>
            )}
          </motion.div>
        )}


      </div>
    </div>
  );
};

export default Team;