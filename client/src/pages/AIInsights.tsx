import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardHeader } from '@/components/DashboardHeader';
import AIChat from '@/components/AIChat';
import FormattedReport from '@/components/FormattedReport';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserId } from '@/lib/userService';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Sparkles, 
  BarChart3, 
  FileText, 
  Calendar,
  TrendingUp,
  MessageSquare,
  Loader2,
  Copy,
  Download,
  Share
} from 'lucide-react';

const AIInsights = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const userId = useUserId(currentUser?.uid);
  const [activeReport, setActiveReport] = useState<string | null>(null);

  const smartSummaryMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api'}/ai/smart-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to generate summary');
      return response.json();
    }
  });

  const standupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api'}/ai/standup-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to generate standup report');
      return response.json();
    }
  });

  const productivityMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api'}/ai/productivity-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, timeframe: 'week' }),
      });
      if (!response.ok) throw new Error('Failed to analyze productivity');
      return response.json();
    }
  });

  const weeklyReportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api'}/ai/weekly-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to generate weekly report');
      return response.json();
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Report copied to clipboard",
    });
  };

  const aiFeatures = [
    {
      id: 'smart-summary',
      title: 'Smart Daily Summary',
      description: 'AI-powered analysis of your daily activities with actionable insights',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      mutation: smartSummaryMutation,
      action: () => smartSummaryMutation.mutate()
    },
    {
      id: 'standup-report',
      title: 'Standup Report',
      description: 'Automated standup report ready for your daily team meeting',
      icon: <FileText className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      mutation: standupMutation,
      action: () => standupMutation.mutate()
    },
    {
      id: 'productivity-analysis',
      title: 'Productivity Analysis',
      description: 'Deep dive into your work patterns and productivity insights',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-purple-500 to-violet-500',
      mutation: productivityMutation,
      action: () => productivityMutation.mutate()
    },
    {
      id: 'weekly-report',
      title: 'Weekly Report',
      description: 'Comprehensive weekly summary perfect for 1:1 meetings',
      icon: <Calendar className="w-6 h-6" />,
      color: 'from-orange-500 to-red-500',
      mutation: weeklyReportMutation,
      action: () => weeklyReportMutation.mutate()
    }
  ];

  const renderReport = (feature: any) => {
    const data = feature.mutation.data;
    if (!data) return null;

    const content = data.summary || data.report || data.analysis;

    return (
      <div className="mt-6">
        <FormattedReport
          title={feature.title}
          content={content}
          icon={feature.icon}
          color={feature.color}
          onCopy={() => copyToClipboard(content)}
          onDownload={() => {
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${feature.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <DashboardHeader onThemeToggle={toggleTheme} isDarkMode={isDarkMode} />
      
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">AI Insights</h1>
            <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
              Powered by Groq
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Get AI-powered insights, reports, and analysis of your productivity data
          </p>
        </div>

        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reports">AI Reports</TabsTrigger>
            <TabsTrigger value="chat">AI Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aiFeatures.map((feature) => (
                <Card key={feature.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-4">
                      <div className={`p-4 bg-gradient-to-r ${feature.color} rounded-xl text-white shadow-lg`}>
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-xl font-bold mb-1">{feature.title}</div>
                        <div className="text-sm text-muted-foreground font-normal leading-relaxed">
                          {feature.description}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button 
                      onClick={feature.action}
                      disabled={feature.mutation.isPending}
                      className={`w-full h-12 bg-gradient-to-r ${feature.color} hover:opacity-90 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200`}
                    >
                      {feature.mutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          <span className="text-base">Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          <span className="text-base font-medium">Generate {feature.title}</span>
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Render generated reports */}
            <div className="space-y-4">
              {aiFeatures.map((feature) => (
                <div key={`report-${feature.id}`}>
                  {renderReport(feature)}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <div className="max-w-4xl mx-auto">
              <AIChat />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIInsights;