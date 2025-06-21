import { storage } from '../storage';
import type { Integration, InsertWorkActivity } from '@shared/schema';

export class JiraService {
  private static async makeJiraRequest(endpoint: string, integration: Integration) {
    const { jiraSiteId } = integration.metadata || {};
    
    if (!jiraSiteId || !integration.accessToken) {
      throw new Error('Jira configuration incomplete');
    }

    const response = await fetch(`https://api.atlassian.com/ex/jira/${jiraSiteId}/rest/api/3${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  static async syncUserData(integration: Integration): Promise<void> {
    console.log(`Starting Jira sync for integration ${integration.id}, user ${integration.userId}`);
    
    try {
      // Verify connection by getting user info
      const user = await this.makeJiraRequest('/myself', integration);
      
      // Update integration with user info
      await storage.updateIntegration(integration.id, {
        providerUsername: user.displayName,
        metadata: {
          ...integration.metadata,
          jiraUser: user
        },
        lastSyncAt: new Date()
      });

      // Sync recent issues
      await this.syncRecentIssues(integration);
      
      console.log('Jira sync completed successfully');

    } catch (error) {
      console.error('Error syncing Jira data:', error);
      throw error;
    }
  }

  private static async syncRecentIssues(integration: Integration): Promise<void> {
    try {
      const user = integration.metadata?.jiraUser;
      if (!user) return;

      // Get issues assigned to or reported by the user in the last 30 days
      const jql = `(assignee = currentUser() OR reporter = currentUser()) AND updated >= -30d ORDER BY updated DESC`;
      
      const response = await this.makeJiraRequest(`/search?jql=${encodeURIComponent(jql)}&maxResults=50`, integration);
      
      for (const issue of response.issues || []) {
        const existingActivity = await this.findExistingActivity(integration.userId, 'jira_issue', issue.key);
        
        if (!existingActivity) {
          const activity: InsertWorkActivity = {
            userId: integration.userId,
            integrationId: integration.id,
            provider: 'jira',
            activityType: 'jira_issue',
            title: `${issue.key}: ${issue.fields.summary}`,
            description: issue.fields.description?.content?.[0]?.content?.[0]?.text || issue.fields.summary,
            externalId: issue.key,
            timestamp: new Date(issue.fields.updated),
            metadata: {
              key: issue.key,
              status: issue.fields.status.name,
              priority: issue.fields.priority?.name,
              issueType: issue.fields.issuetype.name,
              assignee: issue.fields.assignee?.displayName,
              reporter: issue.fields.reporter?.displayName,
              url: `${integration.metadata?.jiraUrl}/browse/${issue.key}`
            }
          };

          await storage.createWorkActivity(activity);
        }
      }
    } catch (error) {
      console.error('Error syncing Jira issues:', error);
    }
  }

  private static async findExistingActivity(userId: number, activityType: string, externalId: string) {
    const activities = await storage.getUserWorkActivities(userId, 1000);
    return activities.find(activity => 
      activity.activityType === activityType && 
      activity.externalId === externalId
    );
  }
}