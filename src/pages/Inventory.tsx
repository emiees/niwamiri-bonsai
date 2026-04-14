import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutGrid, List, Plus, X, TreePine, Sparkles, BookOpen, SlidersHorizontal } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import BonsaiCard from '@/components/bonsai/BonsaiCard'
import { RangeSlider } from '@/components/ui/RangeSlider'
import { useBonsaiStore } from '@/store/bonsaiStore'
import { storageService } from '@/services/storage/DexieStorageService'
import type { BonsaiStatus, BonsaiStyle, BonsaiSize } from '@/db/schema'

// ── Tipos y constantes compartidas ──────────────────────────────

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

const ALL_STATUSES: BonsaiStatus[] = ['developing', 'maintenance', 'recovery', 'donated', 'dead']

// ── Filtros avanzados (F031) ─────────────────────────────────────

type AdvancedFilters = {
  statuses: BonsaiStatus[]
  styles: BonsaiStyle[]
  sizes: BonsaiSize[]
  ageFrom: string        // Edad del árbol (germinación) — cantidad de años, "desde"
  ageTo: string          // Edad del árbol (germinación) — cantidad de años, "hasta"
  antiquityFrom: string  // Antigüedad (adquisición) — cantidad de años, "desde"
  antiquityTo: string    // Antigüedad (adquisición) — cantidad de años, "hasta"
}

const EMPTY_ADVANCED_FILTERS: AdvancedFilters = {
  statuses: [],
  styles: [],
  sizes: [],
  ageFrom: '',
  ageTo: '',
  antiquityFrom: '',
  antiquityTo: '',
}

