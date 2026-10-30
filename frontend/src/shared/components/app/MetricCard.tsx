import type { ComponentType, ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';

type MetricCardProps = {
  label: string;
  value: ReactNode;
  detail?: string;
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  tone?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate';
  className?: string;
};

const toneClasses = {
  cyan: 'bg-cyan-50 text-cyan-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  rose: 'bg-rose-50 text-rose-700',
  slate: 'bg-slate-100 text-slate-700',
};

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'cyan',
  className,
}: MetricCardProps) {
  return (
    <article className={cn('rounded-xl border border-slate-200 bg-white p-5 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <strong className="mt-2 block text-3xl text-slate-950">{value}</strong>
        </div>
        {Icon ? (
          <span className={cn('rounded-lg p-2', toneClasses[tone])}>
            <Icon aria-hidden className="h-5 w-5" />
          </span>
        ) : null}
      </div>
      {detail ? <p className="mt-3 text-sm text-slate-500">{detail}</p> : null}
    </article>
  );
}
