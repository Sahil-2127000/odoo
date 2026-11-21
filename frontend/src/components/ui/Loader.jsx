import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * <Loader />                 inline spinner
 * <Loader label="Loading leads..." />
 * <Loader fullPage />         centered in the viewport
 */
export default function Loader({ label, fullPage = false, size = 'md', className }) {
  const iconSize = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }[size]
  const content = (
    <div className={cn('flex items-center justify-center gap-2 text-slate-500', className)}>
      <Loader2 className={cn('animate-spin text-primary-600', iconSize)} />
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
  if (fullPage) return <div className="flex min-h-screen items-center justify-center">{content}</div>
  return content
}

/** Grey placeholder block: <Skeleton className="h-6 w-32" /> */
export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded bg-slate-200', className)} />
}
