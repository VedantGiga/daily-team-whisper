import { WebClient } from '@slack/web-api';
import { storage } from '../storage';
import type { Integration, InsertWorkActivity } from '@shared/schema';

export class SlackService {
  private static getSlackClient(accessToken: string): WebClient {
    return new WebClient(accessToken);
  }

  static async syncUserData(integration: Integration): Promise<void> {
    try {
      if (!integration.accessToken) {
        throw new Error('No access token available for Slack integration');
      }

      const slack = this.getSlackClient(integration.accessToken);
      
      // Sync recent messages and activity
      await this.syncRecentActivity(integration, slack);
      
      // Update last sync time
      await storage.updateIntegration(integration.id, {
        lastSyncAt: new Date(),
        isConnected: true
      });

    } catch (error) {
      console.error('Error syncing Slack data:', error);
      await storage.updateIntegration(integration.id, {
        isConnected: false
      });
      throw error;
    }
  }

  private static async syncRecentActivity(integration: Integration, slack: WebClient): Promise<void> {
    try {
      const channelId = process.env.SLACK_CHANNEL_ID;
      if (!channelId) {
        console.warn('SLACK_CHANNEL_ID not configured, skipping message sync');
        return;
      }

      // Get recent messages from the past 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const timestamp = (yesterday.getTime() / 1000).toString();

      const result = await slack.conversations.history({
        channel: channelId,
        oldest: timestamp,
        limit: 50
      });

      if (result.messages) {
        for (const message of result.messages) {
          // Skip bot messages and messages without text
          if (message.bot_id || !message.text || !message.ts) continue;

          // Check if we already have this message
          const existingActivity = await this.findExistingActivity(
            integration.userId, 
            'slack_message', 
            message.ts
          );

          if (!existingActivity) {
            const activity: InsertWorkActivity = {
              userId: integration.userId,
              integrationId: integration.id,
              provider: 'slack',
              activityType: 'slack_message',
              title: 'Slack Message',
              description: message.text.substring(0, 200) + (message.text.length > 200 ? '...' : ''),
              externalId: message.ts,
              timestamp: new Date(parseFloat(message.ts) * 1000),
              metadata: {
                channel: channelId,
                messageId: message.ts,
                userId: message.user,
                reactions: message.reactions || [],
                threadTs: message.thread_ts,
                url: `https://slack.com/archives/${channelId}/p${message.ts?.replace('.', '')}`
              }
            };

            await storage.createWorkActivity(activity);
          }
        }
      }

      // Sync user's Slack profile info
      await this.syncUserProfile(integration, slack);

    } catch (error) {
      console.error('Error syncing Slack activity:', error);
      throw error;
    }
  }

  private static async syncUserProfile(integration: Integration, slack: WebClient): Promise<void> {
    try {
      const userInfo = await slack.auth.test();
      
      if (userInfo.ok && userInfo.user_id) {
        const profile = await slack.users.info({
          user: userInfo.user_id
        });

        if (profile.ok && profile.user) {
          // Update integration with user info
          const existingMetadata = (integration.metadata as any) || {};
          await storage.updateIntegration(integration.id, {
            metadata: {
              ...existingMetadata,
              slackUserId: userInfo.user_id,
              slackTeamId: userInfo.team_id,
              slackUserName: profile.user.name,
              slackRealName: profile.user.real_name,
              slackAvatar: profile.user.profile?.image_72
            }
          });
        }
      }
    } catch (error) {
      console.error('Error syncing Slack user profile:', error);
    }
  }

  static async sendMessage(integration: Integration, message: string, channel?: string): Promise<void> {
    if (!integration.accessToken) {
      throw new Error('No access token available');
    }

    const slack = this.getSlackClient(integration.accessToken);
    const targetChannel = channel || process.env.SLACK_CHANNEL_ID;

    if (!targetChannel) {
      throw new Error('No channel specified and SLACK_CHANNEL_ID not configured');
    }

    await slack.chat.postMessage({
      channel: targetChannel,
      text: message
    });
  }

  static async getChannels(integration: Integration): Promise<any[]> {
    if (!integration.accessToken) {
      throw new Error('No access token available');
    }

    const slack = this.getSlackClient(integration.accessToken);
    const result = await slack.conversations.list({
      types: 'public_channel,private_channel',
      limit: 100
    });

    return result.channels || [];
  }

  static async getUserList(integration: Integration): Promise<any[]> {
    if (!integration.accessToken) {
      throw new Error('No access token available');
    }

    const slack = this.getSlackClient(integration.accessToken);
    const result = await slack.users.list();

    return result.members?.filter(member => !member.deleted && !member.is_bot) || [];
  }

  private static async findExistingActivity(userId: number, activityType: string, externalId: string) {
    const activities = await storage.getUserWorkActivities(userId, 1000);
    return activities.find(activity => 
      activity.activityType === activityType && 
      (activity.metadata as any)?.messageId === externalId
    );
  }
}