import { storage } from '../storage';
import type { Integration, InsertWorkActivity } from '@shared/schema';

export class NotionService {
  private static async makeNotionRequest(endpoint: string, token: string, method = 'GET', body?: any) {
    const response = await fetch(`https://api.notion.com/v1${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Notion API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  static async syncUserData(integration: Integration): Promise<void> {
    console.log(`Starting Notion sync for integration ${integration.id}, user ${integration.userId}`);
    
    try {
      if (!integration.accessToken) {
        throw new Error('No access token available for Notion integration');
      }

      // Get user info to verify token
      const user = await this.makeNotionRequest('/users/me', integration.accessToken);
      
      // Update integration with latest user info
      await storage.updateIntegration(integration.id, {
        metadata: { notionUser: user },
        lastSyncAt: new Date()
      });

      console.log('Notion sync completed successfully');

    } catch (error) {
      console.error('Error syncing Notion data:', error);
      throw error;
    }
  }

  static async getDatabases(integration: Integration): Promise<any[]> {
    if (!integration.accessToken) {
      throw new Error('No access token available');
    }

    const response = await this.makeNotionRequest('/search', integration.accessToken, 'POST', {
      filter: {
        value: 'database',
        property: 'object'
      }
    });

    return response.results || [];
  }
}