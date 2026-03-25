import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import LogoSVG from '@/components/logo/LogoSVG'

interface HeaderProps {
  /** Page title. If omitted, the NiwaMirî logo is shown instead. */
  title?: string
  /** Show a back chevron that calls navigate(-1). */
  showBack?: boolean
  /** Slot for action buttons/icons on the right side. */
  actions?: React.ReactNode
  className?: string
}

export default function Header({ title, showBack = false, actions, className }: HeaderProps) {
  const navigate = useNavigate()

  return (
    <header
      style={{
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        paddingTop: 'env(safe-area-inset-top)',
      }}
      className={cn('fixed left-0 right-0 top-0 z-40 flex h-14 items-center px-4', className)}
    >
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
          <LogoSVG size={32} />
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

      {/* Right — action slot */}
      <div className="flex w-10 items-center justify-end gap-1">
        {actions}
      </div>
    </header>
  )
}
