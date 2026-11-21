import { TONE_CLASSES, statusLabel, statusTone } from '@/constants/status'
import { cn } from '@/utils/cn'

/**
 * <Badge status="in_progress" />          -> amber "In progress"
 * <Badge tone="green">Custom</Badge>      -> explicit tone
 */
export default function Badge({ status, tone, children, dot = true, className }) {
  const t = tone || statusTone(status)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        TONE_CLASSES[t] ?? TONE_CLASSES.gray,
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children ?? statusLabel(status)}
    </span>
  )
}
