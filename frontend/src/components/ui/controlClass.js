import { cn } from '@/utils/cn'

/** Shared input/select/textarea styling. */
export const controlClass = (error) =>
  cn(
    'block w-full rounded-control border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400',
    'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500',
    'disabled:bg-slate-100 disabled:text-slate-500',
    error ? 'border-danger-500' : 'border-slate-300',
  )
