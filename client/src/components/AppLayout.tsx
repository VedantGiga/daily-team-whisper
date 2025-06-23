import { ReactNode } from 'react';
import { MobileNavigation } from './MobileNavigation';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const isMobile = useMediaQuery('(max-width: 1024px)');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Main content */}
      <div className="flex min-h-screen">
        {/* Content area */}
        <main className="flex-1">
          {children}
        </main>
      </div>
      
      {/* Mobile navigation - only shown on mobile */}
      {isMobile && <MobileNavigation />}
    </div>
  );
};