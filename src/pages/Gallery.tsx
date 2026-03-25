import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Camera, X, Star, Trash2, LayoutGrid, Clock } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { useBonsaiStore } from '@/store/bonsaiStore'
import { storageService } from '@/services/storage/DexieStorageService'
import { useAppStore } from '@/store/appStore'
import { compressImage, base64ToDataUrl } from '@/utils/images'
import { formatDate } from '@/utils/dates'
import type { Photo } from '@/db/schema'

function groupByMonth(photos: Photo[]): { label: string; photos: Photo[] }[] {
  const groups: Record<string, Photo[]> = {}
  for (const p of photos) {
    const d = new Date(p.takenAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!groups[key]) groups[key] = []
    groups[key].push(p)
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, photos]) => {
      const [year, month] = key.split('-')
      const d = new Date(parseInt(year), parseInt(month) - 1, 1)
      const label = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
      return { label: label.charAt(0).toUpperCase() + label.slice(1), photos }
    })
}

export default function Gallery() {
  const { id: bonsaiId } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'es'

  const { bonsais, updateBonsai } = useBonsaiStore()
  const bonsai = bonsais.find((b) => b.id === bonsaiId)
  const config = useAppStore((s) => s.config)

  const [photos, setPhotos] = useState<Photo[]>([])
  const [view, setView] = useState<'grid' | 'timeline'>('grid')
  const [selected, setSelected] = useState<Photo | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function loadPhotos() {
    if (!bonsaiId) return
    setLoading(true)
    const p = await storageService.getPhotosByBonsai(bonsaiId)
    setPhotos(p)
    setLoading(false)
  }

  useEffect(() => {
    loadPhotos()
  }, [bonsaiId])

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !bonsaiId) return
    const quality = config?.photoQuality === 'low' ? 0.6 : config?.photoQuality === 'medium' ? 0.75 : 0.85
    const b64 = await compressImage(file, 1200, quality)
    const isFirst = photos.length === 0
    const photoId = await storageService.savePhoto({
      bonsaiId, imageData: b64, takenAt: Date.now(),
      isMainPhoto: isFirst,
    })
    if (isFirst) {
      await updateBonsai(bonsaiId, { mainPhotoId: photoId })
    }
    await loadPhotos()
    e.target.value = ''
  }

  async function handleSetMain(photo: Photo) {
    if (!bonsaiId) return
    // Mark all as non-main, set selected as main
    for (const p of photos) {
      if (p.isMainPhoto && p.id !== photo.id) {
        // would need updatePhoto — but there's no updatePhoto in StorageService
        // Workaround: we only track mainPhotoId in Bonsai
      }
    }
    await updateBonsai(bonsaiId, { mainPhotoId: photo.id })
    setSelected(null)
  }

  async function handleDelete(photo: Photo) {
    if (!bonsaiId) return
    setDeleting(true)
    await storageService.deletePhoto(photo.id)
    if (bonsai?.mainPhotoId === photo.id) {
      const remaining = photos.filter((p) => p.id !== photo.id)
      await updateBonsai(bonsaiId, { mainPhotoId: remaining[0]?.id })
    }
    setSelected(null)
    await loadPhotos()
    setDeleting(false)
  }

  const PhotoThumb = ({ photo }: { photo: Photo }) => (
    <button
      onClick={() => setSelected(photo)}
      className="relative aspect-square overflow-hidden rounded-xl"
      style={{ background: 'var(--bg3)' }}
    >
      <img src={base64ToDataUrl(photo.imageData)} alt="" className="h-full w-full object-cover" />
      {bonsai?.mainPhotoId === photo.id && (
        <div className="absolute right-1 top-1 rounded-full bg-yellow-400 p-0.5">
          <Star size={10} fill="white" color="white" />
        </div>
      )}
    </button>
  )

  const groups = groupByMonth(photos)

  return (
    <AppShell showNav={false}>
      <Header
        showBack
        title={lang === 'es' ? 'Galería' : 'Gallery'}
        actions={
          <button
            onClick={() => setView((v) => v === 'grid' ? 'timeline' : 'grid')}
            className="rounded-full p-2"
            style={{ color: 'var(--text2)' }}
          >
            {view === 'grid' ? <Clock size={18} /> : <LayoutGrid size={18} />}
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm" style={{ color: 'var(--text3)' }}>{t('common.loading')}</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <p className="text-sm" style={{ color: 'var(--text3)' }}>
            {lang === 'es' ? 'Sin fotos aún' : 'No photos yet'}
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl px-4 py-2 text-sm font-medium"
            style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
          >
            {lang === 'es' ? 'Agregar foto' : 'Add photo'}
          </button>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-3 gap-1 p-3">
          {photos.map((p) => <PhotoThumb key={p.id} photo={p} />)}
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-4 py-2">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text3)' }}>
                {group.label}
              </p>
              <div className="grid grid-cols-3 gap-1">
                {group.photos.map((p) => <PhotoThumb key={p.id} photo={p} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="fixed bottom-6 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
        style={{ background: 'var(--color-accent)' }}
      >
        <Camera size={22} style={{ color: 'var(--green1)' }} />
      </button>
      <input
        ref={fileInputRef} type="file" accept="image/*" capture="environment"
        className="hidden" onChange={onFileChange}
      />

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: 'rgba(0,0,0,0.95)' }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm text-white/70">{formatDate(selected.takenAt)}</p>
            <button onClick={() => setSelected(null)}>
              <X size={22} color="white" />
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center px-4">
            <img
              src={base64ToDataUrl(selected.imageData)}
              alt=""
              className="max-h-full max-w-full rounded-xl object-contain"
            />
          </div>
          {selected.description && (
            <p className="px-4 py-2 text-sm text-white/70">{selected.description}</p>
          )}
          <div className="flex gap-3 px-4 pb-10 pt-4">
            <button
              onClick={() => handleSetMain(selected)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
            >
              <Star size={16} />
              {lang === 'es' ? 'Portada' : 'Set cover'}
            </button>
            <button
              onClick={() => handleDelete(selected)}
              disabled={deleting}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium disabled:opacity-50"
              style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
            >
              <Trash2 size={16} />
              {t('common.delete')}
            </button>
          </div>
        </div>
      )}
    </AppShell>
  )
}
