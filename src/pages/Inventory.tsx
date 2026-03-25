import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutGrid, List, Plus, X, TreePine } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import BonsaiCard from '@/components/bonsai/BonsaiCard'
import { useBonsaiStore } from '@/store/bonsaiStore'
import { storageService } from '@/services/storage/DexieStorageService'
import { useSeason } from '@/hooks/useSeason'
import type { BonsaiStatus, BonsaiStyle } from '@/db/schema'

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

function AddBonsaiSheet({
  existingSpecies,
  onClose,
  onSaved,
}: {
  existingSpecies: string[]
  onClose: () => void
  onSaved: (id: string) => void
}) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'es'
  const addBonsai = useBonsaiStore((s) => s.addBonsai)

  const [name, setName] = useState('')
  const [species, setSpecies] = useState('')
  const [status, setStatus] = useState<BonsaiStatus>('developing')
  const [style, setStyle] = useState<BonsaiStyle | ''>('')
  const [germinationYear, setGerminationYear] = useState('')
  const [saving, setSaving] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

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
        status,
        style: style || undefined,
        germinationYear: germinationYear ? parseInt(germinationYear) : undefined,
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
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl pb-safe"
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
        <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-6">
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
              {STYLES.map((s) => (
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
                  {t(`style.${s}`).split(' ')[0]}
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

          {/* Save */}
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
  const lang = i18n.language.startsWith('en') ? 'en' : 'es'

  const { bonsais, loading, fetchBonsais } = useBonsaiStore()
  const season = useSeason()

  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([])
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [showAdd, setShowAdd] = useState(false)

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
    return list
  }, [bonsais, search, selectedSpecies])

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
          <button
            onClick={() => setView((v) => (v === 'grid' ? 'list' : 'grid'))}
            className="rounded-full p-2"
            style={{ color: 'var(--text2)' }}
            aria-label={view === 'grid' ? 'List view' : 'Grid view'}
          >
            {view === 'grid' ? <List size={20} /> : <LayoutGrid size={20} />}
          </button>
        }
      />

      {/* Search */}
      <div className="px-4 pt-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('common.search')}
          className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          style={{ background: 'var(--card)', color: 'var(--text1)', border: '1px solid var(--border)' }}
        />
      </div>

      {/* Species filter chips */}
      {speciesOptions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-none">
          <button
            onClick={() => setSelectedSpecies([])}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium"
            style={{
              background: selectedSpecies.length === 0 ? 'var(--color-accent)' : 'var(--card)',
              color: selectedSpecies.length === 0 ? 'var(--green1)' : 'var(--text2)',
              border: `1px solid ${selectedSpecies.length === 0 ? 'var(--color-accent)' : 'var(--border)'}`,
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
        </div>
      )}

      {/* Season + pending row */}
      <div className="flex items-center gap-2 px-4 pb-2">
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

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
        style={{ background: 'var(--color-accent)' }}
        aria-label={t('inventory.addNew')}
      >
        <Plus size={24} style={{ color: 'var(--green1)' }} />
      </button>

      {/* Add sheet */}
      {showAdd && (
        <AddBonsaiSheet
          existingSpecies={speciesOptions}
          onClose={() => setShowAdd(false)}
          onSaved={(id) => {
            setShowAdd(false)
            navigate(`/bonsai/${id}`)
          }}
        />
      )}
    </AppShell>
  )
}
