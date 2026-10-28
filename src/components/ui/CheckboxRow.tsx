interface CheckboxRowProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

// Comparte la presentación del check de visibilidad de la selección masiva.
export default function CheckboxRow({ label, checked, onChange }: CheckboxRowProps) {
  return (
    <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text2)' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  )
}
