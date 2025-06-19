import { storage } from "../storage";
import type { Integration, InsertWorkActivity } from "@shared/schema";

export class GitHubService {
  private static async makeGitHubRequest(endpoint: string, token: string) {
    const response = await fetch(`https://api.github.com${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AutoBrief-App'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  static async syncUserData(integration: Integration): Promise<void> {
    if (!integration.accessToken) {
      throw new Error('No access token available for GitHub integration');
    }

    try {
      // Get user info to verify token
      const user = await this.makeGitHubRequest('/user', integration.accessToken);
      
      // Update integration with latest user info
      await storage.updateIntegration(integration.id, {
        providerUsername: user.login,
        metadata: { githubUser: user },
        lastSyncAt: new Date()
      });

      // Sync recent activity
      await this.syncRecentActivity(integration);
      
    } catch (error) {
      console.error('GitHub sync error:', error);
      // Mark integration as disconnected if token is invalid
      if (error instanceof Error && error.message.includes('401')) {
        await storage.updateIntegration(integration.id, {
          isConnected: false,
          lastSyncAt: new Date()
        });
      }
      throw error;
    }
  }

  private static async syncRecentActivity(integration: Integration): Promise<void> {
    if (!integration.accessToken) return;

    const since = new Date();
    since.setDate(since.getDate() - 7); // Last 7 days

    try {
      // Get user's recent commits
      await this.syncCommits(integration, since);
      
      // Get user's recent pull requests
      await this.syncPullRequests(integration, since);
      
      // Get user's recent issues
      await this.syncIssues(integration, since);
      
    } catch (error) {
      console.error('Error syncing GitHub activity:', error);
    }
  }

  private static async syncCommits(integration: Integration, since: Date): Promise<void> {
    if (!integration.accessToken) return;

    try {
      // Get user's repositories
      const repos = await this.makeGitHubRequest('/user/repos?sort=updated&per_page=10', integration.accessToken);
      
      for (const repo of repos) {
        // Get recent commits for each repo
        const commits = await this.makeGitHubRequest(
          `/repos/${repo.full_name}/commits?author=${integration.providerUsername}&since=${since.toISOString()}&per_page=20`,
          integration.accessToken
        );

        for (const commit of commits) {
          const existingActivity = await this.findExistingActivity(integration.userId, 'commit', commit.sha);
          
          if (!existingActivity) {
            const activity: InsertWorkActivity = {
              userId: integration.userId,
              integrationId: integration.id,
              provider: 'github',
              activityType: 'commit',
              title: commit.commit.message.split('\n')[0],
              description: commit.commit.message,
              externalId: commit.sha,
              metadata: {
                sha: commit.sha,
                repository: repo.full_name,
                url: commit.html_url,
                additions: commit.stats?.additions || 0,
                deletions: commit.stats?.deletions || 0,
                author: commit.commit.author
              },
              timestamp: new Date(commit.commit.author.date)
            };

            await storage.createWorkActivity(activity);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing commits:', error);
    }
  }

  private static async syncPullRequests(integration: Integration, since: Date): Promise<void> {
    if (!integration.accessToken) return;

    try {
      // Get user's pull requests
      const prs = await this.makeGitHubRequest(
        `/search/issues?q=author:${integration.providerUsername}+type:pr+updated:>${since.toISOString().split('T')[0]}&sort=updated&per_page=20`,
        integration.accessToken
      );

      for (const pr of prs.items) {
        const existingActivity = await this.findExistingActivity(integration.userId, 'pr', pr.number.toString());
        
        if (!existingActivity) {
          const activity: InsertWorkActivity = {
            userId: integration.userId,
            integrationId: integration.id,
            provider: 'github',
            activityType: 'pr',
            title: pr.title,
            description: pr.body || '',
            externalId: pr.number.toString(),
            metadata: {
              number: pr.number,
              state: pr.state,
              url: pr.html_url,
              repository: pr.repository_url.split('/').slice(-2).join('/'),
              labels: pr.labels,
              assignees: pr.assignees
            },
            timestamp: new Date(pr.updated_at)
          };

          await storage.createWorkActivity(activity);
        }
      }
    } catch (error) {
      console.error('Error syncing pull requests:', error);
    }
  }

  private static async syncIssues(integration: Integration, since: Date): Promise<void> {
    if (!integration.accessToken) return;

    try {
      // Get user's issues
      const issues = await this.makeGitHubRequest(
        `/search/issues?q=author:${integration.providerUsername}+type:issue+updated:>${since.toISOString().split('T')[0]}&sort=updated&per_page=20`,
        integration.accessToken
      );

      for (const issue of issues.items) {
        const existingActivity = await this.findExistingActivity(integration.userId, 'issue', issue.number.toString());
        
        if (!existingActivity) {
          const activity: InsertWorkActivity = {
            userId: integration.userId,
            integrationId: integration.id,
            provider: 'github',
            activityType: 'issue',
            title: issue.title,
            description: issue.body || '',
            externalId: issue.number.toString(),
            metadata: {
              number: issue.number,
              state: issue.state,
              url: issue.html_url,
              repository: issue.repository_url.split('/').slice(-2).join('/'),
              labels: issue.labels,
              assignees: issue.assignees
            },
            timestamp: new Date(issue.updated_at)
          };

          await storage.createWorkActivity(activity);
        }
      }
    } catch (error) {
      console.error('Error syncing issues:', error);
    }
  }

  private static async findExistingActivity(userId: number, activityType: string, externalId: string) {
    const activities = await storage.getUserWorkActivities(userId, 1000);
    return activities.find(activity => 
      activity.activityType === activityType && 
      activity.externalId === externalId
    );
  }

  static async getUserRepositories(integration: Integration): Promise<any[]> {
    if (!integration.accessToken) {
      throw new Error('No access token available');
    }

    return this.makeGitHubRequest('/user/repos?sort=updated&per_page=50', integration.accessToken);
  }

  static async getRepositoryStats(integration: Integration, repoFullName: string): Promise<any> {
    if (!integration.accessToken) {
      throw new Error('No access token available');
    }

    const [repo, contributors, languages] = await Promise.all([
      this.makeGitHubRequest(`/repos/${repoFullName}`, integration.accessToken),
      this.makeGitHubRequest(`/repos/${repoFullName}/contributors`, integration.accessToken),
      this.makeGitHubRequest(`/repos/${repoFullName}/languages`, integration.accessToken)
    ]);

    return { repo, contributors, languages };
  }
}