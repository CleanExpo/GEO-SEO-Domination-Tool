'use client';

/**
 * Progressive Credential Card
 *
 * Minimizes visual overwhelm by:
 * - Collapsing credential sections by default
 * - Showing only relevant fields
 * - Progressive disclosure: basic → advanced
 * - Visual progress indicators
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Lock, CheckCircle2, AlertCircle, HelpCircle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProgressiveCredentialCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  optional?: boolean;
  estimatedValue?: string; // e.g., "Saves 2 hours/week"
  completionStatus?: 'not-started' | 'in-progress' | 'complete';
  helpText?: string;
  videoUrl?: string;
  onAskAssistant?: () => void;
  defaultExpanded?: boolean;
}

export function ProgressiveCredentialCard({
  title,
  description,
  icon,
  children,
  optional = false,
  estimatedValue,
  completionStatus = 'not-started',
  helpText,
  videoUrl,
  onAskAssistant,
  defaultExpanded = false
}: ProgressiveCredentialCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showHelp, setShowHelp] = useState(false);

  const getStatusColor = () => {
    switch (completionStatus) {
      case 'complete':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'in-progress':
        return 'text-amber-600 dark:text-amber-400';
      default:
        return 'text-gray-400 dark:text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (completionStatus) {
      case 'complete':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'in-progress':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        isExpanded ? 'ring-2 ring-emerald-200 dark:ring-emerald-800' : '',
        completionStatus === 'complete' ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
      )}
    >
      <CardHeader
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            {/* Icon */}
            <div className={cn('mt-1', getStatusColor())}>
              {icon}
            </div>

            {/* Title and Description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base">{title}</CardTitle>
                {optional && (
                  <Badge variant="secondary" className="text-xs">
                    Optional
                  </Badge>
                )}
                {estimatedValue && (
                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                    {estimatedValue}
                  </Badge>
                )}
              </div>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>

            {/* Status Indicator */}
            <div className={cn('flex items-center gap-2 shrink-0', getStatusColor())}>
              {getStatusIcon()}
              {isExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions (always visible) */}
        {!isExpanded && completionStatus !== 'complete' && (
          <div className="flex items-center gap-2 mt-3">
            {onAskAssistant && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAskAssistant();
                }}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Need Help?
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
            >
              {completionStatus === 'not-started' ? 'Get Started' : 'Continue'}
            </Button>
          </div>
        )}
      </CardHeader>

      {/* Expandable Content */}
      {isExpanded && (
        <CardContent className="pt-0 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Security Notice */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-md text-sm">
            <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-blue-800 dark:text-blue-200">
              All credentials are encrypted with AES-256-GCM and stored securely. You can revoke access anytime.
            </p>
          </div>

          {/* Help Section */}
          {helpText && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(!showHelp)}
                className="h-auto py-1 px-2 text-xs"
              >
                <HelpCircle className="h-3 w-3 mr-1" />
                {showHelp ? 'Hide' : 'Show'} Tips
              </Button>
              {showHelp && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-md text-sm text-amber-800 dark:text-amber-200">
                  {helpText}
                </div>
              )}
            </div>
          )}

          {/* AI Assistant Button */}
          {onAskAssistant && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAskAssistant}
              className="w-full"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Ask AI Assistant for Help
            </Button>
          )}

          {/* Credential Fields */}
          <div className="space-y-4">
            {children}
          </div>

          {/* Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="w-full"
          >
            Collapse
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
