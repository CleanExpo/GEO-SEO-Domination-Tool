/**
 * Ranking Alert Email Template
 */

import { RankingAlertNotification, KeywordRankingChangeNotification, EmailTemplate } from '../notification-types';

export function generateRankingAlertTemplate(
  notification: RankingAlertNotification | KeywordRankingChangeNotification,
  unsubscribeUrl?: string
): EmailTemplate {
  const { data, recipientName } = notification;
  const { companyName, keyword, location, oldPosition, newPosition, change, date } = data;
  const competitorData = 'competitorData' in data ? data.competitorData : undefined;

  const isImprovement = change > 0;
  const changeAbs = Math.abs(change);
  const emoji = isImprovement ? '📈' : '📉';
  const trendColor = isImprovement ? '#10b981' : '#ef4444';
  const trendText = isImprovement ? 'Improvement' : 'Decline';

  const subject = `${emoji} Ranking ${trendText}: "${keyword}" ${isImprovement ? 'up' : 'down'} ${changeAbs} position${changeAbs > 1 ? 's' : ''}`;

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
      padding: 20px;
      background: linear-gradient(135deg, ${isImprovement ? '#10b981' : '#ef4444'} 0%, ${isImprovement ? '#059669' : '#dc2626'} 100%);
      color: white;
      border-radius: 6px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .header .emoji {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .alert-box {
      background: #f9fafb;
      border-left: 4px solid ${trendColor};
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .keyword {
      font-size: 20px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 10px;
    }
    .location {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 15px;
    }
    .position-change {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      margin: 25px 0;
      font-size: 18px;
    }
    .position-box {
      background: #f3f4f6;
      padding: 15px 25px;
      border-radius: 8px;
      font-weight: bold;
    }
    .old-position {
      color: #6b7280;
    }
    .new-position {
      color: ${trendColor};
      font-size: 32px;
    }
    .arrow {
      font-size: 32px;
      color: ${trendColor};
    }
    .change-amount {
      text-align: center;
      font-size: 16px;
      color: ${trendColor};
      font-weight: 600;
      margin: 10px 0;
    }
    .section {
      margin: 30px 0;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    .competitor-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .competitor-item {
      background: #f9fafb;
      padding: 12px 15px;
      margin-bottom: 8px;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .competitor-name {
      font-weight: 500;
      color: #1f2937;
    }
    .competitor-position {
      background: #6b7280;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 20px 0;
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
    }
    .info-item {
      font-size: 14px;
    }
    .info-label {
      color: #6b7280;
      font-size: 12px;
    }
    .info-value {
      color: #1f2937;
      font-weight: 600;
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
      <div class="emoji">${emoji}</div>
      <h1>Ranking ${trendText}</h1>
      <div>${companyName}</div>
    </div>

    ${recipientName ? `<p>Hi ${recipientName},</p>` : ''}

    <p>${isImprovement ? 'Great news!' : 'We detected a ranking change.'} Your keyword ranking has ${isImprovement ? 'improved' : 'declined'}:</p>

    <div class="alert-box">
      <div class="keyword">"${keyword}"</div>
      <div class="location">📍 ${location}</div>

      <div class="position-change">
        <div class="position-box old-position">
          <div style="font-size: 12px; margin-bottom: 5px;">Was</div>
          <div style="font-size: 24px;">#${oldPosition}</div>
        </div>
        <div class="arrow">${isImprovement ? '↗' : '↘'}</div>
        <div class="position-box">
          <div style="font-size: 12px; margin-bottom: 5px;">Now</div>
          <div class="new-position">#${newPosition}</div>
        </div>
      </div>

      <div class="change-amount">
        ${isImprovement ? 'Up' : 'Down'} ${changeAbs} position${changeAbs > 1 ? 's' : ''}
      </div>
    </div>

    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Company</div>
        <div class="info-value">${companyName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Date</div>
        <div class="info-value">${date}</div>
      </div>
    </div>

    ${competitorData && competitorData.length > 0 ? `
    <div class="section">
      <div class="section-title">Competitors in Top 10</div>
      <ul class="competitor-list">
        ${competitorData.slice(0, 5).map(comp => `
          <li class="competitor-item">
            <span class="competitor-name">${comp.name}</span>
            <span class="competitor-position">#${comp.position}</span>
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    <p style="margin-top: 30px;">
      ${isImprovement
        ? 'Keep up the great work! Your SEO efforts are paying off.'
        : 'Don\'t worry, ranking fluctuations are normal. Continue monitoring and optimizing your content.'}
    </p>

    <div class="footer">
      <p>GEO-SEO Domination Tool - Real-time Ranking Alerts</p>
      ${unsubscribeUrl ? `<p><a href="${unsubscribeUrl}" class="unsubscribe">Unsubscribe from ranking alerts</a></p>` : ''}
    </div>
  </div>
</body>
</html>
  `;

  const text = `
${emoji} Ranking ${trendText}: "${keyword}"

${recipientName ? `Hi ${recipientName},\n\n` : ''}
${isImprovement ? 'Great news!' : 'We detected a ranking change.'} Your keyword ranking has ${isImprovement ? 'improved' : 'declined'}:

KEYWORD: "${keyword}"
LOCATION: ${location}
COMPANY: ${companyName}

POSITION CHANGE:
Old Position: #${oldPosition}
New Position: #${newPosition}
Change: ${isImprovement ? '+' : ''}${change} (${isImprovement ? 'Up' : 'Down'} ${changeAbs} position${changeAbs > 1 ? 's' : ''})

Date: ${date}

${competitorData && competitorData.length > 0 ? `
COMPETITORS IN TOP 10:
${competitorData.slice(0, 5).map(comp => `- ${comp.name}: Position #${comp.position}`).join('\n')}
` : ''}

${isImprovement
  ? 'Keep up the great work! Your SEO efforts are paying off.'
  : 'Don\'t worry, ranking fluctuations are normal. Continue monitoring and optimizing your content.'}

---
GEO-SEO Domination Tool
${unsubscribeUrl ? `Unsubscribe: ${unsubscribeUrl}` : ''}
  `.trim();

  return { subject, html, text };
}
