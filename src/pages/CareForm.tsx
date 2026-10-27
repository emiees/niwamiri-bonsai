import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Camera, X, Sparkles, Loader2, ChevronDown, ChevronUp, ImagePlus } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { useBonsaiStore } from '@/store/bonsaiStore'
import { storageService } from '@/services/storage/DexieStorageService'
import { useAppStore } from '@/store/appStore'
import { useSeason } from '@/hooks/useSeason'
import { createAIService } from '@/hooks/useAI'
import { compressImage, base64ToDataUrl, extractExifDatetime } from '@/utils/images'
import type { CareType, TreeCondition, Care } from '@/db/schema'
import { CareDetailsFields, CareTypeDateFields, ConditionFields } from '@/components/care/CareFields'
import { isValidDay, normalizeDetails, validateDetails, type DetailDraft } from '@/utils/careDetails'
import { dateStrToTs, tsToDateStr, localToday } from '@/utils/dates'

export default function CareForm() {
  const { id: bonsaiId, careId } = useParams<{ id: string; careId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const fromCareList = location.state?.fromCareList === true
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'es'
  const isEdit = !!careId

  const { bonsais, fetchBonsais } = useBonsaiStore()
  const bonsai = bonsais.find((b) => b.id === bonsaiId)
  const config = useAppStore((s) => s.config)
  const season = useSeason()

  const [type, setType] = useState<CareType>('watering')
  const [date, setDate] = useState(() => localToday())
  const [condition, setCondition] = useState<TreeCondition>('good')
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState<{ b64: string; takenAt: number }[]>([])
  const [reminderDate, setReminderDate] = useState('')
  const [reminderDesc, setReminderDesc] = useState('')
  const [details, setDetails] = useState<DetailDraft>({})
  const [detailErrors, setDetailErrors] = useState<string[]>([])
  const [products, setProducts] = useState<string[]>([])
  const [validationError, setValidationError] = useState(false)
  const saveLock = useRef(false)
  const [saving, setSaving] = useState(false)
  const [loadedCareId, setLoadedCareId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState(false)
  const [suggestingReminder, setSuggestingReminder] = useState(false)
  const [aiNotes, setAiNotes] = useState('')
  const [aiNotesLoading, setAiNotesLoading] = useState(false)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)   // galería
  const cameraInputRef = useRef<HTMLInputElement>(null)  // cámara

  useEffect(() => {
    let active = true
    storageService.getCareProducts().then((items) => { if (active) setProducts(items) }).catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!bonsais.length) fetchBonsais()
  }, [fetchBonsais, bonsais.length])

  useEffect(() => {
    let active = true
    if (isEdit && careId) {
      storageService.getCaresByBonsai(bonsaiId!).then((cares) => {
        if (!active) return
        const existing = cares.find((c) => c.id === careId)
        if (existing) {
          setType(existing.type)
          setDetails(existing.specificFields ?? {})
          setDate(tsToDateStr(existing.date))
          setCondition(existing.treeCondition)
          setDescription(existing.description ?? '')
          if (existing.followUpReminder) {
            setReminderDate(tsToDateStr(existing.followUpReminder.date))
            setReminderDesc(existing.followUpReminder.description)
          }
          setLoadedCareId(existing.id)
        } else {
          setSaveError(true)
        }
      }).catch(() => { if (active) setSaveError(true) })
    }
    return () => { active = false }
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
        date: dateStrToTs(date), treeCondition: condition,
        description, createdAt: Date.now(),
      }
      const result = await svc.suggestReminder(tempCare, {
        bonsai, recentCares: recentCares.slice(0, 5), classNotes: [], season,
      })
      setReminderDate(tsToDateStr(result.date))
      setReminderDesc(result.description)
    } catch { /* silent */ }
    finally { setSuggestingReminder(false) }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const quality = config?.photoQuality === 'low' ? 0.6 : config?.photoQuality === 'medium' ? 0.75 : 0.85
    for (const file of files) {
      const b64 = await compressImage(file, 1200, quality)
      // Intentar extraer timestamp EXIF; si no hay EXIF usar el momento actual
      let takenAt = Date.now()
      try {
        const buffer = await file.arrayBuffer()
        const exif = extractExifDatetime(buffer)
        if (exif) takenAt = exif.takenAt
      } catch { /* sin EXIF */ }
      setPhotos((prev) => [...prev, { b64, takenAt }])
    }
    e.target.value = ''
  }

  async function handleSave() {
    if (!bonsaiId || saveLock.current || (isEdit && loadedCareId !== careId)) return
    const errors = validateDetails(type, details)
    setDetailErrors(errors)
    const invalid = errors.length > 0 || !isValidDay(date) || (!!reminderDate !== !!reminderDesc.trim()) || (!!reminderDate && !isValidDay(reminderDate))
    setValidationError(invalid)
    if (invalid) return
    saveLock.current = true
    setSaving(true)
    setSaveError(false)
    try {
      const careData = {
        bonsaiId, type,
        specificFields: normalizeDetails(type, details),
        date: dateStrToTs(date),
        treeCondition: condition,
        description: description.trim() || undefined,
        followUpReminder: reminderDate && reminderDesc
          ? { date: dateStrToTs(reminderDate), description: reminderDesc }
          : undefined,
      }
      const eventTitle = `${t(`care.${type}`)} — ${bonsai?.name ?? ''}`
      // Editar conserva el ID, las fotos y los eventos del cuidado original.
      const savedCareId = careId ?? await storageService.saveCare(careData)
      if (careId) await storageService.updateCare(careId, careData, eventTitle)

      for (const photo of photos) {
        await storageService.savePhoto({
          bonsaiId, careId: savedCareId, imageData: photo.b64,
          takenAt: photo.takenAt, isMainPhoto: false,
        })
      }

      if (!isEdit) {
        await storageService.saveEvent({
          bonsaiId, type: 'care', careType: type, careId: savedCareId,
          title: eventTitle,
          date: dateStrToTs(date), completed: true,
        })
      }

      if (!isEdit && reminderDate && reminderDesc) {
        await storageService.saveEvent({
          bonsaiId, type: 'followup-reminder', careType: type, careId: savedCareId,
          title: reminderDesc, date: dateStrToTs(reminderDate), completed: false,
        })
      }

      if (fromCareList) {
        try { if (location.state?.careListKey) sessionStorage.setItem(location.state.careListKey, 'updated') } catch { /* almacenamiento de sesión no disponible */ }
        navigate(-1)
      }
      else navigate(`/bonsai/${bonsaiId}`, { replace: true })
    } catch {
      setSaveError(true)
      setSaving(false)
      saveLock.current = false
    }
  }

  return (
    <AppShell showNav={false}>
      <Header
        showBack
        title={isEdit ? t('careForm.editTitle') : t('careForm.title')}
        actions={
          <button
            onClick={handleSave}
            disabled={saving || (isEdit && loadedCareId !== careId)}
            className="rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
          >
            {saving ? '...' : t('common.save')}
          </button>
        }
      />

      <div className="flex flex-col gap-4 px-4 py-3">
        {saveError && <p role="alert" className="error-text text-sm" style={{ color: 'var(--color-warn)' }}>{t('careList.saveError')}</p>}
        {bonsai && (
          <p className="text-sm" style={{ color: 'var(--text3)' }}>
            <em>{bonsai.name}</em> · {bonsai.species}
          </p>
        )}

        <CareTypeDateFields type={type} date={date} onDate={setDate} hasDetails={Object.keys(details).length > 0} onType={(next) => { setType(next); setDetails({}); setDetailErrors([]) }} />
        <CareDetailsFields type={type} value={details} onChange={setDetails} products={products} errors={detailErrors} />
        <ConditionFields condition={condition} description={description} onCondition={setCondition} onDescription={setDescription} />
        {validationError && <p role="alert" className="text-sm" style={{ color: 'var(--color-warn)' }}>{t('careDetails.validationError')}</p>}

        {/* Photos */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text3)' }}>
            {t('careForm.photos')}
          </p>
          <div className="flex flex-wrap gap-2">
            {photos.map((photo, i) => (
              <div key={i} className="relative">
                <img src={base64ToDataUrl(photo.b64)} alt="" className="h-20 w-20 rounded-xl object-cover" />
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
              onClick={() => cameraInputRef.current?.click()}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl text-xs"
              style={{ background: 'var(--card)', border: '1px dashed var(--border)', color: 'var(--text3)' }}
            >
              <Camera size={18} />
              {lang === 'es' ? 'Cámara' : 'Camera'}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl text-xs"
              style={{ background: 'var(--card)', border: '1px dashed var(--border)', color: 'var(--text3)' }}
            >
              <ImagePlus size={18} />
              {lang === 'es' ? 'Galería' : 'Gallery'}
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onFileChange} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
        </div>

        {/* Reminder */}
        <div className="overflow-hidden rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="px-4 py-3">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text3)' }}>
              {t('careForm.reminder')}
            </p>
            {type === 'wiring' && typeof details.reviewDate === 'string' && details.reviewDate && <button type="button" onClick={() => { setReminderDate(String(details.reviewDate)); setReminderDesc(t('careDetails.reviewReminder')) }} className="mb-2 text-sm" style={{ color: 'var(--color-accent)' }}>{t('careDetails.useReviewDate')}</button>}
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
