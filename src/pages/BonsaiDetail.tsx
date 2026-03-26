import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Plus, Edit2, Trash2, ChevronDown, ChevronRight,
  TreePine, Camera, BookOpen, FileText, Sparkles, Scissors, Download,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { useBonsaiStore } from '@/store/bonsaiStore'
import { storageService } from '@/services/storage/DexieStorageService'
import { calcAge, formatDate, formatRelative } from '@/utils/dates'
import { base64ToDataUrl } from '@/utils/images'
import { exportBonsaiBackup } from '@/utils/backup'
import type { Bonsai, Care, Photo, ClassNote, SpeciesSheet, BonsaiStatus, BonsaiStyle, BonsaiOrigin, BonsaiSize } from '@/db/schema'

// ── Collapsible section ─────────────────────────────────────────

function Section({
  icon,
  title,
  count,
  defaultOpen = false,
  children,
}: {
  icon: React.ReactNode
  title: string
  count?: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="mx-4 mb-3 overflow-hidden rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2.5">
          <span style={{ color: 'var(--color-accent)' }}>{icon}</span>
          <span className="font-semibold text-sm" style={{ color: 'var(--text1)' }}>{title}</span>
          {count !== undefined && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ background: 'var(--bg3)', color: 'var(--text3)' }}
            >
              {count}
            </span>
          )}
        </div>
        {open
          ? <ChevronDown size={16} style={{ color: 'var(--text3)' }} />
          : <ChevronRight size={16} style={{ color: 'var(--text3)' }} />}
      </button>
      {open && <div style={{ borderTop: '1px solid var(--border)' }}>{children}</div>}
    </div>
  )
}

// ── Status badge ────────────────────────────────────────────────

const STATUS_COLOR: Record<BonsaiStatus, string> = {
  developing: '#22c55e',
  maintenance: '#3b82f6',
  recovery: '#f97316',
  donated: '#a855f7',
  dead: '#6b7280',
}

// ── Edit sheet ──────────────────────────────────────────────────

const STYLES: BonsaiStyle[] = [
  'chokkan', 'moyogi', 'shakan', 'kengai', 'han-kengai',
  'hokidachi', 'fukinagashi', 'yose-ue', 'literati', 'other',
]
const ORIGINS: BonsaiOrigin[] = ['prebonsai', 'yamadori', 'seed', 'cutting', 'gift', 'purchase']
const SIZES: BonsaiSize[] = ['mame', 'shohin', 'chuhin', 'dai']
const STATUSES: BonsaiStatus[] = ['developing', 'maintenance', 'recovery', 'donated', 'dead']

