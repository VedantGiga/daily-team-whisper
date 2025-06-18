import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const NetworkStatus: React.FC = () => {
  const { isOnline } = useNetworkStatus();

  if (isOnline) {
    return null; // Don't show anything when everything is working
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      {!isOnline && (
        <Alert variant="destructive" className="mb-2">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You're offline. Some features may not work properly.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export const NetworkStatusBadge: React.FC = () => {
  const { isOnline } = useNetworkStatus();

  if (isOnline) {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
        <Wifi className="h-3 w-3 mr-1" />
        Online
      </Badge>
    );
  }

  return (
    <Badge variant="destructive">
      <WifiOff className="h-3 w-3 mr-1" />
      Offline
    </Badge>
  );
};

export default NetworkStatus;