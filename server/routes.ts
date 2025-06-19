import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${scopes.join(",")}&state=${state}`;
    
    res.json({ authUrl });
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

      res.json({ success: true, username: githubUser.login });
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
      const integration = await storage.updateIntegration(integrationId, {
        lastSyncAt: new Date(),
      });
      
      // Here you would implement the actual sync logic for each provider
      // For now, we'll just update the lastSyncAt timestamp
      
      res.json({ success: true, lastSyncAt: integration.lastSyncAt });
    } catch (error) {
      console.error("Error syncing integration:", error);
      res.status(500).json({ error: "Failed to sync integration" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
