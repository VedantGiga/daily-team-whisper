import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Calendar as CalendarIcon, 
  FileText, 
  Download, 
  Search, 
  Filter,
  TrendingUp,
  Clock,
  GitBranch,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

interface Summary {
  id: number;
  date: string;
  title: string;
  tasksCompleted: number;
  blockers: number;
  meetings: number;
  summary: string;
  integrations: string[];
  mood: 'productive' | 'challenging' | 'balanced';
  highlights: string[];
}

const Summaries = () => {
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  // Fetch summaries from API
  const { data: summaries = [], isLoading } = useQuery({
    queryKey: ['/api/summaries', currentUser?.uid],
    enabled: !!currentUser
  });

  const mockSummaries: Summary[] = [
    {
      id: 1,
      date: '2025-01-18',
      title: 'Friday Sprint Wrap-up',
      tasksCompleted: 8,
      blockers: 1,
      meetings: 3,
      summary: 'Completed the user authentication flow and fixed critical bugs in the payment system. Had productive discussions about the upcoming Q1 roadmap.',
      integrations: ['GitHub', 'Slack', 'Jira'],
      mood: 'productive',
      highlights: [
        'Merged 3 pull requests',
        'Resolved database performance issue',
        'Completed Q1 planning session'
      ]
    },
    {
      id: 2,
      date: '2025-01-17',
      title: 'Mid-week Progress',
      tasksCompleted: 5,
      blockers: 2,
      meetings: 2,
      summary: 'Focused on frontend improvements and team collaboration. Encountered some deployment issues that required additional investigation.',
      integrations: ['GitHub', 'Notion'],
      mood: 'challenging',
      highlights: [
        'Updated UI components',
        'Documented API endpoints',
        'Identified deployment bottleneck'
      ]
    },
    {
      id: 3,
      date: '2025-01-16',
      title: 'Week Kickoff',
      tasksCompleted: 6,
      blockers: 0,
      meetings: 4,
      summary: 'Strong start to the week with clear objectives set. Team alignment on priorities and good progress on core features.',
      integrations: ['GitHub', 'Slack', 'Google Calendar'],
      mood: 'balanced',
      highlights: [
        'Set weekly goals',
        'Completed code review',
        'Planned feature architecture'
      ]
    }
  ];

  const filteredSummaries = mockSummaries.filter(summary => {
    if (searchTerm && !summary.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !summary.summary.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterBy !== 'all' && !summary.integrations.includes(filterBy)) {
      return false;
    }
    return true;
  });

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'productive': return 'bg-green-100 text-green-800';
      case 'challenging': return 'bg-red-100 text-red-800';
      case 'balanced': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'productive': return <TrendingUp className="h-4 w-4" />;
      case 'challenging': return <AlertCircle className="h-4 w-4" />;
      case 'balanced': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Daily Summaries</h1>
            <p className="text-muted-foreground">
              Your AI-generated work summaries and insights
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Generate Summary
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Summaries</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Tasks Completed</p>
                  <p className="text-2xl font-bold">156</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Meetings</p>
                  <p className="text-2xl font-bold">32</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Blockers</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search summaries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by integration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Integrations</SelectItem>
              <SelectItem value="GitHub">GitHub</SelectItem>
              <SelectItem value="Slack">Slack</SelectItem>
              <SelectItem value="Jira">Jira</SelectItem>
              <SelectItem value="Notion">Notion</SelectItem>
              <SelectItem value="Google Calendar">Google Calendar</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'calendar' | 'list')}>
          <TabsContent value="list" className="space-y-4">
            {filteredSummaries.map((summary) => (
              <Card key={summary.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{summary.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(summary.date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                    <Badge className={`${getMoodColor(summary.mood)} border-0`}>
                      {getMoodIcon(summary.mood)}
                      <span className="ml-1 capitalize">{summary.mood}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{summary.summary}</p>
                  
                  {/* Metrics */}
                  <div className="flex gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{summary.tasksCompleted} tasks</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{summary.meetings} meetings</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm">{summary.blockers} blockers</span>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Key Highlights:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {summary.highlights.map((highlight, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Integrations */}
                  <div className="flex gap-2">
                    {summary.integrations.map((integration) => (
                      <Badge key={integration} variant="outline" className="text-xs">
                        {integration}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="calendar">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>
                    Summary for {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No summary available for this date</p>
                    <Button variant="outline" className="mt-4">
                      Generate Summary
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Summaries;