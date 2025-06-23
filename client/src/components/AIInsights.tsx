import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Brain, TrendingUp, CheckSquare, Sparkles, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface AIInsightsProps {
  userId: number;
}

export const AIInsights = ({ userId }: AIInsightsProps) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Get work pattern analysis
  const { data: workPatterns, isLoading: patternsLoading } = useQuery({
    queryKey: ["/api/ai/work-patterns", userId],
    queryFn: async () => {
      const response = await fetch(`${process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api'}/ai/work-patterns/${userId}`);
      if (!response.ok) throw new Error('Failed to get work patterns');
      return response.json();
    },
    enabled: !!userId,
  });

  // Get task suggestions
  const { data: taskSuggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ["/api/ai/task-suggestions", userId],
    queryFn: async () => {
      const response = await fetch(`${process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api'}/ai/task-suggestions/${userId}`);
      if (!response.ok) throw new Error('Failed to get task suggestions');
      return response.json();
    },
    enabled: !!userId,
  });

  // Generate daily summary
  const dailySummaryMutation = useMutation({
    mutationFn: async (date: string) => {
      const response = await fetch(`${process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api'}/ai/daily-summary`, {
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
        description: "AI daily summary has been created",
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Unable to generate AI summary",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      {/* AI Daily Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Daily Summary
            </CardTitle>
            <CardDescription>Generate intelligent summaries of your daily work</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <Button
                onClick={() => dailySummaryMutation.mutate(selectedDate)}
                disabled={dailySummaryMutation.isPending}
                size="sm"
              >
                {dailySummaryMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate Summary
              </Button>
            </div>
            {dailySummaryMutation.data && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-purple-200 dark:border-purple-800/50"
              >
                <p className="text-sm leading-relaxed">{dailySummaryMutation.data.summary}</p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Work Pattern Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Work Pattern Analysis
            </CardTitle>
            <CardDescription>AI insights into your productivity patterns</CardDescription>
          </CardHeader>
          <CardContent>
            {patternsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Analyzing your work patterns...
              </div>
            ) : workPatterns?.analysis ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-blue-200 dark:border-blue-800/50">
                  <p className="text-sm leading-relaxed whitespace-pre-line text-gray-700 dark:text-gray-300">
                    {workPatterns.analysis}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Connect your work tools and sync data to get AI insights
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Task Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-green-600" />
              AI Task Suggestions
            </CardTitle>
            <CardDescription>Smart recommendations for your next tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {suggestionsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating task suggestions...
              </div>
            ) : taskSuggestions?.suggestions?.length > 0 ? (
              <div className="space-y-2">
                {taskSuggestions.suggestions.map((task: string, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-green-200 dark:border-green-800/50"
                  >
                    <CheckSquare className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm leading-relaxed">{task}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Complete some work activities to get AI-powered task suggestions
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};