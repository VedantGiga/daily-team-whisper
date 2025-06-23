import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  static async sendDailySummary(userEmail: string, summary: string, date: string): Promise<any> {
    console.log(`Attempting to send email to ${userEmail} for date ${date}`);
    
    if (!process.env.RESEND_API_KEY) {
      console.log('Resend API key not configured, skipping email');
      return;
    }
    
    console.log(`Using Resend API key: ${process.env.RESEND_API_KEY.substring(0, 5)}...`);

    try {
      const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const htmlContent = this.formatSummaryAsHTML(summary, formattedDate);
      console.log('HTML content generated successfully');

      console.log('Sending email via Resend API...');
      const response = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: [userEmail],
        subject: `Daily Brief - ${formattedDate}`,
        html: htmlContent,
      });
      
      console.log('Resend API response:', JSON.stringify(response));
      console.log(`Daily summary email sent to ${userEmail}`);
      
      return response;
    } catch (error) {
      console.error('Error sending email:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.log('Daily summary (email failed):', summary.substring(0, 100) + '...');
    }
  }

  private static formatSummaryAsHTML(summary: string, date: string): string {
    const htmlSummary = summary
      .replace(/^# (.*$)/gm, '<h1 style="color: #7c3aed; font-size: 28px; font-weight: bold; margin: 25px 0 15px 0; border-bottom: 3px solid #7c3aed; padding-bottom: 12px;">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 style="color: #374151; font-size: 20px; font-weight: 600; margin: 24px 0 12px 0; padding: 10px 0 10px 15px; border-left: 5px solid #7c3aed; background: #f8fafc;">$1</h2>')
      .replace(/^\*\*(.*?)\*\*/gm, '<strong style="font-weight: 700; color: #1f2937; font-size: 16px;">$1</strong>')
      .replace(/^   • (.*$)/gm, '<div style="margin: 10px 0 10px 30px; color: #4b5563; font-size: 15px; line-height: 1.7; padding: 6px 0; border-left: 2px solid #e5e7eb; padding-left: 12px;">• $1</div>')
      .replace(/✅/g, '<span style="color: #10b981; font-size: 18px; margin-right: 8px;">✅</span>')
      .replace(/⚠️/g, '<span style="color: #f59e0b; font-size: 18px; margin-right: 8px;">⚠️</span>')
      .replace(/📝/g, '<span style="color: #3b82f6; font-size: 18px; margin-right: 8px;">📝</span>')
      .replace(/📅/g, '<span style="color: #8b5cf6; font-size: 18px; margin-right: 8px;">📅</span>')
      .replace(/🚀/g, '<span style="color: #ef4444; font-size: 18px; margin-right: 8px;">🚀</span>')
      .replace(/🔧/g, '<span style="color: #6b7280; font-size: 18px; margin-right: 8px;">🔧</span>')
      .replace(/🎯/g, '<span style="color: #f97316; font-size: 18px; margin-right: 8px;">🎯</span>')
      .replace(/💬/g, '<span style="color: #a855f7; font-size: 18px; margin-right: 8px;">💬</span>')
      .replace(/📊/g, '<span style="color: #06b6d4; font-size: 18px; margin-right: 8px;">📊</span>')
      .replace(/\n/g, '<br/>');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily Brief - ${date}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">📊 AutoBrief</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your Daily Work Summary</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%); padding: 35px; border-radius: 15px; border: 1px solid #e5e7eb; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);">
          ${htmlSummary}
        </div>
        
        <div style="margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; border-left: 5px solid #3b82f6;">
          <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px; font-weight: 700;">💡 Productivity Insights</h3>
          <p style="margin: 0; color: #1f2937; font-size: 15px; line-height: 1.6;">This detailed summary was automatically generated from your connected integrations. Your productivity data helps you stay on track with your goals!</p>
        </div>
        
        <div style="margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            Generated automatically by AutoBrief<br/>
            <a href="#" style="color: #7c3aed; text-decoration: none;">View in Dashboard</a>
          </p>
        </div>
      </body>
      </html>
    `;
  }
}