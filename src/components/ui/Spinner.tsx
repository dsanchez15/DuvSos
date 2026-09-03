export type SpinnerSize = 'sm' | 'md' | 'lg'

export interface SpinnerProps {
  size?: SpinnerSize
  label?: string
  className?: string
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

export function Spinner({ size = 'md', label = 'Cargando…', className = '' }: SpinnerProps) {
  return (
    <div role="status" aria-label={label} className={`flex items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-primary ${sizeClasses[size]}`} />
    </div>
  )
}

export default Spinner
