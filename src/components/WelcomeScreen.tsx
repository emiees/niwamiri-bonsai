import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TreePine, CalendarDays, HardDrive } from 'lucide-react'
import { storageService } from '@/services/storage/DexieStorageService'
import { db } from '@/db/schema'
import { useSeason } from '@/hooks/useSeason'
import { useBonsaiStore } from '@/store/bonsaiStore'
import { useAppStore } from '@/store/appStore'

const SESSION_KEY = 'niwamiri_welcome_shown'

const SEASON_GREETINGS: Record<string, { emoji: string; es: string; en: string }> = {
  spring: { emoji: '🌸', es: '¡Bienvenido a la primavera!', en: 'Welcome to spring!' },
  summer: { emoji: '☀️', es: '¡Bienvenido al verano!',     en: 'Welcome to summer!'  },
  autumn: { emoji: '🍂', es: '¡Bienvenido al otoño!',      en: 'Welcome to autumn!'  },
  winter: { emoji: '❄️', es: '¡Bienvenido al invierno!',   en: 'Welcome to winter!'  },
}

// Cuenta registros nuevos (cuidados + fotos + notas de clase) desde un timestamp
async function countNewRecordsSince(since: number): Promise<{ cares: number; photos: number; notes: number }> {
  const [cares, photos, notes] = await Promise.all([
    db.cares.where('date').above(since).count(),
    db.photos.where('takenAt').above(since).count(),
    db.classNotes.where('classDate').above(since).count(),
  ])
  return { cares, photos, notes }
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
  const [countdown, setCountdown] = useState(10)
  const [newRecords, setNewRecords] = useState<{ cares: number; photos: number; notes: number } | null>(null)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return
    sessionStorage.setItem(SESSION_KEY, '1')

    const now = Date.now()

    // Cuidados vencidos en el calendario
    storageService.getEventsByDateRange(0, now).then((events) => {
      const overdue = events.filter((e) => !e.completed && e.date <= now).length
      setPendingCount(overdue)
    }).catch(() => {})

    // Registros nuevos desde el último backup
    const since = config?.lastBackupAt ?? 0
    countNewRecordsSince(since).then(setNewRecords).catch(() => {})

    setVisible(true)
  }, [])

  useEffect(() => {
    if (!visible) return
    if (countdown <= 0) { setVisible(false); return }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [visible, countdown])

  if (!visible) return null

  const greeting = SEASON_GREETINGS[season]

  // Alerta de backup: sin backup nunca, o con registros nuevos significativos (> 3)
  const totalNew = (newRecords?.cares ?? 0) + (newRecords?.photos ?? 0) + (newRecords?.notes ?? 0)
  const neverBacked = !config?.lastBackupAt && bonsais.length > 0
  const showBackupWarning = neverBacked || totalNew > 3

  function backupWarningText(): { title: string; subtitle: string } {
    if (neverBacked) {
      return {
        title: lang === 'es' ? 'Tu colección no tiene backup' : 'Your collection has no backup',
        subtitle: lang === 'es'
          ? 'Si se borran los datos del navegador perderías todo'
          : 'If browser data is cleared you would lose everything',
      }
    }
    const parts: string[] = []
    if (newRecords!.cares > 0)
      parts.push(lang === 'es' ? `${newRecords!.cares} cuidado${newRecords!.cares !== 1 ? 's' : ''}` : `${newRecords!.cares} care${newRecords!.cares !== 1 ? 's' : ''}`)
    if (newRecords!.photos > 0)
      parts.push(lang === 'es' ? `${newRecords!.photos} foto${newRecords!.photos !== 1 ? 's' : ''}` : `${newRecords!.photos} photo${newRecords!.photos !== 1 ? 's' : ''}`)
    if (newRecords!.notes > 0)
      parts.push(lang === 'es' ? `${newRecords!.notes} nota${newRecords!.notes !== 1 ? 's' : ''}` : `${newRecords!.notes} note${newRecords!.notes !== 1 ? 's' : ''}`)
    return {
      title: lang === 'es' ? 'Hacer backup' : 'Back up your data',
      subtitle: lang === 'es'
        ? `${parts.join(' y ')} sin respaldar`
        : `${parts.join(' and ')} not backed up`,
    }
  }

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
            NiwaMirî <span style={{ color: 'var(--text3)', opacity: 0.6 }}>v1.1</span>
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

        {/* Alerta de backup inteligente */}
        {showBackupWarning && (
          <button
            onClick={() => { dismiss(); navigate('/settings/backup') }}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left"
            style={{
              background: neverBacked ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)',
              border: `1px solid ${neverBacked ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)'}`,
            }}
          >
            <HardDrive size={18} style={{ color: neverBacked ? '#ef4444' : 'rgb(129,140,248)', flexShrink: 0 }} />
            <div>
              <p className="text-sm font-medium" style={{ color: neverBacked ? '#ef4444' : 'rgb(129,140,248)' }}>
                {backupWarningText().title}
              </p>
              <p className="text-xs" style={{ color: 'var(--text3)' }}>
                {backupWarningText().subtitle}
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
