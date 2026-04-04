import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2, ChevronRight, ExternalLink } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import Toggle from '@/components/ui/Toggle'
import SegmentedControl from '@/components/ui/SegmentedControl'
import SelectRow from '@/components/ui/SelectRow'
import { useAppStore } from '@/store/appStore'
import { storageService } from '@/services/storage/DexieStorageService'
import { encryptApiKey, decryptApiKey } from '@/utils/crypto'
import { createAIService } from '@/hooks/useAI'
import i18n from '@/i18n/index'
import type { AIProvider, AppConfig } from '@/db/schema'

// ── Section wrapper ────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <p
        className="px-4 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-widest"
        style={{ color: 'var(--text3)' }}
      >
        {title}
      </p>
      <div
        className="mx-4 overflow-hidden rounded-2xl"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        {children}
      </div>
    </div>
  )
}

function Row({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-3"
      style={{ borderBottom: last ? 'none' : '1px solid var(--border)' }}
    >
      {children}
    </div>
  )
}

function RowLabel({ label, sublabel }: { label: string; sublabel?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-sm font-medium" style={{ color: 'var(--text1)' }}>
        {label}
      </span>
      {sublabel && (
        <span className="text-xs leading-tight" style={{ color: 'var(--text3)' }}>
          {sublabel}
        </span>
      )}
    </div>
  )
}

// ── Model options per provider ─────────────────────────────────

const PROVIDER_MODEL_DEFAULTS: Record<AIProvider, string> = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o-mini',
  claude: 'claude-haiku-4-5-20251001',
}

const PROVIDER_MODEL_OPTIONS: Record<AIProvider, { value: string; label: string }[]> = {
  gemini: [
    { value: 'gemini-2.5-flash',          label: 'Gemini 2.5 Flash (recomendado)' },
    { value: 'gemini-2.5-pro',            label: 'Gemini 2.5 Pro'                 },
    { value: 'gemini-3-flash-preview',    label: 'Gemini 3 Flash Preview'         },
  ],
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4o',      label: 'GPT-4o'      },
  ],
  claude: [
    { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5'  },
    { value: 'claude-sonnet-4-6',         label: 'Claude Sonnet 4.6' },
  ],
}

// ── Provider console links ─────────────────────────────────────

const PROVIDER_LINKS: Record<AIProvider, string> = {
  gemini: 'https://aistudio.google.com/app/apikey',
  openai: 'https://platform.openai.com/api-keys',
  claude: 'https://console.anthropic.com/settings/keys',
}

// ── API Key sub-component ──────────────────────────────────────

