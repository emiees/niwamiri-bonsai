import { useEffect, useState, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, X, BookOpen, Tag, Trash2, Camera, ImagePlus } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { storageService } from '@/services/storage/DexieStorageService'
import { compressImage, base64ToDataUrl } from '@/utils/images'
import type { JournalNote } from '@/db/schema'

// ── Utilidades de fecha ─────────────────────────────────────────

function tsToInputDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function inputDateToTs(s: string): number {
  return new Date(s + 'T12:00:00').getTime()
}

function formatDate(ts: number, lang: string): string {
  return new Date(ts).toLocaleDateString(lang === 'es' ? 'es-AR' : 'en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ── Editor de nota (sheet inferior) ────────────────────────────

function NoteSheet({
  initial,
  existingTags,
  onSave,
  onDelete,
  onClose,
}: {
  initial?: JournalNote
  existingTags: string[]
  onSave: (data: Omit<JournalNote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}) {
  const { i18n } = useTranslation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'es'

  const [title, setTitle]     = useState(initial?.title ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [date, setDate]       = useState(initial ? tsToInputDate(initial.date) : tsToInputDate(Date.now()))
  const [tags, setTags]       = useState<string[]>(initial?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [photos, setPhotos]   = useState<string[]>(initial?.photos ?? [])
  const [saving, setSaving]   = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)   // galería
  const cameraInputRef = useRef<HTMLInputElement>(null)  // cámara

  async function addPhoto(file: File) {
    const b64 = await compressImage(file, 1200, 0.85)
    setPhotos((prev) => [...prev, b64])
  }

  const tagSuggestions = useMemo(
    () => existingTags.filter((t) => !tags.includes(t) && t.toLowerCase().includes(tagInput.toLowerCase())),
    [existingTags, tags, tagInput],
  )

  function addTag(value: string) {
    const clean = value.trim().toLowerCase()
    if (clean && !tags.includes(clean)) setTags((prev) => [...prev, clean])
    setTagInput('')
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1))
    }
  }

  async function handleSave() {
    if (!content.trim()) return
    setSaving(true)
    await onSave({
      title: title.trim() || undefined,
      content: content.trim(),
      date: inputDateToTs(date),
      tags,
      photos: photos.length > 0 ? photos : undefined,
    })
    setSaving(false)
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[55] bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[60] flex flex-col rounded-t-3xl"
        style={{ background: 'var(--bg)', maxHeight: '92dvh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        {/* Header del sheet */}
        <div className="flex items-center justify-between px-5 pb-3 pt-1">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text1)' }}>
            {initial
              ? (lang === 'es' ? 'Editar nota' : 'Edit note')
              : (lang === 'es' ? 'Nueva nota' : 'New note')}
          </h2>
          <button onClick={onClose} className="rounded-full p-1.5" style={{ background: 'var(--bg3)' }}>
            <X size={16} style={{ color: 'var(--text2)' }} />
          </button>
        </div>

        {/* Formulario */}
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4 px-5 pb-4">

          {/* Fecha */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text3)' }}>
              {lang === 'es' ? 'Fecha de la clase' : 'Class date'}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{ background: 'var(--card)', color: 'var(--text1)', border: '1px solid var(--border)' }}
            />
          </div>

          {/* Título opcional */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text3)' }}>
              {lang === 'es' ? 'Título (opcional)' : 'Title (optional)'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={lang === 'es' ? 'Ej: Técnica de acodos aéreos' : 'E.g. Air layering technique'}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{ background: 'var(--card)', color: 'var(--text1)', border: '1px solid var(--border)' }}
            />
          </div>

          {/* Contenido */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text3)' }}>
              {lang === 'es' ? 'Nota *' : 'Note *'}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={lang === 'es' ? 'Escribí lo que aprendiste hoy…' : 'Write what you learned today…'}
              rows={6}
              className="w-full resize-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{ background: 'var(--card)', color: 'var(--text1)', border: '1px solid var(--border)' }}
            />
          </div>

          {/* Etiquetas */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text3)' }}>
              {lang === 'es' ? 'Etiquetas' : 'Tags'}
            </label>

            {/* Chips de tags agregados */}
            {tags.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
                  >
                    {tag}
                    <button onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Input para nuevo tag */}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => tagInput.trim() && addTag(tagInput)}
              placeholder={lang === 'es' ? 'Ej: esquejes, acodos — Enter para agregar' : 'E.g. cuttings — Enter to add'}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{ background: 'var(--card)', color: 'var(--text1)', border: '1px solid var(--border)' }}
            />

            {/* Sugerencias de tags existentes */}
            {tagInput && tagSuggestions.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {tagSuggestions.slice(0, 8).map((s) => (
                  <button
                    key={s}
                    onMouseDown={() => addTag(s)}
                    className="rounded-full px-2.5 py-1 text-xs"
                    style={{ background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}
                  >
                    + {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fotos */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text3)' }}>
              {lang === 'es' ? 'Fotos' : 'Photos'}
            </label>
            <div className="flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative">
                  <img
                    src={base64ToDataUrl(p)}
                    alt=""
                    className="h-20 w-20 rounded-xl object-cover"
                  />
                  <button
                    onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full"
                    style={{ background: '#ef4444' }}
                  >
                    <X size={10} color="white" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl"
                style={{ background: 'var(--card)', border: '2px dashed var(--border)', color: 'var(--text3)' }}
              >
                <Camera size={18} />
                <span className="text-[10px]">{lang === 'es' ? 'Cámara' : 'Camera'}</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl"
                style={{ background: 'var(--card)', border: '2px dashed var(--border)', color: 'var(--text3)' }}
              >
                <ImagePlus size={18} />
                <span className="text-[10px]">{lang === 'es' ? 'Galería' : 'Gallery'}</span>
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => { Array.from(e.target.files ?? []).forEach((f) => addPhoto(f)); e.target.value = '' }}
            />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => { Array.from(e.target.files ?? []).forEach((f) => addPhoto(f)); e.target.value = '' }}
            />
          </div>

          {/* Eliminar nota */}
          {initial && onDelete && (
            <div className="pt-2">
              {confirmDelete ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 rounded-xl py-2.5 text-sm font-medium"
                    style={{ background: 'var(--bg3)', color: 'var(--text2)' }}
                  >
                    {lang === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button
                    onClick={onDelete}
                    className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
                    style={{ background: '#ef4444', color: 'white' }}
                  >
                    {lang === 'es' ? 'Sí, eliminar' : 'Yes, delete'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium"
                  style={{ background: 'var(--bg3)', color: 'var(--color-warn)' }}
                >
                  <Trash2 size={14} />
                  {lang === 'es' ? 'Eliminar nota' : 'Delete note'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 pt-2" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
          <button
            onClick={handleSave}
            disabled={!content.trim() || saving}
            className="h-12 w-full rounded-2xl text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
          >
            {saving
              ? (lang === 'es' ? 'Guardando…' : 'Saving…')
              : (lang === 'es' ? 'Guardar nota' : 'Save note')}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Página principal ────────────────────────────────────────────

export default function Journal() {
  const { i18n } = useTranslation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'es'

  const [notes, setNotes]           = useState<JournalNote[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showSheet, setShowSheet]   = useState(false)
  const [editing, setEditing]       = useState<JournalNote | undefined>()

  async function load() {
    setLoading(true)
    const data = await storageService.getJournalNotes()
    setNotes(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Todas las etiquetas únicas de todas las notas
  const allTags = useMemo(
    () => [...new Set(notes.flatMap((n) => n.tags))].sort(),
    [notes],
  )

  const filtered = useMemo(() => {
    let list = notes
    if (selectedTag) list = list.filter((n) => n.tags.includes(selectedTag))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (n) =>
          n.content.toLowerCase().includes(q) ||
          (n.title?.toLowerCase().includes(q) ?? false) ||
          n.tags.some((t) => t.includes(q)),
      )
    }
    return list
  }, [notes, search, selectedTag])

  async function handleSave(data: Omit<JournalNote, 'id' | 'createdAt' | 'updatedAt'>) {
    if (editing) {
      await storageService.updateJournalNote(editing.id, data)
    } else {
      await storageService.saveJournalNote(data)
    }
    setShowSheet(false)
    setEditing(undefined)
    await load()
  }

  async function handleDelete() {
    if (!editing) return
    await storageService.deleteJournalNote(editing.id)
    setShowSheet(false)
    setEditing(undefined)
    await load()
  }

  function openNew() {
    setEditing(undefined)
    setShowSheet(true)
  }

  function openEdit(note: JournalNote) {
    setEditing(note)
    setShowSheet(true)
  }

  return (
    <AppShell showNav>
      <Header title={lang === 'es' ? 'Bitácora' : 'Journal'} />

      {/* Buscador */}
      <div className="px-4 pt-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === 'es' ? 'Buscar en notas…' : 'Search notes…'}
          className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          style={{ background: 'var(--card)', color: 'var(--text1)', border: '1px solid var(--border)' }}
        />
      </div>

      {/* Filtro de etiquetas */}
      {allTags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 pt-3 pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedTag(null)}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium"
            style={{
              background: selectedTag === null ? 'var(--color-accent)' : 'var(--card)',
              color: selectedTag === null ? 'var(--green1)' : 'var(--text2)',
              border: `1px solid ${selectedTag === null ? 'var(--color-accent)' : 'var(--border)'}`,
            }}
          >
            {lang === 'es' ? 'Todas' : 'All'}
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className="shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium"
              style={{
                background: selectedTag === tag ? 'var(--color-accent)' : 'var(--card)',
                color: selectedTag === tag ? 'var(--green1)' : 'var(--text2)',
                border: `1px solid ${selectedTag === tag ? 'var(--color-accent)' : 'var(--border)'}`,
              }}
            >
              <Tag size={10} />
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Listado */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm" style={{ color: 'var(--text3)' }}>
            {lang === 'es' ? 'Cargando…' : 'Loading…'}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 px-8 text-center">
          <BookOpen size={48} style={{ color: 'var(--text3)' }} />
          <p className="text-sm" style={{ color: 'var(--text3)' }}>
            {notes.length === 0
              ? (lang === 'es' ? 'Todavía no hay notas. ¡Empezá a registrar lo que aprendés!' : 'No notes yet. Start recording what you learn!')
              : (lang === 'es' ? 'Sin resultados para esa búsqueda.' : 'No results for that search.')}
          </p>
          {notes.length === 0 && (
            <button
              onClick={openNew}
              className="rounded-xl px-4 py-2 text-sm font-medium"
              style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
            >
              {lang === 'es' ? 'Nueva nota' : 'New note'}
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
          {filtered.map((note) => (
            <button
              key={note.id}
              onClick={() => openEdit(note)}
              className="flex gap-3 rounded-2xl px-4 py-3 text-left active:scale-[0.99] transition-transform"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              {/* Texto */}
              <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                {/* Fecha */}
                <span className="text-[11px]" style={{ color: 'var(--text3)' }}>
                  {formatDate(note.date, lang)}
                </span>

                {/* Título o primera línea */}
                <span className="text-sm font-semibold leading-snug line-clamp-1" style={{ color: 'var(--text1)' }}>
                  {note.title || note.content.split('\n')[0]}
                </span>

                {/* Contenido (preview si hay título) */}
                {note.title && (
                  <span className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text2)' }}>
                    {note.content}
                  </span>
                )}

                {/* Tags */}
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: 'var(--bg3)', color: 'var(--text3)' }}
                      >
                        <Tag size={8} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnail de primera foto */}
              {note.photos && note.photos.length > 0 && (
                <div className="relative shrink-0">
                  <img
                    src={base64ToDataUrl(note.photos[0])}
                    alt=""
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                  {note.photos.length > 1 && (
                    <span
                      className="absolute bottom-1 right-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                      style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}
                    >
                      +{note.photos.length - 1}
                    </span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={openNew}
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
        style={{ background: 'var(--color-accent)' }}
        aria-label={lang === 'es' ? 'Nueva nota' : 'New note'}
      >
        <Plus size={24} style={{ color: 'var(--green1)' }} />
      </button>

      {/* Sheet de edición/creación */}
      {showSheet && (
        <NoteSheet
          initial={editing}
          existingTags={allTags}
          onSave={handleSave}
          onDelete={editing ? handleDelete : undefined}
          onClose={() => { setShowSheet(false); setEditing(undefined) }}
        />
      )}
    </AppShell>
  )
}
