import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

const VARIANTS = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
  secondary:
    'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus-visible:ring-primary-500',
  danger: 'bg-danger-500 text-white hover:bg-danger-700 focus-visible:ring-danger-500',
  ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400',
  link: 'text-primary-600 hover:text-primary-700 hover:underline px-0 py-0',
}

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
  icon: 'h-9 w-9 p-0',
}

/**
 * <Button variant="primary|secondary|danger|ghost|link" size="sm|md|lg|icon"
 *         icon={Plus} loading={bool} fullWidth>Save</Button>
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-control font-medium whitespace-nowrap transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        variant !== 'link' && SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        Icon && <Icon className="h-4 w-4" />
      )}
      {children}
      {IconRight && !loading && <IconRight className="h-4 w-4" />}
    </button>
  )
}
