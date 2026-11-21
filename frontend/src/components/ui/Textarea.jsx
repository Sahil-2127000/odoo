import { useId } from 'react'
import Field from './Field'
import { controlClass } from './controlClass'
import { cn } from '@/utils/cn'

export default function Textarea({ label, error, hint, required, rows = 3, className, id, ...props }) {
  const autoId = useId()
  const textareaId = id || autoId
  return (
    <Field label={label} htmlFor={textareaId} error={error} hint={hint} required={required} className={className}>
      <textarea id={textareaId} rows={rows} required={required} className={cn(controlClass(error), 'py-2')} {...props} />
    </Field>
  )
}
