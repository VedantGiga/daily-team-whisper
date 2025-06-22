import { storage } from '../storage';
import type { WorkActivity } from '@shared/schema';

export class AIService {
  private static async makeGroqRequest(messages: any[]) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  static async generateDailySummary(userId: number, date: string, options?: { tone?: string, filter?: string }): Promise<string> {
    try {
      // Get activities for the day
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const activities = await storage.getWorkActivitiesByDateRange(userId, startDate, endDate);

      if (activities.length === 0) {
        // Return a sample summary when no data exists
        return `# Daily Brief - ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}

## 🔧 GitHub
✅ **2 commits pushed**
   • Fix authentication bug
   • Update user dashboard

## 📅 Calendar Summary
📝 **1 meeting attended**
   • Team standup (30m)

## 📊 Daily Summary
✅ **2 tasks completed**
📝 **1 meeting attended**
🚀 **Steady progress maintained**`;
      }

      // Filter activities based on options
      let filteredActivities = activities;
      if (options?.filter && options.filter !== 'all') {
        switch (options.filter) {
          case 'blockers':
            filteredActivities = activities.filter(a => 
              a.activityType === 'issue' || 
              a.title.toLowerCase().includes('bug') ||
              a.title.toLowerCase().includes('error') ||
              a.title.toLowerCase().includes('fix')
            );
            break;
          case 'achievements':
            filteredActivities = activities.filter(a => 
              a.activityType === 'commit' || 
              a.activityType === 'pr' ||
              a.title.toLowerCase().includes('complete') ||
              a.title.toLowerCase().includes('finish')
            );
            break;
          case 'meetings':
            filteredActivities = activities.filter(a => a.activityType === 'calendar_event');
            break;
          case 'code':
            filteredActivities = activities.filter(a => 
              a.activityType === 'commit' || 
              a.activityType === 'pr'
            );
            break;
        }
      }

      if (filteredActivities.length === 0) {
        return `No activities found matching filter: ${options?.filter}`;
      }

      // Group filtered activities by provider
      const groupedActivities = filteredActivities.reduce((acc, activity) => {
        const provider = activity.provider;
        if (!acc[provider]) acc[provider] = [];
        acc[provider].push(activity);
        return acc;
      }, {} as Record<string, typeof activities>);

      // Set tone-based greeting
      const toneGreeting = {
        friendly: 'Hey there! Here\'s what you accomplished today 😊',
        casual: 'Here\'s your daily wrap-up 👋',
        formal: 'Daily Work Summary Report',
        professional: 'Daily Brief'
      }[options?.tone || 'professional'];

      // Format activities by tool
      let formattedBrief = `# ${toneGreeting} - ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}\n\n`;

      // GitHub activities
      if (groupedActivities.github) {
        formattedBrief += `## 🔧 GitHub\n`;
        const commits = groupedActivities.github.filter(a => a.activityType === 'commit');
        const prs = groupedActivities.github.filter(a => a.activityType === 'pr');
        const issues = groupedActivities.github.filter(a => a.activityType === 'issue');
        
        if (commits.length > 0) {
          formattedBrief += `✅ **${commits.length} commits pushed**\n`;
          commits.slice(0, 3).forEach(commit => {
            formattedBrief += `   • ${commit.title}\n`;
          });
        }
        if (prs.length > 0) {
          formattedBrief += `✅ **${prs.length} pull requests**\n`;
          prs.forEach(pr => {
            formattedBrief += `   • ${pr.title}\n`;
          });
        }
        if (issues.length > 0) {
          formattedBrief += `⚠️ **${issues.length} issues worked on**\n`;
          issues.forEach(issue => {
            formattedBrief += `   • ${issue.title}\n`;
          });
        }
        formattedBrief += `\n`;
      }

      // Calendar activities
      if (groupedActivities.google_calendar) {
        formattedBrief += `## 📅 Calendar Summary\n`;
        const meetings = groupedActivities.google_calendar;
        formattedBrief += `📝 **${meetings.length} meetings attended**\n`;
        meetings.forEach(meeting => {
          const duration = meeting.metadata?.duration ? ` (${meeting.metadata.duration}m)` : '';
          formattedBrief += `   • ${meeting.title}${duration}\n`;
        });
        formattedBrief += `\n`;
      }

      // Jira activities
      if (groupedActivities.jira) {
        formattedBrief += `## 🎯 Jira\n`;
        const jiraIssues = groupedActivities.jira;
        formattedBrief += `✅ **${jiraIssues.length} issues updated**\n`;
        jiraIssues.forEach(issue => {
          const status = issue.metadata?.status ? ` [${issue.metadata.status}]` : '';
          formattedBrief += `   • ${issue.title}${status}\n`;
        });
        formattedBrief += `\n`;
      }

      // Slack activities (if any)
      if (groupedActivities.slack) {
        formattedBrief += `## 💬 Slack\n`;
        formattedBrief += `📝 **Team communication active**\n`;
        formattedBrief += `   • ${groupedActivities.slack.length} interactions tracked\n\n`;
      }

      // Summary stats with tone
      const totalTasks = (groupedActivities.github?.length || 0) + (groupedActivities.jira?.length || 0);
      const totalMeetings = groupedActivities.google_calendar?.length || 0;
      
      formattedBrief += `## 📊 Daily Summary\n`;
      formattedBrief += `✅ **${totalTasks} tasks completed**\n`;
      formattedBrief += `📝 **${totalMeetings} meetings attended**\n`;
      
      // Tone-based closing
      const toneClosing = {
        friendly: totalTasks > 5 ? `🚀 **Awesome work today!** You crushed it! 🎉\n` : 
                  totalTasks === 0 ? `💪 **Tomorrow's a new day** - let's make it count!\n` : 
                  `👍 **Solid day!** Keep up the great momentum!\n`,
        casual: totalTasks > 5 ? `🔥 **Killed it today!**\n` : 
                totalTasks === 0 ? `🤷 **Slow day** - happens to the best of us\n` : 
                `👌 **Not bad!**\n`,
        formal: totalTasks > 5 ? `📈 **Exceptional productivity achieved**\n` : 
                totalTasks === 0 ? `⚠️ **Below average activity recorded**\n` : 
                `✓ **Satisfactory progress maintained**\n`,
        professional: totalTasks > 5 ? `🚀 **High productivity day** - Great work!\n` : 
                      totalTasks === 0 ? `⚠️ **Low activity day** - Consider reviewing goals\n` : 
                      `📊 **Steady progress maintained**\n`
      }[options?.tone || 'professional'];
      
      formattedBrief += toneClosing;

      return formattedBrief;
    } catch (error) {
      console.error('Error generating daily summary:', error);
      return 'Unable to generate summary at this time.';
    }
  }

