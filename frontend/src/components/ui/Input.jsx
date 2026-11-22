import { useId } from 'react'
import Field from './Field'
import { controlClass } from './controlClass'
import { cn } from '@/utils/cn'

/**
 * <Input label="Phone" name="phone" value={v} onChange={e => ...} error="Required" icon={Phone} />
 * trailing = something shown inside the box on the right, e.g. a show/hide password button
 */
export default function Input({ label, error, hint, required, icon: Icon, trailing, className, id, ...props }) {
  const autoId = useId()
  const inputId = id || autoId
  return (
    <Field label={label} htmlFor={inputId} error={error} hint={hint} required={required} className={className}>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        )}
        <input
          id={inputId}
          required={required}
          className={cn(controlClass(error), 'h-10', Icon && 'pl-9', trailing && 'pr-10')}
          {...props}
        />
        {trailing && <div className="absolute inset-y-0 right-0 flex items-center pr-2">{trailing}</div>}
      </div>
    </Field>
  )
}
