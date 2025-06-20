import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GitHubService } from "./services/githubService";
import { SlackService } from "./services/slackService";
import { GoogleCalendarService } from "./services/googleCalendarService";
import { 
  insertIntegrationSchema, 
  insertWorkActivitySchema, 
  insertDailySummarySchema,
  integrations
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Integration Routes
  
  // Get user's integrations
  app.get("/api/integrations", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const integrations = await storage.getUserIntegrations(userId);
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ error: "Failed to fetch integrations" });
    }
  });

  // Create new integration
  app.post("/api/integrations", async (req, res) => {
    try {
      const validatedData = insertIntegrationSchema.parse(req.body);
      const integration = await storage.createIntegration(validatedData);
      res.status(201).json(integration);
    } catch (error) {
      console.error("Error creating integration:", error);
      res.status(400).json({ error: "Failed to create integration" });
    }
  });

  // Update integration
  app.patch("/api/integrations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const integration = await storage.updateIntegration(id, updates);
      res.json(integration);
    } catch (error) {
      console.error("Error updating integration:", error);
      res.status(400).json({ error: "Failed to update integration" });
    }
  });

  // Delete integration
  app.delete("/api/integrations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteIntegration(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting integration:", error);
      res.status(400).json({ error: "Failed to delete integration" });
    }
  });

  // GitHub OAuth routes
  app.get("/api/integrations/github/connect", async (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: "GitHub OAuth not configured" });
    }

    const scopes = ["user", "repo", "read:org"];
    const state = Buffer.from(JSON.stringify({ userId, provider: "github" })).toString("base64");
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${scopes.join(",")}&state=${state}`;
    
    res.json({ authUrl });
  });

  // Get GitHub repositories for an integration
  app.get("/api/integrations/:id/github/repos", async (req, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      
      // Get the integration using storage interface
      const integration = await storage.getUserIntegrations(1);
      const targetIntegration = integration.find(i => i.id === integrationId);

      if (!targetIntegration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      const accessToken = targetIntegration.accessToken;
      if (!accessToken) {
        return res.status(400).json({ error: "No access token available" });
      }

      // Fetch repositories from GitHub
      const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=50", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "Daily-Team-Whisper",
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const repos = await response.json();
      res.json(repos);
    } catch (error) {
      console.error("Error fetching GitHub repositories:", error);
      res.status(500).json({ error: "Failed to fetch repositories" });
    }
  });

  app.get("/api/integrations/github/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        return res.status(400).json({ error: "Missing authorization code or state" });
      }

      const { userId } = JSON.parse(Buffer.from(state as string, "base64").toString());
      
      // Exchange code for access token
      const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        return res.status(400).json({ error: tokenData.error_description });
      }

      // Get user info from GitHub
      const userResponse = await fetch("https://api.github.com/user", {
        headers: {
          "Authorization": `Bearer ${tokenData.access_token}`,
        },
      });

      const githubUser = await userResponse.json();

      // Save or update integration
      const existingIntegration = await storage.getIntegrationByProvider(parseInt(userId), "github");
      
      if (existingIntegration) {
        await storage.updateIntegration(existingIntegration.id, {
          isConnected: true,
          accessToken: tokenData.access_token,
          providerUserId: githubUser.id.toString(),
          providerUsername: githubUser.login,
          metadata: { githubUser },
          lastSyncAt: new Date(),
        });
      } else {
        await storage.createIntegration({
          userId: parseInt(userId),
          provider: "github",
          isConnected: true,
          accessToken: tokenData.access_token,
          providerUserId: githubUser.id.toString(),
          providerUsername: githubUser.login,
          metadata: { githubUser },
          lastSyncAt: new Date(),
        });
      }

      // Return HTML that closes the popup and notifies the parent window
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>GitHub Connected</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #f8fafc;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .success {
              color: #059669;
              font-size: 1.5rem;
              margin-bottom: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✅ GitHub Connected Successfully!</div>
            <p>Connected as <strong>@${githubUser.login}</strong></p>
            <p>This window will close automatically...</p>
          </div>
          <script>
            // Notify parent window and close popup
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'GITHUB_AUTH_SUCCESS', 
                username: '${githubUser.login}' 
              }, '*');
            }
            setTimeout(() => {
              window.close();
            }, 2000);
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      console.error("GitHub OAuth callback error:", error);
      res.status(500).json({ error: "Failed to connect GitHub account" });
    }
  });

  // Slack Integration Routes
  
  // Slack OAuth connection
  app.get("/api/integrations/slack/connect", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1;
      
      if (!process.env.SLACK_CLIENT_ID) {
        return res.status(400).json({ error: "Slack client ID not configured" });
      }

      const scopes = [
        'channels:read',
        'channels:history', 
        'chat:write',
        'users:read'
      ].join(',');

      const state = Buffer.from(JSON.stringify({ userId })).toString("base64");
      const redirectUri = `${req.protocol}://${req.get('host')}/api/integrations/slack/callback`;
      
      const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=${scopes}&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;
      
      res.json({ authUrl });
    } catch (error) {
      console.error("Error creating Slack OAuth URL:", error);
      res.status(500).json({ error: "Failed to create OAuth URL" });
    }
  });

  // Slack OAuth callback
  app.get("/api/integrations/slack/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        return res.status(400).json({ error: "Missing authorization code or state" });
      }

      const { userId } = JSON.parse(Buffer.from(state as string, "base64").toString());
      
      // Exchange code for access token
      const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.SLACK_CLIENT_ID!,
          client_secret: process.env.SLACK_CLIENT_SECRET!,
          code: code.toString(),
          redirect_uri: `${req.protocol}://${req.get('host')}/api/integrations/slack/callback`
        })
      });

      const tokenData = await tokenResponse.json();
      
      if (!tokenData.ok) {
        throw new Error(tokenData.error || 'Failed to exchange code for token');
      }

      // Check if integration already exists
      const existingIntegration = await storage.getIntegrationByProvider(userId, 'slack');
      
      if (existingIntegration) {
        await storage.updateIntegration(existingIntegration.id, {
          isConnected: true,
          accessToken: tokenData.access_token,
          metadata: {
            teamId: tokenData.team?.id,
            teamName: tokenData.team?.name,
            scope: tokenData.scope,
            botUserId: tokenData.bot_user_id
          },
          lastSyncAt: new Date(),
        });
      } else {
        await storage.createIntegration({
          userId,
          provider: 'slack',
          isConnected: true,
          accessToken: tokenData.access_token,
          metadata: {
            teamId: tokenData.team?.id,
            teamName: tokenData.team?.name,
            scope: tokenData.scope,
            botUserId: tokenData.bot_user_id
          },
          lastSyncAt: new Date(),
        });
      }

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Slack Connected</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #f8fafc;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .success {
              color: #059669;
              font-size: 1.5rem;
              margin-bottom: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✓ Slack Connected Successfully!</div>
            <p>You can now close this window and return to AutoBrief.</p>
          </div>
          <script>
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      console.error("Slack OAuth callback error:", error);
      res.status(500).json({ error: "Failed to connect Slack account" });
    }
  });

  // Test Slack configuration
  app.get("/api/integrations/slack/test", async (req, res) => {
    try {
      const configured = !!(process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET);
      
      res.json({
        configured,
        clientId: process.env.SLACK_CLIENT_ID ? process.env.SLACK_CLIENT_ID.substring(0, 10) + '...' : null,
        hasSecret: !!process.env.SLACK_CLIENT_SECRET
      });
    } catch (error) {
      console.error("Error testing Slack configuration:", error);
      res.status(500).json({ error: "Failed to test configuration" });
    }
  });

  // Google Calendar Integration Routes
  
  // Google Calendar OAuth connection
  app.get("/api/integrations/google-calendar/connect", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1;
      
      if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(400).json({ error: "Google Client ID not configured" });
      }

      const scopes = [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events'
      ].join(' ');

      const state = Buffer.from(JSON.stringify({ userId })).toString("base64");
      // Use REPLIT_DOMAINS for the redirect URI to ensure it matches the actual domain
      const host = process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(',')[0] : req.get('host');
      const redirectUri = `https://${host}/api/integrations/google-calendar/callback`;
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&state=${state}&access_type=offline&prompt=consent`;
      
      console.log(`Google Calendar OAuth URL generated for user ${userId}: ${redirectUri}`);
      res.json({ authUrl, redirectUri });
    } catch (error) {
      console.error("Error creating Google Calendar OAuth URL:", error);
      res.status(500).json({ error: "Failed to create OAuth URL" });
    }
  });

  // Google Calendar OAuth callback
  app.get("/api/integrations/google-calendar/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        return res.status(400).json({ error: "Missing authorization code or state" });
      }

      const { userId } = JSON.parse(Buffer.from(state as string, "base64").toString());
      
      // Use REPLIT_DOMAINS for the redirect URI to ensure it matches the actual domain
      const host = process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(',')[0] : req.get('host');
      
      // Exchange code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code: code.toString(),
          grant_type: 'authorization_code',
          redirect_uri: `https://${host}/api/integrations/google-calendar/callback`
        })
      });

      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        throw new Error(tokenData.error_description || tokenData.error);
      }

      // Check if integration already exists
      const existingIntegration = await storage.getIntegrationByProvider(userId, 'google_calendar');
      
      if (existingIntegration) {
        await storage.updateIntegration(existingIntegration.id, {
          isConnected: true,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          metadata: {
            scope: tokenData.scope,
            tokenType: tokenData.token_type,
            expiresIn: tokenData.expires_in
          },
          lastSyncAt: new Date(),
        });
      } else {
        const integration = await storage.createIntegration({
          userId,
          provider: 'google_calendar',
          isConnected: true,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          metadata: {
            scope: tokenData.scope,
            tokenType: tokenData.token_type,
            expiresIn: tokenData.expires_in
          },
          lastSyncAt: new Date(),
        });

        // Sync initial data
        await GoogleCalendarService.syncUserData(integration);
      }

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Google Calendar Connected</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #f8fafc;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .success {
              color: #059669;
              font-size: 1.5rem;
              margin-bottom: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✓ Google Calendar Connected Successfully!</div>
            <p>You can now close this window and return to AutoBrief.</p>
          </div>
          <script>
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      console.error("Google Calendar OAuth callback error:", error);
      res.status(500).json({ error: "Failed to connect Google Calendar account" });
    }
  });

  // Test Google Calendar configuration
  app.get("/api/integrations/google-calendar/test", async (req, res) => {
    try {
      const configured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
      
      res.json({
        configured,
        clientId: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 10) + '...' : null,
        hasSecret: !!process.env.GOOGLE_CLIENT_SECRET
      });
    } catch (error) {
      console.error("Error testing Google Calendar configuration:", error);
      res.status(500).json({ error: "Failed to test configuration" });
    }
  });

  // Get Google Calendar events
  app.get("/api/integrations/:id/google-calendar/events", async (req, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      const { timeMin, timeMax, calendarId } = req.query;
      
      const integration = await storage.getUserIntegrations(1);
      const targetIntegration = integration.find(i => i.id === integrationId);

      if (!targetIntegration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      const events = await GoogleCalendarService.getEvents(
        targetIntegration,
        calendarId as string,
        timeMin as string,
        timeMax as string
      );
      res.json(events);
    } catch (error) {
      console.error("Error fetching Google Calendar events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // Test endpoint to debug calendar events
  app.get("/api/integrations/:id/google-calendar/debug", async (req, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      const integration = await storage.getUserIntegrations(1);
      const targetIntegration = integration.find(i => i.id === integrationId);

      if (!targetIntegration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      // Get events from the past year to check if there are any events at all
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const now = new Date();

      // First, get the list of calendars
      const calendarsResponse = await fetch(`https://www.googleapis.com/calendar/v3/users/me/calendarList`, {
        headers: {
          'Authorization': `Bearer ${targetIntegration.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!calendarsResponse.ok) {
        const error = await calendarsResponse.text();
        throw new Error(`Failed to fetch calendars: ${calendarsResponse.status} - ${error}`);
      }

      const calendars = await calendarsResponse.json();
      
      // Get today's events from all calendars
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      let allEvents = [];
      
      for (const calendar of calendars.items || []) {
        try {
          const eventsResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?timeMin=${today.toISOString()}&timeMax=${tomorrow.toISOString()}&singleEvents=true&maxResults=50`, {
            headers: {
              'Authorization': `Bearer ${targetIntegration.accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (eventsResponse.ok) {
            const events = await eventsResponse.json();
            if (events.items && events.items.length > 0) {
              allEvents.push(...events.items.map(event => ({
                ...event,
                calendarId: calendar.id,
                calendarName: calendar.summary
              })));
            }
          }
        } catch (calError) {
          console.log(`Error fetching events from calendar ${calendar.summary}:`, calError);
        }
      }
      
      res.json({
        timeRange: {
          from: today.toISOString(),
          to: tomorrow.toISOString()
        },
        totalCalendars: calendars.items ? calendars.items.length : 0,
        calendars: calendars.items?.map(cal => ({ 
          id: cal.id, 
          name: cal.summary, 
          primary: cal.primary,
          accessRole: cal.accessRole 
        })) || [],
        totalEvents: allEvents.length,
        events: allEvents,
        debugInfo: {
          hasAccessToken: !!targetIntegration.accessToken,
          integration: {
            id: targetIntegration.id,
            provider: targetIntegration.provider,
            isConnected: targetIntegration.isConnected,
            lastSyncAt: targetIntegration.lastSyncAt
          }
        }
      });
    } catch (error) {
      console.error("Error debugging Google Calendar events:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get Google Calendar calendars
  app.get("/api/integrations/:id/google-calendar/calendars", async (req, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      
      const integration = await storage.getUserIntegrations(1);
      const targetIntegration = integration.find(i => i.id === integrationId);

      if (!targetIntegration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      const calendars = await GoogleCalendarService.getCalendars(targetIntegration);
      res.json(calendars);
    } catch (error) {
      console.error("Error fetching Google Calendar calendars:", error);
      res.status(500).json({ error: "Failed to fetch calendars" });
    }
  });

  // Work Activities Routes
  
  // Get user's work activities
  app.get("/api/activities", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const limit = parseInt(req.query.limit as string) || 50;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const activities = await storage.getUserWorkActivities(userId, limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // Get activities by date range
  app.get("/api/activities/range", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);
      
      if (!userId || !startDate || !endDate) {
        return res.status(400).json({ error: "User ID, start date, and end date are required" });
      }
      
      const activities = await storage.getWorkActivitiesByDateRange(userId, startDate, endDate);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities by date range:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // Create work activity
  app.post("/api/activities", async (req, res) => {
    try {
      const validatedData = insertWorkActivitySchema.parse(req.body);
      const activity = await storage.createWorkActivity(validatedData);
      res.status(201).json(activity);
    } catch (error) {
      console.error("Error creating activity:", error);
      res.status(400).json({ error: "Failed to create activity" });
    }
  });

  // Daily Summaries Routes
  
  // Get user's daily summaries
  app.get("/api/summaries", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const limit = parseInt(req.query.limit as string) || 30;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const summaries = await storage.getUserDailySummaries(userId, limit);
      res.json(summaries);
    } catch (error) {
      console.error("Error fetching summaries:", error);
      res.status(500).json({ error: "Failed to fetch summaries" });
    }
  });

  // Get specific daily summary
  app.get("/api/summaries/:date", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const date = req.params.date;
      
      if (!userId || !date) {
        return res.status(400).json({ error: "User ID and date are required" });
      }
      
      const summary = await storage.getDailySummary(userId, date);
      if (!summary) {
        return res.status(404).json({ error: "Summary not found" });
      }
      
      res.json(summary);
    } catch (error) {
      console.error("Error fetching summary:", error);
      res.status(500).json({ error: "Failed to fetch summary" });
    }
  });

  // Create daily summary
  app.post("/api/summaries", async (req, res) => {
    try {
      const validatedData = insertDailySummarySchema.parse(req.body);
      const summary = await storage.createDailySummary(validatedData);
      res.status(201).json(summary);
    } catch (error) {
      console.error("Error creating summary:", error);
      res.status(400).json({ error: "Failed to create summary" });
    }
  });

  // Sync data from integrations
  app.post("/api/integrations/:id/sync", async (req, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      const integrations = await storage.getUserIntegrations(1); // Get all integrations for demo user
      const integration = integrations.find(i => i.id === integrationId);
      
      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      // Perform actual sync based on provider
      if (integration.provider === "github" && integration.isConnected) {
        await GitHubService.syncUserData(integration);
      } else if (integration.provider === "google_calendar" && integration.isConnected) {
        await GoogleCalendarService.syncUserData(integration);
      }
      
      // Update lastSyncAt timestamp
      const updatedIntegration = await storage.updateIntegration(integrationId, {
        lastSyncAt: new Date(),
      });
      
      res.json({ success: true, lastSyncAt: updatedIntegration.lastSyncAt });
    } catch (error) {
      console.error("Error syncing integration:", error);
      res.status(500).json({ error: "Failed to sync integration" });
    }
  });

  // Get GitHub repositories for a user
  app.get("/api/integrations/:id/github/repos", async (req, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      const integrations = await storage.getUserIntegrations(1);
      const integration = integrations.find(i => i.id === integrationId);
      
      if (!integration || integration.provider !== "github") {
        return res.status(404).json({ error: "GitHub integration not found" });
      }

      const repos = await GitHubService.getUserRepositories(integration);
      res.json(repos);
    } catch (error) {
      console.error("Error fetching GitHub repositories:", error);
      res.status(500).json({ error: "Failed to fetch repositories" });
    }
  });

  // Test GitHub OAuth configuration
  app.get("/api/integrations/github/test", async (req, res) => {
    try {
      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;
      
      res.json({
        configured: !!(clientId && clientSecret),
        clientId: clientId ? `${clientId.substring(0, 8)}...` : null,
        hasSecret: !!clientSecret,
        callbackUrl: `${req.protocol}://${req.get('host')}/api/integrations/github/callback`
      });
    } catch (error) {
      console.error("Error testing GitHub configuration:", error);
      res.status(500).json({ error: "Failed to test configuration" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
