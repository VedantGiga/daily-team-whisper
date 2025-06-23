import cron from 'node-cron';
import { storage } from '../storage';
import { GitHubService } from './githubService';
import { GoogleCalendarService } from './googleCalendarService';
import { JiraService } from './jiraService';
import { AIService } from './aiService';
import { EmailService } from './emailService';

export class CronService {
  private static cronJob: cron.ScheduledTask;

  static init() {
    // Run daily at 8 PM (20:00)
    this.cronJob = cron.schedule('0 20 * * *', async () => {
      console.log('Starting daily summary generation at 8 PM...');
      await this.generateDailySummaries();
    });

    // Calculate next run time
    const now = new Date();
    const nextRun = new Date();
    nextRun.setHours(20, 0, 0, 0); // 8 PM
    
    // If it's already past 8 PM, schedule for tomorrow
    if (now.getHours() >= 20) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    const timeUntilNextRun = nextRun.getTime() - now.getTime();
    const hoursUntilNextRun = Math.floor(timeUntilNextRun / (1000 * 60 * 60));
    const minutesUntilNextRun = Math.floor((timeUntilNextRun % (1000 * 60 * 60)) / (1000 * 60));
    
    console.log(`Cron service initialized - daily summaries at 8 PM (next run in ${hoursUntilNextRun}h ${minutesUntilNextRun}m at ${nextRun.toLocaleTimeString()} on ${nextRun.toLocaleDateString()})`);
  }

  static getStatus() {
    // Calculate next run time
    const now = new Date();
    const nextRun = new Date();
    nextRun.setHours(20, 0, 0, 0); // 8 PM
    
    // If it's already past 8 PM, schedule for tomorrow
    if (now.getHours() >= 20) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    const timeUntilNextRun = nextRun.getTime() - now.getTime();
    const hoursUntilNextRun = Math.floor(timeUntilNextRun / (1000 * 60 * 60));
    const minutesUntilNextRun = Math.floor((timeUntilNextRun % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      currentTime: now.toISOString(),
      nextRunTime: nextRun.toISOString(),
      timeUntilNextRun: {
        hours: hoursUntilNextRun,
        minutes: minutesUntilNextRun,
        formatted: `${hoursUntilNextRun}h ${minutesUntilNextRun}m`
      },
      schedule: '0 20 * * *', // 8 PM daily
      isActive: !!this.cronJob
    };
  }

  static async generateDailySummaries() {
    try {
      console.log('Starting daily summary generation process...');
      
      // Get all users with integrations
      const allUsers = await storage.getAllUsersWithIntegrations();
      console.log(`Found ${allUsers.length} users with integrations:`, JSON.stringify(allUsers));
      
      if (allUsers.length === 0) {
        console.log('No users with integrations found. Adding demo user...');
        // Add demo user if no users found
        allUsers.push({ id: 1, email: 'demo@autobrief.dev' });
      }
      
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
          try {
            const emailResult = await EmailService.sendDailySummary(user.email, summary, today);
            console.log(`Email sent to ${user.email}, result:`, JSON.stringify(emailResult));
          } catch (emailError) {
            console.error(`Failed to send email to ${user.email}:`, emailError);
          }
          
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