import { ChevronDown } from 'lucide-react'

interface SelectRowProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  id?: string
}

export default function SelectRow<T extends string>({
  options,
  value,
  onChange,
  id,
}: SelectRowProps<T>) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full appearance-none rounded-lg px-3 py-2 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        style={{
          background: 'var(--bg3)',
          color: 'var(--text1)',
          border: '1px solid var(--border)',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
        style={{ color: 'var(--text3)' }}
      />
    </div>
  )
}
