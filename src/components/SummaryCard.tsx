
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Calendar, FileText, Mail, Download } from "lucide-react";

interface Summary {
  date: string;
  tasksCompleted: number;
  blockers: number;
  meetings: number;
  summary: string;
}

interface SummaryCardProps {
  summary: Summary;
}

export const SummaryCard = ({ summary }: SummaryCardProps) => {
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Today's Summary
          </CardTitle>
          <CardDescription>{summary.date}</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{summary.tasksCompleted}</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-400">Tasks Completed</p>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{summary.blockers}</span>
            </div>
            <p className="text-sm text-red-700 dark:text-red-400">Blockers</p>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{summary.meetings}</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-400">Meetings</p>
          </div>
        </div>

        {/* AI Generated Summary */}
        <div className="p-4 rounded-lg bg-muted/50">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            AI Summary
          </h4>
          <p className="text-muted-foreground leading-relaxed">{summary.summary}</p>
        </div>

        {/* Action Items */}
        <div className="space-y-3">
          <h4 className="font-semibold">Key Items</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Completed GitHub API integration setup</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm">Rate limiting issues need investigation</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Sprint planning meeting tomorrow at 10 AM</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
