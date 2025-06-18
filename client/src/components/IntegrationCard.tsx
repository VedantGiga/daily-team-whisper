
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface Integration {
  name: string;
  icon: LucideIcon;
  status: "connected" | "disconnected";
  lastSync: string;
  color: string;
}

interface IntegrationCardProps {
  integration: Integration;
}

export const IntegrationCard = ({ integration }: IntegrationCardProps) => {
  const { name, icon: Icon, status, lastSync, color } = integration;
  
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">Last sync: {lastSync}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge 
          variant={status === "connected" ? "default" : "secondary"}
          className={status === "connected" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
        >
          {status === "connected" ? "Connected" : "Disconnected"}
        </Badge>
        <Button 
          size="sm" 
          variant={status === "connected" ? "outline" : "default"}
        >
          {status === "connected" ? "Configure" : "Connect"}
        </Button>
      </div>
    </div>
  );
};
