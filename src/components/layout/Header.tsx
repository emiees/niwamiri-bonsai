import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import LogoSVG from '@/components/logo/LogoSVG'

interface HeaderProps {
  /** Page title. If omitted, the NiwaMirî logo is shown instead. */
  title?: string
  /** Show a back chevron that calls navigate(-1). */
  showBack?: boolean
  /** Slot for action buttons/icons on the right side. */
  actions?: React.ReactNode
  /** Ocultar el botón de ajustes (usar en la propia página de Settings). */
  hideSettings?: boolean
  className?: string
}

export default function Header({ title, showBack = false, actions, hideSettings = false, className }: HeaderProps) {
  const navigate = useNavigate()

  return (
    <header
      style={{
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        paddingTop: 'env(safe-area-inset-top)',
      }}
      className={cn('fixed left-0 right-0 top-0 z-40', className)}
    >
      {/* Fila de navegación — altura fija debajo del safe area */}
      <div className="flex h-14 items-center px-4">
      {/* Left — back button or logo */}
      <div className="w-10">
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors active:bg-white/10"
            aria-label="Volver"
          >
            <ChevronLeft size={24} style={{ color: 'var(--text1)' }} strokeWidth={2} />
          </button>
        ) : (
          <button
            onClick={() => navigate('/')}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors active:bg-white/10"
            aria-label="Ir al inventario"
          >
            <LogoSVG size={32} />
          </button>
        )}
      </div>

      {/* Center — title or app name */}
      <div className="flex flex-1 justify-center">
        {title ? (
          <h1
            className="text-base font-semibold leading-tight"
            style={{ color: 'var(--text1)', fontFamily: 'DM Sans, sans-serif' }}
          >
            {title}
          </h1>
        ) : (
          <span
            className="text-lg font-medium italic"
            style={{ color: 'var(--text1)', fontFamily: 'Fraunces, serif' }}
          >
            NiwaMirî
          </span>
        )}
      </div>

      {/* Right — action slot + ajustes */}
      <div className="flex min-w-[40px] items-center justify-end gap-1">
        {actions}
        {!hideSettings && (
          <button
            onClick={() => navigate('/settings')}
            className="rounded-full p-2"
            style={{ color: 'var(--text2)' }}
            aria-label="Ajustes"
          >
            <Settings size={20} />
          </button>
        )}
      </div>
      </div>
    </header>
  )
}
