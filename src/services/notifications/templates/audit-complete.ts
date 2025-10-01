/**
 * Audit Complete Email Template
 */

import { AuditCompleteNotification, EmailTemplate } from '../notification-types';

export function generateAuditCompleteTemplate(
  notification: AuditCompleteNotification,
  unsubscribeUrl?: string
): EmailTemplate {
  const { data, recipientName } = notification;
  const {
    companyName,
    auditId,
    auditDate,
    lighthouseScores,
    eeatScores,
    criticalIssues,
    highPriorityIssues,
    mediumPriorityIssues,
    totalIssues,
    auditUrl,
  } = data;

  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreGrade = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  };

  const avgLighthouseScore = Math.round(
    (lighthouseScores.performance +
      lighthouseScores.accessibility +
      lighthouseScores.bestPractices +
      lighthouseScores.seo) /
      4
  );

  const avgEEATScore = Math.round(
    (eeatScores.experience +
      eeatScores.expertise +
      eeatScores.authoritativeness +
      eeatScores.trustworthiness) /
      4
  );

  const subject = `SEO Audit Complete for ${companyName} - ${totalIssues} Issue${totalIssues !== 1 ? 's' : ''} Found`;

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
    .audit-info {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .score-section {
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
    .score-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 15px 0;
    }
    .score-card {
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      text-align: center;
    }
    .score-label {
      color: #6b7280;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .score-value {
      font-size: 36px;
      font-weight: bold;
      margin: 5px 0;
    }
    .score-bar {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin: 10px 0;
    }
    .score-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    .score-grade {
      font-size: 12px;
      color: #6b7280;
      font-weight: 600;
    }
    .issues-summary {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .issues-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 15px;
      margin-top: 15px;
    }
    .issue-box {
      text-align: center;
      background: rgba(255, 255, 255, 0.1);
      padding: 15px;
      border-radius: 6px;
    }
    .issue-count {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .issue-label {
      font-size: 12px;
      opacity: 0.9;
    }
    .cta-button {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 14px 32px;
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
      <h1>🔍 SEO Audit Complete</h1>
      <div class="audit-info">
        <div style="font-size: 16px; color: #1f2937; font-weight: 600; margin: 10px 0;">${companyName}</div>
        <div>Audit #${auditId} | ${auditDate}</div>
      </div>
    </div>

    ${recipientName ? `<p>Hi ${recipientName},</p>` : ''}

    <p>Your comprehensive SEO audit has been completed. Here's a summary of the findings:</p>

    <div class="score-section">
      <div class="section-title">Lighthouse Performance Scores</div>
      <div class="score-grid">
        <div class="score-card">
          <div class="score-label">Performance</div>
          <div class="score-value" style="color: ${getScoreColor(lighthouseScores.performance)}">${lighthouseScores.performance}</div>
          <div class="score-bar">
            <div class="score-fill" style="width: ${lighthouseScores.performance}%; background: ${getScoreColor(lighthouseScores.performance)}"></div>
          </div>
          <div class="score-grade">${getScoreGrade(lighthouseScores.performance)}</div>
        </div>
        <div class="score-card">
          <div class="score-label">Accessibility</div>
          <div class="score-value" style="color: ${getScoreColor(lighthouseScores.accessibility)}">${lighthouseScores.accessibility}</div>
          <div class="score-bar">
            <div class="score-fill" style="width: ${lighthouseScores.accessibility}%; background: ${getScoreColor(lighthouseScores.accessibility)}"></div>
          </div>
          <div class="score-grade">${getScoreGrade(lighthouseScores.accessibility)}</div>
        </div>
        <div class="score-card">
          <div class="score-label">Best Practices</div>
          <div class="score-value" style="color: ${getScoreColor(lighthouseScores.bestPractices)}">${lighthouseScores.bestPractices}</div>
          <div class="score-bar">
            <div class="score-fill" style="width: ${lighthouseScores.bestPractices}%; background: ${getScoreColor(lighthouseScores.bestPractices)}"></div>
          </div>
          <div class="score-grade">${getScoreGrade(lighthouseScores.bestPractices)}</div>
        </div>
        <div class="score-card">
          <div class="score-label">SEO</div>
          <div class="score-value" style="color: ${getScoreColor(lighthouseScores.seo)}">${lighthouseScores.seo}</div>
          <div class="score-bar">
            <div class="score-fill" style="width: ${lighthouseScores.seo}%; background: ${getScoreColor(lighthouseScores.seo)}"></div>
          </div>
          <div class="score-grade">${getScoreGrade(lighthouseScores.seo)}</div>
        </div>
      </div>
    </div>

    <div class="score-section">
      <div class="section-title">E-E-A-T Scores (Expertise, Experience, Authority, Trust)</div>
      <div class="score-grid">
        <div class="score-card">
          <div class="score-label">Experience</div>
          <div class="score-value" style="color: ${getScoreColor(eeatScores.experience)}">${eeatScores.experience}</div>
          <div class="score-bar">
            <div class="score-fill" style="width: ${eeatScores.experience}%; background: ${getScoreColor(eeatScores.experience)}"></div>
          </div>
        </div>
        <div class="score-card">
          <div class="score-label">Expertise</div>
          <div class="score-value" style="color: ${getScoreColor(eeatScores.expertise)}">${eeatScores.expertise}</div>
          <div class="score-bar">
            <div class="score-fill" style="width: ${eeatScores.expertise}%; background: ${getScoreColor(eeatScores.expertise)}"></div>
          </div>
        </div>
        <div class="score-card">
          <div class="score-label">Authority</div>
          <div class="score-value" style="color: ${getScoreColor(eeatScores.authoritativeness)}">${eeatScores.authoritativeness}</div>
          <div class="score-bar">
            <div class="score-fill" style="width: ${eeatScores.authoritativeness}%; background: ${getScoreColor(eeatScores.authoritativeness)}"></div>
          </div>
        </div>
        <div class="score-card">
          <div class="score-label">Trust</div>
          <div class="score-value" style="color: ${getScoreColor(eeatScores.trustworthiness)}">${eeatScores.trustworthiness}</div>
          <div class="score-bar">
            <div class="score-fill" style="width: ${eeatScores.trustworthiness}%; background: ${getScoreColor(eeatScores.trustworthiness)}"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="issues-summary">
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">Issues Found</div>
      <div style="font-size: 32px; font-weight: bold; margin-bottom: 15px;">${totalIssues} Total</div>
      <div class="issues-grid">
        <div class="issue-box">
          <div class="issue-count">${criticalIssues}</div>
          <div class="issue-label">Critical</div>
        </div>
        <div class="issue-box">
          <div class="issue-count">${highPriorityIssues}</div>
          <div class="issue-label">High Priority</div>
        </div>
        <div class="issue-box">
          <div class="issue-count">${mediumPriorityIssues}</div>
          <div class="issue-label">Medium</div>
        </div>
      </div>
    </div>

    ${criticalIssues > 0 ? `
      <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <strong style="color: #991b1b;">⚠️ Action Required:</strong>
        <p style="margin: 10px 0 0 0; color: #7f1d1d;">Your site has ${criticalIssues} critical issue${criticalIssues !== 1 ? 's' : ''} that need immediate attention.</p>
      </div>
    ` : ''}

    ${auditUrl ? `
    <div style="text-align: center;">
      <a href="${auditUrl}" class="cta-button">View Full Audit Report</a>
    </div>
    ` : ''}

    <div class="footer">
      <p>GEO-SEO Domination Tool - Comprehensive SEO Audits</p>
      ${unsubscribeUrl ? `<p><a href="${unsubscribeUrl}" class="unsubscribe">Unsubscribe from audit notifications</a></p>` : ''}
    </div>
  </div>
</body>
</html>
  `;

  const text = `
SEO Audit Complete for ${companyName}
Audit #${auditId} | ${auditDate}

${recipientName ? `Hi ${recipientName},\n\n` : ''}
Your comprehensive SEO audit has been completed. Here's a summary of the findings:

LIGHTHOUSE PERFORMANCE SCORES:
- Performance: ${lighthouseScores.performance}/100 (${getScoreGrade(lighthouseScores.performance)})
- Accessibility: ${lighthouseScores.accessibility}/100 (${getScoreGrade(lighthouseScores.accessibility)})
- Best Practices: ${lighthouseScores.bestPractices}/100 (${getScoreGrade(lighthouseScores.bestPractices)})
- SEO: ${lighthouseScores.seo}/100 (${getScoreGrade(lighthouseScores.seo)})

E-E-A-T SCORES:
- Experience: ${eeatScores.experience}/100
- Expertise: ${eeatScores.expertise}/100
- Authoritativeness: ${eeatScores.authoritativeness}/100
- Trustworthiness: ${eeatScores.trustworthiness}/100

ISSUES FOUND:
- Total Issues: ${totalIssues}
- Critical: ${criticalIssues}
- High Priority: ${highPriorityIssues}
- Medium Priority: ${mediumPriorityIssues}

${criticalIssues > 0 ? `⚠️ ACTION REQUIRED: Your site has ${criticalIssues} critical issue${criticalIssues !== 1 ? 's' : ''} that need immediate attention.\n\n` : ''}
${auditUrl ? `View Full Report: ${auditUrl}\n\n` : ''}
---
GEO-SEO Domination Tool
${unsubscribeUrl ? `Unsubscribe: ${unsubscribeUrl}` : ''}
  `.trim();

  return { subject, html, text };
}
