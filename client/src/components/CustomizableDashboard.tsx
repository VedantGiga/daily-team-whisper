import { useState, useEffect } from 'react';
import { GitHubWidget } from './widgets/GitHubWidget';
import { CalendarWidget } from './widgets/CalendarWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, Activity } from 'lucide-react';

interface Widget {
  id: string;
  type: 'github' | 'calendar' | 'summary' | 'team' | 'analytics';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: number;
  isCollapsed?: boolean;
}

interface CustomizableDashboardProps {
  userId: number;
  activities: any[];
  stats: any;
  onSync?: () => void;
  isLoading?: boolean;
}

export const CustomizableDashboard = ({ 
  userId, 
  activities, 
  stats, 
  onSync, 
  isLoading 
}: CustomizableDashboardProps) => {
  const [widgets, setWidgets] = useState<Widget[]>([]);

  useEffect(() => {
    const savedLayout = localStorage.getItem(`dashboard-layout-${userId}`);
    if (savedLayout) {
      try {
        setWidgets(JSON.parse(savedLayout));
      } catch (e) {
        setWidgets(getDefaultWidgets());
      }
    } else {
      setWidgets(getDefaultWidgets());
    }
  }, [userId]);

  const getDefaultWidgets = (): Widget[] => [
    { id: 'github-activity', type: 'github', title: 'GitHub Activity', size: 'medium', position: 0 },
    { id: 'calendar-events', type: 'calendar', title: 'Calendar Events', size: 'medium', position: 1 },
    { id: 'daily-summary', type: 'summary', title: 'Daily Summary', size: 'large', position: 2 },
    { id: 'team-activity', type: 'team', title: 'Team Activity', size: 'small', position: 3 },
  ];

  const getSizeClass = (size: string) => {
    switch (size) {
      case 'small':
        return 'col-span-1';
      case 'medium':
        return 'col-span-1 lg:col-span-1';
      case 'large':
        return 'col-span-1 lg:col-span-2';
      default:
        return 'col-span-1';
    }
  };

  const renderWidget = (widget: Widget) => {
    if (widget.isCollapsed) {
      return (
        <Card className="h-20">
          <CardHeader className="p-4">
            <CardTitle className="text-sm">{widget.title} (Collapsed)</CardTitle>
          </CardHeader>
        </Card>
      );
    }

    switch (widget.type) {
      case 'github':
        return (
          <GitHubWidget 
            activities={activities} 
            onSync={onSync} 
            isLoading={isLoading}
            size={widget.size}
          />
        );
      case 'calendar':
        return (
          <CalendarWidget 
            activities={activities} 
            size={widget.size}
          />
        );
      case 'summary':
        return (
          <Card className="shadow-lg h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Daily Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.commits}</p>
                  <p className="text-sm text-muted-foreground">Commits</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.meetings}</p>
                  <p className="text-sm text-muted-foreground">Meetings</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{stats.pullRequests}</p>
                  <p className="text-sm text-muted-foreground">PRs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats.totalActivities}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'team':
        return (
          <Card className="shadow-lg h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Team features coming soon</p>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return (
          <Card className="shadow-lg h-full">
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Widget: {widget.type}</p>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {widgets
        .sort((a, b) => a.position - b.position)
        .map((widget) => (
          <div key={widget.id} className={getSizeClass(widget.size)}>
            {renderWidget(widget)}
          </div>
        ))}
    </div>
  );
};