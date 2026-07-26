import { TextareaHTMLAttributes, useId } from 'react'
import { FieldWrapper } from './Input'

const baseTextareaClasses =
  'w-full rounded-[8px] border border-border bg-bg-input text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-strong transition-colors disabled:opacity-50 px-4 py-2.5'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className = '', id, rows = 3, ...props }: TextareaProps) {
  const autoId = useId()
  const textareaId = id ?? autoId
  const field = (
    <textarea id={textareaId} rows={rows} className={`${baseTextareaClasses} ${className}`} {...props} />
  )
  if (!label && !error) return field
  return (
    <FieldWrapper label={label} error={error} htmlFor={textareaId}>
      {field}
    </FieldWrapper>
  )
}

export default Textarea
