'use client';

/**
 * Onboarding Status Dashboard
 *
 * Real-time progress tracking for client onboarding:
 * - Step-by-step progress visualization
 * - Live updates via polling
 * - Results from each step
 * - Redirect to dashboard when complete
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Building2,
  FolderOpen,
  Search,
  Calendar,
  Mail,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface OnboardingStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  result?: any;
  error?: string;
}

interface OnboardingProgress {
  onboardingId: string;
  companyId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  currentStep: string;
  steps: OnboardingStep[];
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export default function OnboardingStatusPage() {
  const params = useParams();
  const router = useRouter();
  const onboardingId = params.id as string;

  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProgress();

    // Poll for updates every 2 seconds
    const interval = setInterval(loadProgress, 2000);

    return () => clearInterval(interval);
  }, [onboardingId]);

  const loadProgress = async () => {
    try {
      const response = await fetch(`/api/onboarding/${onboardingId}`);

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`API returned HTML instead of JSON. This usually means the route is not found. Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setProgress(data.progress);

        // Redirect to dashboard when completed
        if (data.progress.status === 'completed' && data.progress.companyId) {
          setTimeout(() => {
            router.push(`/companies/${data.progress.companyId}`);
          }, 3000);
        }
      } else {
        setError(data.error || 'Failed to load progress');
      }
    } catch (err: any) {
      console.error('[Onboarding Page] Error loading progress:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (step: OnboardingStep) => {
    switch (step.name) {
      case 'Create Company Record':
        return Building2;
      case 'Setup Workspace':
        return FolderOpen;
      case 'Run SEO Audit':
        return Search;
      case 'Generate Content Calendar':
        return Calendar;
      case 'Send Welcome Email':
        return Mail;
      default:
        return Clock;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const calculateProgress = (): number => {
    if (!progress) return 0;

    const completed = progress.steps.filter(s => s.status === 'completed').length;
    return Math.round((completed / progress.steps.length) * 100);
  };

  if (loading && !progress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Loading onboarding status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push('/companies')}>
          Go to Companies
        </Button>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert>
          <AlertTitle>Onboarding Not Found</AlertTitle>
          <AlertDescription>
            The requested onboarding session could not be found.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Client Onboarding</h1>
            <p className="text-muted-foreground">Setting up your workspace and running initial tasks</p>
          </div>
          {getStatusBadge(progress.status)}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Overall Progress</span>
            <span className="font-medium">{calculateProgress()}%</span>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
        </div>
      </div>

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Steps</CardTitle>
          <CardDescription>
            {progress.status === 'completed'
              ? 'All steps completed successfully!'
              : progress.status === 'failed'
              ? 'Onboarding encountered an error'
              : `Currently: ${progress.currentStep || 'Initializing...'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {progress.steps.map((step, index) => {
              const Icon = getStepIcon(step);
              const isActive = step.status === 'running';

              return (
                <div
                  key={step.name}
                  className={`p-4 border rounded-lg transition-all ${
                    isActive ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Step Number/Icon */}
                    <div className="flex-shrink-0">
                      <div
                        className={`flex items-center justify-center h-10 w-10 rounded-full ${
                          step.status === 'completed'
                            ? 'bg-green-500 text-white'
                            : step.status === 'running'
                            ? 'bg-blue-500 text-white'
                            : step.status === 'failed'
                            ? 'bg-red-500 text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{step.name}</h3>
                        {getStatusIcon(step.status)}
                      </div>

                      {/* Timestamps */}
                      {step.startedAt && (
                        <p className="text-xs text-muted-foreground">
                          Started: {new Date(step.startedAt).toLocaleTimeString()}
                        </p>
                      )}
                      {step.completedAt && (
                        <p className="text-xs text-muted-foreground">
                          Completed: {new Date(step.completedAt).toLocaleTimeString()}
                        </p>
                      )}

                      {/* Results */}
                      {step.status === 'completed' && step.result && (
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                          <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                            ✓ Completed Successfully
                          </p>
                          {step.name === 'Run SEO Audit' && step.result.lighthouse && (
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center justify-between">
                                <span>Overall Score:</span>
                                <Badge variant="outline">{step.result.lighthouse.overall}/100</Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Performance:</span>
                                <span>{step.result.lighthouse.performance}/100</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>SEO:</span>
                                <span>{step.result.lighthouse.seo}/100</span>
                              </div>
                            </div>
                          )}
                          {step.name === 'Generate Content Calendar' && step.result.items && (
                            <p className="text-xs">
                              Generated {step.result.items.length} content items for next 90 days
                            </p>
                          )}
                        </div>
                      )}

                      {/* Error */}
                      {step.status === 'failed' && step.error && (
                        <Alert variant="destructive" className="mt-3">
                          <XCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription className="text-xs">{step.error}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Completion Card */}
      {progress.status === 'completed' && (
        <Card className="mt-6 border-green-500 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
              <CheckCircle className="h-6 w-6" />
              Onboarding Complete!
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300">
              Your workspace is ready. Redirecting to dashboard...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => router.push(`/companies/${progress.companyId}`)}
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Retry Button */}
      {progress.status === 'failed' && (
        <Card className="mt-6 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Onboarding Failed</CardTitle>
            <CardDescription>An error occurred during onboarding. Please contact support.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button variant="outline" onClick={loadProgress}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
            <Button onClick={() => router.push('/companies')}>
              Go to Companies
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            Debug Info
          </summary>
          <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto">
            {JSON.stringify(progress, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
