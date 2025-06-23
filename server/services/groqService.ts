import Groq from 'groq-sdk';

class GroqService {
  private groq: Groq;

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  async generateSmartSummary(activities: any[], userContext: any = {}) {
    // Limit and summarize activities to reduce token usage
    const recentActivities = activities.slice(0, 20).map(a => ({
      type: a.activityType,
      title: a.title?.substring(0, 100),
      provider: a.provider,
      timestamp: new Date(a.timestamp).toLocaleDateString()
    }));

    const prompt = `
Analyze these developer activities and create a daily summary:

Activities (${recentActivities.length} items):
${JSON.stringify(recentActivities)}

User: ${userContext.name || 'Developer'}
Date: ${new Date().toLocaleDateString()}

Create a summary with:
🎯 Key Accomplishments
📊 Activity Breakdown
⚡ Productivity Insights
🚀 Tomorrow's Focus
⚠️ Blockers & Concerns

Keep it concise and professional.
`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192',
        temperature: 0.7,
        max_tokens: 800,
      });

      return completion.choices[0]?.message?.content || 'Unable to generate summary';
    } catch (error) {
      console.error('Groq API error:', error);
      return 'Error generating AI summary. Please try again.';
    }
  }

  async generateStandupReport(activities: any[], userContext: any = {}) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayActivities = activities
      .filter(a => new Date(a.timestamp).toDateString() === yesterday.toDateString())
      .slice(0, 10)
      .map(a => ({
        type: a.activityType,
        title: a.title?.substring(0, 80),
        provider: a.provider
      }));

    const recentActivities = activities.slice(0, 15).map(a => ({
      type: a.activityType,
      title: a.title?.substring(0, 60),
      provider: a.provider,
      date: new Date(a.timestamp).toLocaleDateString()
    }));

    const prompt = `
Generate a standup report:

Yesterday's work:
${JSON.stringify(yesterdayActivities)}

Recent context:
${JSON.stringify(recentActivities)}

Format:
**Yesterday I worked on:**
**Today I plan to:**
**Blockers/Help needed:**

Keep it concise and professional.
`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192',
        temperature: 0.6,
        max_tokens: 600,
      });

      return completion.choices[0]?.message?.content || 'Unable to generate standup report';
    } catch (error) {
      console.error('Groq API error:', error);
      return 'Error generating standup report. Please try again.';
    }
  }

  async chatWithData(query: string, activities: any[], userContext: any = {}) {
    // Limit activities for chat to prevent token overflow
    const limitedActivities = activities.slice(0, 30).map(a => ({
      type: a.activityType,
      title: a.title?.substring(0, 100),
      provider: a.provider,
      date: new Date(a.timestamp).toLocaleDateString()
    }));

    const prompt = `
Answer this question about the developer's work data:

Question: "${query}"

Activities (${limitedActivities.length} recent items):
${JSON.stringify(limitedActivities)}

User: ${userContext.name || 'Developer'}
Date: ${new Date().toLocaleDateString()}

Provide a direct, helpful answer with specific data and insights.
`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192',
        temperature: 0.5,
        max_tokens: 500,
      });

      return completion.choices[0]?.message?.content || 'I could not process your question. Please try rephrasing it.';
    } catch (error) {
      console.error('Groq API error:', error);
      return 'Sorry, I encountered an error processing your question. Please try again.';
    }
  }

  async analyzeProductivity(activities: any[], timeframe: string = 'week') {
    const analysisData = activities.slice(0, 50).map(a => ({
      type: a.activityType,
      provider: a.provider,
      date: new Date(a.timestamp).toLocaleDateString(),
      hour: new Date(a.timestamp).getHours()
    }));

    const prompt = `
Analyze productivity patterns:

Data (${analysisData.length} activities, ${timeframe}):
${JSON.stringify(analysisData)}

Provide:
1. Productivity Patterns
2. Work Distribution
3. Efficiency Insights
4. Recommendations
5. Strengths
6. Areas for Improvement

Be specific with actionable recommendations.
`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192',
        temperature: 0.6,
        max_tokens: 700,
      });

      return completion.choices[0]?.message?.content || 'Unable to analyze productivity';
    } catch (error) {
      console.error('Groq API error:', error);
      return 'Error analyzing productivity. Please try again.';
    }
  }

  async generateWeeklyReport(activities: any[], userContext: any = {}) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyActivities = activities
      .filter(a => new Date(a.timestamp) >= oneWeekAgo)
      .slice(0, 40)
      .map(a => ({
        type: a.activityType,
        title: a.title?.substring(0, 80),
        provider: a.provider,
        date: new Date(a.timestamp).toLocaleDateString()
      }));

    const prompt = `
Generate a weekly report:

Week's Activities (${weeklyActivities.length} items):
${JSON.stringify(weeklyActivities)}

User: ${userContext.name || 'Developer'}

Include:
📈 Week Overview
💻 Development Work
🤝 Collaboration
📊 Productivity Metrics
🎯 Goals & Progress
📋 Next Week's Focus

Make it professional for managers/1:1 meetings.
`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192',
        temperature: 0.7,
        max_tokens: 800,
      });

      return completion.choices[0]?.message?.content || 'Unable to generate weekly report';
    } catch (error) {
      console.error('Groq API error:', error);
      return 'Error generating weekly report. Please try again.';
    }
  }
}

export const groqService = new GroqService();