function ApiKeyRow({
  provider,
  encryptedKey,
  onSave,
}: {
  provider: AIProvider
  encryptedKey?: string
  onSave: (encrypted: string) => void
}) {
  const { t } = useTranslation()
  const [raw, setRaw] = useState('')
  const [show, setShow] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  useEffect(() => {
    setRaw('')
    setStatus('idle')
    if (encryptedKey) {
      decryptApiKey(encryptedKey)
        .then((plain) => setRaw(plain))
        .catch(() => {})
    }
  }, [encryptedKey, provider])

  const verify = useCallback(async () => {
    if (!raw.trim()) return
    setStatus('loading')
    try {
      const encrypted = await encryptApiKey(raw.trim())
      const svc = await createAIService(encrypted, provider)
      const ok = await svc.verifyConnection(raw.trim())
      if (ok) {
        onSave(encrypted)
        setStatus('ok')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }, [raw, provider, onSave])

  return (
    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
      <p className="mb-0.5 text-sm font-medium" style={{ color: 'var(--text1)' }}>
        {t('settings.apiKey')}
      </p>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs" style={{ color: 'var(--text3)' }}>
          Ingresá o reemplazá tu clave y presioná Verificar para guardar
        </p>
        <a
          href={PROVIDER_LINKS[provider]}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1 text-xs font-medium"
          style={{ color: 'var(--color-accent)' }}
        >
          <ExternalLink size={12} />
          Obtener key
        </a>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type={show ? 'text' : 'password'}
            value={raw}
            onChange={(e) => { setRaw(e.target.value); setStatus('idle') }}
            placeholder={t('settings.apiKeyPlaceholder')}
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            style={{ background: 'var(--bg3)', color: 'var(--text1)', border: '1px solid var(--border)' }}
          />
          <button
            onClick={() => setShow((s) => !s)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2"
            aria-label={show ? 'Ocultar' : 'Mostrar'}
          >
            {show
              ? <EyeOff size={15} style={{ color: 'var(--text3)' }} />
              : <Eye size={15} style={{ color: 'var(--text3)' }} />}
          </button>
        </div>

        <button
          onClick={verify}
          disabled={!raw.trim() || status === 'loading'}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold disabled:opacity-50"
          style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
        >
          {status === 'loading' && <Loader2 size={13} className="animate-spin" />}
          {status === 'ok'      && <CheckCircle2 size={13} />}
          {status === 'error'   && <XCircle size={13} />}
          <span>
            {status === 'loading' ? '...' : status === 'ok' ? 'OK' : status === 'error' ? 'Error' : 'Verificar'}
          </span>
        </button>
      </div>

      {status === 'ok' && (
        <p className="mt-1.5 text-xs" style={{ color: 'var(--color-accent)' }}>
          ✓ Conexión verificada y guardada
        </p>
      )}
      {status === 'error' && (
        <p className="mt-1.5 text-xs" style={{ color: 'var(--color-warn)' }}>
          ✗ API key inválida o sin conexión
        </p>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────

export default function Settings() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { config, updateConfig } = useAppStore()

  async function save(data: Partial<AppConfig>) {
    updateConfig(data)
    await storageService.updateConfig(data)
  }

  async function handleLanguage(lang: 'es' | 'en') {
    await save({ language: lang })
    i18n.changeLanguage(lang)
  }

  if (!config) return null

  const provider = config.aiProvider
  const modelOptions = PROVIDER_MODEL_OPTIONS[provider]
  const currentModel = config.aiModel ?? PROVIDER_MODEL_DEFAULTS[provider]

  return (
    <AppShell showNav>
      <Header title={t('settings.title')} hideSettings />

      <div className="py-2">
        {/* ── Apariencia ────────────────────────────── */}
        <Section title="Apariencia">
          <Row>
            <RowLabel label={t('settings.theme')} />
            <SegmentedControl
              options={[
                { value: 'dark',  label: t('settings.themes.dark')  },
                { value: 'light', label: t('settings.themes.light') },
              ]}
              value={config.theme}
              onChange={(v) => save({ theme: v as 'dark' | 'light' })}
            />
          </Row>
          <Row>
            <RowLabel label={t('settings.language')} />
            <SegmentedControl
              options={[
                { value: 'es', label: 'Español' },
                { value: 'en', label: 'English' },
              ]}
              value={config.language}
              onChange={(v) => handleLanguage(v as 'es' | 'en')}
            />
          </Row>
          <Row last>
            <RowLabel label={t('settings.fontSize')} />
            <SegmentedControl
              options={[
                { value: 'normal', label: t('settings.fontSizes.normal') },
                { value: 'large',  label: t('settings.fontSizes.large')  },
              ]}
              value={config.fontSize}
              onChange={(v) => save({ fontSize: v as 'normal' | 'large' })}
            />
          </Row>
        </Section>

        {/* ── General ───────────────────────────────── */}
        <Section title="General">
          <Row>
            <RowLabel
              label={t('settings.hemisphere')}
              sublabel="Afecta el cálculo de estaciones para la IA"
            />
            <SegmentedControl
              options={[
                { value: 'south', label: t('settings.hemispheres.south') },
                { value: 'north', label: t('settings.hemispheres.north') },
              ]}
              value={config.hemisphere}
              onChange={(v) => save({ hemisphere: v as 'north' | 'south' })}
            />
          </Row>
          <Row>
            <RowLabel
              label={t('settings.photoQuality')}
              sublabel="Alta ≈ 300KB · Media ≈ 150KB · Baja ≈ 80KB"
            />
            <SelectRow
              options={[
                { value: 'high',   label: t('settings.photoQualities.high')   },
                { value: 'medium', label: t('settings.photoQualities.medium') },
                { value: 'low',    label: t('settings.photoQualities.low')    },
              ]}
              value={config.photoQuality}
              onChange={(v) => save({ photoQuality: v as 'high' | 'medium' | 'low' })}
            />
          </Row>
          <Row last>
            <RowLabel
              label={t('settings.notifications')}
              sublabel="Requiere permiso del navegador"
            />
            <Toggle
              checked={config.pushNotifications}
              onChange={(v) => save({ pushNotifications: v })}
              label={t('settings.notifications')}
            />
          </Row>
        </Section>

        {/* ── Inteligencia Artificial ───────────────── */}
        <Section title="Inteligencia Artificial">
          <Row>
            <RowLabel label={t('settings.aiProvider')} />
            <SelectRow
              options={[
                { value: 'gemini', label: 'Gemini (Google)' },
                { value: 'openai', label: 'OpenAI'          },
                { value: 'claude', label: 'Claude'          },
              ]}
              value={config.aiProvider}
              onChange={(v) =>
                save({
                  aiProvider: v as AIProvider,
                  aiModel: PROVIDER_MODEL_DEFAULTS[v as AIProvider],
                })
              }
            />
          </Row>
          <Row>
            <RowLabel label={t('settings.aiModel')} />
            <SelectRow
              options={modelOptions}
              value={currentModel}
              onChange={(v) => save({ aiModel: v })}
            />
          </Row>
          <ApiKeyRow
            provider={provider}
            encryptedKey={config.encryptedApiKey}
            onSave={(encrypted) => save({ encryptedApiKey: encrypted })}
          />
          <div style={{ height: 0 }} /> {/* closes last border */}
        </Section>

        {/* ── Datos ─────────────────────────────────── */}
        <Section title="Datos">
          <button
            onClick={() => navigate('/settings/backup')}
            className="flex w-full items-center justify-between px-4 py-3 active:bg-white/5"
          >
            <RowLabel
              label={t('settings.backup')}
              sublabel="Exportar o importar toda la colección"
            />
            <ChevronRight size={18} style={{ color: 'var(--text3)' }} />
          </button>
        </Section>

        {/* ── Acerca de ─────────────────────────────── */}
        <Section title="Acerca de">
          <Row>
            <RowLabel label="Aplicación" sublabel="NiwaMirî v1.1" />
            <a
              href="https://emiees.github.io/niwamiri-bonsai/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: 'var(--color-accent)' }}
            >
              Ver app
              <ExternalLink size={11} />
            </a>
          </Row>
          <Row>
            <RowLabel label="Desarrollador" sublabel="Emi Salazar" />
          </Row>
          <Row>
            <RowLabel label="Contacto" />
            <a
              href="mailto:emilianoesalazar@gmail.com"
              className="text-xs font-medium"
              style={{ color: 'var(--color-accent)' }}
            >
              emilianoesalazar@gmail.com
            </a>
          </Row>
          <Row>
            <RowLabel label="Documentación" sublabel="Guías de uso y referencia" />
            <a
              href="https://github.com/emiees/niwamiri-bonsai/wiki"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: 'var(--color-accent)' }}
            >
              Wiki
              <ExternalLink size={11} />
            </a>
          </Row>
          <Row last>
            <RowLabel label="Agradecimientos a" />
            <a
              href="https://www.instagram.com/gabrielmedinabonsai/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: 'var(--color-accent)' }}
            >
              GM Bonsai
              <ExternalLink size={11} />
            </a>
          </Row>
        </Section>

        <p className="mt-2 pb-2 text-center text-[11px]" style={{ color: 'var(--text3)' }}>
          Jardín pequeño 🌱
        </p>
      </div>
    </AppShell>
  )
}
