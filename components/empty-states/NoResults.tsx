import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface NoResultsProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export function NoResults({
  title = "No results found",
  description = "We couldn't find any results matching your search. Try adjusting your filters.",
  actionLabel = "Clear Filters",
  onAction,
  actionHref,
}: NoResultsProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <SearchX className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {description}
        </p>
        {(onAction || actionHref) && (
          <Button
            onClick={onAction}
            
          >
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
