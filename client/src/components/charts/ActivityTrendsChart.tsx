import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface ActivityData {
  date: string;
  commits: number;
  pullRequests: number;
  issues: number;
  meetings: number;
}

interface ActivityTrendsChartProps {
  data: ActivityData[];
  title?: string;
  className?: string;
}

export const ActivityTrendsChart = ({ 
  data, 
  title = 'Activity Trends', 
  className = '' 
}: ActivityTrendsChartProps) => {
  const [timeRange, setTimeRange] = useState('week');
  
  // Filter data based on time range
  const filteredData = (() => {
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (timeRange) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      default:
        cutoffDate.setDate(now.getDate() - 7);
    }
    
    return data.filter(item => new Date(item.date) >= cutoffDate);
  })();
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[120px] h-8">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="quarter">Last Quarter</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="line">
          <TabsList className="mb-4">
            <TabsTrigger value="line">Line</TabsTrigger>
            <TabsTrigger value="bar">Bar</TabsTrigger>
            <TabsTrigger value="stacked">Stacked</TabsTrigger>
          </TabsList>
          
          <TabsContent value="line" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="commits" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="pullRequests" stroke="#82ca9d" />
                <Line type="monotone" dataKey="issues" stroke="#ffc658" />
                <Line type="monotone" dataKey="meetings" stroke="#ff8042" />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="bar" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="commits" fill="#8884d8" />
                <Bar dataKey="pullRequests" fill="#82ca9d" />
                <Bar dataKey="issues" fill="#ffc658" />
                <Bar dataKey="meetings" fill="#ff8042" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="stacked" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="commits" stackId="a" fill="#8884d8" />
                <Bar dataKey="pullRequests" stackId="a" fill="#82ca9d" />
                <Bar dataKey="issues" stackId="a" fill="#ffc658" />
                <Bar dataKey="meetings" stackId="a" fill="#ff8042" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};