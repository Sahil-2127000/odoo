import { useId } from 'react'
import Field from './Field'
import { controlClass } from './controlClass'
import { cn } from '@/utils/cn'

/**
 * <Select label="Status" value={v} onChange={e => ...}
 *         options={[{ value: 'new', label: 'New' }] | ['new', 'contacted']}
 *         placeholder="All statuses" />
 */
export default function Select({
  label,
  error,
  hint,
  required,
  options = [],
  placeholder,
  className,
  id,
  ...props
}) {
  const autoId = useId()
  const selectId = id || autoId
  return (
    <Field label={label} htmlFor={selectId} error={error} hint={hint} required={required} className={className}>
      <select id={selectId} required={required} className={cn(controlClass(error), 'h-10 pr-8')} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const o = typeof opt === 'object' ? opt : { value: opt, label: opt }
          return (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          )
        })}
      </select>
    </Field>
  )
}
