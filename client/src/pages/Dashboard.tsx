import { DashboardHeader } from "@/components/DashboardHeader";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { QuickActions } from "@/components/QuickActions";
import { RecentActivityFeed } from "@/components/RecentActivityFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useUserId } from "@/lib/userService";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const userId = useUserId(currentUser?.uid);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <DashboardHeader />
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {userId && <QuickActions userId={userId} />}
            </div>
            <div className="space-y-6">
              {userId && <RecentActivityFeed userId={userId} />}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {userId ? (
            <AnalyticsDashboard userId={userId} />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            {userId && <RecentActivityFeed userId={userId} />}
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <div className="space-y-4">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Integrations management coming soon...</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}