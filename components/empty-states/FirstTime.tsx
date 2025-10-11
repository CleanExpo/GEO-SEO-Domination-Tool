import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface FirstTimeProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  steps?: string[];
}

export function FirstTime({
  title = "Welcome! Let's get started",
  description = "This is your first time here. Follow these steps to begin your journey.",
  actionLabel = "Get Started",
  onAction,
  actionHref,
  steps = [
    "Complete your profile setup",
    "Configure your preferences",
    "Explore the features",
  ],
}: FirstTimeProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 mb-4">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {description}
        </p>
        {steps && steps.length > 0 && (
          <div className="mb-6 space-y-2 text-left w-full max-w-sm">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {index + 1}
                </div>
                <p className="text-sm text-muted-foreground pt-0.5">{step}</p>
              </div>
            ))}
          </div>
        )}
        {(onAction || actionHref) && (
          <Button
            onClick={onAction}
            size="lg"
          >
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
