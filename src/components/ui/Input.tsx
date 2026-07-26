import { InputHTMLAttributes, useId } from 'react'

const baseFieldClasses =
  'w-full rounded-[8px] border border-border bg-bg-input text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-strong transition-colors disabled:opacity-50'

const sizeClasses = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5',
} as const

export type FieldSize = keyof typeof sizeClasses

export interface FieldWrapperProps {
  label?: string
  error?: string
  htmlFor?: string
  children: React.ReactNode
}

export function FieldWrapper({ label, error, htmlFor, children }: FieldWrapperProps) {
  return (
    <div>
      {label && (
        <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      {children}
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  )
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  fieldSize?: FieldSize
}

export function Input({ label, error, fieldSize = 'md', className = '', id, ...props }: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const field = (
    <input id={inputId} className={`${baseFieldClasses} ${sizeClasses[fieldSize]} ${className}`} {...props} />
  )
  if (!label && !error) return field
  return (
    <FieldWrapper label={label} error={error} htmlFor={inputId}>
      {field}
    </FieldWrapper>
  )
}

export default Input
