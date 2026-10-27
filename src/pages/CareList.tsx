import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Edit2, Plus, Search, Trash2, SlidersHorizontal } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { useBonsaiStore } from '@/store/bonsaiStore'
import { storageService } from '@/services/storage/DexieStorageService'
import { formatDate } from '@/utils/dates'
import { detailSummary } from '@/utils/careDetails'
import {
  EMPTY_CARE_FILTERS,
  filterCares,
  readCareFilters,
  invalidCareRange,
  type CareFilters,
} from '@/utils/careFilters'
import CareFiltersSheet from '@/components/care/CareFiltersSheet'
import { CareChip } from '@/components/care/CareFields'
import type { Care } from '@/db/schema'

export default function CareList() {
  const { id: bonsaiId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const filters = readCareFilters(params)
  const [showFilters, setShowFilters] = useState(false)
  const [photoIds, setPhotoIds] = useState<Set<string>>(new Set())
  const [updated] = useState(() => {
    const key = `care-list-${location.key}`
    try {
      return sessionStorage.getItem(key) === 'updated'
    } catch {
      return false
    }
  })
  const { t } = useTranslation()
  const { bonsais, fetchBonsais } = useBonsaiStore()
  const bonsai = bonsais.find((item) => item.id === bonsaiId)
  const [result, setResult] = useState<{ bonsaiId: string; cares: Care[]; failed: boolean } | null>(
    null
  )
  const [deleteConfirm, setDeleteConfirm] = useState<Care | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(false)

  useEffect(() => {
    try {
      sessionStorage.removeItem(`care-list-${location.key}`)
    } catch {
      /* almacenamiento de sesión no disponible */
    }
  }, [location.key])

  useEffect(() => {
    if (!bonsais.length) void fetchBonsais()
  }, [bonsais.length, fetchBonsais])

  useEffect(() => {
    if (!bonsaiId) return
    let active = true
    Promise.all([
      storageService.getCaresByBonsai(bonsaiId),
      storageService.getPhotosByBonsai(bonsaiId),
    ]).then(
      ([cares, photos]) => {
        if (active) {
          setPhotoIds(new Set(photos.flatMap((photo) => (photo.careId ? [photo.careId] : []))))
          setResult({ bonsaiId, cares, failed: false })
        }
      },
      () => {
        if (active) setResult({ bonsaiId, cares: [], failed: true })
      }
    )
    return () => {
      active = false
    }
  }, [bonsaiId])

  const loading = result?.bonsaiId !== bonsaiId
  const cares = !loading && result ? result.cares : []
  const query = search.trim().toLocaleLowerCase()
  const filtered = filterCares(
    cares,
    filters,
    photoIds,
    (care) =>
      !query ||
      [
        t(`care.${care.type}`),
        care.description ?? '',
        t(`condition.${care.treeCondition}`),
        detailSummary(care, t),
      ].some((value) => value.toLocaleLowerCase().includes(query))
  )
  const activeCount =
    (filters.types.length ? 1 : 0) +
    (filters.period !== 'all' ? 1 : 0) +
    (filters.photos !== 'all' ? 1 : 0)
  function applyFilters(next: CareFilters) {
    const nextParams = new URLSearchParams(params)
    for (const key of ['type', 'period', 'from', 'to', 'photos']) nextParams.delete(key)
    next.types.forEach((type) => nextParams.append('type', type))
    if (next.period !== 'all') nextParams.set('period', next.period)
    if (next.period === 'custom') {
      if (next.from) nextParams.set('from', next.from)
      if (next.to) nextParams.set('to', next.to)
    }
    if (next.photos !== 'all') nextParams.set('photos', next.photos)
    setParams(nextParams, { replace: true })
    setShowFilters(false)
  }
  const editState = { fromCareList: true, careListKey: `care-list-${location.key}` }

  async function handleDelete() {
    if (!deleteConfirm || deleting) return
    setDeleting(true)
    setDeleteError(false)
    try {
      await storageService.deleteCare(deleteConfirm.id)
      setResult((current) =>
        current
          ? {
              ...current,
              cares: current.cares.filter((care) => care.id !== deleteConfirm.id),
            }
          : current
      )
      setDeleteConfirm(null)
    } catch {
      setDeleteError(true)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppShell showNav={false}>
      <Header title={t('careList.title')} showBack />
      <div className="px-4 pt-2 pb-3">
        {bonsai && (
          <p className="mb-3 text-sm" style={{ color: 'var(--text3)' }}>
            <em>{bonsai.name}</em> · {bonsai.species}
          </p>
        )}
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <input
              type="search"
              value={search}
              onChange={(event) => {
                const next = new URLSearchParams(params)
                if (event.target.value) next.set('q', event.target.value)
                else next.delete('q')
                setParams(next, { replace: true })
              }}
              aria-label={t('careList.search')}
              placeholder={t('common.search')}
              className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{
                background: 'var(--card)',
                color: 'var(--text1)',
                border: '1px solid var(--border)',
              }}
            />
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text3)' }}
            />
          </div>
          <button
            onClick={() => setShowFilters(true)}
            aria-label={t('careFilters.title')}
            className="relative rounded-xl p-3"
            style={{
              background: 'var(--card)',
              color: 'var(--text2)',
              border: '1px solid var(--border)',
            }}
          >
            <SlidersHorizontal size={18} />
            {activeCount > 0 && (
              <span
                className="absolute -right-1 -top-1 rounded-full px-1.5 text-xs"
                style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
              >
                {activeCount}
              </span>
            )}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {filters.types.map((type) => (
            <CareChip
              key={type}
              onClick={() =>
                applyFilters({ ...filters, types: filters.types.filter((item) => item !== type) })
              }
            >
              {t(`care.${type}`)} ×
            </CareChip>
          ))}
          {filters.period !== 'all' && (
            <CareChip onClick={() => applyFilters({ ...filters, period: 'all', from: '', to: '' })}>
              {t(`careFilters.periods.${filters.period}`)}
              {filters.period === 'custom' ? ` ${filters.from} – ${filters.to}` : ''} ×
            </CareChip>
          )}
          {filters.photos !== 'all' && (
            <CareChip onClick={() => applyFilters({ ...filters, photos: 'all' })}>
              {t(`careFilters.photos.${filters.photos}`)} ×
            </CareChip>
          )}
          {activeCount > 0 && (
            <CareChip onClick={() => applyFilters(EMPTY_CARE_FILTERS)}>
              {t('careFilters.clear')}
            </CareChip>
          )}
          {search && (
            <CareChip
              onClick={() => {
                const next = new URLSearchParams(params)
                next.delete('q')
                setParams(next, { replace: true })
              }}
            >
              {t('careFilters.clearSearch')}
            </CareChip>
          )}
        </div>
        {!loading && (
          <p className="mt-2 text-xs" style={{ color: 'var(--text3)' }}>
            {t('careFilters.count', { count: filtered.length, total: cares.length })}
          </p>
        )}
        {updated && (
          <p role="status" className="mt-2 text-sm" style={{ color: 'var(--color-accent)' }}>
            {t('careFilters.updated')}
          </p>
        )}
        {invalidCareRange(filters) && (
          <p role="alert" className="text-sm" style={{ color: 'var(--color-warn)' }}>
            {t('careFilters.invalidRange')}
          </p>
        )}
      </div>
      {showFilters && (
        <CareFiltersSheet
          filters={filters}
          onApply={applyFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {loading ? (
        <p className="px-4 py-12 text-center text-sm" style={{ color: 'var(--text3)' }}>
          {t('common.loading')}
        </p>
      ) : result?.failed ? (
        <p
          role="alert"
          className="error-text px-4 py-12 text-center text-sm"
          style={{ color: 'var(--color-warn)' }}
        >
          {t('careList.loadError')}
        </p>
      ) : filtered.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm" style={{ color: 'var(--text3)' }}>
          {cares.length ? t('common.noResults') : t('bonsaiDetail.noCares')}
        </p>
      ) : (
        <div className="flex flex-col gap-2 px-4 pb-24">
          {filtered.map((care) => (
            <article
              key={care.id}
              className="rounded-2xl p-4"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--text1)' }}>
                    {t(`care.${care.type}`)}
                  </h2>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text3)' }}>
                    {formatDate(care.date)}
                  </p>
                  <p
                    className="mt-1 text-xs font-medium"
                    style={{
                      color:
                        care.treeCondition === 'good'
                          ? 'var(--color-accent)'
                          : care.treeCondition === 'regular'
                            ? 'var(--color-gold)'
                            : 'var(--color-warn)',
                    }}
                  >
                    {t(`condition.${care.treeCondition}`)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() =>
                      navigate(`/bonsai/${bonsaiId}/care/${care.id}`, { state: editState })
                    }
                    aria-label={t('careList.edit', {
                      type: t(`care.${care.type}`),
                      date: formatDate(care.date),
                    })}
                    className="rounded-full p-3"
                    style={{ color: 'var(--text3)' }}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteError(false)
                      setDeleteConfirm(care)
                    }}
                    aria-label={t('careList.delete', {
                      type: t(`care.${care.type}`),
                      date: formatDate(care.date),
                    })}
                    className="rounded-full p-3"
                    style={{ color: 'var(--text3)' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              {detailSummary(care, t) && (
                <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text3)' }}>
                  {detailSummary(care, t)}
                </p>
              )}
              {care.description && (
                <p
                  className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed"
                  style={{ color: 'var(--text2)' }}
                >
                  {care.description}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      <button
        onClick={() => navigate(`/bonsai/${bonsaiId}/care`, { state: editState })}
        aria-label={t('careList.add')}
        className="fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
        style={{
          bottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
          background: 'var(--color-accent)',
          color: 'var(--green1)',
        }}
      >
        <Plus size={24} />
      </button>

      {deleteConfirm && (
        <>
          <div
            className="fixed inset-0 z-[55] bg-black/50"
            onClick={() => {
              if (!deleting) setDeleteConfirm(null)
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-care-title"
            className="fixed bottom-0 left-0 right-0 z-[60] rounded-t-3xl px-5 pt-6"
            style={{
              background: 'var(--bg)',
              paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
            }}
          >
            <h2
              id="delete-care-title"
              className="mb-2 text-base font-semibold"
              style={{ color: 'var(--text1)' }}
            >
              {t('careList.confirmDelete')}
            </h2>
            <p className="mb-4 text-sm" style={{ color: 'var(--text2)' }}>
              {t('careList.deleteDescription')}
            </p>
            {deleteError && (
              <p
                role="alert"
                className="error-text mb-3 text-sm"
                style={{ color: 'var(--color-warn)' }}
              >
                {t('careList.deleteError')}
              </p>
            )}
            <div className="flex gap-3">
              <button
                autoFocus
                disabled={deleting}
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-2xl py-3 text-sm disabled:opacity-50"
                style={{
                  background: 'var(--card)',
                  color: 'var(--text2)',
                  border: '1px solid var(--border)',
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                disabled={deleting}
                onClick={handleDelete}
                className="flex-1 rounded-2xl py-3 text-sm font-semibold disabled:opacity-50"
                style={{ background: 'var(--color-warn)', color: 'var(--bg)' }}
              >
                {deleting ? t('common.loading') : t('common.delete')}
              </button>
            </div>
          </div>
        </>
      )}
    </AppShell>
  )
}