function EditSheet({
  bonsai,
  onClose,
  onSaved,
}: {
  bonsai: Bonsai
  onClose: () => void
  onSaved: () => void
}) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'es'
  const { updateBonsai } = useBonsaiStore()

  const [name, setName] = useState(bonsai.name)
  const [species, setSpecies] = useState(bonsai.species)
  const [status, setStatus] = useState<BonsaiStatus>(bonsai.status)
  const [style, setStyle] = useState<BonsaiStyle | ''>(bonsai.style ?? '')
  const [origin, setOrigin] = useState<BonsaiOrigin | ''>(bonsai.origin ?? '')
  const [size, setSize] = useState<BonsaiSize | ''>(bonsai.size ?? '')
  const [germinationYear, setGerminationYear] = useState(bonsai.germinationYear?.toString() ?? '')
  const [acquisitionDate, setAcquisitionDate] = useState(bonsai.acquisitionDate ?? '')
  const [location, setLocation] = useState(bonsai.location ?? '')
  const [potAndSubstrate, setPotAndSubstrate] = useState(bonsai.potAndSubstrate ?? '')
  const [generalNotes, setGeneralNotes] = useState(bonsai.generalNotes ?? '')
  const [tags, setTags] = useState<string[]>(bonsai.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)

  function addTag(value: string) {
    const t = value.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t])
    setTagInput('')
  }

  function onTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) setTags((prev) => prev.slice(0, -1))
  }

  async function save() {
    if (!name.trim() || !species.trim()) return
    setSaving(true)
    await updateBonsai(bonsai.id, {
      name: name.trim(),
      species: species.trim(),
      status,
      style: style || undefined,
      origin: origin as BonsaiOrigin || undefined,
      size: size as BonsaiSize || undefined,
      germinationYear: germinationYear ? parseInt(germinationYear) : undefined,
      acquisitionDate: acquisitionDate || undefined,
      location: location.trim() || undefined,
      potAndSubstrate: potAndSubstrate.trim() || undefined,
      generalNotes: generalNotes.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    })
    onSaved()
  }

  const field = (label: string, el: React.ReactNode) => (
    <div>
      <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text3)' }}>{label}</label>
      {el}
    </div>
  )

  const textInput = (value: string, onChange: (v: string) => void, placeholder = '') => (
    <input
      type="text" value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
      style={{ background: 'var(--bg3)', color: 'var(--text1)', border: '1px solid var(--border)' }}
    />
  )

  const chipRow = <T extends string>(
    options: T[],
    current: T | '',
    set: (v: T | '') => void,
    labelFn: (v: T) => string,
  ) => (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => set(current === opt ? '' : opt)}
          className="shrink-0 rounded-xl px-3 py-2 text-xs font-medium"
          style={{
            background: current === opt ? 'var(--color-accent)' : 'var(--bg3)',
            color: current === opt ? 'var(--green1)' : 'var(--text2)',
            border: `1px solid ${current === opt ? 'var(--color-accent)' : 'var(--border)'}`,
          }}
        >
          {labelFn(opt)}
        </button>
      ))}
    </div>
  )

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl"
        style={{ background: 'var(--bg)', maxHeight: '92dvh' }}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
        </div>
        <div className="flex items-center justify-between px-5 pb-3">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text1)' }}>
            {t('common.edit')}
          </h2>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm" style={{ color: 'var(--text2)' }}>
              {t('common.cancel')}
            </button>
            <button
              onClick={save}
              disabled={!name.trim() || !species.trim() || saving}
              className="rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
              style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
            >
              {saving ? '...' : t('common.save')}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-8">
          {field(lang === 'es' ? 'Nombre / Apodo *' : 'Name / Nickname *', textInput(name, setName))}
          {field(lang === 'es' ? 'Especie *' : 'Species *', textInput(species, setSpecies, 'Ficus retusa'))}
          {field(lang === 'es' ? 'Estado' : 'Status',
            chipRow(STATUSES, status, (v) => setStatus(v as BonsaiStatus || 'developing'), (v) => t(`status.${v}`))
          )}
          {field(lang === 'es' ? 'Estilo' : 'Style',
            chipRow(STYLES, style as BonsaiStyle, (v) => setStyle(v), (v) => t(`style.${v}`).split(' ')[0])
          )}
          {field(lang === 'es' ? 'Origen' : 'Origin',
            chipRow(ORIGINS, origin as BonsaiOrigin, (v) => setOrigin(v), (v) => t(`origin.${v}`))
          )}
          {field(lang === 'es' ? 'Tamaño' : 'Size',
            chipRow(SIZES, size as BonsaiSize, (v) => setSize(v), (v) => t(`size.${v}`))
          )}
          {field(lang === 'es' ? 'Año de germinación' : 'Germination year',
            <input type="number" value={germinationYear} onChange={(e) => setGerminationYear(e.target.value)}
              placeholder="1990" min={1900} max={new Date().getFullYear()}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{ background: 'var(--bg3)', color: 'var(--text1)', border: '1px solid var(--border)' }}
            />
          )}
          {field(lang === 'es' ? 'Fecha de adquisición' : 'Acquisition date',
            <input type="date" value={acquisitionDate} onChange={(e) => setAcquisitionDate(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{ background: 'var(--bg3)', color: 'var(--text1)', border: '1px solid var(--border)' }}
            />
          )}
          {field(lang === 'es' ? 'Ubicación' : 'Location', textInput(location, setLocation, lang === 'es' ? 'Ej: exterior, sombra' : 'E.g. outdoor, shade'))}
          {field(lang === 'es' ? 'Maceta / Sustrato' : 'Pot / Substrate', textInput(potAndSubstrate, setPotAndSubstrate))}
          {field(lang === 'es' ? 'Etiquetas' : 'Tags',
            <div
              className="flex flex-wrap gap-1.5 rounded-xl px-3 py-2.5 min-h-[44px]"
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}
            >
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
                >
                  {tag}
                  <button onClick={() => setTags((prev) => prev.filter((t) => t !== tag))} className="leading-none">×</button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={onTagKeyDown}
                onBlur={() => { if (tagInput.trim()) addTag(tagInput) }}
                placeholder={tags.length === 0 ? (lang === 'es' ? 'escuela, mío… Enter para agregar' : 'school, mine… Enter to add') : ''}
                className="flex-1 min-w-[120px] bg-transparent text-xs focus:outline-none"
                style={{ color: 'var(--text1)' }}
              />
            </div>
          )}
          {field(lang === 'es' ? 'Notas generales' : 'General notes',
            <textarea value={generalNotes} onChange={(e) => setGeneralNotes(e.target.value)}
              rows={3} placeholder={lang === 'es' ? 'Observaciones libres...' : 'Free observations...'}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
              style={{ background: 'var(--bg3)', color: 'var(--text1)', border: '1px solid var(--border)' }}
            />
          )}
        </div>
      </div>
    </>
  )
}

