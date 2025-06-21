import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DashboardHeader } from '@/components/DashboardHeader';
import { 
  Brain,
  Sparkles,
  RefreshCw,
  FileText, 
  Clock,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Download,
  Search,
  Calendar
} from 'lucide-react';
import { exportToPDF, exportToCSV } from '@/lib/exportUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useUserId } from '@/lib/userService';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || document.documentElement.classList.contains('dark');
    }
    return false;
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const { currentUser } = useAuth();
  const userId = useUserId(currentUser?.uid);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    document.documentElement.classList.toggle('dark', newMode);
  };

  // Fetch summaries from API
  const { data: summaries = [], isLoading } = useQuery({
    queryKey: ['/api/summaries', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`/api/summaries?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch summaries');
      return response.json();
    },
    enabled: !!userId,
  });

  // Generate AI daily summary
  const generateSummaryMutation = useMutation({
    mutationFn: async (date: string) => {
      const response = await fetch('/api/ai/daily-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, date }),
      });
      if (!response.ok) throw new Error('Failed to generate summary');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Summary Generated",
        description: "AI daily summary has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Unable to generate AI summary. Please try again.",
        variant: "destructive",
      });
    },
  });



  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader onThemeToggle={toggleTheme} isDarkMode={isDarkMode} />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
            Daily Summaries
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered insights and summaries of your daily work activities
          </p>
        </motion.div>

        {/* AI Summary Generator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-purple-600" />
                Generate AI Summary
              </CardTitle>
              <CardDescription>
                Create intelligent summaries of your daily work activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => generateSummaryMutation.mutate(selectedDate)}
                    disabled={generateSummaryMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {generateSummaryMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Generate Summary
                  </Button>
                  {summaries.length > 0 && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => exportToCSV(summaries, 'daily-summaries')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        CSV
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => exportToPDF(summaries, 'Daily Summaries Report')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <AnimatePresence>
                {generateSummaryMutation.data && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 p-6 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <Brain className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-purple-900 dark:text-purple-100">AI Generated Summary</h3>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          {new Date(selectedDate).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                      <div 
                        className="leading-relaxed whitespace-pre-line"
                        dangerouslySetInnerHTML={{
                          __html: generateSummaryMutation.data.summary
                            .replace(/^# (.*$)/gm, '<h1 class="text-lg font-bold mb-2 text-purple-900 dark:text-purple-100">$1</h1>')
                            .replace(/^## (.*$)/gm, '<h2 class="text-md font-semibold mb-2 mt-4 text-gray-800 dark:text-gray-200">$1</h2>')
                            .replace(/^\*\*(.*?)\*\*/gm, '<strong class="font-semibold">$1</strong>')
                            .replace(/^   • (.*$)/gm, '<div class="ml-4 text-sm text-gray-600 dark:text-gray-400">• $1</div>')
                            .replace(/\n/g, '<br/>')
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-green-600" />
                Today's Summary
              </CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summaries.find(s => s.date === new Date().toISOString().split('T')[0]) ? (
                <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                  <p>{summaries.find(s => s.date === new Date().toISOString().split('T')[0])?.summary}</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <p className="text-green-700 dark:text-green-300 mb-4">No summary for today yet</p>
                  <Button 
                    onClick={() => generateSummaryMutation.mutate(new Date().toISOString().split('T')[0])}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Today's Summary
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search summaries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Previous Summaries */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Previous Summaries</h2>

          {(() => {
            const filteredSummaries = summaries.filter(summary => 
              !searchTerm || 
              summary.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
              new Date(summary.date).toLocaleDateString().toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            return isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 rounded-lg border bg-card/50"
                >
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : filteredSummaries.length === 0 && summaries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-2">No Summaries Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Generate your first AI summary using the tool above, or your daily summaries will appear here as you complete work activities.
              </p>
              <Button 
                onClick={() => generateSummaryMutation.mutate(selectedDate)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate First Summary
              </Button>
            </motion.div>
          ) : filteredSummaries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <Search className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-2">No Summaries Found</h3>
              <p className="text-muted-foreground mb-6">Try a different search term</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSummaries.map((summary: any, index: number) => (
                <motion.div
                  key={summary.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  <Card className="h-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold">
                          {new Date(summary.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(summary.createdAt).toLocaleDateString()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {summary.summary}
                      </p>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold text-green-600">{summary.tasksCompleted}</p>
                          <p className="text-xs text-muted-foreground">Tasks</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-blue-600">{summary.meetingsAttended}</p>
                          <p className="text-xs text-muted-foreground">Meetings</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-purple-600">{summary.codeCommits}</p>
                          <p className="text-xs text-muted-foreground">Commits</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )
          })()}
        </div>
      </div>
    </div>
  );
};

export default Summaries;