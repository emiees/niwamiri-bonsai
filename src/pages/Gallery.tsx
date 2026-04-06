import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Camera, X, Star, Trash2, LayoutGrid, Clock, Check, ChevronLeft, ChevronRight, Pencil, ImagePlus, Plus } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { useBonsaiStore } from '@/store/bonsaiStore'
import { storageService } from '@/services/storage/DexieStorageService'
import { useAppStore } from '@/store/appStore'
import { compressImage, base64ToDataUrl, extractExifDatetime } from '@/utils/images'
import { formatDate, localToday, dateStrToTs } from '@/utils/dates'
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
      // Ordenar fotos dentro del grupo DESC por takenAt; desempate por createdAt
      const sorted = [...photos].sort((a, b) =>
        b.takenAt !== a.takenAt ? b.takenAt - a.takenAt : b.createdAt - a.createdAt
      )
      return { label: label.charAt(0).toUpperCase() + label.slice(1), photos: sorted }
    })
}

type PendingPhoto = { b64: string; date: string; takenAt: number }

export default function Gallery() {
  const { id: bonsaiId } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'es'

  const { bonsais, updateBonsai } = useBonsaiStore()
  const bonsai = bonsais.find((b) => b.id === bonsaiId)
  const config = useAppStore((s) => s.config)

  const [photos, setPhotos] = useState<Photo[]>([])
  const [view, setView] = useState<'grid' | 'timeline'>('grid')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)

  // Cola de fotos pendientes de confirmar
  const [queue, setQueue] = useState<PendingPhoto[]>([])

  // Lightbox: edición de descripción y fecha
  const [editingDesc, setEditingDesc] = useState(false)
  const [descInput, setDescInput] = useState('')
  const [editingDate, setEditingDate] = useState(false)
  const [dateInput, setDateInput] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)   // galería
  const cameraInputRef = useRef<HTMLInputElement>(null)  // cámara
  const [fabOpen, setFabOpen] = useState(false)
  const todayISO = localToday()

  // Foto actualmente seleccionada en el lightbox
  const selected = photos.find((p) => p.id === selectedId) ?? null
  const selectedIndex = photos.findIndex((p) => p.id === selectedId)

  async function loadPhotos() {
    if (!bonsaiId) return
    setLoading(true)
    const p = await storageService.getPhotosByBonsai(bonsaiId)
    // Ordenar por timestamp completo (incluye hora EXIF) de más reciente a más antigua
    setPhotos([...p].sort((a, b) => b.takenAt - a.takenAt))
    setLoading(false)
  }

  useEffect(() => { loadPhotos() }, [bonsaiId])

  // F013 + F014: múltiples archivos, extrae fecha EXIF de cada uno
  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length || !bonsaiId) return
    const quality = config?.photoQuality === 'low' ? 0.6 : config?.photoQuality === 'medium' ? 0.75 : 0.85
    const pending: PendingPhoto[] = []
    for (const file of files) {
      const b64 = await compressImage(file, 1200, quality)
      // Intentar extraer fecha y hora EXIF; fallback a fecha actual al mediodía
      let date = todayISO
      let takenAt = dateStrToTs(todayISO)
      try {
        const buffer = await file.arrayBuffer()
        const exif = extractExifDatetime(buffer)
        if (exif) { date = exif.date; takenAt = exif.takenAt }
      } catch { /* sin EXIF, usar hoy */ }
      pending.push({ b64, date, takenAt })
    }
    setQueue(pending)
    e.target.value = ''
  }

  async function confirmCurrentPhoto() {
    if (!queue.length || !bonsaiId) return
    setSaving(true)
    const current = queue[0]
    const photoId = await storageService.savePhoto({
      bonsaiId, imageData: current.b64, takenAt: current.takenAt,
      isMainPhoto: photos.length === 0,
    })
    if (photos.length === 0) {
      await updateBonsai(bonsaiId, { mainPhotoId: photoId })
    }
    const remaining = queue.slice(1)
    setQueue(remaining)
    setSaving(false)
    await loadPhotos()
  }

  function skipCurrentPhoto() {
    setQueue((q) => q.slice(1))
  }

  async function handleSetMain(photo: Photo) {
    if (!bonsaiId) return
    await updateBonsai(bonsaiId, { mainPhotoId: photo.id })
    setSelectedId(null)
  }

  async function handleDelete(photo: Photo) {
    if (!bonsaiId) return
    setDeleting(true)
    await storageService.deletePhoto(photo.id)
    if (bonsai?.mainPhotoId === photo.id) {
      const remaining = photos.filter((p) => p.id !== photo.id)
      await updateBonsai(bonsaiId, { mainPhotoId: remaining[0]?.id })
    }
    setSelectedId(null)
    await loadPhotos()
    setDeleting(false)
  }

  // Lightbox: navegar entre fotos
  function goToPrev() {
    if (selectedIndex > 0) {
      setSelectedId(photos[selectedIndex - 1].id)
      setEditingDesc(false)
      setEditingDate(false)
    }
  }
  function goToNext() {
    if (selectedIndex < photos.length - 1) {
      setSelectedId(photos[selectedIndex + 1].id)
      setEditingDesc(false)
      setEditingDate(false)
    }
  }

  const PhotoThumb = ({ photo }: { photo: Photo }) => (
    <button
      onClick={() => setSelectedId(photo.id)}
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
  const pendingPhoto = queue[0] ?? null

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
            onClick={() => setFabOpen(true)}
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

      {/* FAB expandible: cámara + galería */}
      {fabOpen && (
        <div className="fixed inset-0 z-20" onClick={() => setFabOpen(false)} />
      )}
      <div className="fixed bottom-6 right-4 z-30 flex flex-col items-end gap-2">
        {fabOpen && (
          <>
            <button
              onClick={() => { setFabOpen(false); cameraInputRef.current?.click() }}
              className="flex items-center gap-2 rounded-full px-4 py-2.5 shadow-lg text-sm font-medium"
              style={{ background: 'var(--bg2)', color: 'var(--text1)', border: '1px solid var(--border)' }}
            >
              <Camera size={16} />
              {lang === 'es' ? 'Cámara' : 'Camera'}
            </button>
            <button
              onClick={() => { setFabOpen(false); fileInputRef.current?.click() }}
              className="flex items-center gap-2 rounded-full px-4 py-2.5 shadow-lg text-sm font-medium"
              style={{ background: 'var(--bg2)', color: 'var(--text1)', border: '1px solid var(--border)' }}
            >
              <ImagePlus size={16} />
              {lang === 'es' ? 'Galería' : 'Gallery'}
            </button>
          </>
        )}
        <button
          onClick={() => setFabOpen((o) => !o)}
          className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform"
          style={{ background: 'var(--color-accent)', transform: fabOpen ? 'rotate(45deg)' : 'none' }}
        >
          <Plus size={24} style={{ color: 'var(--green1)' }} />
        </button>
      </div>
      {/* Galería del dispositivo: multiple */}
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onFileChange} />
      {/* Cámara: capture fuerza la cámara directamente en iOS y Android */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />

      {/* Modal confirmar foto + fecha (F013: procesa de a una de la cola) */}
      {pendingPhoto && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-end" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-t-3xl p-5 flex flex-col gap-4" style={{ background: 'var(--bg2)' }}>
            <div className="flex items-center justify-between">
              <p className="font-semibold" style={{ color: 'var(--text1)' }}>
                {queue.length > 1
                  ? (lang === 'es' ? `Nueva foto (${queue.length} restantes)` : `New photo (${queue.length} remaining)`)
                  : (lang === 'es' ? 'Nueva foto' : 'New photo')}
              </p>
              <button onClick={() => setQueue([])}>
                <X size={20} style={{ color: 'var(--text3)' }} />
              </button>
            </div>

            {/* Preview */}
            <div className="overflow-hidden rounded-2xl" style={{ maxHeight: '40vh' }}>
              <img src={base64ToDataUrl(pendingPhoto.b64)} alt="" className="w-full object-cover" />
            </div>

            {/* Date picker (F014: prefilled con fecha EXIF si existe) */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text3)' }}>
                {lang === 'es' ? 'Fecha de la foto' : 'Photo date'}
              </label>
              <input
                type="date"
                value={pendingPhoto.date}
                max={todayISO}
                onChange={(e) => {
                  const newDate = e.target.value
                  setQueue((q) => [{ ...q[0], date: newDate, takenAt: dateStrToTs(newDate) }, ...q.slice(1)])
                }}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ background: 'var(--bg3)', color: 'var(--text1)', border: '1px solid var(--border)' }}
              />
            </div>

            {/* Acciones */}
            <div className="flex gap-3">
              {queue.length > 1 ? (
                <button
                  onClick={skipCurrentPhoto}
                  className="flex-1 rounded-2xl py-3 text-sm font-medium"
                  style={{ background: 'var(--bg3)', color: 'var(--text2)' }}
                >
                  {lang === 'es' ? 'Omitir' : 'Skip'}
                </button>
              ) : (
                <button
                  onClick={() => setQueue([])}
                  className="flex-1 rounded-2xl py-3 text-sm font-medium"
                  style={{ background: 'var(--bg3)', color: 'var(--text2)' }}
                >
                  {lang === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
              )}
              <button
                onClick={confirmCurrentPhoto}
                disabled={saving || !pendingPhoto.date}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium disabled:opacity-50"
                style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
              >
                <Check size={16} />
                {lang === 'es' ? 'Guardar' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: 'rgba(0,0,0,0.95)' }}
        >
          {/* Header con safe area (B016) */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
          >
            {/* F015: fecha+hora clickeable para editar */}
            {editingDate ? (
              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="rounded-xl px-2 py-1 text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
                  autoFocus
                />
                <button
                  onClick={async () => {
                    if (!dateInput) return
                    const takenAt = new Date(dateInput).getTime()
                    await storageService.updatePhoto(selected.id, { takenAt })
                    setEditingDate(false)
                    await loadPhotos()
                  }}
                  className="rounded-xl px-2 py-1.5"
                  style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
                >
                  <Check size={14} />
                </button>
                <button onClick={() => setEditingDate(false)}>
                  <X size={16} color="rgba(255,255,255,0.5)" />
                </button>
              </div>
            ) : (
              <button
                className="flex items-center gap-1.5"
                onClick={() => {
                  // Formato local YYYY-MM-DDTHH:MM para datetime-local input
                  const d = new Date(selected.takenAt)
                  const pad = (n: number) => String(n).padStart(2, '0')
                  const local = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
                  setDateInput(local)
                  setEditingDate(true)
                }}
              >
                <div className="text-left">
                  <p className="text-sm text-white/70">{formatDate(selected.takenAt)}</p>
                  <p className="text-xs text-white/40">
                    {new Date(selected.takenAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <Pencil size={12} color="rgba(255,255,255,0.4)" />
              </button>
            )}
            <button onClick={() => { setSelectedId(null); setEditingDesc(false); setEditingDate(false) }}>
              <X size={22} color="white" />
            </button>
          </div>

          {/* Imagen con flechas de navegación (F016) */}
          <div className="relative flex flex-1 items-center justify-center px-4">
            {selectedIndex > 0 && (
              <button
                onClick={goToPrev}
                className="absolute left-2 z-10 flex h-9 w-9 items-center justify-center rounded-full"
                style={{ background: 'rgba(0,0,0,0.4)' }}
              >
                <ChevronLeft size={20} color="white" />
              </button>
            )}
            <img
              src={base64ToDataUrl(selected.imageData)}
              alt=""
              className="max-h-full max-w-full rounded-xl object-contain"
            />
            {selectedIndex < photos.length - 1 && (
              <button
                onClick={goToNext}
                className="absolute right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full"
                style={{ background: 'rgba(0,0,0,0.4)' }}
              >
                <ChevronRight size={20} color="white" />
              </button>
            )}
          </div>

          {/* Indicador de posición */}
          {photos.length > 1 && (
            <p className="text-center text-xs text-white/40 pt-2">
              {selectedIndex + 1} / {photos.length}
            </p>
          )}

          {/* Descripción editable */}
          <div className="px-4 py-2">
            {editingDesc ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  placeholder={lang === 'es' ? 'Descripción de la foto...' : 'Photo description...'}
                  className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
                  autoFocus
                />
                <button
                  onClick={async () => {
                    await storageService.updatePhoto(selected.id, { description: descInput.trim() || undefined })
                    setEditingDesc(false)
                    await loadPhotos()
                  }}
                  className="rounded-xl px-3 py-2 text-sm font-medium"
                  style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
                >
                  <Check size={16} />
                </button>
                <button onClick={() => setEditingDesc(false)} className="rounded-xl px-3 py-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setDescInput(selected.description ?? ''); setEditingDesc(true) }}
                className="text-sm"
                style={{ color: selected.description ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)' }}
              >
                {selected.description ?? (lang === 'es' ? '+ Agregar descripción' : '+ Add description')}
              </button>
            )}
          </div>

          <div className="flex gap-3 px-4 pb-10 pt-2">
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
