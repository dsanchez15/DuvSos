import { SelectHTMLAttributes, useId } from 'react'
import { FieldWrapper, type FieldSize } from './Input'

const baseSelectClasses =
  'w-full rounded-[8px] border border-border bg-bg-input text-text-primary focus:outline-none focus:border-border-strong transition-colors disabled:opacity-50'

const sizeClasses: Record<FieldSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5',
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  fieldSize?: FieldSize
}

export function Select({ label, error, fieldSize = 'md', className = '', id, children, ...props }: SelectProps) {
  const autoId = useId()
  const selectId = id ?? autoId
  const field = (
    <select id={selectId} className={`${baseSelectClasses} ${sizeClasses[fieldSize]} ${className}`} {...props}>
      {children}
    </select>
  )
  if (!label && !error) return field
  return (
    <FieldWrapper label={label} error={error} htmlFor={selectId}>
      {field}
    </FieldWrapper>
  )
}

export default Select
