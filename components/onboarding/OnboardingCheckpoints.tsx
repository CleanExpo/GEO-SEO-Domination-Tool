'use client';

/**
 * Onboarding Checkpoints Component
 *
 * Implements milestone-based onboarding with "Good Enough" vs "Full Power" approach
 * Features:
 * - Phase 1: Essential (can start using platform)
 * - Phase 2: Quick Wins (automated features enabled)
 * - Phase 3: Full Power (all integrations)
 * - Auto-save at each checkpoint
 * - Visual progress tracking
 */

import React from 'react';
import { CheckCircle2, Circle, Lock, Zap, Rocket, Trophy, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface Checkpoint {
  id: string;
  phase: 1 | 2 | 3;
  title: string;
  description: string;
  benefits: string[];
  requiredSteps: string[]; // Step IDs that must be completed
  estimatedTime: string;
  value: 'essential' | 'quick-win' | 'full-power';
  status: 'locked' | 'available' | 'in-progress' | 'completed';
}

interface OnboardingCheckpointsProps {
  checkpoints: Checkpoint[];
  currentPhase: 1 | 2 | 3;
  onContinue: (checkpointId: string) => void;
  onSkipToNext: () => void;
  completionPercentage: number;
}

export function OnboardingCheckpoints({
  checkpoints,
  currentPhase,
  onContinue,
  onSkipToNext,
  completionPercentage
}: OnboardingCheckpointsProps) {
  const getPhaseIcon = (phase: 1 | 2 | 3) => {
    switch (phase) {
      case 1:
        return <Zap className="h-5 w-5" />;
      case 2:
        return <Rocket className="h-5 w-5" />;
      case 3:
        return <Trophy className="h-5 w-5" />;
    }
  };

  const getPhaseColor = (phase: 1 | 2 | 3) => {
    switch (phase) {
      case 1:
        return 'from-emerald-500 to-teal-600';
      case 2:
        return 'from-blue-500 to-cyan-600';
      case 3:
        return 'from-purple-500 to-pink-600';
    }
  };

  const getStatusIcon = (status: Checkpoint['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case 'in-progress':
        return <Circle className="h-5 w-5 text-blue-600 fill-blue-600" />;
      case 'available':
        return <Circle className="h-5 w-5 text-gray-400" />;
      case 'locked':
        return <Lock className="h-5 w-5 text-gray-300" />;
    }
  };

  // Group checkpoints by phase
  const phase1 = checkpoints.filter(c => c.phase === 1);
  const phase2 = checkpoints.filter(c => c.phase === 2);
  const phase3 = checkpoints.filter(c => c.phase === 3);

  const phase1Complete = phase1.every(c => c.status === 'completed');
  const phase2Complete = phase2.every(c => c.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-200">
        <CardHeader>
          <CardTitle className="text-lg">Your Onboarding Journey</CardTitle>
          <CardDescription>
            Complete milestones at your own pace. Start using features as you unlock them!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                {Math.round(completionPercentage)}%
              </span>
            </div>
            <Progress value={completionPercentage} className="h-3" />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="font-semibold text-emerald-600">Phase 1</p>
              <p className="text-gray-500">{phase1Complete ? 'Complete ✓' : 'Essential'}</p>
            </div>
            <div>
              <p className="font-semibold text-blue-600">Phase 2</p>
              <p className="text-gray-500">{phase2Complete ? 'Complete ✓' : 'Quick Wins'}</p>
            </div>
            <div>
              <p className="font-semibold text-purple-600">Phase 3</p>
              <p className="text-gray-500">Full Power</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase 1: Essential */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className={cn('w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white', getPhaseColor(1))}>
            {getPhaseIcon(1)}
          </div>
          <div>
            <h3 className="font-semibold text-lg">Phase 1: Essential Setup</h3>
            <p className="text-sm text-gray-500">Get started in 3 minutes – unlock basic features</p>
          </div>
          {phase1Complete && (
            <Badge className="ml-auto bg-emerald-600">✓ Complete</Badge>
          )}
        </div>

        <div className="space-y-2 pl-12">
          {phase1.map((checkpoint) => (
            <CheckpointCard
              key={checkpoint.id}
              checkpoint={checkpoint}
              onContinue={() => onContinue(checkpoint.id)}
            />
          ))}
        </div>

        {phase1Complete && !phase2Complete && (
          <Card className="ml-12 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0">
                  <Rocket className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    Phase 1 Complete! You can now use the platform. 🎉
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Continue to Phase 2 to unlock automated features, or start using the platform now.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={onSkipToNext}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Continue to Phase 2
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = '/dashboard'}
                    >
                      Start Using Platform
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Phase 2: Quick Wins */}
      {phase1Complete && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className={cn('w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white', getPhaseColor(2))}>
              {getPhaseIcon(2)}
            </div>
            <div>
              <h3 className="font-semibold text-lg">Phase 2: Quick Wins</h3>
              <p className="text-sm text-gray-500">Enable automation – save hours every week</p>
            </div>
            {phase2Complete && (
              <Badge className="ml-auto bg-blue-600">✓ Complete</Badge>
            )}
          </div>

          <div className="space-y-2 pl-12">
            {phase2.map((checkpoint) => (
              <CheckpointCard
                key={checkpoint.id}
                checkpoint={checkpoint}
                onContinue={() => onContinue(checkpoint.id)}
              />
            ))}
          </div>

          {phase2Complete && (
            <Card className="ml-12 bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-purple-900 dark:text-purple-100">
                      Phase 2 Complete! Automation is now active. 🚀
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                      Continue to Phase 3 for full power, or start benefiting from automation now.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        onClick={onSkipToNext}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Continue to Phase 3
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.location.href = '/dashboard'}
                      >
                        See Automation in Action
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Phase 3: Full Power */}
      {phase2Complete && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className={cn('w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white', getPhaseColor(3))}>
              {getPhaseIcon(3)}
            </div>
            <div>
              <h3 className="font-semibold text-lg">Phase 3: Full Power</h3>
              <p className="text-sm text-gray-500">Optional – unlock all integrations</p>
            </div>
            <Badge className="ml-auto" variant="secondary">Optional</Badge>
          </div>

          <div className="space-y-2 pl-12">
            {phase3.map((checkpoint) => (
              <CheckpointCard
                key={checkpoint.id}
                checkpoint={checkpoint}
                onContinue={() => onContinue(checkpoint.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Individual Checkpoint Card
function CheckpointCard({
  checkpoint,
  onContinue
}: {
  checkpoint: Checkpoint;
  onContinue: () => void;
}) {
  const isLocked = checkpoint.status === 'locked';
  const isCompleted = checkpoint.status === 'completed';

  return (
    <Card
      className={cn(
        'transition-all',
        isLocked && 'opacity-50',
        isCompleted && 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Status Icon */}
          <div className="shrink-0 mt-0.5">
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : isLocked ? (
              <Lock className="h-5 w-5 text-gray-300" />
            ) : (
              <Circle className={cn(
                'h-5 w-5',
                checkpoint.status === 'in-progress' ? 'text-blue-600 fill-blue-600' : 'text-gray-400'
              )} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-medium">{checkpoint.title}</h4>
                <p className="text-sm text-gray-500 mt-0.5">{checkpoint.description}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                <Clock className="h-3 w-3" />
                <span>{checkpoint.estimatedTime}</span>
              </div>
            </div>

            {/* Benefits */}
            {!isCompleted && checkpoint.benefits.length > 0 && (
              <ul className="mt-2 space-y-1">
                {checkpoint.benefits.map((benefit, idx) => (
                  <li key={idx} className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Action Button */}
            {!isLocked && !isCompleted && (
              <Button
                size="sm"
                onClick={onContinue}
                className="mt-3"
                variant={checkpoint.status === 'in-progress' ? 'default' : 'outline'}
              >
                {checkpoint.status === 'in-progress' ? 'Continue' : 'Start'}
              </Button>
            )}

            {isCompleted && (
              <Badge className="mt-2 bg-emerald-600">✓ Saved</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
