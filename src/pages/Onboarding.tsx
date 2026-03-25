import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, XCircle, Loader2, Eye, EyeOff, ExternalLink } from 'lucide-react'
import LogoSVG from '@/components/logo/LogoSVG'
import { useAppStore } from '@/store/appStore'
import { storageService } from '@/services/storage/DexieStorageService'
import { encryptApiKey } from '@/utils/crypto'
import { createAIService } from '@/hooks/useAI'
import type { AIProvider } from '@/db/schema'

// ── Provider links ──────────────────────────────────────────────

const PROVIDER_LINKS: Record<AIProvider, string> = {
  gemini: 'https://aistudio.google.com/app/apikey',
  openai: 'https://platform.openai.com/api-keys',
  claude: 'https://console.anthropic.com/settings/keys',
}

const PROVIDER_INSTRUCTIONS: Record<AIProvider, { es: string[]; en: string[] }> = {
  gemini: {
    es: [
      'Entrá a Google AI Studio con tu cuenta de Google.',
      'Hacé clic en "Create API key".',
      'Copiá la clave generada.',
    ],
    en: [
      'Go to Google AI Studio with your Google account.',
      'Click "Create API key".',
      'Copy the generated key.',
    ],
  },
  openai: {
    es: [
      'Entrá a la plataforma de OpenAI.',
      'En "API keys", hacé clic en "Create new secret key".',
      'Copiá la clave — no se puede ver de nuevo.',
    ],
    en: [
      'Go to the OpenAI platform.',
      'Under "API keys", click "Create new secret key".',
      'Copy the key — it won\'t be shown again.',
    ],
  },
  claude: {
    es: [
      'Entrá a la consola de Anthropic.',
      'En "API Keys", hacé clic en "Create Key".',
      'Copiá la clave generada.',
    ],
    en: [
      'Go to the Anthropic console.',
      'Under "API Keys", click "Create Key".',
      'Copy the generated key.',
    ],
  },
}

// ── Step dots ───────────────────────────────────────────────────

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === current ? 20 : 8,
            height: 8,
            background: i === current ? 'var(--color-accent)' : 'var(--bg3)',
          }}
        />
      ))}
    </div>
  )
}

// ── Provider card ───────────────────────────────────────────────

function ProviderCard({
  label,
  badge,
  selected,
  onSelect,
}: {
  value?: AIProvider
  label: string
  badge?: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className="flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left transition-all duration-150 active:scale-[0.98]"
      style={{
        background: selected ? 'var(--color-accent)' : 'var(--card)',
        border: `2px solid ${selected ? 'var(--color-accent)' : 'var(--border)'}`,
        color: selected ? 'var(--green1)' : 'var(--text1)',
      }}
    >
      <div>
        <p className="font-semibold">{label}</p>
        {badge && (
          <p className="mt-0.5 text-xs" style={{ color: selected ? 'var(--green1)' : 'var(--text3)' }}>
            {badge}
          </p>
        )}
      </div>
      <div
        className="flex h-5 w-5 items-center justify-center rounded-full border-2"
        style={{
          borderColor: selected ? 'var(--green1)' : 'var(--border)',
          background: selected ? 'var(--green1)' : 'transparent',
        }}
      >
        {selected && <div className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--color-accent)' }} />}
      </div>
    </button>
  )
}

// ── Main page ───────────────────────────────────────────────────

