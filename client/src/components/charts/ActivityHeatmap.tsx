import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip } from '@/components/ui/tooltip';
import { format, parseISO, eachDayOfInterval, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface ActivityCount {
  date: string;
  count: number;
  type?: string;
}

interface ActivityHeatmapProps {
  data: ActivityCount[];
  title?: string;
  className?: string;
}

export const ActivityHeatmap = ({ data, title = 'Activity Heatmap', className = '' }: ActivityHeatmapProps) => {
  const [monthsToShow, setMonthsToShow] = useState('6');
  
  // Generate all days in the selected range
  const today = new Date();
  const startDate = startOfMonth(subMonths(today, parseInt(monthsToShow) - 1));
  const endDate = endOfMonth(today);
  
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Create a map of date to activity count
  const activityMap = new Map<string, number>();
  data.forEach(item => {
    const dateStr = item.date.split('T')[0]; // Handle ISO strings
    activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + item.count);
  });
  
  // Get the maximum activity count for scaling
  const maxCount = Math.max(...Array.from(activityMap.values()), 1);
  
  // Group days by month
  const monthsData = allDays.reduce((acc, day) => {
    const monthKey = format(day, 'yyyy-MM');
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(day);
    return acc;
  }, {} as Record<string, Date[]>);
  
  // Get color intensity based on activity count
  const getColorIntensity = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    const intensity = Math.min(Math.ceil((count / maxCount) * 4), 4);
    return `bg-green-${intensity}00 dark:bg-green-${intensity}00/70`;
  };
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <Select value={monthsToShow} onValueChange={setMonthsToShow}>
          <SelectTrigger className="w-[120px] h-8">
            <SelectValue placeholder="Months" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 Months</SelectItem>
            <SelectItem value="6">6 Months</SelectItem>
            <SelectItem value="12">12 Months</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(monthsData).map(([month, days]) => (
            <div key={month} className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground">
                {format(days[0], 'MMMM yyyy')}
              </h4>
              <div className="grid grid-cols-7 gap-1">
                {/* Day labels */}
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="h-6 text-[10px] flex items-center justify-center text-muted-foreground">
                    {day}
                  </div>
                ))}
                
                {/* Empty cells for alignment */}
                {Array.from({ length: days[0].getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-6" />
                ))}
                
                {/* Day cells */}
                {days.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const count = activityMap.get(dateStr) || 0;
                  return (
                    <div
                      key={dateStr}
                      className={`h-6 w-6 rounded-sm ${getColorIntensity(count)} flex items-center justify-center text-[10px] cursor-pointer transition-colors`}
                      title={`${format(day, 'MMM d, yyyy')}: ${count} activities`}
                    >
                      {day.getDate()}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {/* Legend */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <span className="text-xs text-muted-foreground">Less</span>
            {[0, 1, 2, 3, 4].map(level => (
              <div 
                key={level} 
                className={`h-3 w-3 rounded-sm ${level === 0 ? 'bg-gray-100 dark:bg-gray-800' : `bg-green-${level}00 dark:bg-green-${level}00/70`}`}
              />
            ))}
            <span className="text-xs text-muted-foreground">More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};