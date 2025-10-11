import { FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface NoDataProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export function NoData({
  title = "No data available",
  description = "There is no data to display at the moment. Start by adding your first item.",
  actionLabel = "Add New Item",
  onAction,
  actionHref,
}: NoDataProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <FileX className="h-8 w-8 text-muted-foreground" />
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
