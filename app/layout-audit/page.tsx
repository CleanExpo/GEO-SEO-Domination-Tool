'use client';

import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Lightbulb,
  Zap,
  TrendingUp,
  Layout,
  Palette,
  Workflow,
  RefreshCw,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface AuditIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  category: 'ui-ux' | 'flow' | 'automation' | 'accessibility' | 'performance';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  automatable: boolean;
  estimatedTime: string;
  priority: number;
}

interface PageAudit {
  route: string;
  score: number;
  issues: number;
  opportunities: number;
  automationPotential: number;
}

export default function LayoutAuditPage() {
  const [selectedPage, setSelectedPage] = useState<string>('all');
  const [showAutomationOnly, setShowAutomationOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock audit data
  const auditIssues: AuditIssue[] = [
    {
      id: '1',
      severity: 'critical',
      category: 'ui-ux',
      title: 'Inconsistent Card Spacing',
      description: 'Card components have varying padding (16px, 20px, 24px) across different pages',
      impact: 'Creates visual inconsistency and disrupts user flow',
      recommendation: 'Standardize card padding to 24px (p-6) with 16px (p-4) for compact variants',
      automatable: true,
      estimatedTime: '2h',
      priority: 95,
    },
    {
      id: '2',
      severity: 'warning',
      category: 'flow',
      title: 'Missing Onboarding Flow Navigation',
      description: 'Users cannot easily return to previous onboarding steps',
      impact: 'Forces users to restart onboarding if they make a mistake',
      recommendation: 'Add stepper component with back navigation and progress indicators',
      automatable: false,
      estimatedTime: '4h',
      priority: 85,
    },
    {
      id: '3',
      severity: 'critical',
      category: 'automation',
      title: 'Manual Data Refresh Required',
      description: 'Dashboard requires manual refresh to see updated SEO audit data',
      impact: 'Users miss real-time updates, leading to stale decisions',
      recommendation: 'Implement React Query with automatic refetch intervals (30s)',
      automatable: true,
      estimatedTime: '3h',
      priority: 90,
    },
    {
      id: '4',
      severity: 'info',
      category: 'accessibility',
      title: 'Color Contrast on Badge Components',
      description: 'Some badge variants fail WCAG AA contrast ratio (4.5:1)',
      impact: 'Reduces readability for users with visual impairments',
      recommendation: 'Adjust badge background colors to meet WCAG standards',
      automatable: true,
      estimatedTime: '1h',
      priority: 70,
    },
    {
      id: '5',
      severity: 'warning',
      category: 'performance',
      title: 'Unoptimized Chart Rendering',
      description: 'Recharts components re-render on every parent state change',
      impact: 'Causes UI lag when interacting with dashboard filters',
      recommendation: 'Wrap charts in React.memo and use useMemo for data transformations',
      automatable: true,
      estimatedTime: '2h',
      priority: 75,
    },
    {
      id: '6',
      severity: 'success',
      category: 'ui-ux',
      title: 'Excellent Loading States',
      description: 'Skeleton loaders provide clear feedback during data fetching',
      impact: 'Improves perceived performance and reduces user anxiety',
      recommendation: 'Maintain current implementation as best practice',
      automatable: false,
      estimatedTime: '0h',
      priority: 100,
    },
    {
      id: '7',
      severity: 'critical',
      category: 'flow',
      title: 'No Error Recovery Patterns',
      description: 'Failed API requests show generic errors with no retry mechanism',
      impact: 'Users must refresh entire page, losing form state and context',
      recommendation: 'Add exponential backoff retry with detailed error messages and recovery actions',
      automatable: true,
      estimatedTime: '4h',
      priority: 92,
    },
    {
      id: '8',
      severity: 'warning',
      category: 'automation',
      title: 'Manual Report Generation',
      description: 'Users must click "Generate Report" and wait for processing',
      impact: 'Adds friction to workflow, especially for recurring reports',
      recommendation: 'Implement scheduled report generation with email delivery',
      automatable: true,
      estimatedTime: '6h',
      priority: 80,
    },
    {
      id: '9',
      severity: 'info',
      category: 'ui-ux',
      title: 'Missing Empty States',
      description: 'Some pages show blank content when no data exists',
      impact: 'Confuses new users and appears broken',
      recommendation: 'Add illustrated empty states with clear CTAs for first-time setup',
      automatable: true,
      estimatedTime: '3h',
      priority: 65,
    },
    {
      id: '10',
      severity: 'warning',
      category: 'flow',
      title: 'Complex Multi-Step Forms',
      description: 'Onboarding form has 12+ fields on single page',
      impact: 'Overwhelming for users, increases abandonment rate',
      recommendation: 'Split into 3-4 progressive disclosure steps with smart defaults',
      automatable: false,
      estimatedTime: '8h',
      priority: 88,
    },
  ];

  const pageAudits: PageAudit[] = [
    { route: '/dashboard', score: 82, issues: 3, opportunities: 5, automationPotential: 75 },
    { route: '/companies', score: 76, issues: 5, opportunities: 8, automationPotential: 85 },
    { route: '/onboarding', score: 68, issues: 7, opportunities: 10, automationPotential: 65 },
    { route: '/seo-audit', score: 85, issues: 2, opportunities: 4, automationPotential: 90 },
    { route: '/reports', score: 72, issues: 4, opportunities: 6, automationPotential: 80 },
  ];

  const overallScore = Math.round(
    pageAudits.reduce((sum, page) => sum + page.score, 0) / pageAudits.length
  );
  const totalIssues = auditIssues.filter((i) => i.severity !== 'success').length;
  const automatable = auditIssues.filter((i) => i.automatable).length;
  const avgAutomationPotential = Math.round(
    pageAudits.reduce((sum, page) => sum + page.automationPotential, 0) / pageAudits.length
  );

  const filteredIssues = showAutomationOnly
    ? auditIssues.filter((issue) => issue.automatable)
    : auditIssues;

  const getSeverityIcon = (severity: AuditIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    }
  };

  const getSeverityBadge = (severity: AuditIssue['severity']) => {
    const variants = {
      critical: 'bg-red-100 text-red-700 hover:bg-red-100',
      warning: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
      info: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
      success: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
    };
    return (
      <Badge variant="secondary" className={variants[severity]}>
        {severity}
      </Badge>
    );
  };

  const getCategoryIcon = (category: AuditIssue['category']) => {
    switch (category) {
      case 'ui-ux':
        return <Palette className="h-4 w-4" />;
      case 'flow':
        return <Workflow className="h-4 w-4" />;
      case 'automation':
        return <Zap className="h-4 w-4" />;
      case 'accessibility':
        return <Layout className="h-4 w-4" />;
      case 'performance':
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Layout Audit</h1>
            <p className="text-gray-600">
              Comprehensive analysis of UI/UX flow, design consistency, and automation opportunities
            </p>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Re-run Audit
          </Button>
        </div>

        {/* Overall Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Overall Score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-gray-900">{overallScore}</p>
                <Badge
                  variant="secondary"
                  className={
                    overallScore >= 80
                      ? 'bg-emerald-100 text-emerald-700'
                      : overallScore >= 60
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }
                >
                  {overallScore >= 80 ? 'Good' : overallScore >= 60 ? 'Fair' : 'Poor'}
                </Badge>
              </div>
              <Progress value={overallScore} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-gray-900">{totalIssues}</p>
                <AlertCircle className="h-5 w-5 text-amber-500" />
              </div>
              <p className="text-sm text-gray-500 mt-2">Across {pageAudits.length} pages</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Automatable</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-gray-900">{automatable}</p>
                <Zap className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-sm text-gray-500 mt-2">{Math.round((automatable / totalIssues) * 100)}% can be automated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Automation Potential</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-gray-900">{avgAutomationPotential}%</p>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <Progress value={avgAutomationPotential} className="mt-3 h-2" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="issues">Issues & Improvements</TabsTrigger>
          <TabsTrigger value="pages">Page-by-Page</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-emerald-900">Strong Loading State Implementation</p>
                  <p className="text-sm text-emerald-700 mt-1">
                    Skeleton loaders provide excellent feedback during data fetching across all pages
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-900">Critical: No Error Recovery Patterns</p>
                  <p className="text-sm text-red-700 mt-1">
                    Failed API requests force full page refresh, losing user context and form state
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Zap className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-900">High Automation Potential</p>
                  <p className="text-sm text-blue-700 mt-1">
                    {automatable} of {totalIssues} issues can be fixed with automated tools and scripts
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Issues by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(['ui-ux', 'flow', 'automation', 'accessibility', 'performance'] as const).map((category) => {
                  const categoryIssues = auditIssues.filter((i) => i.category === category && i.severity !== 'success');
                  const categoryLabels = {
                    'ui-ux': 'UI/UX Design',
                    flow: 'User Flow',
                    automation: 'Automation',
                    accessibility: 'Accessibility',
                    performance: 'Performance',
                  };

                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(category)}
                          <span className="font-medium">{categoryLabels[category]}</span>
                        </div>
                        <span className="text-sm text-gray-500">{categoryIssues.length} issues</span>
                      </div>
                      <Progress value={(categoryIssues.length / totalIssues) * 100} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="automation-filter"
                    checked={showAutomationOnly}
                    onCheckedChange={setShowAutomationOnly}
                  />
                  <Label htmlFor="automation-filter" className="cursor-pointer">
                    Show only automatable issues
                  </Label>
                </div>
                <Badge variant="outline">{filteredIssues.length} issues</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Issues List */}
          <div className="space-y-4">
            {filteredIssues
              .sort((a, b) => b.priority - a.priority)
              .map((issue) => (
                <Card key={issue.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {getSeverityIcon(issue.severity)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-lg">{issue.title}</CardTitle>
                            {issue.automatable && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                <Zap className="h-3 w-3 mr-1" />
                                Automatable
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {getSeverityBadge(issue.severity)}
                            <Badge variant="outline" className="capitalize">
                              {getCategoryIcon(issue.category)}
                              <span className="ml-1">{issue.category.replace('-', '/')}</span>
                            </Badge>
                            <span className="text-sm text-gray-500">Est. {issue.estimatedTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-700">{issue.description}</p>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Impact</p>
                        <p className="text-sm text-gray-600">{issue.impact}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Recommendation</p>
                        <p className="text-sm text-gray-600">{issue.recommendation}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button variant="default" size="sm">
                        Create Task
                      </Button>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Documentation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages" className="space-y-6">
          <div className="space-y-4">
            {pageAudits.map((page) => (
              <Card key={page.route} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-mono">{page.route}</CardTitle>
                      <CardDescription className="mt-1">
                        {page.issues} issues • {page.opportunities} opportunities
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm">
                      View Details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Overall Score</span>
                        <span className="text-lg font-bold">{page.score}</span>
                      </div>
                      <Progress value={page.score} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Issues</span>
                        <Badge
                          variant="secondary"
                          className={
                            page.issues <= 2
                              ? 'bg-emerald-100 text-emerald-700'
                              : page.issues <= 5
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }
                        >
                          {page.issues}
                        </Badge>
                      </div>
                      <Progress
                        value={100 - (page.issues / 10) * 100}
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Automation Potential</span>
                        <span className="text-lg font-bold">{page.automationPotential}%</span>
                      </div>
                      <Progress value={page.automationPotential} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
