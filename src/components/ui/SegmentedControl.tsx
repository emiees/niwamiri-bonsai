import { cn } from '@/lib/utils'

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div
      className="flex rounded-lg p-0.5"
      style={{ background: 'var(--bg3)' }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150',
            value === opt.value
              ? 'bg-[var(--color-accent)] text-[var(--green1)] shadow-sm'
              : 'text-[var(--text2)] hover:text-[var(--text1)]'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
