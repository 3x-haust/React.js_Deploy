import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'building' | 'ready' | 'error' | 'queued';
  className?: string;
}

const statusConfig = {
  building: {
    label: 'Building',
    dotClass: 'bg-warning animate-pulse-dot',
    textClass: 'text-warning',
  },
  ready: {
    label: 'Ready',
    dotClass: 'bg-success',
    textClass: 'text-success',
  },
  error: {
    label: 'Error',
    dotClass: 'bg-destructive',
    textClass: 'text-destructive',
  },
  queued: {
    label: 'Queued',
    dotClass: 'bg-muted-foreground',
    textClass: 'text-muted-foreground',
  },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('h-2 w-2 rounded-full', config.dotClass)} />
      <span className={cn('text-sm font-medium', config.textClass)}>
        {config.label}
      </span>
    </div>
  );
};
