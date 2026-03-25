import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Upload, Loader2, CheckCircle2, X } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { useAppStore } from '@/store/appStore'
import { createAIService } from '@/hooks/useAI'
import { compressImage, base64ToDataUrl } from '@/utils/images'

type Result = {
  species: string
  confidence: 'high' | 'medium' | 'low'
  notes: string
}

const CONFIDENCE_COLORS = {
  high: '#22c55e',
  medium: '#f59e0b',
  low: '#f97316',
}

const CONFIDENCE_LABELS_ES = { high: 'Alta', medium: 'Media', low: 'Baja' }
const CONFIDENCE_LABELS_EN = { high: 'High', medium: 'Medium', low: 'Low' }

export default function Identify() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'es'
  const config = useAppStore((s) => s.config)

  const [photo, setPhoto] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState(false)
  const cameraRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    const b64 = await compressImage(file, 1200, 0.85)
    setPhoto(b64)
    setResult(null)
    setError(null)
    setAccepted(false)
  }

  async function analyze() {
    if (!photo || !config?.encryptedApiKey) return
    setAnalyzing(true)
    setError(null)
    try {
      const svc = await createAIService(config.encryptedApiKey, config.aiProvider, config.aiModel)
      const res = await svc.identifySpecies(photo)
      setResult(res)
    } catch {
      setError(lang === 'es'
        ? 'Error al identificar. Verificá tu API key y que el proveedor soporta visión.'
        : 'Identification error. Check your API key and that the provider supports vision.')
    } finally {
      setAnalyzing(false)
    }
  }

  function reset() {
    setPhoto(null)
    setResult(null)
    setError(null)
    setAccepted(false)
  }

  const hasKey = !!config?.encryptedApiKey

  return (
    <AppShell showNav>
      <Header title={t('identify.title')} />

      <div className="flex flex-col items-center gap-5 px-4 py-4">
        {!hasKey ? (
          <div
            className="w-full rounded-2xl p-5 text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text3)' }}>{t('identify.noKey')}</p>
          </div>
        ) : (
          <>
            {/* Photo area */}
            {!photo ? (
              <div
                className="flex w-full flex-col items-center gap-4 rounded-2xl py-12"
                style={{ background: 'var(--card)', border: '1px dashed var(--border)' }}
              >
                <p className="text-sm" style={{ color: 'var(--text3)' }}>
                  {lang === 'es' ? 'Subí una foto de la planta' : 'Upload a photo of the plant'}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => cameraRef.current?.click()}
                    className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
                    style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
                  >
                    <Camera size={16} />
                    {t('identify.take')}
                  </button>
                  <button
                    onClick={() => uploadRef.current?.click()}
                    className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium"
                    style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)' }}
                  >
                    <Upload size={16} />
                    {t('identify.upload')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative w-full">
                <img
                  src={base64ToDataUrl(photo)}
                  alt=""
                  className="w-full rounded-2xl object-cover"
                  style={{ maxHeight: 300 }}
                />
                <button
                  onClick={reset}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: 'rgba(0,0,0,0.6)' }}
                >
                  <X size={16} color="white" />
                </button>
              </div>
            )}

            {/* Analyze button */}
            {photo && !result && (
              <button
                onClick={analyze}
                disabled={analyzing}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold disabled:opacity-50"
                style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
              >
                {analyzing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {t('identify.analyzing')}
                  </>
                ) : (
                  lang === 'es' ? 'Identificar especie' : 'Identify species'
                )}
              </button>
            )}

            {/* Error */}
            {error && (
              <div
                className="w-full rounded-2xl px-4 py-3"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444' }}
              >
                <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
              </div>
            )}

            {/* Result */}
            {result && !accepted && (
              <div
                className="w-full overflow-hidden rounded-2xl"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div className="px-4 py-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text3)' }}>
                    {t('identify.result')}
                  </p>
                  <p className="text-xl font-bold italic" style={{ color: 'var(--text1)' }}>
                    {result.species}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--text3)' }}>
                      {t('identify.confidence')}:
                    </span>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{
                        background: CONFIDENCE_COLORS[result.confidence] + '22',
                        color: CONFIDENCE_COLORS[result.confidence],
                      }}
                    >
                      {lang === 'en' ? CONFIDENCE_LABELS_EN[result.confidence] : CONFIDENCE_LABELS_ES[result.confidence]}
                    </span>
                  </div>
                  {result.notes && (
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
                      {result.notes}
                    </p>
                  )}
                  <p className="mt-3 text-xs" style={{ color: 'var(--text3)' }}>
                    {lang === 'es'
                      ? '⚠️ La identificación por IA no es 100% precisa. Verificá con un experto.'
                      : '⚠️ AI identification is not 100% accurate. Verify with an expert.'}
                  </p>
                </div>
                <div className="flex" style={{ borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={reset}
                    className="flex-1 py-3 text-sm"
                    style={{ color: 'var(--text3)', borderRight: '1px solid var(--border)' }}
                  >
                    {lang === 'es' ? 'Descartar' : 'Discard'}
                  </button>
                  <button
                    onClick={() => setAccepted(true)}
                    className="flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-semibold"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    <CheckCircle2 size={15} />
                    {t('identify.useSpecies')}
                  </button>
                </div>
              </div>
            )}

            {/* Accepted state */}
            {accepted && result && (
              <div
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-4"
                style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
              >
                <CheckCircle2 size={20} />
                <div>
                  <p className="font-semibold">{result.species}</p>
                  <p className="text-xs opacity-80">
                    {lang === 'es'
                      ? 'Copiado — usá este nombre al crear un nuevo árbol'
                      : 'Copied — use this name when creating a new tree'}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <input
        ref={cameraRef} type="file" accept="image/*" capture="environment"
        className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      <input
        ref={uploadRef} type="file" accept="image/*"
        className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </AppShell>
  )
}
