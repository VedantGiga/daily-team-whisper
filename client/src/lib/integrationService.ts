import type { Integration, InsertIntegration, WorkActivity, DailySummary } from "@shared/schema";

const API_BASE = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api';

export class IntegrationService {
  static async getUserIntegrations(userId: number): Promise<Integration[]> {
    const response = await fetch(`${API_BASE}/integrations?userId=${userId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch integrations");
    }
    return response.json();
  }

  static async createIntegration(integration: InsertIntegration): Promise<Integration> {
    const response = await fetch(`${API_BASE}/integrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(integration),
    });
    if (!response.ok) {
      throw new Error("Failed to create integration");
    }
    return response.json();
  }

  static async updateIntegration(id: number, updates: Partial<Integration>): Promise<Integration> {
    const response = await fetch(`${API_BASE}/integrations/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error("Failed to update integration");
    }
    return response.json();
  }

  static async deleteIntegration(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/integrations/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete integration");
    }
  }

  static async connectGitHub(userId: number): Promise<{ authUrl: string }> {
    const response = await fetch(`${API_BASE}/integrations/github/connect?userId=${userId}`);
    if (!response.ok) {
      throw new Error("Failed to get GitHub auth URL");
    }
    return response.json();
  }

  static async connectGoogleCalendar(userId: number): Promise<{ authUrl: string }> {
    const response = await fetch(`${API_BASE}/integrations/google-calendar/connect?userId=${userId}`);
    if (!response.ok) {
      throw new Error("Failed to get Google Calendar auth URL");
    }
    return response.json();
  }

  static async syncIntegration(id: number): Promise<{ success: boolean; lastSyncAt: Date }> {
    const response = await fetch(`${API_BASE}/integrations/${id}/sync`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error("Failed to sync integration");
    }
    return response.json();
  }

  static async getUserActivities(userId: number, limit = 50): Promise<WorkActivity[]> {
    const response = await fetch(`${API_BASE}/activities?userId=${userId}&limit=${limit}`);
    if (!response.ok) {
      throw new Error("Failed to fetch activities");
    }
    return response.json();
  }

  static async getActivitiesByDateRange(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<WorkActivity[]> {
    const start = startDate.toISOString();
    const end = endDate.toISOString();
    const response = await fetch(
      `${API_BASE}/activities/range?userId=${userId}&startDate=${start}&endDate=${end}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch activities by date range");
    }
    return response.json();
  }

  static async getUserSummaries(userId: number, limit = 30): Promise<DailySummary[]> {
    const response = await fetch(`${API_BASE}/summaries?userId=${userId}&limit=${limit}`);
    if (!response.ok) {
      throw new Error("Failed to fetch summaries");
    }
    return response.json();
  }

  static async getDailySummary(userId: number, date: string): Promise<DailySummary | null> {
    const response = await fetch(`${API_BASE}/summaries/${date}?userId=${userId}`);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error("Failed to fetch daily summary");
    }
    return response.json();
  }
}

export const INTEGRATION_PROVIDERS = {
  github: {
    name: "GitHub",
    description: "Connect your GitHub repositories to track commits, pull requests, and code reviews",
    color: "bg-gray-900",
    icon: "🐙",
  },
  slack: {
    name: "Slack",
    description: "Track your messages, mentions, and channel activity",
    color: "bg-purple-600",
    icon: "💬",
  },
  google_calendar: {
    name: "Google Calendar",
    description: "Monitor your meetings, events, and scheduled time blocks",
    color: "bg-blue-600",
    icon: "📅",
  },
  jira: {
    name: "Jira",
    description: "Track tasks, story points, and sprint progress",
    color: "bg-blue-700",
    icon: "📋",
  },
  notion: {
    name: "Notion",
    description: "Monitor page updates, database changes, and documentation work",
    color: "bg-gray-800",
    icon: "📝",
  },
} as const;

export type ProviderKey = keyof typeof INTEGRATION_PROVIDERS;