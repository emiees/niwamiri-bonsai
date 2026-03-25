import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Camera, X, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { useBonsaiStore } from '@/store/bonsaiStore'
import { storageService } from '@/services/storage/DexieStorageService'
import { useAppStore } from '@/store/appStore'
import { useSeason } from '@/hooks/useSeason'
import { createAIService } from '@/hooks/useAI'
import { compressImage, base64ToDataUrl } from '@/utils/images'
import type { CareType, TreeCondition, Care } from '@/db/schema'

const CARE_TYPES: CareType[] = [
  'watering', 'fertilizing', 'maintenance-pruning', 'structural-pruning',
  'wiring', 'wire-removal', 'repotting', 'root-pruning',
  'defoliation', 'pest-treatment', 'jin-shari', 'relocation',
  'observation', 'other',
]

const CARE_ICONS: Record<CareType, string> = {
  watering: '💧', fertilizing: '🌿', 'maintenance-pruning': '✂️',
  'structural-pruning': '🌳', wiring: '🔗', 'wire-removal': '📎',
  repotting: '🪴', 'root-pruning': '🌱', defoliation: '🍃',
  'pest-treatment': '🐛', 'jin-shari': '🪵', relocation: '📍',
  observation: '👁️', other: '📝',
}

const CONDITIONS: TreeCondition[] = ['good', 'regular', 'problematic']
const CONDITION_COLORS: Record<TreeCondition, string> = {
  good: '#22c55e',
  regular: '#f59e0b',
  problematic: '#f97316',
}

