import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sparkles, Loader2, Edit2, Check, X, FileDown } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { useBonsaiStore } from '@/store/bonsaiStore'
import { storageService } from '@/services/storage/DexieStorageService'
import { useAppStore } from '@/store/appStore'
import { createAIService } from '@/hooks/useAI'
import type { SpeciesSheet as SpeciesSheetType, SheetOrigin } from '@/db/schema'

const SHEET_FIELDS_ES = [
  'origen', 'clima', 'luz', 'riego', 'fertilizacion',
  'poda', 'trasplante', 'sustrato', 'plagas', 'observaciones',
]
const SHEET_FIELDS_EN = [
  'origin', 'climate', 'light', 'watering', 'fertilization',
  'pruning', 'repotting', 'substrate', 'pests', 'observations',
]

export default function SpeciesSheet() {
  const { id: bonsaiId } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'es'

  const { bonsais } = useBonsaiStore()
  const bonsai = bonsais.find((b) => b.id === bonsaiId)
  const config = useAppStore((s) => s.config)

  const [sheet, setSheet] = useState<SpeciesSheetType | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState<Record<string, string>>({})

  async function loadSheet() {
    if (!bonsai?.species) return
    setLoading(true)
    const s = await storageService.getSheetBySpecies(bonsai.species)
    setSheet(s ?? null)
    setLoading(false)
  }

  useEffect(() => { loadSheet() }, [bonsai?.species])

  async function generateSheet() {
    if (!bonsai?.species || !config?.encryptedApiKey) return
    setGenerating(true)
    try {
      const svc = await createAIService(config.encryptedApiKey, config.aiProvider, config.aiModel)
      const content = await svc.generateSpeciesSheet(bonsai.species)
      if (sheet) {
        await storageService.updateSheet(sheet.id, { content, origin: 'ai-generated' })
      } else {
        await storageService.saveSheet({
          species: bonsai.species,
          origin: 'ai-generated',
          content,
          lastUpdated: Date.now(),
        })
      }
      await loadSheet()
    } catch {
      // silent
    } finally {
      setGenerating(false)
    }
  }

  function startEdit() {
    setEditContent(sheet?.content ?? {})
    setEditing(true)
  }

  async function saveEdit() {
    if (!bonsai?.species) return
    const origin: SheetOrigin = 'edited'
    if (sheet) {
      await storageService.updateSheet(sheet.id, { content: editContent, origin })
    } else {
      await storageService.saveSheet({
        species: bonsai.species, origin: 'manual',
        content: editContent, lastUpdated: Date.now(),
      })
    }
    setEditing(false)
    loadSheet()
  }

  const ORIGIN_BADGE_COLORS: Record<SheetOrigin, string> = {
    'local-db': '#3b82f6',
    'ai-generated': '#a855f7',
    'edited': '#22c55e',
    'manual': '#f59e0b',
  }

  const fields = lang === 'en' ? SHEET_FIELDS_EN : SHEET_FIELDS_ES

  function downloadPDF() {
    if (!sheet || !bonsai) return
    const rows = Object.entries(sheet.content)
      .map(([k, v]) => `
        <div class="field">
          <div class="label">${k}</div>
          <div class="value">${String(v).replace(/\n/g, '<br>')}</div>
        </div>`)
      .join('')
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>${bonsai.species}</title>
      <style>
        body{font-family:sans-serif;margin:32px;color:#1a1a1a}
        h1{font-size:20px;font-style:italic;margin-bottom:4px}
        .sub{color:#666;font-size:12px;margin-bottom:24px}
        .field{margin-bottom:16px;break-inside:avoid}
        .label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#888;margin-bottom:4px}
        .value{font-size:14px;line-height:1.5}
        @media print{body{margin:16px}}
      </style>
    </head><body>
      <h1>${bonsai.species}</h1>
      <div class="sub">${lang === 'es' ? 'Ficha técnica — NiwaMirî' : 'Species sheet — NiwaMirî'} · ${new Date().toLocaleDateString()}</div>
      ${rows}
      <script>window.onload=()=>{window.print()}<\/script>
    </body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  }

  return (
    <AppShell showNav={false}>
      <Header
        showBack
        title={lang === 'es' ? 'Ficha técnica' : 'Species sheet'}
        actions={
          sheet && !editing ? (
            <div className="flex items-center">
              <button
                onClick={downloadPDF}
                className="rounded-full p-2"
                style={{ color: 'var(--text2)' }}
                title={lang === 'es' ? 'Descargar PDF' : 'Download PDF'}
              >
                <FileDown size={18} />
              </button>
              <button
                onClick={startEdit}
                className="rounded-full p-2"
                style={{ color: 'var(--text2)' }}
              >
                <Edit2 size={18} />
              </button>
            </div>
          ) : editing ? (
            <div className="flex gap-1">
              <button onClick={() => setEditing(false)} className="rounded-full p-2" style={{ color: 'var(--text2)' }}>
                <X size={18} />
              </button>
              <button onClick={saveEdit} className="rounded-full p-2" style={{ color: 'var(--color-accent)' }}>
                <Check size={18} />
              </button>
            </div>
          ) : null
        }
      />

      <div className="px-4 py-3">
        {bonsai && (
          <div className="mb-3">
            {bonsai.commonName && (
              <p className="text-base font-semibold" style={{ color: 'var(--text1)' }}>
                {bonsai.commonName}
              </p>
            )}
            <p className="text-sm italic" style={{ color: 'var(--text3)' }}>
              {bonsai.species}
            </p>
          </div>
        )}

        {/* Origin badge + generate button */}
        <div className="mb-4 flex items-center gap-3">
          {sheet && (
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background: ORIGIN_BADGE_COLORS[sheet.origin] + '22',
                color: ORIGIN_BADGE_COLORS[sheet.origin],
              }}
            >
              {t(`sheetOrigin.${sheet.origin}`)}
            </span>
          )}
          {config?.encryptedApiKey && (
            <button
              onClick={generateSheet}
              disabled={generating}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--color-accent)' }}
            >
              {generating
                ? <Loader2 size={13} className="animate-spin" />
                : <Sparkles size={13} />}
              {sheet
                ? (lang === 'es' ? 'Regenerar con IA' : 'Regenerate with AI')
                : (lang === 'es' ? 'Generar con IA' : 'Generate with AI')}
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-sm" style={{ color: 'var(--text3)' }}>{t('common.loading')}</p>
        ) : !sheet && !editing ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <p className="text-sm" style={{ color: 'var(--text3)' }}>
              {lang === 'es'
                ? 'Sin ficha para esta especie'
                : 'No sheet for this species'}
            </p>
            <button
              onClick={startEdit}
              className="rounded-xl px-4 py-2 text-sm font-medium"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text2)' }}
            >
              {lang === 'es' ? 'Crear manualmente' : 'Create manually'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {(editing ? fields : Object.keys(sheet?.content ?? {})).map((key) => (
              <div
                key={key}
                className="rounded-2xl p-4"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <p
                  className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--text3)' }}
                >
                  {key}
                </p>
                {editing ? (
                  <textarea
                    value={editContent[key] ?? ''}
                    onChange={(e) =>
                      setEditContent((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    rows={3}
                    className="w-full resize-none rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    style={{ background: 'var(--bg3)', color: 'var(--text1)', border: '1px solid var(--border)' }}
                  />
                ) : (
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text1)' }}>
                    {sheet?.content[key] ?? '—'}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
