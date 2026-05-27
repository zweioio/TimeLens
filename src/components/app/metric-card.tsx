import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';

interface MetricCardProps {
  icon: ReactNode;
  title: string;
  description?: string;
  value: string;
  extra?: ReactNode;
  iconClassName?: string;
}

export function MetricCard({
  icon,
  title,
  description,
  value,
  extra,
  iconClassName = 'bg-primary/10 text-primary'
}: MetricCardProps) {
  return (
    <Card className="rounded-3xl border-white/70 shadow-[0_12px_36px_rgba(15,23,42,0.05)]">
      <CardContent className="flex items-center gap-5 p-6">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconClassName}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="mt-1 text-3xl font-bold text-gray-900">{value}</div>
          {description ? <CardDescription className="mt-2">{description}</CardDescription> : null}
          {extra ? <div className="mt-3">{extra}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}
