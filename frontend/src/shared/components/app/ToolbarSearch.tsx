import { Search } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

import { cn } from '@/shared/lib/utils';

type ToolbarSearchProps = InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export function ToolbarSearch({ className, ...props }: ToolbarSearchProps) {
  return (
    <label className={cn('flex max-w-sm items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2', className)}>
      <Search aria-hidden="true" className="h-4 w-4 text-slate-400" />
      <input className="w-full bg-transparent text-sm outline-none" {...props} />
    </label>
  );
}