function AdvancedFiltersSheet({
  filters,
  onChange,
  onClear,
  onClose,
  maxAge,
  maxAntiquity,
}: {
  filters: AdvancedFilters
  onChange: (f: AdvancedFilters) => void
  onClear: () => void
  onClose: () => void
  maxAge: number        // mayor edad (años) en la colección; 0 = sin datos
  maxAntiquity: number  // mayor antigüedad (años) en la colección; 0 = sin datos
}) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'es'
  const [local, setLocal] = useState<AdvancedFilters>(filters)

  function toggle<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
  }

  const statusOptions: { value: BonsaiStatus; label: string }[] = ALL_STATUSES.map((s) => ({
    value: s,
    label: t(`status.${s}`),
  }))

  return (
    <>
      <div className="fixed inset-0 z-[55] bg-black/50" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-[60] flex flex-col rounded-t-3xl"
        style={{ background: 'var(--bg)', maxHeight: '85dvh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text1)' }}>
            {lang === 'es' ? 'Filtros avanzados' : 'Advanced filters'}
          </h2>
          <button onClick={onClose} className="rounded-full p-1.5" style={{ background: 'var(--bg3)' }}>
            <X size={16} style={{ color: 'var(--text2)' }} />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4 flex flex-col gap-5">
          {/* Estado */}
          <div>
            <label className="mb-2 block text-xs font-medium" style={{ color: 'var(--text3)' }}>
              {lang === 'es' ? 'Estado' : 'Status'}
            </label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLocal((l) => ({ ...l, statuses: toggle(l.statuses, opt.value) }))}
                  className="shrink-0 rounded-xl px-3 py-2 text-xs font-medium"
                  style={{
                    background: local.statuses.includes(opt.value) ? 'var(--color-accent)' : 'var(--card)',
                    color: local.statuses.includes(opt.value) ? 'var(--green1)' : 'var(--text2)',
                    border: `1px solid ${local.statuses.includes(opt.value) ? 'var(--color-accent)' : 'var(--border)'}`,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Estilo */}
          <div>
            <label className="mb-2 block text-xs font-medium" style={{ color: 'var(--text3)' }}>
              {lang === 'es' ? 'Estilo' : 'Style'}
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
                    onClick={() => setLocal((l) => ({ ...l, styles: toggle(l.styles, s) }))}
                    className="shrink-0 rounded-xl px-3 py-2 text-xs font-medium"
                    style={{
                      background: local.styles.includes(s) ? 'var(--color-accent)' : 'var(--card)',
                      color: local.styles.includes(s) ? 'var(--green1)' : 'var(--text2)',
                      border: `1px solid ${local.styles.includes(s) ? 'var(--color-accent)' : 'var(--border)'}`,
                    }}
                  >
                    <span className="block">{jaName}</span>
                    {esName && <span className="block text-[10px] italic opacity-60">{esName}</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tamaño */}
          <div>
            <label className="mb-2 block text-xs font-medium" style={{ color: 'var(--text3)' }}>
              {lang === 'es' ? 'Tamaño' : 'Size'}
            </label>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setLocal((l) => ({ ...l, sizes: toggle(l.sizes, s) }))}
                  className="shrink-0 rounded-xl px-3 py-2 text-xs font-medium"
                  style={{
                    background: local.sizes.includes(s) ? 'var(--color-accent)' : 'var(--card)',
                    color: local.sizes.includes(s) ? 'var(--green1)' : 'var(--text2)',
                    border: `1px solid ${local.sizes.includes(s) ? 'var(--color-accent)' : 'var(--border)'}`,
                  }}
                >
                  <span className="block">{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                  <span className="block text-[10px] italic opacity-60">{SIZE_RANGES[s]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Edad del árbol — range slider (solo si hay datos de germinación) */}
          {maxAge > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text3)' }}>
                {lang === 'es' ? 'Edad del árbol (años)' : 'Tree age (years)'}
              </label>
              <p className="mb-3 text-[10px]" style={{ color: 'var(--text3)', opacity: 0.6 }}>
                {lang === 'es' ? 'Basado en año de germinación estimado' : 'Based on estimated germination year'}
              </p>
              <div className="mb-1 flex justify-between">
                <span className="text-xs font-medium" style={{ color: 'var(--text1)' }}>
                  {local.ageFrom ? `${local.ageFrom} ${lang === 'es' ? 'años' : 'yrs'}` : (lang === 'es' ? 'Sin límite' : 'No limit')}
                </span>
                <span className="text-xs font-medium" style={{ color: 'var(--text1)' }}>
                  {local.ageTo ? `${local.ageTo} ${lang === 'es' ? 'años' : 'yrs'}` : (lang === 'es' ? 'Sin límite' : 'No limit')}
                </span>
              </div>
              <RangeSlider
                min={1} max={maxAge}
                valueMin={parseInt(local.ageFrom) || 1}
                valueMax={parseInt(local.ageTo) || maxAge}
                onValueChange={(lo, hi) => setLocal((l) => ({
                  ...l,
                  ageFrom: lo <= 1 ? '' : String(lo),
                  ageTo: hi >= maxAge ? '' : String(hi),
                }))}
              />
              <div className="mt-1 flex justify-between">
                <span className="text-[10px]" style={{ color: 'var(--text3)' }}>1 {lang === 'es' ? 'año' : 'yr'}</span>
                <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{maxAge} {lang === 'es' ? 'años' : 'yrs'}</span>
              </div>
            </div>
          )}

          {/* Antigüedad — range slider (solo si hay datos de adquisición) */}
          {maxAntiquity > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text3)' }}>
                {lang === 'es' ? 'Antigüedad (años)' : 'Time owned (years)'}
              </label>
              <p className="mb-3 text-[10px]" style={{ color: 'var(--text3)', opacity: 0.6 }}>
                {lang === 'es' ? 'Basado en fecha de adquisición' : 'Based on acquisition date'}
              </p>
              <div className="mb-1 flex justify-between">
                <span className="text-xs font-medium" style={{ color: 'var(--text1)' }}>
                  {local.antiquityFrom ? `${local.antiquityFrom} ${lang === 'es' ? 'años' : 'yrs'}` : (lang === 'es' ? 'Sin límite' : 'No limit')}
                </span>
                <span className="text-xs font-medium" style={{ color: 'var(--text1)' }}>
                  {local.antiquityTo ? `${local.antiquityTo} ${lang === 'es' ? 'años' : 'yrs'}` : (lang === 'es' ? 'Sin límite' : 'No limit')}
                </span>
              </div>
              <RangeSlider
                min={1} max={maxAntiquity}
                valueMin={parseInt(local.antiquityFrom) || 1}
                valueMax={parseInt(local.antiquityTo) || maxAntiquity}
                onValueChange={(lo, hi) => setLocal((l) => ({
                  ...l,
                  antiquityFrom: lo <= 1 ? '' : String(lo),
                  antiquityTo: hi >= maxAntiquity ? '' : String(hi),
                }))}
              />
              <div className="mt-1 flex justify-between">
                <span className="text-[10px]" style={{ color: 'var(--text3)' }}>1 {lang === 'es' ? 'año' : 'yr'}</span>
                <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{maxAntiquity} {lang === 'es' ? 'años' : 'yrs'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="shrink-0 flex gap-3 px-5 pt-2"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={() => { onClear(); onClose() }}
            className="flex-1 rounded-2xl py-3 text-sm font-medium"
            style={{ background: 'var(--bg3)', color: 'var(--text2)' }}
          >
            {lang === 'es' ? 'Limpiar' : 'Clear'}
          </button>
          <button
            onClick={() => { onChange(local); onClose() }}
            className="flex-1 rounded-2xl py-3 text-sm font-medium"
            style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
          >
            {lang === 'es' ? 'Aplicar' : 'Apply'}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Add bonsai sheet ────────────────────────────────────────────

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

  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(EMPTY_ADVANCED_FILTERS)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
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
      const pending = events.filter((e) => !e.completed && e.bonsaiId && e.date <= now + sevenDays)
      setPendingIds(new Set(pending.map((e) => e.bonsaiId!)))
    }).catch(() => {})
  }, [bonsais.length])

  // Derived data
  const speciesOptions = useMemo(
    () => [...new Set(bonsais.map((b) => b.species))].sort(),
    [bonsais],
  )

  // F031: valores máximos para sliders de edad y antigüedad
  const maxAge = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const ages = bonsais.filter((b) => b.germinationYear).map((b) => currentYear - b.germinationYear!)
    return ages.length > 0 ? Math.max(...ages) : 0
  }, [bonsais])

  const maxAntiquity = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const vals = bonsais.filter((b) => b.acquisitionDate).map((b) => currentYear - parseInt(b.acquisitionDate!.slice(0, 4)))
    return vals.length > 0 ? Math.max(...vals) : 0
  }, [bonsais])

  // F030: mapa especie → nombre común (para mostrar en chips de filtro rápido)
  const speciesDisplayMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const b of bonsais) {
      if (!map[b.species]) map[b.species] = b.commonName || b.species
    }
    return map
  }, [bonsais])

  const tagOptions = useMemo(
    () => [...new Set(bonsais.flatMap((b) => b.tags ?? []))].sort(),
    [bonsais],
  )

  // F031: cantidad de grupos de filtros avanzados activos (para el badge)
  const activeAdvancedCount =
    (advancedFilters.statuses.length > 0 ? 1 : 0) +
    (advancedFilters.styles.length > 0 ? 1 : 0) +
    (advancedFilters.sizes.length > 0 ? 1 : 0) +
    (advancedFilters.ageFrom || advancedFilters.ageTo ? 1 : 0) +
    (advancedFilters.antiquityFrom || advancedFilters.antiquityTo ? 1 : 0)

  function clearAdvancedFilters() {
    setAdvancedFilters(EMPTY_ADVANCED_FILTERS)
  }

  const filtered = useMemo(() => {
    // 1. Filtros avanzados — definen el subconjunto base
    let list = bonsais
    if (advancedFilters.statuses.length > 0)
      list = list.filter((b) => advancedFilters.statuses.includes(b.status))
    if (advancedFilters.styles.length > 0)
      list = list.filter((b) => b.style !== undefined && advancedFilters.styles.includes(b.style))
    if (advancedFilters.sizes.length > 0)
      list = list.filter((b) => b.size !== undefined && advancedFilters.sizes.includes(b.size))
    // Edad del árbol: edad = currentYear - germinationYear
    const currentYear = new Date().getFullYear()
    if (advancedFilters.ageFrom)
      list = list.filter((b) => b.germinationYear !== undefined && (currentYear - b.germinationYear) >= parseInt(advancedFilters.ageFrom))
    if (advancedFilters.ageTo)
      list = list.filter((b) => b.germinationYear !== undefined && (currentYear - b.germinationYear) <= parseInt(advancedFilters.ageTo))
    // Antigüedad: años transcurridos desde la adquisición
    if (advancedFilters.antiquityFrom)
      list = list.filter((b) => b.acquisitionDate !== undefined && (currentYear - parseInt(b.acquisitionDate.slice(0, 4))) >= parseInt(advancedFilters.antiquityFrom))
    if (advancedFilters.antiquityTo)
      list = list.filter((b) => b.acquisitionDate !== undefined && (currentYear - parseInt(b.acquisitionDate.slice(0, 4))) <= parseInt(advancedFilters.antiquityTo))

    // 2. Búsqueda de texto — sobre el subconjunto avanzado
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (b) => b.name.toLowerCase().includes(q) || b.species.toLowerCase().includes(q),
      )
    }

    // 3. Filtros rápidos de especie — sobre el resultado anterior
    if (selectedSpecies.length > 0)
      list = list.filter((b) => selectedSpecies.includes(b.species))

    // 4. Filtros rápidos de etiquetas — sobre el resultado anterior
    if (selectedTags.length > 0)
      list = list.filter((b) => selectedTags.every((tag) => b.tags?.includes(tag)))

    return list
  }, [bonsais, search, selectedSpecies, selectedTags, advancedFilters])

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

      {/* Search + botón filtros avanzados (F031) */}
      <div className="flex items-center gap-2 px-4 pt-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('common.search')}
          className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          style={{ background: 'var(--card)', color: 'var(--text1)', border: '1px solid var(--border)' }}
        />
        <button
          onClick={activeAdvancedCount > 0 ? clearAdvancedFilters : () => setShowAdvancedFilters(true)}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: activeAdvancedCount > 0 ? 'var(--color-accent)' : 'var(--card)',
            color: activeAdvancedCount > 0 ? 'var(--green1)' : 'var(--text2)',
            border: '1px solid var(--border)',
          }}
          aria-label={activeAdvancedCount > 0 ? (lang === 'es' ? 'Limpiar filtros' : 'Clear filters') : (lang === 'es' ? 'Filtros avanzados' : 'Advanced filters')}
        >
          {activeAdvancedCount > 0 ? <X size={18} /> : <SlidersHorizontal size={18} />}
          {activeAdvancedCount > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: 'var(--text1)', color: 'var(--bg)' }}
            >
              {activeAdvancedCount}
            </span>
          )}
        </button>
      </div>

      {/* Fila 1: filtros por especie */}
      {speciesOptions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 pt-3 pb-1 scrollbar-none">
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
              {speciesDisplayMap[sp] ?? sp}
            </button>
          ))}
        </div>
      )}

      {/* Fila 2: filtros por etiqueta (solo si el usuario tiene labels) */}
      {tagOptions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 pt-1 pb-2 scrollbar-none">
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

      {/* F031: Panel de filtros avanzados */}
      {showAdvancedFilters && (
        <AdvancedFiltersSheet
          filters={advancedFilters}
          onChange={setAdvancedFilters}
          onClear={clearAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          maxAge={maxAge}
          maxAntiquity={maxAntiquity}
        />
      )}
    </AppShell>
  )
}
