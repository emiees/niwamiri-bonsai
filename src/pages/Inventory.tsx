import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutGrid, List, Plus, X, TreePine, Sparkles, BookOpen } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import BonsaiCard from '@/components/bonsai/BonsaiCard'
import { useBonsaiStore } from '@/store/bonsaiStore'
import { storageService } from '@/services/storage/DexieStorageService'
import { useSeason } from '@/hooks/useSeason'
import type { BonsaiStatus, BonsaiStyle, BonsaiSize } from '@/db/schema'

// ── Season chip config ──────────────────────────────────────────

const SEASON_LABELS: Record<string, { es: string; en: string; emoji: string }> = {
  spring: { es: 'Primavera', en: 'Spring',  emoji: '🌸' },
  summer: { es: 'Verano',    en: 'Summer',  emoji: '☀️' },
  autumn: { es: 'Otoño',     en: 'Autumn',  emoji: '🍂' },
  winter: { es: 'Invierno',  en: 'Winter',  emoji: '❄️' },
}

// ── Add bonsai sheet ────────────────────────────────────────────

const STYLES: BonsaiStyle[] = [
  'chokkan', 'moyogi', 'shakan', 'kengai', 'han-kengai',
  'hokidachi', 'fukinagashi', 'yose-ue', 'literati', 'other',
]

const SIZES: BonsaiSize[] = ['shito', 'mame', 'shohin', 'chuhin', 'dai']

const SIZE_RANGES: Record<BonsaiSize, string> = {
  shito:  '< 5 cm',
  mame:   '5–15 cm',
  shohin: '15–25 cm',
  chuhin: '25–45 cm',
  dai:    '> 45 cm',
}