function dateToInputValue(ts: number): string {
  const d = new Date(ts)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function CareForm() {
  const { id: bonsaiId, careId } = useParams<{ id: string; careId: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'es'
  const isEdit = !!careId

  const { bonsais, fetchBonsais } = useBonsaiStore()
  const bonsai = bonsais.find((b) => b.id === bonsaiId)
  const config = useAppStore((s) => s.config)
  const season = useSeason()

  const [type, setType] = useState<CareType>('watering')
  const [date, setDate] = useState(dateToInputValue(Date.now()))
  const [condition, setCondition] = useState<TreeCondition>('good')
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [reminderDate, setReminderDate] = useState('')
  const [reminderDesc, setReminderDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [suggestingReminder, setSuggestingReminder] = useState(false)
  const [aiNotes, setAiNotes] = useState('')
  const [aiNotesLoading, setAiNotesLoading] = useState(false)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!bonsais.length) fetchBonsais()
  }, [fetchBonsais, bonsais.length])

  useEffect(() => {
    if (isEdit && careId) {
      storageService.getCaresByBonsai(bonsaiId!).then((cares) => {
        const existing = cares.find((c) => c.id === careId)
        if (existing) {
          setType(existing.type)
          setDate(dateToInputValue(existing.date))
          setCondition(existing.treeCondition)
          setDescription(existing.description ?? '')
          if (existing.followUpReminder) {
            setReminderDate(dateToInputValue(existing.followUpReminder.date))
            setReminderDesc(existing.followUpReminder.description)
          }
        }
      })
    }
  }, [isEdit, careId, bonsaiId])

  const loadAiNotes = useCallback(async () => {
    if (!bonsai || !config?.encryptedApiKey) return
    setAiNotesLoading(true)
    try {
      const speciesNotes = await storageService.getNotesBySpecies(bonsai.species)
      const specimenNotes = await storageService.getNotesBySpecimen(bonsaiId!)
      const seen = new Set(specimenNotes.map((n) => n.id))
      const allNotes = [...specimenNotes, ...speciesNotes.filter((n) => !seen.has(n.id))]
      if (allNotes.length === 0) { setAiNotes(''); return }
      const svc = await createAIService(config.encryptedApiKey, config.aiProvider, config.aiModel)
      const summary = await svc.summarizeNotesForCare(allNotes, type, bonsai.species)
      setAiNotes(summary)
    } catch {
      setAiNotes('')
    } finally {
      setAiNotesLoading(false)
    }
  }, [bonsai, bonsaiId, config, type])

  async function suggestReminder() {
    if (!bonsai || !config?.encryptedApiKey) return
    setSuggestingReminder(true)
    try {
      const recentCares = await storageService.getCaresByBonsai(bonsaiId!)
      const svc = await createAIService(config.encryptedApiKey, config.aiProvider, config.aiModel)
      const tempCare: Care = {
        id: 'temp', bonsaiId: bonsaiId!, type,
        date: new Date(date).getTime(), treeCondition: condition,
        description, createdAt: Date.now(),
      }
      const result = await svc.suggestReminder(tempCare, {
        bonsai, recentCares: recentCares.slice(0, 5), classNotes: [], season,
      })
      setReminderDate(dateToInputValue(result.date))
      setReminderDesc(result.description)
    } catch { /* silent */ }
    finally { setSuggestingReminder(false) }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const quality = config?.photoQuality === 'low' ? 0.6 : config?.photoQuality === 'medium' ? 0.75 : 0.85
    const b64 = await compressImage(file, 1200, quality)
    setPhotos((prev) => [...prev, b64])
    e.target.value = ''
  }

  async function handleSave() {
    if (!bonsaiId) return
    setSaving(true)
    try {
      const careData = {
        bonsaiId, type,
        date: new Date(date).getTime(),
        treeCondition: condition,
        description: description.trim() || undefined,
        followUpReminder: reminderDate && reminderDesc
          ? { date: new Date(reminderDate).getTime(), description: reminderDesc }
          : undefined,
      }
      if (isEdit && careId) await storageService.deleteCare(careId)
      const savedCareId = await storageService.saveCare(careData)

      for (const imageData of photos) {
        await storageService.savePhoto({
          bonsaiId, careId: savedCareId, imageData,
          takenAt: new Date(date).getTime(), isMainPhoto: false,
        })
      }

      if (!isEdit) {
        await storageService.saveEvent({
          bonsaiId, type: 'care', careType: type,
          title: `${t(`care.${type}`)} — ${bonsai?.name ?? ''}`,
          date: new Date(date).getTime(), completed: true,
        })
      }

      if (reminderDate && reminderDesc) {
        await storageService.saveEvent({
          bonsaiId, type: 'followup-reminder', careType: type,
          title: reminderDesc, date: new Date(reminderDate).getTime(), completed: false,
        })
      }

      navigate(`/bonsai/${bonsaiId}`, { replace: true })
    } catch { setSaving(false) }
  }

  return (
    <AppShell showNav={false}>
      <Header
        showBack
        title={isEdit ? t('careForm.editTitle') : t('careForm.title')}
        actions={
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
          >
            {saving ? '...' : t('common.save')}
          </button>
        }
      />

      <div className="flex flex-col gap-4 px-4 py-3">
        {bonsai && (
          <p className="text-sm" style={{ color: 'var(--text3)' }}>
            <em>{bonsai.name}</em> · {bonsai.species}
          </p>
        )}

        {/* Type */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text3)' }}>
            {t('careForm.type')}
          </p>
          <div className="flex flex-wrap gap-2">
            {CARE_TYPES.map((ct) => (
              <button
                key={ct}
                onClick={() => setType(ct)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium"
                style={{
                  background: type === ct ? 'var(--color-accent)' : 'var(--card)',
                  color: type === ct ? 'var(--green1)' : 'var(--text2)',
                  border: `1px solid ${type === ct ? 'var(--color-accent)' : 'var(--border)'}`,
                }}
              >
                <span>{CARE_ICONS[ct]}</span>
                {t(`care.${ct}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text3)' }}>
            {t('careForm.date')}
          </p>
          <input
            type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            style={{ background: 'var(--card)', color: 'var(--text1)', border: '1px solid var(--border)' }}
          />
        </div>

        {/* Condition */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text3)' }}>
            {t('careForm.condition')}
          </p>
          <div className="flex gap-3">
            {CONDITIONS.map((c) => (
              <button
                key={c}
                onClick={() => setCondition(c)}
                className="flex-1 rounded-xl py-2.5 text-xs font-semibold"
                style={{
                  background: condition === c ? CONDITION_COLORS[c] + '33' : 'var(--card)',
                  color: condition === c ? CONDITION_COLORS[c] : 'var(--text2)',
                  border: `2px solid ${condition === c ? CONDITION_COLORS[c] : 'var(--border)'}`,
                }}
              >
                {t(`condition.${c}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text3)' }}>
            {t('careForm.description')}
          </p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder={lang === 'es' ? 'Observaciones, notas, detalles...' : 'Observations, notes, details...'}
            className="w-full resize-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            style={{ background: 'var(--card)', color: 'var(--text1)', border: '1px solid var(--border)' }}
          />
        </div>

        {/* Photos */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text3)' }}>
            {t('careForm.photos')}
          </p>
          <div className="flex flex-wrap gap-2">
            {photos.map((b64, i) => (
              <div key={i} className="relative">
                <img src={base64ToDataUrl(b64)} alt="" className="h-20 w-20 rounded-xl object-cover" />
                <button
                  onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ background: '#ef4444' }}
                >
                  <X size={10} color="white" />
                </button>
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl text-xs"
              style={{ background: 'var(--card)', border: '1px dashed var(--border)', color: 'var(--text3)' }}
            >
              <Camera size={18} />
              {lang === 'es' ? 'Foto' : 'Photo'}
            </button>
          </div>
          <input
            ref={fileInputRef} type="file" accept="image/*" capture="environment"
            className="hidden" onChange={onFileChange}
          />
        </div>

        {/* Reminder */}
        <div className="overflow-hidden rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="px-4 py-3">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text3)' }}>
              {t('careForm.reminder')}
            </p>
            <div className="flex gap-2">
              <input
                type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)}
                className="flex-1 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                style={{ background: 'var(--bg3)', color: 'var(--text1)', border: '1px solid var(--border)' }}
              />
              <button
                onClick={suggestReminder}
                disabled={suggestingReminder || !config?.encryptedApiKey}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold disabled:opacity-40"
                style={{ background: 'var(--bg3)', color: 'var(--color-accent)', border: '1px solid var(--border)' }}
              >
                {suggestingReminder
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Sparkles size={13} />}
                {t('careForm.suggestReminder')}
              </button>
            </div>
            {(reminderDate || reminderDesc) && (
              <input
                type="text" value={reminderDesc} onChange={(e) => setReminderDesc(e.target.value)}
                placeholder={lang === 'es' ? 'Descripción del recordatorio' : 'Reminder description'}
                className="mt-2 w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                style={{ background: 'var(--bg3)', color: 'var(--text1)', border: '1px solid var(--border)' }}
              />
            )}
          </div>
        </div>

        {/* AI notes panel */}
        {config?.encryptedApiKey && (
          <div className="overflow-hidden rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <button
              onClick={() => {
                setAiPanelOpen((o) => !o)
                if (!aiPanelOpen && !aiNotes && !aiNotesLoading) loadAiNotes()
              }}
              className="flex w-full items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-2" style={{ color: 'var(--color-accent)' }}>
                <Sparkles size={15} />
                <span className="text-sm font-semibold">{t('careForm.aiNotes')}</span>
              </div>
              {aiPanelOpen
                ? <ChevronUp size={16} style={{ color: 'var(--text3)' }} />
                : <ChevronDown size={16} style={{ color: 'var(--text3)' }} />}
            </button>
            {aiPanelOpen && (
              <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--border)' }}>
                {aiNotesLoading ? (
                  <div className="flex items-center gap-2 pt-3">
                    <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text3)' }} />
                    <span className="text-sm" style={{ color: 'var(--text3)' }}>{t('common.loading')}</span>
                  </div>
                ) : aiNotes ? (
                  <p className="pt-3 text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>{aiNotes}</p>
                ) : (
                  <p className="pt-3 text-sm" style={{ color: 'var(--text3)' }}>{t('careForm.aiNotesEmpty')}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="h-4" />
      </div>
    </AppShell>
  )
}
