import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GitHubService } from "./services/githubService";
import { 
  insertIntegrationSchema, 
  insertWorkActivitySchema, 
  insertDailySummarySchema 
} from "@shared/schema";

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
    
    // Add popup parameter to the callback URL
    const callbackUrl = `${req.protocol}://${req.get('host')}/api/integrations/github/callback?popup=true`;
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${scopes.join(",")}&state=${state}&redirect_uri=${encodeURIComponent(callbackUrl)}`;
    
    res.json({ authUrl });
  });

  // Get GitHub repositories for an integration
  app.get("/api/integrations/:id/github/repos", async (req, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      
      // Get the integration using storage interface
      const integrations = await storage.getUserIntegrations(1); // Using user ID 1 for now
      const integration = integrations.find(i => i.id === integrationId);

      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      const accessToken = integration.accessToken;
      if (!accessToken) {
        return res.status(400).json({ error: "No access token available" });
      }

      // Fetch repositories from GitHub
      const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=50", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "AutoBrief-AI",
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

      // Check if this is a popup request (from our frontend integration)
      const isPopup = req.query.popup === 'true';
      
      if (isPopup) {
        // For popup OAuth flow, return HTML that closes the popup and notifies the parent window
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
      } else {
        // For direct navigation, redirect back to the integrations page
        res.redirect('/integrations?github_connected=true&username=' + encodeURIComponent(githubUser.login));
      }
    } catch (error) {
      console.error("GitHub OAuth callback error:", error);
      res.status(500).json({ error: "Failed to connect GitHub account" });
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
