import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

interface CalendarWidgetProps {
  activities: any[];
  size?: 'small' | 'medium' | 'large';
}

export const CalendarWidget = ({ activities, size = 'medium' }: CalendarWidgetProps) => {
  const calendarActivities = activities.filter((a: any) => a.provider === 'google_calendar');
  const displayCount = size === 'small' ? 2 : size === 'medium' ? 3 : 5;

  return (
    <Card className="shadow-lg h-full">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-800/50 dark:to-blue-700/50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <span className={size === 'small' ? 'text-sm' : 'text-base'}>Calendar Events</span>
          </div>
          <Badge variant="secondary">{calendarActivities.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {calendarActivities.slice(0, displayCount).map((activity: any) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border border-blue-100 dark:border-blue-800 hover:border-blue-200 dark:hover:border-blue-700 transition-colors">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <Calendar className="h-3 w-3" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium mb-1 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
                  {activity.title}
                </p>
                {size !== 'small' && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {activity.metadata?.duration ? `${activity.metadata.duration} minutes` : 'Event'}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/30">
                    Meeting
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {calendarActivities.length === 0 && (
            <div className="text-center py-6">
              <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No calendar events</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};