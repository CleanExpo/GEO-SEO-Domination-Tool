/**
 * Panel Container
 *
 * Phase 1.1 Day 2: Reusable panel wrapper with header and content
 */

'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PanelContainerProps {
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
}

export function PanelContainer({
  title,
  icon,
  children,
  className,
  actions,
  collapsible,
  collapsed,
  onToggleCollapse,
  onClose,
}: PanelContainerProps) {
  return (
    <div className={cn('h-full flex flex-col bg-background', className)}>
      {/* Panel Header */}
      {title && (
        <div className="h-10 border-b bg-muted/30 flex items-center justify-between px-3">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-1">
            {actions}
            {collapsible && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onToggleCollapse}
              >
                {collapsed ? (
                  <Maximize2 className="h-3 w-3" />
                ) : (
                  <Minimize2 className="h-3 w-3" />
                )}
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onClose}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
