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
    console.log(`Starting Google Calendar sync for integration ${integration.id}, user ${integration.userId}`);
    
    try {
      if (!integration.accessToken) {
        throw new Error('No access token available for Google Calendar integration');
      }

      console.log('Access token available, syncing recent events...');
      // Sync recent events
      await this.syncRecentEvents(integration);
      
      console.log('Events synced successfully, updating integration...');
      // Update last sync time
      await storage.updateIntegration(integration.id, {
        lastSyncAt: new Date(),
        isConnected: true
      });
      
      console.log('Google Calendar sync completed successfully');

    } catch (error) {
      console.error('Error syncing Google Calendar data:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      
      // Don't disconnect on sync errors, just log them
      throw error;
    }
  }

  private static async syncRecentEvents(integration: Integration): Promise<void> {
    try {
      // Get events from the past 30 days and next 7 days
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      oneMonthAgo.setHours(0, 0, 0, 0); // Start of day
      
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
      oneWeekFromNow.setHours(23, 59, 59, 999); // End of day
      
      console.log(`Syncing calendar events from ${oneMonthAgo.toISOString()} to ${oneWeekFromNow.toISOString()}`);
      
      // First, get all calendars
      const calendars = await this.makeGoogleRequest(
        `/users/me/calendarList`,
        integration.accessToken!
      );
      
      console.log(`Found ${calendars.items ? calendars.items.length : 0} calendars`);
      
      let totalEvents = 0;
      
      // Check events from all calendars
      for (const calendar of calendars.items || []) {
        try {
          const events = await this.makeGoogleRequest(
            `/calendars/${encodeURIComponent(calendar.id)}/events?timeMin=${oneMonthAgo.toISOString()}&timeMax=${oneWeekFromNow.toISOString()}&orderBy=startTime&singleEvents=true&maxResults=50`,
            integration.accessToken!
          );
          
          console.log(`Found ${events.items ? events.items.length : 0} events in calendar: ${calendar.summary}`);
          totalEvents += events.items ? events.items.length : 0;

          if (events.items) {
            for (const event of events.items) {
              console.log(`Processing event: ${event.summary || 'Untitled'} from ${calendar.summary}, start: ${event.start?.dateTime || event.start?.date || 'No start time'}`);
              
              // Handle both timed events and all-day events
              if (!event.start?.dateTime && !event.start?.date) {
                console.log(`Skipping event ${event.summary || 'Untitled'} - no start time at all`);
                continue;
              }

              // Skip holiday calendars and holiday events
              const isHoliday = calendar.summary?.toLowerCase().includes('holiday') || 
                               event.summary?.toLowerCase().includes('holiday') ||
                               event.summary?.toLowerCase().includes('bakrid') ||
                               event.summary?.toLowerCase().includes('eid') ||
                               event.summary?.toLowerCase().includes('diwali') ||
                               event.summary?.toLowerCase().includes('christmas') ||
                               event.summary?.toLowerCase().includes('new year');
              
              if (isHoliday) {
                console.log(`Skipping holiday event: ${event.summary}`);
                continue;
              }

              // Check if we already have this event
              const existingActivity = await this.findExistingActivity(
                integration.userId, 
                'calendar_event', 
                event.id
              );

              if (!existingActivity) {
                // Handle both timed events and all-day events
                const startTime = new Date(event.start.dateTime || event.start.date);
                const endTime = event.end?.dateTime ? new Date(event.end.dateTime) : 
                               event.end?.date ? new Date(event.end.date) : null;
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
                    startTime: event.start.dateTime || event.start.date,
                    endTime: event.end?.dateTime || event.end?.date,
                    duration: duration,
                    location: event.location,
                    attendees: event.attendees?.map((a: any) => ({
                      email: a.email,
                      responseStatus: a.responseStatus
                    })),
                    organizer: event.organizer,
                    htmlLink: event.htmlLink,
                    status: event.status,
                    recurrence: event.recurrence,
                    calendarName: calendar.summary
                  }
                };

                console.log(`Creating activity for event: ${event.summary}`);
                await storage.createWorkActivity(activity);
              } else {
                console.log(`Activity already exists for event: ${event.summary}`);
              }
            }
          }
        } catch (calendarError) {
          console.error(`Error syncing calendar ${calendar.summary}:`, calendarError);
        }
      }

      console.log(`Total events processed across all calendars: ${totalEvents}`);

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
        await storage.updateIntegration(integration.id, {
          metadata: {
            ...integration.metadata,
            calendars: calendars.items.map((cal: any) => ({
              id: cal.id,
              name: cal.summary,
              primary: cal.primary,
              accessRole: cal.accessRole
            }))
          }
        });
      }
    } catch (error) {
      console.error('Error syncing calendar list:', error);
    }
  }

  static async getCalendars(integration: Integration): Promise<any[]> {
    if (!integration.accessToken) {
      throw new Error('No access token available');
    }

    const response = await this.makeGoogleRequest('/users/me/calendarList', integration.accessToken);
    return response.items || [];
  }

  static async getEvents(integration: Integration, calendarId = 'primary', timeMin?: string, timeMax?: string): Promise<any[]> {
    if (!integration.accessToken) {
      throw new Error('No access token available');
    }

    let url = `/calendars/${encodeURIComponent(calendarId)}/events?singleEvents=true&maxResults=50`;
    
    if (timeMin) {
      url += `&timeMin=${timeMin}`;
    }
    if (timeMax) {
      url += `&timeMax=${timeMax}`;
    }

    const response = await this.makeGoogleRequest(url, integration.accessToken);
    return response.items || [];
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
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create event: ${response.status} - ${error}`);
    }

    return response.json();
  }

  private static async findExistingActivity(userId: number, activityType: string, externalId: string) {
    const activities = await storage.getUserWorkActivities(userId, 1000);
    return activities.find(a => 
      a.activityType === activityType && 
      a.externalId === externalId
    );
  }
}