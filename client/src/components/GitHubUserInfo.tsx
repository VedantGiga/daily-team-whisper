import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  GitBranch, 
  Star, 
  Users, 
  Calendar, 
  ExternalLink, 
  RefreshCw,
  GitCommit,
  GitPullRequest,
  MessageSquare
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { Integration } from "@shared/schema";

interface GitHubUserInfoProps {
  integration: Integration;
  onSync: () => void;
  isSyncing: boolean;
}

interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  html_url: string;
}

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  updated_at: string;
  html_url: string;
  private: boolean;
}

export const GitHubUserInfo = ({ integration, onSync, isSyncing }: GitHubUserInfoProps) => {
  const { toast } = useToast();

  const safeFormatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Unknown";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Unknown";
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "Unknown";
    }
  };

  // Get GitHub repositories
  const { data: repositories = [], isLoading: reposLoading } = useQuery({
    queryKey: [`/api/integrations/${integration.id}/github/repos`],
    queryFn: async () => {
      const response = await fetch(`/api/integrations/${integration.id}/github/repos`);
      if (!response.ok) throw new Error("Failed to fetch repositories");
      return response.json() as Repository[];
    },
    enabled: integration.isConnected,
  });

  const githubUser = integration.metadata?.githubUser as GitHubUser;

  if (!githubUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>GitHub Account</CardTitle>
          <CardDescription>No user information available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const topRepositories = repositories
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5);

  const recentRepositories = repositories
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={githubUser.avatar_url} alt={githubUser.login} />
                <AvatarFallback>{githubUser.login.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              GitHub Profile
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={onSync}
              disabled={isSyncing}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync Data
            </Button>
          </div>
          <CardDescription>Connected as @{githubUser.login}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={githubUser.avatar_url} alt={githubUser.login} />
              <AvatarFallback className="text-lg">
                {githubUser.login.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="font-semibold text-lg">{githubUser.name || githubUser.login}</h3>
                <p className="text-muted-foreground">@{githubUser.login}</p>
              </div>
              
              {githubUser.bio && (
                <p className="text-sm text-muted-foreground">{githubUser.bio}</p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <GitBranch className="h-3 w-3" />
                  {githubUser.public_repos} repos
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {githubUser.followers} followers
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {githubUser.following} following
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined {safeFormatDate(githubUser.created_at)}
                </div>
              </div>
              
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={githubUser.html_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  View Profile
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Repository Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Repositories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Top Repositories
            </CardTitle>
            <CardDescription>Most starred repositories</CardDescription>
          </CardHeader>
          <CardContent>
            {reposLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : topRepositories.length > 0 ? (
              <div className="space-y-3">
                {topRepositories.map((repo) => (
                  <div key={repo.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-sm hover:underline flex items-center gap-1"
                      >
                        {repo.private && <span className="text-xs">🔒</span>}
                        {repo.name}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {repo.stargazers_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitBranch className="h-3 w-3" />
                          {repo.forks_count}
                        </span>
                      </div>
                    </div>
                    {repo.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      {repo.language && (
                        <Badge variant="outline" className="text-xs">
                          {repo.language}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Updated {safeFormatDate(repo.updated_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No repositories found</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCommit className="h-4 w-4" />
              Recent Activity
            </CardTitle>
            <CardDescription>Recently updated repositories</CardDescription>
          </CardHeader>
          <CardContent>
            {reposLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : recentRepositories.length > 0 ? (
              <div className="space-y-3">
                {recentRepositories.map((repo) => (
                  <div key={repo.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-sm hover:underline flex items-center gap-1"
                      >
                        {repo.private && <span className="text-xs">🔒</span>}
                        {repo.name}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <span className="text-xs text-muted-foreground">
                        {safeFormatDate(repo.updated_at)}
                      </span>
                    </div>
                    {repo.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {repo.description}
                      </p>
                    )}
                    {repo.language && (
                      <Badge variant="outline" className="text-xs">
                        {repo.language}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Account Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {repositories.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Repos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Stars</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {repositories.reduce((sum, repo) => sum + repo.forks_count, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Forks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {repositories.filter(repo => !repo.private).length}
              </div>
              <div className="text-sm text-muted-foreground">Public Repos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};