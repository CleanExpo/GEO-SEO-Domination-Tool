/**
 * Weekly Report Email Template
 */

import { WeeklyReportNotification, ScheduledReportNotification, EmailTemplate } from '../notification-types';

export function generateWeeklyReportTemplate(
  notification: WeeklyReportNotification | ScheduledReportNotification,
  unsubscribeUrl?: string
): EmailTemplate {
  const { data, recipientName } = notification;
  const { companyName, reportPeriod, reportUrl } = data;

  // Handle optional fields that may not exist in ScheduledReportNotification
  const metrics = 'metrics' in data && data.metrics && typeof data.metrics === 'object' && 'rankingImprovements' in data.metrics
    ? data.metrics as any
    : { rankingImprovements: 0, rankingDecreases: 0, totalKeywords: 0, averagePosition: 0, topKeywords: [] };

  const audits = 'audits' in data && data.audits
    ? data.audits
    : { total: 0, criticalIssues: 0, improvements: 0 };

  const competitors = 'competitors' in data && data.competitors
    ? data.competitors
    : { total: 0, gainedPositions: 0, lostPositions: 0 };

  const rankingTrend = metrics.rankingImprovements > metrics.rankingDecreases ? 'up' : 'down';
  const trendColor = rankingTrend === 'up' ? '#10b981' : '#ef4444';

  const subject = `Weekly SEO Report for ${companyName} - ${reportPeriod.start} to ${reportPeriod.end}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1f2937;
      margin: 0 0 10px 0;
      font-size: 24px;
    }
    .period {
      color: #6b7280;
      font-size: 14px;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 20px 0;
    }
    .metric-card {
      background: #f9fafb;
      padding: 20px;
      border-radius: 6px;
      border-left: 4px solid #2563eb;
    }
    .metric-label {
      color: #6b7280;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .metric-value {
      font-size: 28px;
      font-weight: bold;
      color: #1f2937;
    }
    .metric-change {
      font-size: 14px;
      margin-top: 5px;
    }
    .positive {
      color: #10b981;
    }
    .negative {
      color: #ef4444;
    }
    .section {
      margin: 30px 0;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    .keyword-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .keyword-item {
      background: #f9fafb;
      padding: 12px 15px;
      margin-bottom: 8px;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .keyword-name {
      font-weight: 500;
      color: #1f2937;
    }
    .keyword-stats {
      display: flex;
      gap: 15px;
      font-size: 14px;
    }
    .position {
      background: #2563eb;
      color: white;
      padding: 4px 10px;
      border-radius: 12px;
      font-weight: 600;
    }
    .cta-button {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    .unsubscribe {
      color: #6b7280;
      text-decoration: none;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Weekly SEO Report</h1>
      <div class="period">${reportPeriod.start} - ${reportPeriod.end}</div>
      <div style="font-size: 16px; color: #1f2937; margin-top: 10px; font-weight: 600;">${companyName}</div>
    </div>

    ${recipientName ? `<p>Hi ${recipientName},</p>` : ''}

    <p>Here's your weekly SEO performance summary:</p>

    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-label">Total Keywords</div>
        <div class="metric-value">${metrics.totalKeywords}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Avg Position</div>
        <div class="metric-value">${metrics.averagePosition.toFixed(1)}</div>
      </div>
    </div>

    <div class="metric-grid">
      <div class="metric-card" style="border-left-color: #10b981;">
        <div class="metric-label">Improvements</div>
        <div class="metric-value positive">${metrics.rankingImprovements}</div>
      </div>
      <div class="metric-card" style="border-left-color: #ef4444;">
        <div class="metric-label">Decreases</div>
        <div class="metric-value negative">${metrics.rankingDecreases}</div>
      </div>
    </div>

    ${metrics.topKeywords.length > 0 ? `
    <div class="section">
      <div class="section-title">Top Performing Keywords</div>
      <ul class="keyword-list">
        ${metrics.topKeywords.map(kw => `
          <li class="keyword-item">
            <span class="keyword-name">${kw.keyword}</span>
            <div class="keyword-stats">
              <span class="position">#${kw.position}</span>
              <span class="${kw.change > 0 ? 'positive' : kw.change < 0 ? 'negative' : ''}">${kw.change > 0 ? '+' : ''}${kw.change}</span>
            </div>
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Audits & Competitors</div>
      <p><strong>Total Audits:</strong> ${audits.total} | <strong>Critical Issues:</strong> <span style="color: #ef4444;">${audits.criticalIssues}</span></p>
      <p><strong>Competitor Positions:</strong> Gained ${competitors.gainedPositions} | Lost ${competitors.lostPositions}</p>
    </div>

    ${reportUrl ? `
    <div style="text-align: center;">
      <a href="${reportUrl}" class="cta-button">View Full Report</a>
    </div>
    ` : ''}

    <div class="footer">
      <p>GEO-SEO Domination Tool - Your Local SEO Command Center</p>
      ${unsubscribeUrl ? `<p><a href="${unsubscribeUrl}" class="unsubscribe">Unsubscribe from weekly reports</a></p>` : ''}
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Weekly SEO Report for ${companyName}
${reportPeriod.start} - ${reportPeriod.end}

${recipientName ? `Hi ${recipientName},\n\n` : ''}
Here's your weekly SEO performance summary:

OVERVIEW:
- Total Keywords: ${metrics.totalKeywords}
- Average Position: ${metrics.averagePosition.toFixed(1)}
- Ranking Improvements: ${metrics.rankingImprovements}
- Ranking Decreases: ${metrics.rankingDecreases}

TOP PERFORMING KEYWORDS:
${metrics.topKeywords.map(kw => `- ${kw.keyword}: Position #${kw.position} (${kw.change > 0 ? '+' : ''}${kw.change})`).join('\n')}

AUDITS & COMPETITORS:
- Total Audits: ${audits.total}
- Critical Issues: ${audits.criticalIssues}
- Competitor Positions Gained: ${competitors.gainedPositions}
- Competitor Positions Lost: ${competitors.lostPositions}

${reportUrl ? `View Full Report: ${reportUrl}\n\n` : ''}
---
GEO-SEO Domination Tool
${unsubscribeUrl ? `Unsubscribe: ${unsubscribeUrl}` : ''}
  `.trim();

  return { subject, html, text };
}
