import { cn } from '@/shared/lib/utils';

type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

type StatusBadgeProps = {
  children: string;
  tone?: StatusTone;
  className?: string;
};

const toneClasses: Record<StatusTone, string> = {
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
  info: 'bg-cyan-50 text-cyan-800',
  neutral: 'bg-slate-100 text-slate-700',
};

export function statusToneFromText(status: string): StatusTone {
  const normalized = status.toLowerCase();

  if (normalized.includes('aprov') || normalized.includes('publicado') || normalized.includes('confirmado')) {
    return 'success';
  }

  if (normalized.includes('pendente') || normalized.includes('rascunho') || normalized.includes('aberta')) {
    return 'warning';
  }

  if (normalized.includes('rejeitado') || normalized.includes('erro') || normalized.includes('cancelado')) {
    return 'danger';
  }

  if (normalized.includes('análise') || normalized.includes('analise')) {
    return 'info';
  }

  return 'neutral';
}

export function StatusBadge({ children, tone = statusToneFromText(children), className }: StatusBadgeProps) {
  return (
    <span className={cn('inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold', toneClasses[tone], className)}>
      {children}
    </span>
  );
}
