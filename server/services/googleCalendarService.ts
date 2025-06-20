import { storage } from '../storage';
import type { Integration, InsertWorkActivity } from '@shared/schema';

export class GoogleCalendarService {
  private static async makeGoogleRequest(endpoint: string, token: string) {
    const response = await fetch(`https://www.googleapis.com/calendar/v3${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Calendar API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  static async syncUserData(integration: Integration): Promise<void> {
    try {
      if (!integration.accessToken) {
        throw new Error('No access token available for Google Calendar integration');
      }

      // Sync recent events
      await this.syncRecentEvents(integration);
      
      // Update last sync time
      await storage.updateIntegration(integration.id, {
        lastSyncAt: new Date(),
        isConnected: true
      });

    } catch (error) {
      console.error('Error syncing Google Calendar data:', error);
      await storage.updateIntegration(integration.id, {
        isConnected: false
      });
      throw error;
    }
  }

  private static async syncRecentEvents(integration: Integration): Promise<void> {
    try {
      // Get events from the past 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const now = new Date();
      
      const events = await this.makeGoogleRequest(
        `/calendars/primary/events?timeMin=${oneWeekAgo.toISOString()}&timeMax=${now.toISOString()}&orderBy=startTime&singleEvents=true&maxResults=50`,
        integration.accessToken!
      );

      if (events.items) {
        for (const event of events.items) {
          // Skip events without start time or that are all-day events without proper time
          if (!event.start?.dateTime) continue;

          // Check if we already have this event
          const existingActivity = await this.findExistingActivity(
            integration.userId, 
            'calendar_event', 
            event.id
          );

          if (!existingActivity) {
            const startTime = new Date(event.start.dateTime);
            const endTime = event.end?.dateTime ? new Date(event.end.dateTime) : null;
            const duration = endTime ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) : null;

            const activity: InsertWorkActivity = {
              userId: integration.userId,
              integrationId: integration.id,
              provider: 'google_calendar',
              activityType: 'calendar_event',
              title: event.summary || 'Untitled Event',
              description: event.description || `Calendar event${duration ? ` (${duration} minutes)` : ''}`,
              externalId: event.id,
              timestamp: startTime,
              metadata: {
                eventId: event.id,
                startTime: event.start.dateTime,
                endTime: event.end?.dateTime,
                duration: duration,
                location: event.location,
                attendees: event.attendees?.map((a: any) => ({
                  email: a.email,
                  responseStatus: a.responseStatus
                })),
                organizer: event.organizer,
                htmlLink: event.htmlLink,
                status: event.status,
                recurrence: event.recurrence
              }
            };

            await storage.createWorkActivity(activity);
          }
        }
      }

      // Sync user's calendar list and profile
      await this.syncCalendarList(integration);

    } catch (error) {
      console.error('Error syncing Google Calendar events:', error);
      throw error;
    }
  }

  private static async syncCalendarList(integration: Integration): Promise<void> {
    try {
      const calendars = await this.makeGoogleRequest('/users/me/calendarList', integration.accessToken!);
      
      if (calendars.items) {
        // Update integration with calendar info
        const existingMetadata = (integration.metadata as any) || {};
        await storage.updateIntegration(integration.id, {
          metadata: {
            ...existingMetadata,
            calendars: calendars.items.map((cal: any) => ({
              id: cal.id,
              summary: cal.summary,
              primary: cal.primary,
              accessRole: cal.accessRole
            })),
            primaryCalendar: calendars.items.find((cal: any) => cal.primary)?.summary
          }
        });
      }
    } catch (error) {
      console.error('Error syncing Google Calendar list:', error);
    }
  }

  static async getCalendars(integration: Integration): Promise<any[]> {
    if (!integration.accessToken) {
      throw new Error('No access token available');
    }

    const calendars = await this.makeGoogleRequest('/users/me/calendarList', integration.accessToken);
    return calendars.items || [];
  }

  static async getEvents(integration: Integration, calendarId = 'primary', timeMin?: string, timeMax?: string): Promise<any[]> {
    if (!integration.accessToken) {
      throw new Error('No access token available');
    }

    const params = new URLSearchParams({
      orderBy: 'startTime',
      singleEvents: 'true',
      maxResults: '50'
    });

    if (timeMin) params.append('timeMin', timeMin);
    if (timeMax) params.append('timeMax', timeMax);

    const events = await this.makeGoogleRequest(
      `/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
      integration.accessToken
    );

    return events.items || [];
  }

  static async createEvent(integration: Integration, eventData: any, calendarId = 'primary'): Promise<any> {
    if (!integration.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create event: ${response.status} - ${error}`);
    }

    return response.json();
  }

  private static async findExistingActivity(userId: number, activityType: string, externalId: string) {
    const activities = await storage.getUserWorkActivities(userId, 1000);
    return activities.find(activity => 
      activity.activityType === activityType && 
      activity.externalId === externalId
    );
  }
}