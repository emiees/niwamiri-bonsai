import { useId } from 'react'

// Referencia visual: tarjeta de Recordatorio de seguimiento del formulario individual.
export default function CareSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const id = useId()
  return (
    <section
      aria-labelledby={id}
      className="overflow-hidden rounded-2xl"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="px-4 py-3">
        <h2
          id={id}
          className="mb-3 text-xs font-semibold uppercase tracking-wide"
          style={{ color: 'var(--text3)' }}
        >
          {title}
        </h2>
        <div className="flex flex-col gap-3">{children}</div>
      </div>
    </section>
  )
}
