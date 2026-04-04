import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Edit2, Trash2, Search } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { useBonsaiStore } from '@/store/bonsaiStore'
import { storageService } from '@/services/storage/DexieStorageService'
import { formatDate } from '@/utils/dates'
import type { ClassNote } from '@/db/schema'

// ── Note form sheet ─────────────────────────────────────────────

function NoteSheet({
  bonsaiId,
  bonsaiSpecies,
  note,
  onClose,
  onSaved,
}: {
  bonsaiId?: string
  bonsaiSpecies?: string
  note?: ClassNote
  onClose: () => void
  onSaved: () => void
}) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'es'

  const [species, setSpecies] = useState(note?.species ?? bonsaiSpecies ?? '')
  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [classDate, setClassDate] = useState(() => {
    if (note?.classDate) {
      const d = new Date(note.classDate)
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    }
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!species.trim() || !content.trim()) return
    setSaving(true)
    const data = {
      species: species.trim(),
      specimenId: bonsaiId,
      title: title.trim() || undefined,
      content: content.trim(),
      classDate: new Date(classDate + 'T12:00:00').getTime(),
    }
    if (note) {
      await storageService.updateNote(note.id, data)
    } else {
      await storageService.saveNote(data)
    }
    onSaved()
  }

  return (
    <>
      <div className="fixed inset-0 z-[55] bg-black/50" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-[60] flex flex-col rounded-t-3xl"
        style={{ background: 'var(--bg)', maxHeight: '90dvh' }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text1)' }}>
            {note
              ? (lang === 'es' ? 'Editar nota' : 'Edit note')
              : (lang === 'es' ? 'Nueva nota' : 'New note')}
          </h2>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-xl px-3 py-1.5 text-sm" style={{ color: 'var(--text2)' }}>
              {t('common.cancel')}
            </button>
            <button
              onClick={save}
              disabled={!species.trim() || !content.trim() || saving}
              className="rounded-xl px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
              style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
            >
              {saving ? '...' : t('common.save')}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto px-5 pb-8">
          {!bonsaiSpecies && (
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text3)' }}>
                {lang === 'es' ? 'Especie *' : 'Species *'}
              </label>
              <input
                type="text" value={species} onChange={(e) => setSpecies(e.target.value)}
                placeholder="Ficus retusa"
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                style={{ background: 'var(--bg3)', color: 'var(--text1)', border: '1px solid var(--border)' }}
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text3)' }}>
              {lang === 'es' ? 'Fecha de clase' : 'Class date'}
            </label>
            <input
              type="date" value={classDate} onChange={(e) => setClassDate(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{ background: 'var(--bg3)', color: 'var(--text1)', border: '1px solid var(--border)' }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text3)' }}>
              {lang === 'es' ? 'Título (opcional)' : 'Title (optional)'}
            </label>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={lang === 'es' ? 'Ej: Técnica de alambrado' : 'E.g. Wiring technique'}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{ background: 'var(--bg3)', color: 'var(--text1)', border: '1px solid var(--border)' }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text3)' }}>
              {lang === 'es' ? 'Contenido *' : 'Content *'}
            </label>
            <textarea
              value={content} onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder={lang === 'es' ? 'Escribí tus notas de clase aquí...' : 'Write your class notes here...'}
              className="w-full resize-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{ background: 'var(--bg3)', color: 'var(--text1)', border: '1px solid var(--border)' }}
            />
          </div>
        </div>
      </div>
    </>
  )
}

// ── Main page ───────────────────────────────────────────────────

export default function ClassNotes() {
  const { id: bonsaiId } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'es'

  const { bonsais } = useBonsaiStore()
  const bonsai = bonsais.find((b) => b.id === bonsaiId)

  const [notes, setNotes] = useState<ClassNote[]>([])
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editNote, setEditNote] = useState<ClassNote | undefined>()
  const [deleteConfirm, setDeleteConfirm] = useState<ClassNote | null>(null)

  async function loadNotes() {
    if (!bonsaiId || !bonsai) return
    const [specimen, species] = await Promise.all([
      storageService.getNotesBySpecimen(bonsaiId),
      storageService.getNotesBySpecies(bonsai.species),
    ])
    const seen = new Set(specimen.map((n) => n.id))
    const all = [...specimen, ...species.filter((n) => !seen.has(n.id))]
    all.sort((a, b) => b.classDate - a.classDate)
    setNotes(all)
  }

  useEffect(() => { loadNotes() }, [bonsaiId, bonsai?.species])

  const filtered = useMemo(() => {
    if (!search.trim()) return notes
    const q = search.toLowerCase()
    return notes.filter(
      (n) =>
        n.content.toLowerCase().includes(q) ||
        (n.title ?? '').toLowerCase().includes(q) ||
        n.species.toLowerCase().includes(q),
    )
  }, [notes, search])

  async function handleDelete(note: ClassNote) {
    await storageService.deleteNote(note.id)
    setDeleteConfirm(null)
    loadNotes()
  }

  return (
    <AppShell showNav={false}>
      <Header
        showBack
        title={lang === 'es' ? 'Notas de clase' : 'Class notes'}
      />

      {/* Search */}
      <div className="px-4 pt-2 pb-2">
        <div className="relative">
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.search')}
            className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            style={{ background: 'var(--card)', color: 'var(--text1)', border: '1px solid var(--border)' }}
          />
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text3)' }} />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <p className="text-sm" style={{ color: 'var(--text3)' }}>
            {notes.length === 0
              ? (lang === 'es' ? 'Sin notas aún' : 'No notes yet')
              : t('common.noResults')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 px-4 pb-4">
          {filtered.map((note) => (
            <div
              key={note.id}
              className="rounded-2xl p-4"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs rounded-full px-2 py-0.5" style={{ background: 'var(--bg3)', color: 'var(--text3)' }}>
                      <em>{note.species}</em>
                    </span>
                    {note.specimenId && (
                      <span className="text-xs rounded-full px-2 py-0.5" style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}>
                        {lang === 'es' ? 'este árbol' : 'this tree'}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: 'var(--text3)' }}>
                      {formatDate(note.classDate)}
                    </span>
                  </div>
                  {note.title && (
                    <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text1)' }}>{note.title}</p>
                  )}
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>{note.content}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => setEditNote(note)}
                    className="rounded-full p-1.5"
                    style={{ color: 'var(--text3)' }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(note)}
                    className="rounded-full p-1.5"
                    style={{ color: 'var(--text3)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
        style={{ background: 'var(--color-accent)' }}
      >
        <Plus size={24} style={{ color: 'var(--green1)' }} />
      </button>

      {/* Add / Edit sheet */}
      {(showAdd || editNote) && (
        <NoteSheet
          bonsaiId={bonsaiId}
          bonsaiSpecies={bonsai?.species}
          note={editNote}
          onClose={() => { setShowAdd(false); setEditNote(undefined) }}
          onSaved={() => { setShowAdd(false); setEditNote(undefined); loadNotes() }}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <>
          <div className="fixed inset-0 z-[55] bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <div
            className="fixed bottom-0 left-0 right-0 z-[60] rounded-t-3xl px-5 py-6"
            style={{ background: 'var(--bg)' }}
          >
            <p className="mb-4 text-base font-semibold" style={{ color: 'var(--text1)' }}>
              {lang === 'es' ? '¿Eliminar esta nota?' : 'Delete this note?'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-2xl py-3 text-sm"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text2)' }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
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
