export type AuditSeverity = 'critical' | 'warning' | 'info' | 'success';

export type AuditCategory = 'ui-ux' | 'flow' | 'automation' | 'accessibility' | 'performance';

export interface AuditIssue {
  id: string;
  severity: AuditSeverity;
  category: AuditCategory;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  automatable: boolean;
  estimatedTime: string;
  priority: number;
  relatedPages?: string[];
  codeExample?: string;
  documentationUrl?: string;
}

export interface PageAudit {
  route: string;
  score: number;
  issues: number;
  opportunities: number;
  automationPotential: number;
  audits?: Array<{
    type: AuditCategory;
    message: string;
    severity: AuditSeverity;
  }>;
}

export interface CategorySummary {
  issues: number;
  automatable: number;
  criticalCount?: number;
  warningCount?: number;
  infoCount?: number;
}

export interface LayoutAuditData {
  timestamp: string;
  overallScore: number;
  pages: PageAudit[];
  categories: Record<AuditCategory, CategorySummary>;
  totalIssues: number;
  automatableIssues: number;
  avgAutomationPotential: number;
}

export interface AuditRecommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'small' | 'medium' | 'large';
  impact: 'high' | 'medium' | 'low';
  category: AuditCategory;
  automationScript?: string;
  migrationGuide?: string;
}

export interface AutomationOpportunity {
  id: string;
  title: string;
  description: string;
  estimatedTimeSaved: string;
  implementationComplexity: 'low' | 'medium' | 'high';
  tools: string[];
  steps: string[];
  roi: number;
}
