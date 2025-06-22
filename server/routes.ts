import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "node:path";
import { storage } from "./storage";
import { GitHubService } from "./services/githubService";
import { SlackService } from "./services/slackService";
import { GoogleCalendarService } from "./services/googleCalendarService";
import { JiraService } from "./services/jiraService";
import { AIService } from "./services/aiService";
import { 
  insertIntegrationSchema, 
  insertWorkActivitySchema, 
  insertDailySummarySchema,
  integrations
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Root route
  app.get("/", (req, res) => {
    res.json({ 
      message: "Daily Team Whisper API", 
      status: "running",
      endpoints: {
        integrations: "/api/integrations",
        activities: "/api/activities",
        summaries: "/api/summaries",
        ai: "/api/ai/*"
      }
    });
  });

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
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${scopes.join(",")}&state=${state}&prompt=select_account`;
    
    res.json({ authUrl });
  });

  // Get GitHub repositories for an integration
  app.get("/api/integrations/:id/github/repos", async (req, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      
      // Get the integration directly by ID
      const targetIntegration = await storage.getIntegrationById(integrationId);

      if (!targetIntegration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      if (targetIntegration.provider !== "github") {
        return res.status(400).json({ error: "Not a GitHub integration" });
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
        // Always clear old GitHub activities when reconnecting
        await storage.clearProviderActivities(parseInt(userId), "github");
        
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
                type: 'OAUTH_SUCCESS', 
                provider: 'github',
                username: '${githubUser.login}' 
              }, '*');
            }
            setTimeout(() => {
              window.close();
            }, 1000);
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
      
      console.log('Generated Slack OAuth URL:', authUrl);
      console.log('Redirect URI:', redirectUri);
      
      res.json({ authUrl });
    } catch (error) {
      console.error("Error creating Slack OAuth URL:", error);
      res.status(500).json({ error: "Failed to create OAuth URL" });
    }
  });

  // Slack OAuth callback
  app.get("/api/integrations/slack/callback", async (req, res) => {
    try {
      const { code, state, error } = req.query;
      
      console.log('Slack callback received:', { code: !!code, state: !!state, error });
      
      if (error) {
        console.error('Slack OAuth error:', error);
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head><title>Slack Connection Failed</title></head>
          <body>
            <h1>Connection Failed</h1>
            <p>Error: ${error}</p>
            <script>setTimeout(() => window.close(), 3000);</script>
          </body>
          </html>
        `);
      }
      
      if (!code || !state) {
        console.error('Missing code or state:', { code: !!code, state: !!state });
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head><title>Slack Connection Failed</title></head>
          <body>
            <h1>Connection Failed</h1>
            <p>Missing authorization parameters</p>
            <script>setTimeout(() => window.close(), 3000);</script>
          </body>
          </html>
        `);
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
      // Use the actual production URL for Render deployment
      const redirectUri = 'https://daily-team-whisper.onrender.com/api/integrations/google-calendar/callback';
      
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
      
      // Use the actual production URL for Render deployment
      const redirectUri = 'https://daily-team-whisper.onrender.com/api/integrations/google-calendar/callback';
      
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
          redirect_uri: redirectUri
        })
      });

      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        throw new Error(tokenData.error_description || tokenData.error);
      }

      // Check if integration already exists
      const existingIntegration = await storage.getIntegrationByProvider(userId, 'google_calendar');
      
      if (existingIntegration) {
        // Always clear old Google Calendar activities when reconnecting
        await storage.clearProviderActivities(userId, "google_calendar");
        
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

  // Notion Integration Routes
  
  // Test Notion configuration
  app.get("/api/integrations/notion/test", async (req, res) => {
    try {
      const configured = !!(process.env.NOTION_CLIENT_ID && process.env.NOTION_CLIENT_SECRET);
      
      res.json({
        configured,
        clientId: process.env.NOTION_CLIENT_ID ? process.env.NOTION_CLIENT_ID.substring(0, 10) + '...' : null,
        hasSecret: !!process.env.NOTION_CLIENT_SECRET
      });
    } catch (error) {
      console.error("Error testing Notion configuration:", error);
      res.status(500).json({ error: "Failed to test configuration" });
    }
  });

  // Notion OAuth connection
  app.get("/api/integrations/notion/connect", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      if (!process.env.NOTION_CLIENT_ID) {
        return res.status(400).json({ error: "Notion Client ID not configured" });
      }

      const state = Buffer.from(JSON.stringify({ userId })).toString("base64");
      const redirectUri = `${req.protocol}://${req.get('host')}/api/integrations/notion/callback`;
      
      const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${process.env.NOTION_CLIENT_ID}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
      
      res.json({ authUrl });
    } catch (error) {
      console.error("Error creating Notion OAuth URL:", error);
      res.status(500).json({ error: "Failed to create OAuth URL" });
    }
  });

  // Notion OAuth callback
  app.get("/api/integrations/notion/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        return res.status(400).json({ error: "Missing authorization code or state" });
      }

      const { userId } = JSON.parse(Buffer.from(state as string, "base64").toString());
      
      // Exchange code for access token
      const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString('base64')}`,
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: code.toString(),
          redirect_uri: `${req.protocol}://${req.get('host')}/api/integrations/notion/callback`
        })
      });

      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        throw new Error(tokenData.error_description || tokenData.error);
      }

      // Check if integration already exists
      const existingIntegration = await storage.getIntegrationByProvider(userId, 'notion');
      
      if (existingIntegration) {
        await storage.updateIntegration(existingIntegration.id, {
          isConnected: true,
          accessToken: tokenData.access_token,
          metadata: {
            workspace_name: tokenData.workspace_name,
            workspace_id: tokenData.workspace_id,
            bot_id: tokenData.bot_id
          },
          lastSyncAt: new Date(),
        });
      } else {
        await storage.createIntegration({
          userId,
          provider: 'notion',
          isConnected: true,
          accessToken: tokenData.access_token,
          metadata: {
            workspace_name: tokenData.workspace_name,
            workspace_id: tokenData.workspace_id,
            bot_id: tokenData.bot_id
          },
          lastSyncAt: new Date(),
        });
      }

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Notion Connected</title>
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
            <div class="success">✓ Notion Connected Successfully!</div>
            <p>Connected to <strong>${tokenData.workspace_name}</strong></p>
            <p>This window will close automatically...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_SUCCESS', 
                provider: 'notion'
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
      console.error("Notion OAuth callback error:", error);
      res.status(500).json({ error: "Failed to connect Notion account" });
    }
  });

  // Setup Notion databases
  app.post("/api/integrations/notion/setup", async (req, res) => {
    try {
      if (!process.env.NOTION_INTEGRATION_SECRET || !process.env.NOTION_PAGE_URL) {
        return res.status(400).json({ error: "Notion integration not configured" });
      }

      // Set up Notion databases directly
      const { createDatabaseIfNotExists } = await import('./notion.js');
      
      // Create Work Activities database
      const activitiesDb = await createDatabaseIfNotExists("Work Activities", {
        Title: { title: {} },
        Description: { rich_text: {} },
        Type: {
          select: {
            options: [
              { name: "Commit", color: "blue" },
              { name: "Pull Request", color: "green" },
              { name: "Issue", color: "orange" },
              { name: "Meeting", color: "purple" },
              { name: "Calendar Event", color: "pink" }
            ]
          }
        },
        Source: {
          select: {
            options: [
              { name: "GitHub", color: "default" },
              { name: "Google Calendar", color: "yellow" },
              { name: "Slack", color: "red" }
            ]
          }
        },
        Date: { date: {} },
        Completed: { checkbox: {} }
      });

      // Create Daily Summaries database
      const summariesDb = await createDatabaseIfNotExists("Daily Summaries", {
        Title: { title: {} },
        Date: { date: {} },
        Summary: { rich_text: {} },
        TasksCompleted: { number: {} },
        Meetings: { number: {} },
        Blockers: { number: {} }
      });
      
      res.json({ 
        success: true, 
        message: "Notion databases created successfully",
        databases: {
          activities: activitiesDb.id,
          summaries: summariesDb.id
        }
      });

    } catch (error) {
      console.error("Error setting up Notion databases:", error);
      res.status(500).json({ error: "Failed to setup Notion databases" });
    }
  });

  // Jira Integration Routes
  
  // Test Jira configuration
  app.get("/api/integrations/jira/test", async (req, res) => {
    try {
      const configured = !!(process.env.JIRA_CLIENT_ID && process.env.JIRA_CLIENT_SECRET);
      
      res.json({
        configured,
        clientId: process.env.JIRA_CLIENT_ID ? process.env.JIRA_CLIENT_ID.substring(0, 10) + '...' : null,
        hasSecret: !!process.env.JIRA_CLIENT_SECRET
      });
    } catch (error) {
      console.error("Error testing Jira configuration:", error);
      res.status(500).json({ error: "Failed to test configuration" });
    }
  });

  // Jira OAuth connection
  app.get("/api/integrations/jira/connect", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      if (!process.env.JIRA_CLIENT_ID) {
        return res.status(400).json({ error: "Jira OAuth not configured" });
      }

      const state = Buffer.from(JSON.stringify({ userId })).toString("base64");
      const redirectUri = `${req.protocol}://${req.get('host')}/api/integrations/jira/callback`;
      
      const authUrl = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${process.env.JIRA_CLIENT_ID}&scope=read%3Ajira-user%20read%3Ajira-work%20write%3Ajira-work&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&response_type=code&prompt=consent`;
      
      res.json({ authUrl });
    } catch (error) {
      console.error("Error creating Jira OAuth URL:", error);
      res.status(500).json({ error: "Failed to create OAuth URL" });
    }
  });

  // Jira OAuth callback
  app.get("/api/integrations/jira/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        return res.status(400).json({ error: "Missing authorization code or state" });
      }

      const { userId } = JSON.parse(Buffer.from(state as string, "base64").toString());
      
      // Exchange code for access token
      const tokenResponse = await fetch('https://auth.atlassian.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: process.env.JIRA_CLIENT_ID,
          client_secret: process.env.JIRA_CLIENT_SECRET,
          code: code.toString(),
          redirect_uri: `${req.protocol}://${req.get('host')}/api/integrations/jira/callback`
        })
      });

      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        throw new Error(tokenData.error_description || tokenData.error);
      }

      // Get accessible resources (Jira sites)
      const resourcesResponse = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json'
        }
      });

      const resources = await resourcesResponse.json();
      const jiraSite = resources.find((r: any) => r.scopes.includes('read:jira-user'));
      
      if (!jiraSite) {
        throw new Error('No Jira site found with required permissions');
      }

      // Get user info
      const userResponse = await fetch(`https://api.atlassian.com/ex/jira/${jiraSite.id}/rest/api/3/myself`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json'
        }
      });

      const jiraUser = await userResponse.json();

      // Check if integration already exists
      const existingIntegration = await storage.getIntegrationByProvider(userId, 'jira');
      
      if (existingIntegration) {
        await storage.updateIntegration(existingIntegration.id, {
          isConnected: true,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          providerUsername: jiraUser.displayName,
          metadata: {
            jiraSiteId: jiraSite.id,
            jiraSiteName: jiraSite.name,
            jiraUrl: jiraSite.url,
            jiraUser
          },
          lastSyncAt: new Date(),
        });
      } else {
        await storage.createIntegration({
          userId,
          provider: 'jira',
          isConnected: true,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          providerUsername: jiraUser.displayName,
          metadata: {
            jiraSiteId: jiraSite.id,
            jiraSiteName: jiraSite.name,
            jiraUrl: jiraSite.url,
            jiraUser
          },
          lastSyncAt: new Date(),
        });
      }

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Jira Connected</title>
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
            <div class="success">✓ Jira Connected Successfully!</div>
            <p>Connected to <strong>${jiraSite.name}</strong></p>
            <p>This window will close automatically...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_SUCCESS', 
                provider: 'jira'
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
      console.error("Jira OAuth callback error:", error);
      res.status(500).json({ error: "Failed to connect Jira account" });
    }
  });

  // Get Google Calendar events
  app.get("/api/integrations/:id/google-calendar/events", async (req, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      const { timeMin, timeMax, calendarId } = req.query;
      
      // Find which user owns this integration
      const allUsers = [1, 1549479646]; // Support both demo user and authenticated users
      let targetIntegration = null;
      
      for (const userId of allUsers) {
        const userIntegrations = await storage.getUserIntegrations(userId);
        targetIntegration = userIntegrations.find(i => i.id === integrationId);
        if (targetIntegration) break;
      }

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
      
      // Find which user owns this integration
      const allUsers = [1, 1549479646]; // Support both demo user and authenticated users
      let targetIntegration = null;
      
      for (const userId of allUsers) {
        const userIntegrations = await storage.getUserIntegrations(userId);
        targetIntegration = userIntegrations.find(i => i.id === integrationId);
        if (targetIntegration) break;
      }

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
      
      // Find which user owns this integration
      const allUsers = [1, 1549479646]; // Support both demo user and authenticated users
      let targetIntegration = null;
      
      for (const userId of allUsers) {
        const userIntegrations = await storage.getUserIntegrations(userId);
        targetIntegration = userIntegrations.find(i => i.id === integrationId);
        if (targetIntegration) break;
      }

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
      
      console.log(`Fetching activities for user ID: ${userId}`);
      const activities = await storage.getUserWorkActivities(userId, limit);
      console.log(`Found ${activities.length} activities for user ${userId}`);
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

  // Clear all activities for a user
  app.delete("/api/activities/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      await storage.clearAllUserActivities(userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error clearing user activities:", error);
      res.status(500).json({ error: "Failed to clear activities" });
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
      
      // Get the integration directly by ID to find its userId
      const integration = await storage.getIntegrationById(integrationId);
      
      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      if (!integration.isConnected) {
        return res.status(400).json({ error: "Integration is not connected" });
      }

      // Perform actual sync based on provider
      try {
        if (integration.provider === "github") {
          await GitHubService.syncUserData(integration);
        } else if (integration.provider === "google_calendar") {
          await GoogleCalendarService.syncUserData(integration);
        } else if (integration.provider === "jira") {
          await JiraService.syncUserData(integration);
        } else {
          return res.status(400).json({ error: `Sync not supported for provider: ${integration.provider}` });
        }
        
        // Update lastSyncAt timestamp
        const updatedIntegration = await storage.updateIntegration(integrationId, {
          lastSyncAt: new Date(),
        });
        
        res.json({ success: true, lastSyncAt: updatedIntegration.lastSyncAt });
      } catch (syncError) {
        console.error(`Error syncing ${integration.provider}:`, syncError);
        res.status(500).json({ error: `Failed to sync ${integration.provider}: ${syncError instanceof Error ? syncError.message : String(syncError)}` });
      }
    } catch (error) {
      console.error("Error syncing integration:", error);
      res.status(500).json({ error: "Failed to sync integration" });
    }
  });

  // Get GitHub repositories for a user
  app.get("/api/integrations/:id/github/repos", async (req, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      
      // Find which user owns this integration
      const allUsers = [1, 1549479646]; // Support both demo user and authenticated users
      let integration = null;
      
      for (const userId of allUsers) {
        const userIntegrations = await storage.getUserIntegrations(userId);
        integration = userIntegrations.find(i => i.id === integrationId);
        if (integration) break;
      }
      
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

  // AI-Powered Features Routes
  
  // Generate AI daily summary with options
  app.post("/api/ai/daily-summary", async (req, res) => {
    try {
      const { userId, date, tone, filter } = req.body;
      
      if (!userId || !date) {
        return res.status(400).json({ error: "User ID and date are required" });
      }
      
      const summary = await AIService.generateDailySummary(userId, date, { tone, filter });
      res.json({ summary });
    } catch (error) {
      console.error("Error generating daily summary:", error);
      res.status(500).json({ error: "Failed to generate summary" });
    }
  });

  // Slack bot endpoint for daily summary
  app.post("/api/slack/summary", async (req, res) => {
    try {
      const { text, user_id } = req.body;
      const userId = 1; // Map Slack user to your user ID
      const today = new Date().toISOString().split('T')[0];
      
      // Parse command for tone/filter
      const tone = text?.includes('friendly') ? 'friendly' : 
                   text?.includes('casual') ? 'casual' : 
                   text?.includes('formal') ? 'formal' : 'professional';
      
      const filter = text?.includes('blockers') ? 'blockers' :
                     text?.includes('meetings') ? 'meetings' :
                     text?.includes('code') ? 'code' : 'all';
      
      const summary = await AIService.generateDailySummary(userId, today, { tone, filter });
      
      // Format for Slack
      const slackSummary = summary
        .replace(/^# (.*$)/gm, '*$1*')
        .replace(/^## (.*$)/gm, '*$1*')
        .replace(/\*\*(.*?)\*\*/gm, '*$1*')
        .replace(/^   • (.*$)/gm, '  • $1');
      
      res.json({
        response_type: 'in_channel',
        text: slackSummary
      });
    } catch (error) {
      console.error('Slack bot error:', error);
      res.json({
        response_type: 'ephemeral',
        text: 'Sorry, I couldn\'t generate your summary right now. Try again later!'
      });
    }
  });

  // Analyze work patterns
  app.get("/api/ai/work-patterns/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const analysis = await AIService.analyzeWorkPatterns(userId);
      res.json({ analysis });
    } catch (error) {
      console.error("Error analyzing work patterns:", error);
      res.status(500).json({ error: "Failed to analyze patterns" });
    }
  });

  // Get AI task suggestions
  app.get("/api/ai/task-suggestions/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const suggestions = await AIService.suggestNextTasks(userId);
      res.json({ suggestions });
    } catch (error) {
      console.error("Error getting task suggestions:", error);
      res.status(500).json({ error: "Failed to get suggestions" });
    }
  });

  // Simple email test route
  app.get("/api/test-email", async (req, res) => {
    try {
      const email = req.query.email as string || 'test@example.com';
      const today = new Date().toISOString().split('T')[0];
      const summary = "# Test Daily Brief\n\n## 🔧 GitHub\n✅ 2 commits pushed\n   • Test commit 1\n   • Test commit 2\n\n## 📊 Daily Summary\n✅ 2 tasks completed";
      
      const { EmailService } = await import('./services/emailService');
      await EmailService.sendDailySummary(email, summary, today);
      
      res.json({ success: true, message: `Email sent to ${email}` });
    } catch (error) {
      console.error('Email test error:', error);
      res.json({ success: false, error: error.message });
    }
  });

  // Helper function for generating hash codes
  function hashCode(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // Team Management Routes
  
  // Get team members for a user from integrations
  app.get("/api/team/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const integrations = await storage.getUserIntegrations(userId);
      const teamMembers = [];
      const seenEmails = new Set();
      
      // Fetch from GitHub
      const githubIntegration = integrations.find(i => i.provider === 'github' && i.isConnected);
      if (githubIntegration?.accessToken) {
        try {
          // Get organization members
          const orgResponse = await fetch('https://api.github.com/user/orgs', {
            headers: {
              'Authorization': `Bearer ${githubIntegration.accessToken}`,
              'User-Agent': 'Daily-Team-Whisper'
            }
          });
          
          if (orgResponse.ok) {
            const orgs = await orgResponse.json();
            
            for (const org of orgs.slice(0, 1)) { // Just first org
              const membersResponse = await fetch(`https://api.github.com/orgs/${org.login}/members`, {
                headers: {
                  'Authorization': `Bearer ${githubIntegration.accessToken}`,
                  'User-Agent': 'Daily-Team-Whisper'
                }
              });
              
              if (membersResponse.ok) {
                const members = await membersResponse.json();
                
                for (const member of members.slice(0, 10)) { // Limit to 10
                  if (!seenEmails.has(member.login)) {
                    seenEmails.add(member.login);
                    
                    // Get user details
                    const userResponse = await fetch(`https://api.github.com/users/${member.login}`, {
                      headers: {
                        'Authorization': `Bearer ${githubIntegration.accessToken}`,
                        'User-Agent': 'Daily-Team-Whisper'
                      }
                    });
                    
                    if (userResponse.ok) {
                      const userDetails = await userResponse.json();
                      
                      teamMembers.push({
                        id: member.id,
                        name: userDetails.name || member.login,
                        email: userDetails.email || `${member.login}@github.local`,
                        role: 'member',
                        department: 'Engineering',
                        avatar: member.avatar_url,
                        status: 'active',
                        joinedAt: userDetails.created_at,
                        lastActive: userDetails.updated_at ? new Date(userDetails.updated_at).toLocaleDateString() : 'Unknown',
                        permissions: ['read'],
                        stats: {
                          tasksCompleted: userDetails.public_repos || 0,
                          hoursWorked: Math.floor(Math.random() * 160) + 40,
                          projectsActive: Math.floor(userDetails.public_repos / 5) || 1,
                          activitiesCount: userDetails.public_repos + (userDetails.followers || 0)
                        },
                        source: 'github'
                      });
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error fetching GitHub team members:', error);
        }
      }
      
      // Fetch from Slack (if available)
      const slackIntegration = integrations.find(i => i.provider === 'slack' && i.isConnected);
      if (slackIntegration?.accessToken) {
        try {
          const usersResponse = await fetch('https://slack.com/api/users.list', {
            headers: {
              'Authorization': `Bearer ${slackIntegration.accessToken}`
            }
          });
          
          if (usersResponse.ok) {
            const data = await usersResponse.json();
            if (data.ok && data.members) {
              for (const member of data.members.slice(0, 10)) {
                if (!member.deleted && !member.is_bot && member.profile?.email && !seenEmails.has(member.profile.email)) {
                  seenEmails.add(member.profile.email);
                  
                  teamMembers.push({
                    id: hashCode(member.id),
                    name: member.profile.real_name || member.name,
                    email: member.profile.email,
                    role: member.is_admin ? 'admin' : member.is_owner ? 'admin' : 'member',
                    department: member.profile.title ? 'General' : 'Communication',
                    avatar: member.profile.image_192,
                    status: member.presence === 'active' ? 'active' : 'inactive',
                    joinedAt: new Date(member.updated * 1000).toISOString(),
                    lastActive: member.presence === 'active' ? 'Recently' : 'Unknown',
                    permissions: member.is_admin ? ['read', 'write', 'admin'] : ['read'],
                    stats: {
                      tasksCompleted: Math.floor(Math.random() * 50),
                      hoursWorked: Math.floor(Math.random() * 160) + 40,
                      projectsActive: Math.floor(Math.random() * 5) + 1,
                      activitiesCount: Math.floor(Math.random() * 100) + 20
                    },
                    source: 'slack'
                  });
                }
              }
            }
          }
        } catch (error) {
          console.error('Error fetching Slack team members:', error);
        }
      }
      
      // Add current user if not already included
      const currentUserEmail = 'current.user@company.com'; // This would come from auth
      if (!seenEmails.has(currentUserEmail)) {
        teamMembers.unshift({
          id: userId,
          name: 'You',
          email: currentUserEmail,
          role: 'admin',
          department: 'Management',
          avatar: '',
          status: 'active',
          joinedAt: new Date().toISOString(),
          lastActive: 'Now',
          permissions: ['read', 'write', 'admin'],
          stats: {
            tasksCompleted: 45,
            hoursWorked: 160,
            projectsActive: 3,
            activitiesCount: 128
          },
          source: 'current'
        });
      }
      
      res.json(teamMembers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  // Add team member
  app.post("/api/team/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { name, email, role, department } = req.body;
      
      if (!userId || !name || !email || !role) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // In production, this would insert into team_members table
      const newMember = {
        id: Date.now(),
        name,
        email,
        role,
        department: department || 'General',
        status: 'pending',
        joinedAt: new Date().toISOString(),
        lastActive: 'Never',
        permissions: role === 'admin' ? ['read', 'write', 'admin'] : ['read'],
        stats: { tasksCompleted: 0, hoursWorked: 0, projectsActive: 0, activitiesCount: 0 }
      };
      
      res.status(201).json(newMember);
    } catch (error) {
      console.error("Error adding team member:", error);
      res.status(500).json({ error: "Failed to add team member" });
    }
  });

  // Remove team member
  app.delete("/api/team/:userId/:memberId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const memberId = parseInt(req.params.memberId);
      
      if (!userId || !memberId) {
        return res.status(400).json({ error: "User ID and Member ID are required" });
      }
      
      // In production, this would delete from team_members table
      res.status(204).send();
    } catch (error) {
      console.error("Error removing team member:", error);
      res.status(500).json({ error: "Failed to remove team member" });
    }
  });

  // Add sample data for testing
  app.post("/api/add-sample-data", async (req, res) => {
    try {
      const userId = 1;
      const today = new Date().toISOString().split('T')[0];
      
      // Add sample activities
      await storage.createWorkActivity({
        userId,
        provider: 'github',
        activityType: 'commit',
        title: 'Fix authentication bug',
        description: 'Resolved login issues for users',
        timestamp: new Date(`${today}T10:00:00Z`)
      });
      
      await storage.createWorkActivity({
        userId,
        provider: 'github',
        activityType: 'pr',
        title: 'Add new dashboard feature',
        description: 'Implemented user dashboard with analytics',
        timestamp: new Date(`${today}T14:00:00Z`)
      });
      
      await storage.createWorkActivity({
        userId,
        provider: 'google_calendar',
        activityType: 'calendar_event',
        title: 'Team standup meeting',
        description: 'Daily team sync',
        timestamp: new Date(`${today}T09:00:00Z`),
        metadata: { duration: 30 }
      });
      
      res.json({ success: true, message: 'Sample data added' });
    } catch (error) {
      console.error('Error adding sample data:', error);
      res.status(500).json({ error: 'Failed to add sample data' });
    }
  });

  // Test daily summary endpoint
  app.post("/api/test-daily-summary", async (req, res) => {
    try {
      const { userId, email } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const userEmail = email || 'your-email@gmail.com'; // Replace with your actual email
      const today = new Date().toISOString().split('T')[0];
      
      // Generate AI summary
      const summary = await AIService.generateDailySummary(userId, today);
      
      // Send email
      await EmailService.sendDailySummary(userEmail, summary, today);
      
      res.json({ success: true, message: 'Daily summary sent!', email: userEmail });
    } catch (error) {
      console.error('Error sending test summary:', error);
      res.status(500).json({ error: 'Failed to send summary' });
    }
  });

  // Initialize cron service for automated daily summaries
  const { CronService } = await import('./services/cronService');
  CronService.init();

  // Import and setup SPA handler for production
  if (process.env.NODE_ENV === 'production') {
    const { setupSpaHandler } = await import('./spa-handler.js');
    setupSpaHandler(app);
  }

  const httpServer = createServer(app);
  return httpServer;
}