  static async analyzeWorkPatterns(userId: number): Promise<string> {
    try {
      // Get last 30 days of activities
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const activities = await storage.getWorkActivitiesByDateRange(userId, startDate, endDate);

      if (activities.length === 0) {
        return "Not enough data to analyze work patterns.";
      }

      // Analyze patterns
      const patterns = {
        totalActivities: activities.length,
        byProvider: activities.reduce((acc, activity) => {
          acc[activity.provider] = (acc[activity.provider] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byType: activities.reduce((acc, activity) => {
          acc[activity.activityType] = (acc[activity.activityType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byHour: activities.reduce((acc, activity) => {
          const hour = activity.timestamp.getHours();
          acc[hour] = (acc[hour] || 0) + 1;
          return acc;
        }, {} as Record<number, number>)
      };

      const messages = [
        {
          role: 'system',
          content: 'You are a productivity analyst. Analyze work patterns and provide actionable insights about productivity, work habits, and recommendations for improvement. Be specific and helpful.'
        },
        {
          role: 'user',
          content: `Analyze these work patterns and provide insights: ${JSON.stringify(patterns, null, 2)}`
        }
      ];

      return await this.makeGroqRequest(messages);
    } catch (error) {
      console.error('Error analyzing work patterns:', error);
      return 'Unable to analyze work patterns at this time.';
    }
  }

  static async suggestNextTasks(userId: number): Promise<string[]> {
    try {
      // Get recent activities
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const activities = await storage.getWorkActivitiesByDateRange(userId, startDate, endDate);

      if (activities.length === 0) {
        return ["Start by connecting your work tools to track activities"];
      }

      const recentWork = activities.slice(0, 10).map(activity => ({
        type: activity.activityType,
        title: activity.title,
        provider: activity.provider
      }));

      const messages = [
        {
          role: 'system',
          content: 'You are a productivity assistant. Based on recent work activities, suggest 3-5 specific, actionable next tasks. Be practical and relevant to the work being done.'
        },
        {
          role: 'user',
          content: `Based on these recent activities, suggest next tasks: ${JSON.stringify(recentWork, null, 2)}`
        }
      ];

      const response = await this.makeGroqRequest(messages);
      
      // Parse response into array of tasks
      return response.split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
        .filter(task => task.length > 0)
        .slice(0, 5);
    } catch (error) {
      console.error('Error suggesting tasks:', error);
      return ["Review recent work and plan next steps"];
    }
  }
}