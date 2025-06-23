import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  displayName: text("display_name"),
  bio: text("bio"),
  location: text("location"),
  timezone: text("timezone").default("UTC"),
  profilePhotoUrl: text("profile_photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  provider: text("provider").notNull(), // 'github', 'slack', 'google', 'jira', 'notion'
  isConnected: boolean("is_connected").default(false).notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  providerUserId: text("provider_user_id"),
  providerUsername: text("provider_username"),
  metadata: json("metadata"), // Additional provider-specific data
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workActivities = pgTable("work_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  integrationId: integer("integration_id").notNull(),
  provider: text("provider").notNull(),
  activityType: text("activity_type").notNull(), // 'commit', 'pr', 'meeting', 'message', 'task'
  title: text("title").notNull(),
  description: text("description"),
  externalId: text("external_id").notNull(), // ID from the external service
  metadata: json("metadata"), // Raw data from the service
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dailySummaries = pgTable("daily_summaries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  summary: text("summary").notNull(),
  tasksCompleted: integer("tasks_completed").default(0).notNull(),
  meetingsAttended: integer("meetings_attended").default(0).notNull(),
  codeCommits: integer("code_commits").default(0).notNull(),
  blockers: text("blockers"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles),
  integrations: many(integrations),
  workActivities: many(workActivities),
  dailySummaries: many(dailySummaries),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const integrationsRelations = relations(integrations, ({ one, many }) => ({
  user: one(users, {
    fields: [integrations.userId],
    references: [users.id],
  }),
  workActivities: many(workActivities),
}));

export const workActivitiesRelations = relations(workActivities, ({ one }) => ({
  user: one(users, {
    fields: [workActivities.userId],
    references: [users.id],
  }),
  integration: one(integrations, {
    fields: [workActivities.integrationId],
    references: [integrations.id],
  }),
}));

export const dailySummariesRelations = relations(dailySummaries, ({ one }) => ({
  user: one(users, {
    fields: [dailySummaries.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkActivitySchema = createInsertSchema(workActivities).omit({
  id: true,
  createdAt: true,
});

export const insertDailySummarySchema = createInsertSchema(dailySummaries).omit({
  id: true,
  createdAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type WorkActivity = typeof workActivities.$inferSelect;
export type InsertWorkActivity = z.infer<typeof insertWorkActivitySchema>;
export type DailySummary = typeof dailySummaries.$inferSelect;
export type InsertDailySummary = z.infer<typeof insertDailySummarySchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
