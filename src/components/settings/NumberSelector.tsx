'use client'

interface NumberSelectorProps {
  options: number[]
  value: number
  onChange: (value: number) => void
  ariaLabel?: string
}

export default function NumberSelector({ options, value, onChange, ariaLabel }: NumberSelectorProps) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label={ariaLabel}>
      {options.map((num) => (
        <button
          key={num}
          onClick={() => onChange(num)}
          className={`h-10 w-10 rounded-[8px] border-2 font-bold transition-all ${
            value === num ? 'border-primary bg-primary/10 text-primary' : 'settings-num-btn-inactive'
          }`}
          style={value !== num ? { borderColor: 'var(--color-border)' } : undefined}
        >
          {num}
        </button>
      ))}
    </div>
  )
}