function AddBonsaiSheet({
  existingSpecies,
  prefill,
  onClose,
  onSaved,
}: {
  existingSpecies: string[]
  prefill?: { species: string; commonName?: string }
  onClose: () => void
  onSaved: (id: string) => void
}) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'es'
  const addBonsai = useBonsaiStore((s) => s.addBonsai)

  const [name, setName] = useState('')
  const [species, setSpecies] = useState(prefill?.species ?? '')
  const [commonName, setCommonName] = useState(prefill?.commonName ?? '')
  const [status, setStatus] = useState<BonsaiStatus>('developing')
  const [style, setStyle] = useState<BonsaiStyle | ''>('')
  const [size, setSize] = useState<BonsaiSize | ''>('')
  const [germinationYear, setGerminationYear] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  function addTag(value: string) {
    const t = value.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t])
    setTagInput('')
  }

  function onTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) setTags((prev) => prev.slice(0, -1))
  }

  const suggestions = useMemo(
    () => existingSpecies.filter((s) => s.toLowerCase().includes(species.toLowerCase()) && s !== species),
    [existingSpecies, species],
  )

  async function save() {
    if (!name.trim() || !species.trim()) return
    setSaving(true)
    try {
      const id = await addBonsai({
        name: name.trim(),
        species: species.trim(),
        commonName: commonName.trim() || undefined,
        status,
        style: style || undefined,
        size: size as BonsaiSize || undefined,
        germinationYear: germinationYear ? parseInt(germinationYear) : undefined,
        tags: tags.length > 0 ? tags : undefined,
      })
      onSaved(id)
    } catch {
      setSaving(false)
    }
  }

  const statusOptions: { value: BonsaiStatus; label: string }[] = [
    { value: 'developing',  label: t('status.developing')  },
    { value: 'maintenance', label: t('status.maintenance') },
    { value: 'recovery',    label: t('status.recovery')    },
  ]

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[55] bg-black/50"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[60] flex flex-col rounded-t-3xl"
        style={{ background: 'var(--bg)', maxHeight: '90dvh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text1)' }}>
            {lang === 'es' ? 'Nuevo bonsai' : 'New bonsai'}
          </h2>
          <button onClick={onClose} className="rounded-full p-1.5" style={{ background: 'var(--bg3)' }}>
            <X size={16} style={{ color: 'var(--text2)' }} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto px-5 pb-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text3)' }}>
              {lang === 'es' ? 'Nombre / Apodo *' : 'Name / Nickname *'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={lang === 'es' ? 'Mi ficus dorado' : 'My golden ficus'}
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{ background: 'var(--card)', color: 'var(--text1)', border: '1px solid var(--border)' }}
            />
          </div>

          {/* Species */}
          <div className="relative">
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text3)' }}>
              {lang === 'es' ? 'Especie *' : 'Species *'}
            </label>
            <input
              type="text"
              value={species}
              onChange={(e) => { setSpecies(e.target.value); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Ficus retusa"
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{ background: 'var(--card)', color: 'var(--text1)', border: '1px solid var(--border)' }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div
                className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl shadow-lg"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                {suggestions.slice(0, 5).map((s) => (
                  <button
                    key={s}
                    onMouseDown={() => { setSpecies(s); setShowSuggestions(false) }}
                    className="flex w-full items-center px-4 py-2.5 text-sm text-left active:bg-white/5"
                    style={{ color: 'var(--text1)', borderBottom: '1px solid var(--border)' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Common name */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text3)' }}>
              {lang === 'es' ? 'Nombre común (opcional)' : 'Common name (optional)'}
            </label>
            <input
              type="text"
              value={commonName}
              onChange={(e) => setCommonName(e.target.value)}
              placeholder={lang === 'es' ? 'Ej: Ficus, Olmo chino…' : 'E.g. Ficus, Chinese elm…'}
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{ background: 'var(--card)', color: 'var(--text1)', border: '1px solid var(--border)' }}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text3)' }}>
              {lang === 'es' ? 'Etiquetas (opcional)' : 'Tags (optional)'}
            </label>
            <div
              className="flex flex-wrap gap-1.5 rounded-xl px-3 py-2.5 min-h-[44px]"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
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
          </div>

          {/* Status */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text3)' }}>
              {lang === 'es' ? 'Estado' : 'Status'}
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className="shrink-0 rounded-xl px-3 py-2 text-xs font-medium"
                  style={{
                    background: status === opt.value ? 'var(--color-accent)' : 'var(--card)',
                    color: status === opt.value ? 'var(--green1)' : 'var(--text2)',
                    border: `1px solid ${status === opt.value ? 'var(--color-accent)' : 'var(--border)'}`,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text3)' }}>
              {lang === 'es' ? 'Estilo (opcional)' : 'Style (optional)'}
            </label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => {
                const fullLabel = t(`style.${s}`)
                const parenIdx = fullLabel.indexOf(' (')
                const jaName = parenIdx !== -1 ? fullLabel.slice(0, parenIdx) : fullLabel
                const esName = parenIdx !== -1 ? fullLabel.slice(parenIdx + 2, -1) : null
                return (
                  <button
                    key={s}
                    onClick={() => setStyle(style === s ? '' : s)}
                    className="shrink-0 rounded-xl px-3 py-2 text-xs font-medium"
                    style={{
                      background: style === s ? 'var(--color-accent)' : 'var(--card)',
                      color: style === s ? 'var(--green1)' : 'var(--text2)',
                      border: `1px solid ${style === s ? 'var(--color-accent)' : 'var(--border)'}`,
                    }}
                  >
                    <span className="block">{jaName}</span>
                    {esName && (
                      <span className="block text-[10px] italic opacity-60">{esName}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Size */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text3)' }}>
              {lang === 'es' ? 'Tamaño (opcional)' : 'Size (optional)'}
            </label>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(size === s ? '' : s)}
                  className="shrink-0 rounded-xl px-3 py-2 text-xs font-medium"
                  style={{
                    background: size === s ? 'var(--color-accent)' : 'var(--card)',
                    color: size === s ? 'var(--green1)' : 'var(--text2)',
                    border: `1px solid ${size === s ? 'var(--color-accent)' : 'var(--border)'}`,
                  }}
                >
                  <span className="block">{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                  <span className="block text-[10px] italic opacity-60">{SIZE_RANGES[s]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Germination year */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text3)' }}>
              {lang === 'es' ? 'Año de germinación estimado (opcional)' : 'Estimated germination year (optional)'}
            </label>
            <input
              type="number"
              value={germinationYear}
              onChange={(e) => setGerminationYear(e.target.value)}
              placeholder={lang === 'es' ? 'Ej: 1990' : 'E.g. 1990'}
              min={1900}
              max={new Date().getFullYear()}
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{ background: 'var(--card)', color: 'var(--text1)', border: '1px solid var(--border)' }}
            />
          </div>

        </div>

        {/* Footer con botón siempre visible */}
        <div className="shrink-0 px-5 pt-2" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
          <button
            onClick={save}
            disabled={!name.trim() || !species.trim() || saving}
            className="h-12 w-full rounded-2xl text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
          >
            {saving
              ? (lang === 'es' ? 'Guardando…' : 'Saving…')
              : (lang === 'es' ? 'Agregar árbol' : 'Add tree')}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Main page ───────────────────────────────────────────────────

export default function Inventory() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'es'

  const { bonsais, loading, fetchBonsais } = useBonsaiStore()
  const season = useSeason()

  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [showAdd, setShowAdd] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)
  const [prefill, setPrefill] = useState<{ species: string; commonName?: string } | undefined>()

  // Si venimos de Identificar con especie pre-cargada, abrir el sheet
  useEffect(() => {
    const state = location.state as { prefillSpecies?: string; prefillCommonName?: string } | null
    if (state?.prefillSpecies) {
      setPrefill({ species: state.prefillSpecies, commonName: state.prefillCommonName })
      setShowAdd(true)
      // Limpiar el state de navegación para que no se re-abra en refreshes
      window.history.replaceState({}, '')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load bonsais + pending events on mount
  useEffect(() => {
    fetchBonsais()
  }, [fetchBonsais])

  useEffect(() => {
    const now = Date.now()
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    storageService.getEventsByDateRange(0, now + sevenDays).then((events) => {
      const ids = new Set(
        events
          .filter((e) => !e.completed && e.bonsaiId && e.date <= now + sevenDays)
          .map((e) => e.bonsaiId!)
      )
      setPendingIds(ids)
    }).catch(() => {})
  }, [bonsais.length])

  // Derived data
  const speciesOptions = useMemo(
    () => [...new Set(bonsais.map((b) => b.species))].sort(),
    [bonsais],
  )

  const tagOptions = useMemo(
    () => [...new Set(bonsais.flatMap((b) => b.tags ?? []))].sort(),
    [bonsais],
  )

  const filtered = useMemo(() => {
    let list = bonsais
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (b) => b.name.toLowerCase().includes(q) || b.species.toLowerCase().includes(q),
      )
    }
    if (selectedSpecies.length > 0) {
      list = list.filter((b) => selectedSpecies.includes(b.species))
    }
    if (selectedTags.length > 0) {
      list = list.filter((b) => selectedTags.every((tag) => b.tags?.includes(tag)))
    }
    return list
  }, [bonsais, search, selectedSpecies, selectedTags])

  const seasonInfo = SEASON_LABELS[season]
  const pendingCount = pendingIds.size

  const seasonChip = (
    <span
      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text2)' }}
    >
      {seasonInfo.emoji} {lang === 'es' ? seasonInfo.es : seasonInfo.en}
    </span>
  )

  return (
    <AppShell showNav>
      <Header
        title={t('inventory.title')}
        actions={
          <div className="flex items-center gap-1">
            <a
              href="https://github.com/emiees/niwamiri-bonsai/wiki"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full p-2"
              style={{ color: 'var(--text2)' }}
              aria-label={lang === 'es' ? 'Ayuda / Wiki' : 'Help / Wiki'}
            >
              <BookOpen size={20} />
            </a>
            <button
              onClick={() => setView((v) => (v === 'grid' ? 'list' : 'grid'))}
              className="rounded-full p-2"
              style={{ color: 'var(--text2)' }}
              aria-label={view === 'grid' ? 'List view' : 'Grid view'}
            >
              {view === 'grid' ? <List size={20} /> : <LayoutGrid size={20} />}
            </button>
          </div>
        }
      />

      {/* Estación + pendientes — sobre el buscador, alineado a la derecha */}
      <div className="flex items-center justify-end gap-2 px-4 pt-2">
        {seasonChip}
        {pendingCount > 0 && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: 'rgba(251,146,60,0.15)', color: 'rgb(251,146,60)' }}
          >
            ⚠️ {pendingCount} {lang === 'es' ? 'pendiente' + (pendingCount > 1 ? 's' : '') : 'pending'}
          </span>
        )}
      </div>

      {/* Search */}
      <div className="px-4 pt-1">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('common.search')}
          className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          style={{ background: 'var(--card)', color: 'var(--text1)', border: '1px solid var(--border)' }}
        />
      </div>

      {/* Species + tag filter chips */}
      {(speciesOptions.length > 0 || tagOptions.length > 0) && (
        <div className="flex gap-2 overflow-x-auto px-4 pt-3 pb-2 scrollbar-none">
          <button
            onClick={() => { setSelectedSpecies([]); setSelectedTags([]) }}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium"
            style={{
              background: selectedSpecies.length === 0 && selectedTags.length === 0 ? 'var(--color-accent)' : 'var(--card)',
              color: selectedSpecies.length === 0 && selectedTags.length === 0 ? 'var(--green1)' : 'var(--text2)',
              border: `1px solid ${selectedSpecies.length === 0 && selectedTags.length === 0 ? 'var(--color-accent)' : 'var(--border)'}`,
            }}
          >
            {t('inventory.filterAll')}
          </button>
          {speciesOptions.map((sp) => (
            <button
              key={sp}
              onClick={() =>
                setSelectedSpecies((prev) =>
                  prev.includes(sp) ? prev.filter((s) => s !== sp) : [...prev, sp],
                )
              }
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium"
              style={{
                background: selectedSpecies.includes(sp) ? 'var(--color-accent)' : 'var(--card)',
                color: selectedSpecies.includes(sp) ? 'var(--green1)' : 'var(--text2)',
                border: `1px solid ${selectedSpecies.includes(sp) ? 'var(--color-accent)' : 'var(--border)'}`,
              }}
            >
              {sp}
            </button>
          ))}
          {tagOptions.length > 0 && speciesOptions.length > 0 && (
            <span className="shrink-0 self-center" style={{ color: 'var(--border)', fontSize: 18 }}>|</span>
          )}
          {tagOptions.map((tag) => (
            <button
              key={tag}
              onClick={() =>
                setSelectedTags((prev) =>
                  prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                )
              }
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium"
              style={{
                background: selectedTags.includes(tag) ? 'var(--color-accent)' : 'var(--card)',
                color: selectedTags.includes(tag) ? 'var(--green1)' : 'var(--text2)',
                border: `1px solid ${selectedTags.includes(tag) ? 'var(--color-accent)' : 'var(--border)'}`,
              }}
            >
              # {tag}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading && bonsais.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-sm" style={{ color: 'var(--text3)' }}>{t('common.loading')}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <TreePine size={48} style={{ color: 'var(--text3)' }} />
          <p className="text-sm" style={{ color: 'var(--text3)' }}>
            {bonsais.length === 0 ? t('inventory.empty') : t('common.noResults')}
          </p>
          {bonsais.length === 0 && (
            <button
              onClick={() => setShowAdd(true)}
              className="rounded-xl px-4 py-2 text-sm font-medium"
              style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
            >
              {t('inventory.addFirst')}
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 px-4 pb-4">
          {filtered.map((bonsai) => (
            <BonsaiCard
              key={bonsai.id}
              bonsai={bonsai}
              hasPending={pendingIds.has(bonsai.id)}
              view="grid"
              onClick={() => navigate(`/bonsai/${bonsai.id}`)}
            />
          ))}
        </div>
      ) : (
        <div
          className="mx-4 overflow-hidden rounded-2xl"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          {filtered.map((bonsai) => (
            <BonsaiCard
              key={bonsai.id}
              bonsai={bonsai}
              hasPending={pendingIds.has(bonsai.id)}
              view="list"
              onClick={() => navigate(`/bonsai/${bonsai.id}`)}
            />
          ))}
        </div>
      )}

      {/* FAB expandible */}
      {fabOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setFabOpen(false)}
        />
      )}
      {fabOpen && (
        <div className="fixed bottom-40 right-4 z-30 flex flex-col items-end gap-2">
          <button
            onClick={() => { setFabOpen(false); navigate('/identify') }}
            className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-semibold shadow-lg"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text1)' }}
          >
            <Sparkles size={16} style={{ color: 'var(--color-accent)' }} />
            {lang === 'es' ? 'Identificar con IA' : 'Identify with AI'}
          </button>
          <button
            onClick={() => { setFabOpen(false); setPrefill(undefined); setShowAdd(true) }}
            className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-semibold shadow-lg"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text1)' }}
          >
            <TreePine size={16} style={{ color: 'var(--color-accent)' }} />
            {lang === 'es' ? 'Nuevo bonsai' : 'New bonsai'}
          </button>
        </div>
      )}
      <button
        onClick={() => setFabOpen((v) => !v)}
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform"
        style={{
          background: 'var(--color-accent)',
          transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)',
        }}
        aria-label={t('inventory.addNew')}
      >
        <Plus size={24} style={{ color: 'var(--green1)' }} />
      </button>

      {/* Add sheet */}
      {showAdd && (
        <AddBonsaiSheet
          existingSpecies={speciesOptions}
          prefill={prefill}
          onClose={() => { setShowAdd(false); setPrefill(undefined) }}
          onSaved={(id) => {
            setShowAdd(false)
            setPrefill(undefined)
            navigate(`/bonsai/${id}`)
          }}
        />
      )}
    </AppShell>
  )
}
