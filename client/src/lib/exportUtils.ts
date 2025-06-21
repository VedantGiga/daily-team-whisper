// Export utilities for summaries and activities
export const exportToPDF = async (data: any[], title: string) => {
  const content = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
          h1 { color: #7c3aed; border-bottom: 3px solid #7c3aed; padding-bottom: 15px; font-size: 28px; }
          h2 { color: #374151; font-size: 20px; margin-top: 30px; border-left: 4px solid #7c3aed; padding-left: 12px; }
          .item { margin: 30px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9fafb; }
          .date { font-weight: bold; color: #7c3aed; font-size: 16px; }
          .summary { margin: 15px 0; line-height: 1.8; white-space: pre-line; }
          .stats { display: flex; gap: 20px; margin-top: 15px; }
          .stat { text-align: center; padding: 10px; background: white; border-radius: 8px; }
          .stat-number { font-size: 24px; font-weight: bold; color: #7c3aed; }
          .stat-label { font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <h1>📊 ${title}</h1>
        <p style="color: #6b7280; margin-bottom: 40px;">Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        ${data.map(item => `
          <div class="item">
            <div class="date">${new Date(item.date || item.timestamp).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div class="summary">${(item.summary || item.title || '').replace(/\n/g, '<br>')}</div>
            ${item.tasksCompleted !== undefined ? `
              <div class="stats">
                <div class="stat">
                  <div class="stat-number">${item.tasksCompleted || 0}</div>
                  <div class="stat-label">Tasks</div>
                </div>
                <div class="stat">
                  <div class="stat-number">${item.meetingsAttended || 0}</div>
                  <div class="stat-label">Meetings</div>
                </div>
                <div class="stat">
                  <div class="stat-number">${item.codeCommits || 0}</div>
                  <div class="stat-label">Commits</div>
                </div>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </body>
    </html>
  `;
  
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.html`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportToMarkdown = (data: any[], title: string) => {
  let markdown = `# 📊 ${title}\n\n`;
  markdown += `*Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}*\n\n`;
  
  data.forEach(item => {
    const date = new Date(item.date || item.timestamp).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    markdown += `## ${date}\n\n`;
    markdown += `${item.summary || item.title || ''}\n\n`;
    
    if (item.tasksCompleted !== undefined) {
      markdown += `**Stats:**\n`;
      markdown += `- ✅ Tasks: ${item.tasksCompleted || 0}\n`;
      markdown += `- 📝 Meetings: ${item.meetingsAttended || 0}\n`;
      markdown += `- 🔧 Commits: ${item.codeCommits || 0}\n\n`;
    }
    
    markdown += `---\n\n`;
  });
  
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.md`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(item => 
    Object.values(item).map(value => 
      typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
    ).join(',')
  );
  
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};