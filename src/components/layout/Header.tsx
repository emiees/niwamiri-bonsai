import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import LogoSVG from '@/components/logo/LogoSVG'
import { useSeason } from '@/hooks/useSeason'
import { useBonsaiStore } from '@/store/bonsaiStore'
import { storageService } from '@/services/storage/DexieStorageService'
import { formatDate } from '@/utils/dates'
import type { CalendarEvent } from '@/db/schema'

const SEASON_EMOJI: Record<string, string> = {
  spring: '🌸',
  summer: '☀️',
  autumn: '🍂',
  winter: '❄️',
}

const SEASON_NAMES: Record<string, { es: string; en: string }> = {
  spring: { es: 'Primavera', en: 'Spring' },
  summer: { es: 'Verano',    en: 'Summer' },
  autumn: { es: 'Otoño',     en: 'Autumn' },
  winter: { es: 'Invierno',  en: 'Winter' },
}

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
  const { i18n } = useTranslation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'es'
  const season = useSeason()
  const { bonsais } = useBonsaiStore()

  const [pendingEvents, setPendingEvents] = useState<CalendarEvent[]>([])
  const [showPending, setShowPending] = useState(false)

  useEffect(() => {
    const now = Date.now()
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    storageService.getEventsByDateRange(0, now + sevenDays).then((events) => {
      const pending = events
        .filter((e) => !e.completed && e.date <= now + sevenDays)
        .sort((a, b) => a.date - b.date)
      setPendingEvents(pending)
    }).catch(() => {})
  }, [])

  // Urgencia del chip
  const todayStart = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime() })()
  const todayEnd = todayStart + 24 * 60 * 60 * 1000 - 1
  const hasOverdue = pendingEvents.some((ev) => ev.date < todayStart)
  const hasToday   = !hasOverdue && pendingEvents.some((ev) => ev.date >= todayStart && ev.date <= todayEnd)

  const chipEmoji = hasOverdue ? '🚨' : hasToday ? '⏰' : '🗓️'
  const chipBg    = hasOverdue ? 'rgba(239,68,68,0.15)'  : hasToday ? 'rgba(251,146,60,0.15)'  : 'var(--bg3)'
  const chipColor = hasOverdue ? 'rgb(239,68,68)'        : hasToday ? 'rgb(251,146,60)'         : 'var(--text2)'
  const chipPulse = hasOverdue ? ' animate-pulse' : ''

  return (
    <>
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

          {/* Right — action slot + chip pendientes + estación + ajustes */}
          <div className="flex min-w-[40px] items-center justify-end gap-1">
            {actions}
            {!hideSettings && pendingEvents.length > 0 && (
              <button
                onClick={() => setShowPending(true)}
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium${chipPulse}`}
                style={{ background: chipBg, color: chipColor }}
              >
                {chipEmoji} {pendingEvents.length}
              </button>
            )}
            {!hideSettings && (
              <span
                className="select-none px-1 text-base leading-none"
                title={SEASON_NAMES[season][lang]}
                aria-label={SEASON_NAMES[season][lang]}
              >
                {SEASON_EMOJI[season]}
              </span>
            )}
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

      {/* Sheet de pendientes */}
      {showPending && (
        <>
          <div className="fixed inset-0 z-[55] bg-black/50" onClick={() => setShowPending(false)} />
          <div
            className="fixed bottom-0 left-0 right-0 z-[60] flex flex-col rounded-t-3xl"
            style={{ background: 'var(--bg)', maxHeight: '70dvh' }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
            </div>
            <div className="flex items-center justify-between px-5 pb-3">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text1)' }}>
                {lang === 'es' ? 'Pendientes' : 'Pending'}
              </h2>
              <button
                onClick={() => { setShowPending(false); navigate('/calendar') }}
                className="text-xs font-medium"
                style={{ color: 'var(--color-accent)' }}
              >
                {lang === 'es' ? 'Ver calendario →' : 'View calendar →'}
              </button>
            </div>
            <div className="overflow-y-auto pb-8">
              {pendingEvents.map((ev) => {
                const bonsai = bonsais.find((b) => b.id === ev.bonsaiId)
                const isOverdue = ev.date < todayStart
                const d = new Date(ev.date)
                const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                return (
                  <button
                    key={ev.id}
                    className="flex w-full items-start gap-3 px-5 py-3 text-left active:opacity-70"
                    style={{ borderTop: '1px solid var(--border)' }}
                    onClick={() => { setShowPending(false); navigate('/calendar', { state: { selectDay: dateKey } }) }}
                  >
                    <div
                      className="mt-1 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: isOverdue ? '#ef4444' : 'rgb(251,146,60)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--text1)' }}>{ev.title}</p>
                      {bonsai && (
                        <p className="text-xs" style={{ color: 'var(--text3)' }}>{bonsai.name}</p>
                      )}
                      <p className="text-xs" style={{ color: isOverdue ? '#ef4444' : 'var(--text3)' }}>
                        {formatDate(ev.date)}
                        {isOverdue && (lang === 'es' ? ' · vencido' : ' · overdue')}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}
