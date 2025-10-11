import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Calendar,
  FileText,
  Zap,
  Target,
  ArrowRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AuditIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  impact: 'high' | 'medium' | 'low';
}

interface NextStep {
  id: string;
  title: string;
  description: string;
  action: string;
  actionUrl?: string;
  actionHandler?: () => Promise<void>;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedTime: string;
  icon: React.ReactNode;
  automate?: boolean;
}

interface AuditNextStepsProps {
  auditId: string;
  companyId: string;
  score: number;
  issues: AuditIssue[];
  recommendations?: string[];
  onActionComplete?: () => void;
}

export function AuditNextSteps({
  auditId,
  companyId,
  score,
  issues,
  recommendations = [],
  onActionComplete,
}: AuditNextStepsProps) {
  const router = useRouter();
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const criticalIssues = issues.filter((i) => i.impact === 'high' || i.type === 'error');
  const hasLowScore = score < 60;

  const handleCreateTasks = async () => {
    setProcessingAction('create-tasks');
    setError(null);

    try {
      const tasks = criticalIssues.slice(0, 5).map((issue) => ({
        company_id: companyId,
        title: `Fix: ${issue.message}`,
        description: `Category: ${issue.category}\nImpact: ${issue.impact}\nSource: SEO Audit #${auditId}`,
        priority: issue.impact === 'high' ? 'high' : 'medium',
        status: 'todo',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }));

      const response = await fetch('/api/crm/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tasks),
      });

      if (!response.ok) throw new Error('Failed to create tasks');

      setCompletedActions((prev) => new Set(prev).add('create-tasks'));
      onActionComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tasks');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleScheduleFollowUp = async () => {
    setProcessingAction('schedule-followup');
    setError(null);

    try {
      const followUpDays = score < 70 ? 30 : 90;
      const response = await fetch('/api/scheduled-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_type: 'seo_audit',
          company_id: companyId,
          schedule_date: new Date(Date.now() + followUpDays * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            audit_type: 'follow_up',
            previous_audit_id: auditId,
            previous_score: score,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to schedule follow-up');

      setCompletedActions((prev) => new Set(prev).add('schedule-followup'));
      onActionComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule follow-up');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRunComprehensiveAudit = () => {
    router.push(`/companies/${companyId}/comprehensive-audit`);
  };

  const handleGenerateReport = async () => {
    setProcessingAction('generate-report');
    setError(null);

    try {
      router.push(`/reports?audit_id=${auditId}`);
      setCompletedActions((prev) => new Set(prev).add('generate-report'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleTriggerWebhook = async () => {
    setProcessingAction('trigger-webhook');
    setError(null);

    try {
      const response = await fetch('/api/webhooks/audit-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditId,
          companyId,
          score,
          issues,
          recommendations,
        }),
      });

      if (!response.ok) throw new Error('Failed to trigger automation');

      const data = await response.json();
      console.log('[Webhook] Automation triggered:', data);

      setCompletedActions((prev) => new Set(prev).add('trigger-webhook'));
      onActionComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger automation');
    } finally {
      setProcessingAction(null);
    }
  };

  const nextSteps: NextStep[] = [
    {
      id: 'create-tasks',
      title: 'Create Improvement Tasks',
      description: `Generate ${criticalIssues.length} actionable tasks from critical issues`,
      action: 'Create Tasks',
      actionHandler: handleCreateTasks,
      priority: 'critical',
      estimatedTime: '2 min',
      icon: <CheckCircle className="h-5 w-5" />,
      automate: true,
    },
    {
      id: 'schedule-followup',
      title: 'Schedule Follow-up Audit',
      description: `Auto-schedule next audit in ${score < 70 ? 30 : 90} days`,
      action: 'Schedule',
      actionHandler: handleScheduleFollowUp,
      priority: 'high',
      estimatedTime: '1 min',
      icon: <Calendar className="h-5 w-5" />,
      automate: true,
    },
    {
      id: 'comprehensive-audit',
      title: 'Run 117-Point Comprehensive Audit',
      description: 'Deep analysis with backlink profile, competitor gaps, and AI search optimization',
      action: 'Run Audit',
      actionUrl: `/companies/${companyId}/comprehensive-audit`,
      actionHandler: handleRunComprehensiveAudit,
      priority: 'high',
      estimatedTime: '5 min',
      icon: <Target className="h-5 w-5" />,
      automate: false,
    },
    {
      id: 'generate-report',
      title: 'Generate Client Report',
      description: 'Create PDF report with findings and recommendations',
      action: 'Generate Report',
      actionHandler: handleGenerateReport,
      priority: 'medium',
      estimatedTime: '2 min',
      icon: <FileText className="h-5 w-5" />,
      automate: false,
    },
    {
      id: 'trigger-webhook',
      title: 'Trigger Post-Audit Automation',
      description: 'Run all automated workflows (tasks, scheduling, analysis)',
      action: 'Automate All',
      actionHandler: handleTriggerWebhook,
      priority: 'high',
      estimatedTime: 'Instant',
      icon: <Zap className="h-5 w-5" />,
      automate: true,
    },
  ];

  // Add competitor analysis for low scores
  if (hasLowScore) {
    nextSteps.splice(3, 0, {
      id: 'competitor-analysis',
      title: 'Analyze Top Competitors',
      description: 'Find keyword gaps and backlink opportunities from competitors',
      action: 'Analyze',
      actionUrl: `/companies/${companyId}/competitors`,
      priority: 'critical',
      estimatedTime: '3 min',
      icon: <TrendingUp className="h-5 w-5" />,
      automate: false,
    });
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'URGENT';
      case 'high':
        return 'High Priority';
      case 'medium':
        return 'Medium';
      default:
        return 'Low';
    }
  };

  return (
    <Card className="mt-6 border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-emerald-600" />
          Recommended Next Steps
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Continue improving your SEO with these automated and manual actions
        </p>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {nextSteps.map((step) => {
            const isCompleted = completedActions.has(step.id);
            const isProcessing = processingAction === step.id;

            return (
              <div
                key={step.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isCompleted
                    ? 'bg-green-50 border-green-300'
                    : 'bg-white border-gray-200 hover:border-emerald-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`mt-1 ${
                        isCompleted ? 'text-green-600' : 'text-emerald-600'
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="h-5 w-5" /> : step.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{step.title}</h4>
                        <Badge variant={getPriorityColor(step.priority) as any}>
                          {getPriorityLabel(step.priority)}
                        </Badge>
                        {step.automate && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                            <Zap className="h-3 w-3 mr-1" />
                            Auto
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>⏱️ {step.estimatedTime}</span>
                        {isCompleted && (
                          <span className="text-green-600 font-medium">✓ Completed</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    {!isCompleted && (
                      <Button
                        onClick={step.actionHandler}
                        disabled={isProcessing}
                        variant={step.priority === 'critical' ? 'default' : 'outline'}
                        size="sm"
                        className="gap-2"
                      >
                        {isProcessing ? (
                          'Processing...'
                        ) : (
                          <>
                            {step.action}
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Action Bar */}
        <div className="mt-6 p-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg">
          <div className="flex items-center justify-between text-white">
            <div>
              <h4 className="font-semibold mb-1">🚀 Automate Everything</h4>
              <p className="text-sm text-emerald-50">
                Run all automated workflows in one click
              </p>
            </div>
            <Button
              onClick={handleTriggerWebhook}
              disabled={processingAction === 'trigger-webhook'}
              variant="secondary"
              size="lg"
              className="gap-2 bg-white text-emerald-700 hover:bg-emerald-50"
            >
              {processingAction === 'trigger-webhook' ? (
                'Running...'
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  Automate All
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
