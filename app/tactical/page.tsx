'use client';

/**
 * Tactical Agentic Coding Interface
 *
 * Plain English → World-Class Engineering
 * Based on IndyDevDan's Plan-Build-Ship methodology
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  Code2,
  FileCode,
  TestTube,
  Rocket,
  Lightbulb
} from 'lucide-react';

interface TacticalProject {
  id: string;
  title: string;
  status: string;
  phases: any;
  summary: {
    files_created: number;
    tests_passed: number;
    code_quality: number;
  };
  duration: number;
}

export default function TacticalPage() {
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('');
  const [project, setProject] = useState<TacticalProject | null>(null);

  const examples = [
    {
      title: 'Ranking Tracker',
      description: 'Build a keyword ranking tracker that checks 50 keywords daily, stores 90 days of history, sends Slack alerts on position changes > 3 spots, and displays trend charts with filters.'
    },
    {
      title: 'Content Calendar',
      description: 'Create a content calendar system that generates 30 days of social media posts, suggests optimal posting times based on engagement data, integrates with Hootsuite API, and provides performance analytics.'
    },
    {
      title: 'Backlink Monitor',
      description: 'Build a backlink monitoring tool that tracks new/lost backlinks daily, calculates domain authority scores, identifies toxic links, sends weekly reports, and integrates with Ahrefs API.'
    }
  ];

  const handleSubmit = async () => {
    if (!description.trim()) return;

    setIsProcessing(true);
    setCurrentPhase('planning');
    setProject(null);

    try {
      // Simulate phases for demo (in production, use SSE for real-time updates)
      const phases = ['planning', 'architecting', 'implementing', 'testing', 'shipping'];

      for (const phase of phases) {
        setCurrentPhase(phase);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Call tactical API
      const response = await fetch('/api/tactical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });

      const data = await response.json();

      if (data.success) {
        setProject(data.project);
        setCurrentPhase('complete');
      } else {
        throw new Error(data.error);
      }

    } catch (error) {
      console.error('Failed to process tactical request:', error);
      alert('Failed to process request. Check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'planning': return <Lightbulb className="w-5 h-5" />;
      case 'architecting': return <Code2 className="w-5 h-5" />;
      case 'implementing': return <FileCode className="w-5 h-5" />;
      case 'testing': return <TestTube className="w-5 h-5" />;
      case 'shipping': return <Rocket className="w-5 h-5" />;
      default: return <CheckCircle2 className="w-5 h-5" />;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3 mb-2">
          <Sparkles className="w-10 h-10 text-emerald-500" />
          Tactical Agentic Coding
        </h1>
        <p className="text-lg text-muted-foreground">
          Describe what you want in plain English. Get world-class engineered solutions.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Based on <span className="font-semibold">IndyDevDan's Plan-Build-Ship</span> methodology
        </p>
      </div>

      {/* Main Input */}
      <Card className="p-6 mb-6">
        <label className="block text-sm font-medium mb-2">
          What would you like to build?
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Example: I need a system that monitors my competitors' websites daily, tracks their new content, analyzes their SEO changes, and sends me a weekly report with actionable insights..."
          className="min-h-[120px] text-base"
          disabled={isProcessing}
        />

        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">
            {description.length} characters
          </span>
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || !description.trim()}
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Build This For Me
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Example Projects */}
      {!isProcessing && !project && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3">Quick Examples:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {examples.map((example, idx) => (
              <Card
                key={idx}
                className="p-4 cursor-pointer hover:border-emerald-500 transition-colors"
                onClick={() => setDescription(example.description)}
              >
                <h4 className="font-semibold mb-2">{example.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {example.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-2 text-emerald-500" />
              <p className="text-lg font-semibold">
                {currentPhase === 'planning' && 'Analyzing your requirements...'}
                {currentPhase === 'architecting' && 'Designing system architecture...'}
                {currentPhase === 'implementing' && 'Generating code...'}
                {currentPhase === 'testing' && 'Running quality checks...'}
                {currentPhase === 'shipping' && 'Finalizing deployment...'}
              </p>
            </div>

            {/* Phase Progress */}
            <div className="space-y-2">
              {['planning', 'architecting', 'implementing', 'testing', 'shipping'].map((phase, idx) => (
                <div key={phase} className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    currentPhase === phase ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                    phases.indexOf(currentPhase) > idx ? 'bg-green-100 dark:bg-green-900/30' :
                    'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    {getPhaseIcon(phase)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium capitalize">{phase}</div>
                    {currentPhase === phase && (
                      <div className="text-sm text-muted-foreground">In progress...</div>
                    )}
                    {phases.indexOf(currentPhase) > idx && (
                      <div className="text-sm text-green-600 dark:text-green-400">Complete ✓</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {project && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                Project Complete!
              </h2>
              <p className="text-muted-foreground">
                Completed in {project.duration}s
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {project.status}
            </Badge>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="p-4 text-center">
              <div className="text-3xl font-bold text-emerald-500">
                {project.summary.files_created}
              </div>
              <div className="text-sm text-muted-foreground">Files Created</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-3xl font-bold text-green-500">
                {project.summary.tests_passed}
              </div>
              <div className="text-sm text-muted-foreground">Tests Passed</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-500">
                {project.summary.code_quality}/100
              </div>
              <div className="text-sm text-muted-foreground">Code Quality</div>
            </Card>
          </div>

          {/* Phase Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Project Phases:</h3>

            {project.phases.plan && (
              <Card className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Planning
                </h4>
                <div className="text-sm space-y-1">
                  <div><strong>Objective:</strong> {project.phases.plan.objective}</div>
                  <div><strong>Complexity:</strong> {project.phases.plan.estimated_complexity}</div>
                  <div><strong>Phases:</strong> {project.phases.plan.phases.length}</div>
                </div>
              </Card>
            )}

            {project.phases.architecture && (
              <Card className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  Architecture
                </h4>
                <div className="text-sm space-y-1">
                  <div><strong>Design:</strong> {project.phases.architecture.system_design}</div>
                  <div><strong>Components:</strong> {project.phases.architecture.components.length}</div>
                </div>
              </Card>
            )}

            {project.phases.implementation && (
              <Card className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  Implementation
                </h4>
                <div className="text-sm space-y-1">
                  <div><strong>Files:</strong> {project.phases.implementation.files_created.length}</div>
                  <div><strong>Quality:</strong> {project.phases.implementation.code_quality_score}/100</div>
                </div>
              </Card>
            )}
          </div>

          <Button className="w-full mt-6" size="lg">
            <Rocket className="w-5 h-5 mr-2" />
            Deploy to Production
          </Button>
        </Card>
      )}

      {/* How It Works */}
      {!isProcessing && !project && (
        <Card className="p-6 mt-6 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950 dark:to-blue-950">
          <h3 className="font-semibold text-lg mb-4">How It Works:</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2">
                <Lightbulb className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="font-semibold">Plan</div>
              <div className="text-sm text-muted-foreground">Analyze requirements</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2">
                <Code2 className="w-6 h-6 text-blue-500" />
              </div>
              <div className="font-semibold">Architect</div>
              <div className="text-sm text-muted-foreground">Design system</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2">
                <FileCode className="w-6 h-6 text-purple-500" />
              </div>
              <div className="font-semibold">Implement</div>
              <div className="text-sm text-muted-foreground">Generate code</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2">
                <TestTube className="w-6 h-6 text-orange-500" />
              </div>
              <div className="font-semibold">Test</div>
              <div className="text-sm text-muted-foreground">Validate quality</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2">
                <Rocket className="w-6 h-6 text-red-500" />
              </div>
              <div className="font-semibold">Ship</div>
              <div className="text-sm text-muted-foreground">Deploy live</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

const phases = ['planning', 'architecting', 'implementing', 'testing', 'shipping'];
