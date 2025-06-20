
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Moon, Sun, User, Settings, Mail, LogOut, Menu, Home, FileText, Plug, Users, UserCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NetworkStatusBadge } from "@/components/NetworkStatus";
import autoBriefLogo from "@/assets/autobrief-logo.png";
import { Link } from "wouter";

interface DashboardHeaderProps {
  onThemeToggle: () => void;
  isDarkMode: boolean;
}

export const DashboardHeader = ({ onThemeToggle, isDarkMode }: DashboardHeaderProps) => {
  const { currentUser, userProfile, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/">
            <img 
              src={autoBriefLogo} 
              alt="AutoBrief" 
              className="h-24 w-40 object-contain cursor-pointer hover:opacity-80 transition-all duration-300 hover:scale-105 filter dark:brightness-0 dark:invert"
            />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-2 bg-muted/50 rounded-full p-1">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="rounded-full px-4 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200">
                Dashboard
              </Button>
            </Link>
            <Link to="/summaries">
              <Button variant="ghost" size="sm" className="rounded-full px-4 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200">
                Summaries
              </Button>
            </Link>
            <Link to="/integrations">
              <Button variant="ghost" size="sm" className="rounded-full px-4 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200">
                Integrations
              </Button>
            </Link>
            <Link to="/profiles">
              <Button variant="ghost" size="sm" className="rounded-full px-4 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200">
                Profiles
              </Button>
            </Link>
            <Link to="/team">
              <Button variant="ghost" size="sm" className="rounded-full px-4 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200">
                Team
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 pb-6 border-b">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={currentUser?.photoURL || ''} alt={currentUser?.displayName || 'User'} />
                      <AvatarFallback className="bg-purple-600 text-white">
                        {currentUser?.displayName ? getInitials(currentUser.displayName) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{currentUser?.displayName || 'User'}</p>
                      <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
                    </div>
                  </div>
                  
                  <nav className="flex-1 py-6">
                    <div className="space-y-2">
                      <Link to="/dashboard">
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start h-12 text-base"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Home className="mr-3 h-5 w-5" />
                          Dashboard
                        </Button>
                      </Link>
                      <Link to="/summaries">
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start h-12 text-base"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <FileText className="mr-3 h-5 w-5" />
                          Summaries
                        </Button>
                      </Link>
                      <Link to="/integrations">
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start h-12 text-base"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Plug className="mr-3 h-5 w-5" />
                          Integrations
                        </Button>
                      </Link>
                      <Link to="/profiles">
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start h-12 text-base"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <UserCircle className="mr-3 h-5 w-5" />
                          Profiles
                        </Button>
                      </Link>
                      <Link to="/team">
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start h-12 text-base"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Users className="mr-3 h-5 w-5" />
                          Team
                        </Button>
                      </Link>
                    </div>
                  </nav>
                  
                  <div className="border-t pt-6 space-y-2">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start h-12 text-base"
                      onClick={onThemeToggle}
                    >
                      {isDarkMode ? <Sun className="mr-3 h-5 w-5" /> : <Moon className="mr-3 h-5 w-5" />}
                      {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start h-12 text-base"
                    >
                      <Settings className="mr-3 h-5 w-5" />
                      Settings
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start h-12 text-base text-red-600 hover:text-red-700"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-3 h-5 w-5" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onThemeToggle}
              className="rounded-full h-9 w-9 hover:bg-muted transition-all duration-200"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <div className="hidden sm:flex items-center gap-3">
              <NetworkStatusBadge />
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                {userProfile?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
              </Badge>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={currentUser?.photoURL || ''} alt={currentUser?.displayName || 'User'} />
                    <AvatarFallback className="bg-purple-600 text-white">
                      {currentUser?.displayName ? getInitials(currentUser.displayName) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-medium">{currentUser?.displayName || 'User'}</p>
                  <p className="text-muted-foreground text-xs">{currentUser?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Mail className="mr-2 h-4 w-4" />
                  Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
