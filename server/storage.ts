import { 
  users, 
  integrations,
  workActivities,
  dailySummaries,
  type User, 
  type InsertUser,
  type Integration,
  type InsertIntegration,
  type WorkActivity,
  type InsertWorkActivity,
  type DailySummary,
  type InsertDailySummary
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Integration operations
  getUserIntegrations(userId: number): Promise<Integration[]>;
  getIntegrationByProvider(userId: number, provider: string): Promise<Integration | undefined>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: number, updates: Partial<Integration>): Promise<Integration>;
  deleteIntegration(id: number): Promise<void>;
  
  // Work activity operations
  createWorkActivity(activity: InsertWorkActivity): Promise<WorkActivity>;
  getUserWorkActivities(userId: number, limit?: number): Promise<WorkActivity[]>;
  getWorkActivitiesByDateRange(userId: number, startDate: Date, endDate: Date): Promise<WorkActivity[]>;
  
  // Daily summary operations
  createDailySummary(summary: InsertDailySummary): Promise<DailySummary>;
  getDailySummary(userId: number, date: string): Promise<DailySummary | undefined>;
  getUserDailySummaries(userId: number, limit?: number): Promise<DailySummary[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private integrations: Map<number, Integration>;
  private workActivities: Map<number, WorkActivity>;
  private dailySummaries: Map<number, DailySummary>;
  private currentUserId: number;
  private currentIntegrationId: number;
  private currentActivityId: number;
  private currentSummaryId: number;

  constructor() {
    this.users = new Map();
    this.integrations = new Map();
    this.workActivities = new Map();
    this.dailySummaries = new Map();
    this.currentUserId = 1;
    this.currentIntegrationId = 1;
    this.currentActivityId = 1;
    this.currentSummaryId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create a sample user
    const sampleUser: User = {
      id: 1,
      username: "demo_user",
      password: "hashed_password",
      email: "demo@autobrief.com",
      createdAt: new Date()
    };
    this.users.set(1, sampleUser);
    this.currentUserId = 2;

    // Create sample integrations
    const githubIntegration: Integration = {
      id: 1,
      userId: 1,
      provider: "github",
      isConnected: true,
      accessToken: "sample_token",
      refreshToken: null,
      tokenExpiresAt: null,
      providerUserId: "12345",
      providerUsername: "demo_user",
      metadata: { githubUser: { login: "demo_user", name: "Demo User" } },
      lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    };

    const slackIntegration: Integration = {
      id: 2,
      userId: 1,
      provider: "slack",
      isConnected: false,
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      providerUserId: null,
      providerUsername: null,
      metadata: null,
      lastSyncAt: null,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
    };

    this.integrations.set(1, githubIntegration);
    this.integrations.set(2, slackIntegration);
    this.currentIntegrationId = 3;

    // Create sample work activities
    const activities: WorkActivity[] = [
      {
        id: 1,
        userId: 1,
        integrationId: 1,
        provider: "github",
        activityType: "commit",
        title: "Fix authentication bug in login flow",
        description: "Resolved issue where users couldn't log in with special characters in password",
        externalId: "abc123",
        metadata: { sha: "abc123", additions: 15, deletions: 3 },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 2,
        userId: 1,
        integrationId: 1,
        provider: "github",
        activityType: "pr",
        title: "Add dark mode support",
        description: "Implemented comprehensive dark theme with user preferences",
        externalId: "pr456",
        metadata: { number: 123, state: "merged", changed_files: 8 },
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },
      {
        id: 3,
        userId: 1,
        integrationId: 1,
        provider: "github",
        activityType: "commit",
        title: "Update integration documentation",
        description: "Added comprehensive API documentation for new integration endpoints",
        externalId: "def789",
        metadata: { sha: "def789", additions: 45, deletions: 0 },
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
      }
    ];

    activities.forEach(activity => {
      this.workActivities.set(activity.id, activity);
    });
    this.currentActivityId = 4;

    // Create sample daily summary
    const today = new Date().toISOString().split('T')[0];
    const yesterdaySummary: DailySummary = {
      id: 1,
      userId: 1,
      date: today,
      summary: "Productive day focusing on authentication improvements and dark mode implementation. Fixed critical login bug affecting users with special characters in passwords. Successfully merged dark theme feature after comprehensive testing.",
      tasksCompleted: 3,
      meetingsAttended: 2,
      codeCommits: 2,
      blockers: null,
      metadata: { mood: "productive", focus_areas: ["authentication", "ui"] },
      createdAt: new Date()
    };

    this.dailySummaries.set(1, yesterdaySummary);
    this.currentSummaryId = 2;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Integration operations
  async getUserIntegrations(userId: number): Promise<Integration[]> {
    return Array.from(this.integrations.values()).filter(
      (integration) => integration.userId === userId
    );
  }

  async getIntegrationByProvider(userId: number, provider: string): Promise<Integration | undefined> {
    return Array.from(this.integrations.values()).find(
      (integration) => integration.userId === userId && integration.provider === provider
    );
  }

  async createIntegration(insertIntegration: InsertIntegration): Promise<Integration> {
    const id = this.currentIntegrationId++;
    const now = new Date();
    const integration: Integration = {
      ...insertIntegration,
      id,
      isConnected: insertIntegration.isConnected ?? false,
      accessToken: insertIntegration.accessToken ?? null,
      refreshToken: insertIntegration.refreshToken ?? null,
      tokenExpiresAt: insertIntegration.tokenExpiresAt ?? null,
      providerUserId: insertIntegration.providerUserId ?? null,
      providerUsername: insertIntegration.providerUsername ?? null,
      metadata: insertIntegration.metadata ?? null,
      lastSyncAt: insertIntegration.lastSyncAt ?? null,
      createdAt: now,
      updatedAt: now
    };
    this.integrations.set(id, integration);
    return integration;
  }

  async updateIntegration(id: number, updates: Partial<Integration>): Promise<Integration> {
    const existing = this.integrations.get(id);
    if (!existing) {
      throw new Error(`Integration with id ${id} not found`);
    }
    
    const updated: Integration = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    this.integrations.set(id, updated);
    return updated;
  }

  async deleteIntegration(id: number): Promise<void> {
    this.integrations.delete(id);
    // Also delete related work activities
    Array.from(this.workActivities.entries()).forEach(([activityId, activity]) => {
      if (activity.integrationId === id) {
        this.workActivities.delete(activityId);
      }
    });
  }

  // Work activity operations
  async createWorkActivity(insertActivity: InsertWorkActivity): Promise<WorkActivity> {
    const id = this.currentActivityId++;
    const activity: WorkActivity = {
      ...insertActivity,
      id,
      description: insertActivity.description ?? null,
      metadata: insertActivity.metadata ?? null,
      createdAt: new Date()
    };
    this.workActivities.set(id, activity);
    return activity;
  }

  async getUserWorkActivities(userId: number, limit = 50): Promise<WorkActivity[]> {
    const activities = Array.from(this.workActivities.values())
      .filter((activity) => activity.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
    return activities;
  }

  async getWorkActivitiesByDateRange(userId: number, startDate: Date, endDate: Date): Promise<WorkActivity[]> {
    return Array.from(this.workActivities.values())
      .filter((activity) => 
        activity.userId === userId &&
        activity.timestamp >= startDate &&
        activity.timestamp <= endDate
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Daily summary operations
  async createDailySummary(insertSummary: InsertDailySummary): Promise<DailySummary> {
    const id = this.currentSummaryId++;
    const summary: DailySummary = {
      ...insertSummary,
      id,
      tasksCompleted: insertSummary.tasksCompleted ?? 0,
      meetingsAttended: insertSummary.meetingsAttended ?? 0,
      codeCommits: insertSummary.codeCommits ?? 0,
      blockers: insertSummary.blockers ?? null,
      metadata: insertSummary.metadata ?? null,
      createdAt: new Date()
    };
    this.dailySummaries.set(id, summary);
    return summary;
  }

  async getDailySummary(userId: number, date: string): Promise<DailySummary | undefined> {
    return Array.from(this.dailySummaries.values()).find(
      (summary) => summary.userId === userId && summary.date === date
    );
  }

  async getUserDailySummaries(userId: number, limit = 30): Promise<DailySummary[]> {
    return Array.from(this.dailySummaries.values())
      .filter((summary) => summary.userId === userId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit);
  }
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Integration operations
  async getUserIntegrations(userId: number): Promise<Integration[]> {
    return await db.select().from(integrations).where(eq(integrations.userId, userId));
  }

  async getIntegrationByProvider(userId: number, provider: string): Promise<Integration | undefined> {
    const [integration] = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.userId, userId), eq(integrations.provider, provider)));
    return integration || undefined;
  }

  async createIntegration(insertIntegration: InsertIntegration): Promise<Integration> {
    const [integration] = await db
      .insert(integrations)
      .values(insertIntegration)
      .returning();
    return integration;
  }

  async updateIntegration(id: number, updates: Partial<Integration>): Promise<Integration> {
    const [integration] = await db
      .update(integrations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(integrations.id, id))
      .returning();
    return integration;
  }

  async deleteIntegration(id: number): Promise<void> {
    await db.delete(integrations).where(eq(integrations.id, id));
  }

  // Work activity operations
  async createWorkActivity(insertActivity: InsertWorkActivity): Promise<WorkActivity> {
    const [activity] = await db
      .insert(workActivities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async getUserWorkActivities(userId: number, limit = 50): Promise<WorkActivity[]> {
    return await db
      .select()
      .from(workActivities)
      .where(eq(workActivities.userId, userId))
      .orderBy(desc(workActivities.timestamp))
      .limit(limit);
  }

  async getWorkActivitiesByDateRange(userId: number, startDate: Date, endDate: Date): Promise<WorkActivity[]> {
    return await db
      .select()
      .from(workActivities)
      .where(
        and(
          eq(workActivities.userId, userId),
          gte(workActivities.timestamp, startDate),
          lte(workActivities.timestamp, endDate)
        )
      )
      .orderBy(desc(workActivities.timestamp));
  }

  // Daily summary operations
  async createDailySummary(insertSummary: InsertDailySummary): Promise<DailySummary> {
    const [summary] = await db
      .insert(dailySummaries)
      .values(insertSummary)
      .returning();
    return summary;
  }

  async getDailySummary(userId: number, date: string): Promise<DailySummary | undefined> {
    const [summary] = await db
      .select()
      .from(dailySummaries)
      .where(and(eq(dailySummaries.userId, userId), eq(dailySummaries.date, date)));
    return summary || undefined;
  }

  async getUserDailySummaries(userId: number, limit = 30): Promise<DailySummary[]> {
    return await db
      .select()
      .from(dailySummaries)
      .where(eq(dailySummaries.userId, userId))
      .orderBy(desc(dailySummaries.date))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
