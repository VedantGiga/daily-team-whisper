
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, Users, BarChart3 } from "lucide-react";

export const QuickStats = () => {
  const stats = [
    {
      label: "Summaries Generated",
      value: "47",
      icon: BarChart3,
      trend: "+12%",
      color: "text-purple-600"
    },
    {
      label: "Hours Tracked",
      value: "156",
      icon: Clock,
      trend: "+8%",
      color: "text-blue-600"
    },
    {
      label: "Tasks Completed",
      value: "234",
      icon: CheckCircle,
      trend: "+23%",
      color: "text-green-600"
    },
    {
      label: "Team Members",
      value: "8",
      icon: Users,
      trend: "+2",
      color: "text-orange-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.label} className="shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
                <Badge variant="secondary" className="text-xs">
                  {stat.trend} this month
                </Badge>
              </div>
              <div className={`p-3 rounded-full bg-muted/50 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
