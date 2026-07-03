import * as React from 'react';

import { cn } from '@/lib/utils';

interface StatsCardProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: 'default' | 'warning' | 'danger' | 'success';
}

const TONE: Record<NonNullable<StatsCardProps['tone']>, string> = {
  default: 'text-muted-foreground',
  warning: 'text-brand',
  danger: 'text-destructive',
  success: 'text-success',
};

/** Dashboard metric tile. */
function StatsCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
}: StatsCardProps): React.ReactElement {
  return (
    <div className="border-border bg-background rounded-lg border p-5">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{label}</p>
        {icon ? <span className={cn('[&_svg]:size-4', TONE[tone])}>{icon}</span> : null}
      </div>
      <p className="text-foreground mt-2 text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      {hint ? <p className={cn('mt-1 text-xs', TONE[tone])}>{hint}</p> : null}
    </div>
  );
}

export { StatsCard };
