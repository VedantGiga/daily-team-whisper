import cron from 'node-cron';
import { storage } from '../storage';
import { GitHubService } from './githubService';
import { GoogleCalendarService } from './googleCalendarService';
import { JiraService } from './jiraService';
import { AIService } from './aiService';
import { EmailService } from './emailService';

export class CronService {
  static init() {
    // Run daily at 7 PM (19:00)
    cron.schedule('0 19 * * *', async () => {
      console.log('Starting daily summary generation at 7 PM...');
      await this.generateDailySummaries();
    });

    console.log('Cron service initialized - daily summaries at 7 PM');
  }

  static async generateDailySummaries() {
    try {
      // Get all users with integrations
      const allUsers = await storage.getAllUsersWithIntegrations();
      
      for (const user of allUsers) {
        try {
          console.log(`Processing daily summary for user ${user.id}`);
          
          // Sync data from all connected integrations
          await this.syncAllIntegrations(user.id);
          
          // Generate AI summary for today
          const today = new Date().toISOString().split('T')[0];
          const summary = await AIService.generateDailySummary(user.id, today);
          
          // Store the summary
          await storage.createDailySummary({
            userId: user.id,
            date: today,
            summary,
            tasksCompleted: await this.countTasks(user.id, today),
            meetingsAttended: await this.countMeetings(user.id, today),
            blockers: 0
          });
          
          // Send email notification
          await EmailService.sendDailySummary(user.email, summary, today);
          
          console.log(`Daily summary completed for user ${user.id}`);
        } catch (error) {
          console.error(`Error processing user ${user.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in daily summary generation:', error);
    }
  }

  private static async syncAllIntegrations(userId: number) {
    const integrations = await storage.getUserIntegrations(userId);
    
    for (const integration of integrations) {
      if (!integration.isConnected) continue;
      
      try {
        switch (integration.provider) {
          case 'github':
            await GitHubService.syncUserData(integration);
            break;
          case 'google_calendar':
            await GoogleCalendarService.syncUserData(integration);
            break;
          case 'jira':
            await JiraService.syncUserData(integration);
            break;
        }
        
        await storage.updateIntegration(integration.id, {
          lastSyncAt: new Date()
        });
      } catch (error) {
        console.error(`Error syncing ${integration.provider} for user ${userId}:`, error);
      }
    }
  }

  private static async countTasks(userId: number, date: string): Promise<number> {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const activities = await storage.getWorkActivitiesByDateRange(userId, startDate, endDate);
    return activities.filter(a => 
      a.activityType === 'commit' || 
      a.activityType === 'pr' || 
      a.activityType === 'jira_issue'
    ).length;
  }

  private static async countMeetings(userId: number, date: string): Promise<number> {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const activities = await storage.getWorkActivitiesByDateRange(userId, startDate, endDate);
    return activities.filter(a => a.activityType === 'calendar_event').length;
  }
}