// ── Main page ───────────────────────────────────────────────────

export default function BonsaiDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'es'

  const { bonsais, fetchBonsais, deleteBonsai } = useBonsaiStore()
  const bonsai = bonsais.find((b) => b.id === id)

  const [cares, setCares] = useState<Care[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [notes, setNotes] = useState<ClassNote[]>([])
  const [sheet, setSheet] = useState<SpeciesSheet | null>(null)
  const [mainPhoto, setMainPhoto] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const loadData = useCallback(async () => {
    if (!id) return
    const [c, p, n] = await Promise.all([
      storageService.getCaresByBonsai(id),
      storageService.getPhotosByBonsai(id),
      storageService.getNotesBySpecimen(id),
    ])
    setCares(c)
    setPhotos(p)
    setNotes(n)
    if (bonsai?.mainPhotoId) {
      const main = p.find((ph) => ph.id === bonsai.mainPhotoId)
      if (main) setMainPhoto(base64ToDataUrl(main.imageData))
    }
    if (bonsai?.species) {
      storageService.getSheetBySpecies(bonsai.species).then((s) => setSheet(s ?? null)).catch(() => {})
    }
  }, [id, bonsai?.mainPhotoId, bonsai?.species])

  useEffect(() => {
    if (!bonsais.length) fetchBonsais()
  }, [fetchBonsais, bonsais.length])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (!bonsai) {
    return (
      <AppShell showNav={false}>
        <Header showBack />
        <div className="flex items-center justify-center py-20">
          <p style={{ color: 'var(--text3)' }}>{t('common.loading')}</p>
        </div>
      </AppShell>
    )
  }

  const age = calcAge(bonsai!.germinationYear)
  const lastCare = cares[0]
  const statusColor = STATUS_COLOR[bonsai!.status]

  async function handleDelete() {
    await deleteBonsai(bonsai!.id)
    navigate('/', { replace: true })
  }

  async function handleExport() {
    const blob = await exportBonsaiBackup(bonsai!.id)
    const date = new Date().toISOString().slice(0, 10)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `niwamiri_${bonsai!.name.replace(/\s+/g, '_')}_${date}.zip`
    a.click()
    URL.revokeObjectURL(url)
  }

  const statItem = (value: number | string, label: string) => (
    <div className="flex flex-1 flex-col items-center">
      <span className="text-lg font-bold" style={{ color: 'var(--text1)' }}>{value}</span>
      <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{label}</span>
    </div>
  )

  const daysSinceLastCare = lastCare
    ? Math.floor((Date.now() - lastCare.date) / 86400000)
    : null

  return (
    <AppShell showNav={false}>
      <Header
        showBack
        title={bonsai.name}
        actions={
          <div className="flex items-center gap-1">
            <button
              onClick={handleExport}
              className="rounded-full p-2"
              style={{ color: 'var(--text2)' }}
              title={lang === 'es' ? 'Exportar árbol' : 'Export tree'}
            >
              <Download size={18} />
            </button>
            <button
              onClick={() => setShowEdit(true)}
              className="rounded-full p-2"
              style={{ color: 'var(--text2)' }}
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-full p-2"
              style={{ color: 'var(--color-warn, #f97316)' }}
            >
              <Trash2 size={18} />
            </button>
          </div>
        }
      />

      {/* Hero */}
      <div
        className="relative mx-4 mt-2 mb-3 overflow-hidden rounded-2xl"
        style={{ aspectRatio: '16/9', background: 'var(--bg3)' }}
      >
        {mainPhoto
          ? <img src={mainPhoto} alt={bonsai.name} className="h-full w-full object-cover" />
          : (
            <TreePine
              size={56}
              className="absolute inset-0 m-auto"
              style={{ color: 'var(--text3)' }}
            />
          )
        }
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div>
            {age !== '—' && (
              <span
                className="mr-2 rounded-full px-3 py-1 text-xs font-semibold shadow"
                style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}
              >
                ~{age}
              </span>
            )}
          </div>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold shadow"
            style={{ background: statusColor, color: 'white' }}
          >
            {t(`status.${bonsai.status}`)}
          </span>
        </div>
      </div>

      {/* Quick stats */}
      <div
        className="mx-4 mb-3 flex rounded-2xl py-3"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        {statItem(cares.length, lang === 'es' ? 'Cuidados' : 'Cares')}
        <div style={{ width: 1, background: 'var(--border)' }} />
        {statItem(photos.length, lang === 'es' ? 'Fotos' : 'Photos')}
        <div style={{ width: 1, background: 'var(--border)' }} />
        {statItem(notes.length, lang === 'es' ? 'Notas' : 'Notes')}
        <div style={{ width: 1, background: 'var(--border)' }} />
        {statItem(
          daysSinceLastCare !== null ? `${daysSinceLastCare}d` : '—',
          lang === 'es' ? 'Desde cuidado' : 'Since care',
        )}
      </div>

      {/* ── Resumen ── */}
      <Section icon={<span>📋</span>} title={t('bonsaiDetail.sections.summary')} defaultOpen>
        <div className="grid grid-cols-2 gap-0 px-4 py-3">
          {[
            [lang === 'es' ? 'Especie' : 'Species', bonsai.commonName
              ? <>{bonsai.commonName}<br /><em style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{bonsai.species}</em></>
              : <em>{bonsai.species}</em>],
            [lang === 'es' ? 'Estilo' : 'Style', bonsai.style ? t(`style.${bonsai.style}`).split(' ')[0] : '—'],
            [lang === 'es' ? 'Tamaño' : 'Size', bonsai.size ? t(`size.${bonsai.size}`) : '—'],
            [lang === 'es' ? 'Origen' : 'Origin', bonsai.origin ? t(`origin.${bonsai.origin}`) : '—'],
            [lang === 'es' ? 'Adquisición' : 'Acquired', bonsai.acquisitionDate ? formatDate(new Date(bonsai.acquisitionDate).getTime()) : '—'],
            [lang === 'es' ? 'Ubicación' : 'Location', bonsai.location ?? '—'],
          ].map(([label, value], i) => (
            <div key={i} className="py-2 pr-2">
              <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text3)' }}>{label as string}</p>
              <p className="mt-0.5 text-sm" style={{ color: 'var(--text1)' }}>{value as React.ReactNode}</p>
            </div>
          ))}
        </div>
        {bonsai.potAndSubstrate && (
          <div className="px-4 pb-3" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="pt-2 text-[10px] uppercase tracking-wide" style={{ color: 'var(--text3)' }}>
              {lang === 'es' ? 'Maceta / Sustrato' : 'Pot / Substrate'}
            </p>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--text1)' }}>{bonsai.potAndSubstrate}</p>
          </div>
        )}
        {bonsai.generalNotes && (
          <div className="px-4 pb-3" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="pt-2 text-[10px] uppercase tracking-wide" style={{ color: 'var(--text3)' }}>
              {lang === 'es' ? 'Notas generales' : 'General notes'}
            </p>
            <p className="mt-0.5 text-sm leading-relaxed" style={{ color: 'var(--text1)' }}>{bonsai.generalNotes}</p>
          </div>
        )}
      </Section>

      {/* ── Cuidados ── */}
      <Section icon={<Scissors size={16} />} title={t('bonsaiDetail.sections.cares')} count={cares.length}>
        {cares.length === 0 ? (
          <p className="px-4 py-3 text-sm" style={{ color: 'var(--text3)' }}>{t('bonsaiDetail.noCares')}</p>
        ) : (
          <>
            {cares.slice(0, 5).map((care, i) => (
              <button
                key={care.id}
                onClick={() => navigate(`/bonsai/${id}/care/${care.id}`)}
                className="flex w-full items-center justify-between px-4 py-3 text-left active:bg-white/5"
                style={{ borderBottom: i < Math.min(cares.length, 5) - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text1)' }}>{t(`care.${care.type}`)}</p>
                  <p className="text-xs" style={{ color: 'var(--text3)' }}>{formatRelative(care.date)}</p>
                </div>
                <span
                  className="text-xs font-medium"
                  style={{ color: care.treeCondition === 'good' ? '#22c55e' : care.treeCondition === 'problematic' ? '#f97316' : 'var(--text3)' }}
                >
                  {t(`condition.${care.treeCondition}`)}
                </span>
              </button>
            ))}
            {cares.length > 5 && (
              <button
                onClick={() => navigate(`/bonsai/${id}/care`)}
                className="flex w-full items-center justify-center py-3 text-sm font-medium"
                style={{ color: 'var(--color-accent)' }}
              >
                {lang === 'es' ? `Ver todos (${cares.length})` : `See all (${cares.length})`}
              </button>
            )}
          </>
        )}
      </Section>

      {/* ── Galería ── */}
      <Section icon={<Camera size={16} />} title={t('bonsaiDetail.sections.gallery')} count={photos.length}>
        {photos.length === 0 ? (
          <p className="px-4 py-3 text-sm" style={{ color: 'var(--text3)' }}>
            {lang === 'es' ? 'Sin fotos aún' : 'No photos yet'}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-1 p-3">
            {photos.slice(0, 6).map((photo) => (
              <button
                key={photo.id}
                onClick={() => navigate(`/bonsai/${id}/gallery`)}
                className="aspect-square overflow-hidden rounded-lg"
                style={{ background: 'var(--bg3)' }}
              >
                <img
                  src={base64ToDataUrl(photo.imageData)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
            {photos.length > 6 && (
              <button
                onClick={() => navigate(`/bonsai/${id}/gallery`)}
                className="aspect-square flex items-center justify-center rounded-lg text-sm font-semibold"
                style={{ background: 'var(--bg3)', color: 'var(--text2)' }}
              >
                +{photos.length - 6}
              </button>
            )}
          </div>
        )}
        <button
          onClick={() => navigate(`/bonsai/${id}/gallery`)}
          className="flex w-full items-center justify-center py-3 text-sm font-medium"
          style={{ color: 'var(--color-accent)', borderTop: '1px solid var(--border)' }}
        >
          {lang === 'es' ? 'Ver galería completa' : 'View full gallery'}
        </button>
      </Section>

      {/* ── Notas de clase ── */}
      <Section icon={<BookOpen size={16} />} title={t('bonsaiDetail.sections.notes')} count={notes.length}>
        {notes.length === 0 ? (
          <p className="px-4 py-3 text-sm" style={{ color: 'var(--text3)' }}>
            {lang === 'es' ? 'Sin notas para este árbol' : 'No notes for this tree'}
          </p>
        ) : (
          notes.slice(0, 3).map((note, i) => (
            <div
              key={note.id}
              className="px-4 py-3"
              style={{ borderBottom: i < Math.min(notes.length, 3) - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--text1)' }}>
                {note.title ?? (lang === 'es' ? 'Sin título' : 'Untitled')}
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed" style={{ color: 'var(--text3)' }}>
                {note.content}
              </p>
            </div>
          ))
        )}
        <button
          onClick={() => navigate(`/bonsai/${id}/notes`)}
          className="flex w-full items-center justify-center py-3 text-sm font-medium"
          style={{ color: 'var(--color-accent)', borderTop: '1px solid var(--border)' }}
        >
          {lang === 'es' ? 'Ver todas las notas' : 'View all notes'}
        </button>
      </Section>

      {/* ── Ficha técnica ── */}
      <Section icon={<FileText size={16} />} title={t('bonsaiDetail.sections.speciesSheet')}>
        {sheet ? (
          <div className="px-4 py-3">
            <div className="mb-2 flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ background: 'var(--bg3)', color: 'var(--text3)' }}
              >
                {t(`sheetOrigin.${sheet.origin}`)}
              </span>
            </div>
            {Object.entries(sheet.content).slice(0, 3).map(([key, value]) => (
              <div key={key} className="mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text3)' }}>{key}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text1)' }}>{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-4 py-3 text-sm" style={{ color: 'var(--text3)' }}>
            {lang === 'es' ? 'Sin ficha para esta especie' : 'No sheet for this species'}
          </p>
        )}
        <button
          onClick={() => navigate(`/bonsai/${id}/sheet`)}
          className="flex w-full items-center justify-center py-3 text-sm font-medium"
          style={{ color: 'var(--color-accent)', borderTop: '1px solid var(--border)' }}
        >
          {sheet
            ? (lang === 'es' ? 'Ver ficha completa' : 'View full sheet')
            : (lang === 'es' ? 'Crear ficha técnica' : 'Create species sheet')}
        </button>
      </Section>

      {/* ── Asistente IA ── */}
      <Section icon={<Sparkles size={16} />} title={t('bonsaiDetail.sections.aiAssistant')}>
        <p className="px-4 py-3 text-sm" style={{ color: 'var(--text3)' }}>
          {lang === 'es'
            ? 'Consultá al asistente sobre este árbol con contexto de su historial completo.'
            : 'Ask the assistant about this tree with its full history as context.'}
        </p>
        <button
          onClick={() => navigate(`/bonsai/${id}/ai`)}
          className="flex w-full items-center justify-center py-3 text-sm font-medium"
          style={{ color: 'var(--color-accent)', borderTop: '1px solid var(--border)' }}
        >
          {lang === 'es' ? 'Abrir asistente' : 'Open assistant'}
        </button>
      </Section>

      <div className="pb-4" />

      {/* FAB */}
      <button
        onClick={() => navigate(`/bonsai/${id}/care`)}
        className="fixed bottom-6 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
        style={{ background: 'var(--color-accent)' }}
        aria-label={t('bonsaiDetail.addCare')}
      >
        <Plus size={24} style={{ color: 'var(--green1)' }} />
      </button>

      {/* Edit sheet */}
      {showEdit && (
        <EditSheet
          bonsai={bonsai}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); fetchBonsais(); loadData() }}
        />
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl px-5 py-6"
            style={{ background: 'var(--bg)' }}
          >
            <p className="mb-2 text-base font-semibold" style={{ color: 'var(--text1)' }}>
              {lang === 'es' ? '¿Eliminar este árbol?' : 'Delete this tree?'}
            </p>
            <p className="mb-5 text-sm" style={{ color: 'var(--text3)' }}>
              {lang === 'es'
                ? 'Se eliminarán todos sus cuidados, fotos y datos. Esta acción es irreversible.'
                : 'All care records, photos, and data will be deleted. This action is irreversible.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-2xl py-3 text-sm font-medium"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text2)' }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-2xl py-3 text-sm font-semibold"
                style={{ background: '#ef4444', color: 'white' }}
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </>
      )}
    </AppShell>
  )
}