export default function Onboarding() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { updateConfig } = useAppStore()

  const [step, setStep] = useState(0) // 0–3
  const [provider, setProvider] = useState<AIProvider>('gemini')
  const [apiKey, setApiKey] = useState('')
  const [show, setShow] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  const lang = i18n.language.startsWith('en') ? 'en' : 'es'
  const instructions = PROVIDER_INSTRUCTIONS[provider][lang]
  const providerLink = PROVIDER_LINKS[provider]

  async function finish(withKey: boolean) {
    let encryptedApiKey: string | undefined
    if (withKey && apiKey.trim()) {
      encryptedApiKey = await encryptApiKey(apiKey.trim())
    }
    const data = {
      aiProvider: provider,
      encryptedApiKey,
      onboardingCompleted: true,
    }
    updateConfig(data)
    await storageService.updateConfig(data)
    navigate('/', { replace: true })
  }

  const verifyAndFinish = useCallback(async () => {
    if (!apiKey.trim()) return
    setStatus('loading')
    try {
      const encrypted = await encryptApiKey(apiKey.trim())
      const svc = await createAIService(encrypted, provider)
      const ok = await svc.verifyConnection(apiKey.trim())
      if (ok) {
        setStatus('ok')
        setTimeout(() => finish(true), 800)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, provider])

  // ── Step 1 — Welcome ──────────────────────────────────────────
  const Step1 = (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
      <LogoSVG size={96} />
      <div>
        <h1 className="font-display text-3xl font-bold italic" style={{ color: 'var(--text1)' }}>
          NiwaMirî
        </h1>
        <p className="mt-1 text-base" style={{ color: 'var(--text2)' }}>
          {t('onboarding.step1.subtitle')}
        </p>
      </div>
      <p className="max-w-xs text-sm leading-relaxed" style={{ color: 'var(--text3)' }}>
        {lang === 'es'
          ? 'Registrá tus árboles, sus cuidados, fotos y notas. Con inteligencia artificial que te acompaña en cada decisión.'
          : 'Record your trees, their care, photos, and notes. With AI that guides you in every decision.'}
      </p>
    </div>
  )

  // ── Step 2 — Choose provider ──────────────────────────────────
  const Step2 = (
    <div className="flex flex-1 flex-col gap-4 px-6 pt-4">
      <div className="mb-2 text-center">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text1)' }}>
          {t('onboarding.step2.title')}
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text3)' }}>
          {t('onboarding.step2.subtitle')}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <ProviderCard
          value="gemini"
          label="Gemini (Google)"
          badge={lang === 'es' ? '✦ Gratuito — recomendado' : '✦ Free — recommended'}
          selected={provider === 'gemini'}
          onSelect={() => setProvider('gemini')}
        />
        <ProviderCard
          value="openai"
          label="OpenAI (ChatGPT)"
          selected={provider === 'openai'}
          onSelect={() => setProvider('openai')}
        />
        <ProviderCard
          value="claude"
          label="Claude (Anthropic)"
          selected={provider === 'claude'}
          onSelect={() => setProvider('claude')}
        />
      </div>
    </div>
  )

  // ── Step 3 — Get API key ──────────────────────────────────────
  const Step3 = (
    <div className="flex flex-1 flex-col gap-4 px-6 pt-4">
      <div className="mb-2 text-center">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text1)' }}>
          {t('onboarding.step3.title')}
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text3)' }}>
          {lang === 'es'
            ? `Seguí estos pasos en ${provider === 'gemini' ? 'Google AI Studio' : provider === 'openai' ? 'OpenAI' : 'Anthropic'}:`
            : `Follow these steps on ${provider === 'gemini' ? 'Google AI Studio' : provider === 'openai' ? 'OpenAI' : 'Anthropic'}:`}
        </p>
      </div>

      <ol className="flex flex-col gap-3">
        {instructions.map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
            >
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
              {step}
            </p>
          </li>
        ))}
      </ol>

      <a
        href={providerLink}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--color-accent)' }}
      >
        <ExternalLink size={15} />
        {lang === 'es' ? 'Ir a la consola' : 'Open console'}
      </a>
    </div>
  )

  // ── Step 4 — Verify ───────────────────────────────────────────
  const Step4 = (
    <div className="flex flex-1 flex-col gap-4 px-6 pt-4">
      <div className="mb-2 text-center">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text1)' }}>
          {t('onboarding.step4.title')}
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text3)' }}>
          {t('onboarding.step4.subtitle')}
        </p>
      </div>

      {/* Input */}
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => { setApiKey(e.target.value); setStatus('idle') }}
          placeholder={t('settings.apiKeyPlaceholder')}
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          style={{ background: 'var(--card)', color: 'var(--text1)', border: '1px solid var(--border)' }}
        />
        <button
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2"
          aria-label={show ? 'Hide' : 'Show'}
        >
          {show
            ? <EyeOff size={16} style={{ color: 'var(--text3)' }} />
            : <Eye size={16} style={{ color: 'var(--text3)' }} />}
        </button>
      </div>

      {/* Verify button */}
      <button
        onClick={verifyAndFinish}
        disabled={!apiKey.trim() || status === 'loading' || status === 'ok'}
        className="flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-semibold disabled:opacity-50"
        style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
      >
        {status === 'loading' && <Loader2 size={16} className="animate-spin" />}
        {status === 'ok'      && <CheckCircle2 size={16} />}
        {status === 'error'   && <XCircle size={16} />}
        <span>
          {status === 'loading' ? (lang === 'es' ? 'Verificando…' : 'Verifying…')
           : status === 'ok'    ? (lang === 'es' ? 'Conectado' : 'Connected')
           : status === 'error' ? (lang === 'es' ? 'Error — reintentar' : 'Error — retry')
           : (lang === 'es' ? 'Verificar y comenzar' : 'Verify and start')}
        </span>
      </button>

      {status === 'error' && (
        <p className="text-center text-xs" style={{ color: 'var(--color-warn)' }}>
          {lang === 'es'
            ? 'API key inválida o sin conexión. Revisá la clave e intentá de nuevo.'
            : 'Invalid API key or no connection. Check the key and try again.'}
        </p>
      )}
    </div>
  )

  const steps = [Step1, Step2, Step3, Step4]
  const isLast = step === 3

  function handleNext() {
    if (step < 3) setStep((s) => s + 1)
  }

  async function handleSkip() {
    if (step === 3) {
      // skip API key — finish without key
      await finish(false)
    } else {
      handleNext()
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: 'var(--bg)', color: 'var(--text1)' }}
    >
      {/* Content */}
      <div className="flex flex-1 flex-col pb-4 pt-12">
        {steps[step]}
      </div>

      {/* Bottom controls */}
      <div className="flex flex-col gap-3 px-6 pb-10 pt-4">
        <StepDots total={4} current={step} />

        {step === 0 ? (
          <button
            onClick={handleNext}
            className="h-12 w-full rounded-2xl text-sm font-semibold"
            style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
          >
            {t('onboarding.next')}
          </button>
        ) : isLast ? (
          <button
            onClick={() => finish(false)}
            className="h-12 w-full rounded-2xl text-sm font-medium"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text2)' }}
          >
            {lang === 'es' ? 'Omitir por ahora' : 'Skip for now'}
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="h-12 flex-1 rounded-2xl text-sm font-medium"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text2)' }}
            >
              {t('onboarding.skip')}
            </button>
            <button
              onClick={handleNext}
              className="h-12 flex-1 rounded-2xl text-sm font-semibold"
              style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
            >
              {t('onboarding.next')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
