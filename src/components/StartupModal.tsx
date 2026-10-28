import { useEffect, useId, useRef, type ReactNode } from 'react'
import { APP_VERSION } from '@/utils/appVersion'

interface Props {
  title: string
  subtitle?: string
  actionLabel: string
  onContinue: () => void
  children?: ReactNode
}

// Estructura extraída de la bienvenida: ambos pasos comparten diseño y foco.
export default function StartupModal({ title, subtitle, actionLabel, onContinue, children }: Props) {
  const titleId = useId()
  const cardRef = useRef<HTMLDivElement>(null)
  const actionRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previous = document.activeElement
    actionRef.current?.focus({ preventScroll: true })
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true })
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6"
      style={{
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
        paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const buttons = cardRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
        if (!buttons?.length) return
        const first = buttons[0], last = buttons[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm min-h-0 overflow-y-auto rounded-3xl flex flex-col gap-5 p-6"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', maxHeight: '100%' }}
      >
        <div className="text-center">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="NiwaMirî" className="mx-auto mb-3 h-16 w-16" />
          <p className="text-base font-semibold" style={{ color: 'var(--text2)' }}>
            NiwaMirî <span className="text-xs font-normal" style={{ opacity: 0.6 }}>v{APP_VERSION}</span>
          </p>
          <h2 id={titleId} className="text-xl font-bold mt-2" style={{ color: 'var(--text1)' }}>{title}</h2>
          {subtitle && <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>{subtitle}</p>}
        </div>
        {children}
        <button
          ref={actionRef}
          onClick={onContinue}
          className="h-12 w-full shrink-0 rounded-2xl text-sm font-semibold"
          style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}
