import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TreePine, CalendarDays, HardDrive } from 'lucide-react'
import { storageService } from '@/services/storage/DexieStorageService'
import { useSeason } from '@/hooks/useSeason'
import { useBonsaiStore } from '@/store/bonsaiStore'
import { useAppStore } from '@/store/appStore'

const SESSION_KEY = 'niwamiri_welcome_shown'
const BACKUP_WARN_DAYS = 7

const SEASON_GREETINGS: Record<string, { emoji: string; es: string; en: string }> = {
  spring: { emoji: '🌸', es: '¡Bienvenido a la primavera!', en: 'Welcome to spring!' },
  summer: { emoji: '☀️', es: '¡Bienvenido al verano!',     en: 'Welcome to summer!'  },
  autumn: { emoji: '🍂', es: '¡Bienvenido al otoño!',      en: 'Welcome to autumn!'  },
  winter: { emoji: '❄️', es: '¡Bienvenido al invierno!',   en: 'Welcome to winter!'  },
}

export default function WelcomeScreen() {
  const { i18n } = useTranslation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'es'
  const navigate = useNavigate()
  const season = useSeason()
  const { bonsais } = useBonsaiStore()
  const config = useAppStore((s) => s.config)

  const [visible, setVisible] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [countdown, setCountdown] = useState(6)

  // Mostrar solo una vez por sesión
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return
    sessionStorage.setItem(SESSION_KEY, '1')

    const now = Date.now()
    storageService.getEventsByDateRange(0, now).then((events) => {
      const overdue = events.filter((e) => !e.completed && e.date <= now).length
      setPendingCount(overdue)
    }).catch(() => {})

    setVisible(true)
  }, [])

  // Cuenta regresiva y auto-cierre
  useEffect(() => {
    if (!visible) return
    if (countdown <= 0) { setVisible(false); return }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [visible, countdown])

  if (!visible) return null

  const greeting = SEASON_GREETINGS[season]
  const showBackupWarning = (() => {
    if (!config?.lastBackupAt) return true
    return Date.now() - config.lastBackupAt > BACKUP_WARN_DAYS * 24 * 60 * 60 * 1000
  })()

  function dismiss() { setVisible(false) }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-sm rounded-3xl flex flex-col gap-5 p-6"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        {/* Saludo estacional */}
        <div className="text-center">
          <p className="text-4xl mb-2">{greeting.emoji}</p>
          <p className="text-lg font-bold" style={{ color: 'var(--text1)' }}>
            {lang === 'es' ? greeting.es : greeting.en}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>
            NiwaMirî
          </p>
        </div>

        {/* Resumen colección */}
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}
        >
          <TreePine size={18} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
          <p className="text-sm" style={{ color: 'var(--text2)' }}>
            {lang === 'es'
              ? `${bonsais.length} árbol${bonsais.length !== 1 ? 'es' : ''} en tu colección`
              : `${bonsais.length} tree${bonsais.length !== 1 ? 's' : ''} in your collection`}
          </p>
        </div>

        {/* Cuidados vencidos */}
        {pendingCount > 0 && (
          <button
            onClick={() => { dismiss(); navigate('/calendar') }}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left"
            style={{ background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.3)' }}
          >
            <CalendarDays size={18} style={{ color: 'rgb(251,146,60)', flexShrink: 0 }} />
            <p className="text-sm font-medium" style={{ color: 'rgb(251,146,60)' }}>
              {lang === 'es'
                ? `${pendingCount} cuidado${pendingCount !== 1 ? 's' : ''} vencido${pendingCount !== 1 ? 's' : ''}`
                : `${pendingCount} overdue care${pendingCount !== 1 ? 's' : ''}`}
            </p>
          </button>
        )}

        {/* Recordatorio de backup */}
        {showBackupWarning && (
          <button
            onClick={() => { dismiss(); navigate('/settings/backup') }}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)' }}
          >
            <HardDrive size={18} style={{ color: 'rgb(129,140,248)', flexShrink: 0 }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'rgb(129,140,248)' }}>
                {lang === 'es' ? 'Hacer backup' : 'Back up your data'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text3)' }}>
                {config?.lastBackupAt
                  ? (lang === 'es' ? `Hace más de ${BACKUP_WARN_DAYS} días` : `Over ${BACKUP_WARN_DAYS} days ago`)
                  : (lang === 'es' ? 'Sin backup registrado' : 'No backup on record')}
              </p>
            </div>
          </button>
        )}

        {/* Botón Entrar */}
        <button
          onClick={dismiss}
          className="h-12 w-full rounded-2xl text-sm font-semibold"
          style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
        >
          {lang === 'es' ? `Entrar${countdown > 0 ? ` (${countdown})` : ''}` : `Enter${countdown > 0 ? ` (${countdown})` : ''}`}
        </button>
      </div>
    </div>
  )
}
