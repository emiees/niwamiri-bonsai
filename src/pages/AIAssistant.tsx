import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Send, Loader2, Trash2, Camera, X } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { useBonsaiStore } from '@/store/bonsaiStore'
import { storageService } from '@/services/storage/DexieStorageService'
import { useAppStore } from '@/store/appStore'
import { useSeason } from '@/hooks/useSeason'
import { createAIService } from '@/hooks/useAI'
import { compressImage, base64ToDataUrl } from '@/utils/images'
type Message = { role: 'user' | 'assistant'; content: string; imageBase64?: string; timestamp: number; isError?: boolean }

function formatAIError(raw: string): string {
  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      const e = parsed?.error ?? parsed
      if (e?.code || e?.message) {
        return [e.code && `[${e.code}]`, e.message].filter(Boolean).join(' ')
      }
    }
  } catch { /* ignorar */ }
  return raw
}

export default function AIAssistant() {
  const { id: bonsaiId } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'es'

  const { bonsais } = useBonsaiStore()
  const bonsai = bonsais.find((b) => b.id === bonsaiId)
  const config = useAppStore((s) => s.config)
  const season = useSeason()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [thinking, setThinking] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load existing conversation
  useEffect(() => {
    if (!bonsaiId) return
    storageService['db' as keyof typeof storageService]
    // Access via direct Dexie query
    import('@/db/schema').then(({ db }) => {
      db.conversations.where('bonsaiId').equals(bonsaiId).first().then((conv) => {
        if (conv) {
          setConversationId(conv.id)
          setMessages(conv.messages)
        }
      })
    })
  }, [bonsaiId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  async function saveConversation(msgs: Message[]) {
    if (!bonsaiId) return
    const { db } = await import('@/db/schema')
    const now = Date.now()
    if (conversationId) {
      await db.conversations.update(conversationId, { messages: msgs, updatedAt: now })
    } else {
      const { v4: uuidv4 } = await import('uuid')
      const id = uuidv4()
      await db.conversations.add({ id, bonsaiId, messages: msgs, createdAt: now, updatedAt: now })
      setConversationId(id)
    }
  }

  const send = useCallback(async () => {
    if ((!input.trim() && !pendingImage) || !bonsai || !config?.encryptedApiKey) return
    const userMsg: Message = {
      role: 'user',
      content: input.trim(),
      imageBase64: pendingImage ?? undefined,
      timestamp: Date.now(),
    }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setPendingImage(null)
    setThinking(true)

    try {
      const recentCares = await storageService.getCaresByBonsai(bonsaiId!)
      const classNotes = await storageService.getNotesBySpecies(bonsai.species)
      const svc = await createAIService(config.encryptedApiKey, config.aiProvider, config.aiModel)
      const reply = await svc.chat(
        updated.map((m) => ({ role: m.role, content: m.content, imageBase64: m.imageBase64 })),
        { bonsai, recentCares: recentCares.slice(0, 10), classNotes, season },
      )
      const assistantMsg: Message = { role: 'assistant', content: reply, timestamp: Date.now() }
      const finalMsgs = [...updated, assistantMsg]
      setMessages(finalMsgs)
      await saveConversation(finalMsgs)
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      const errMsg: Message = {
        role: 'assistant',
        content: `${t('ai.error')}\n\n${detail}`,
        timestamp: Date.now(),
        isError: true,
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setThinking(false)
    }
  }, [input, pendingImage, bonsai, bonsaiId, config, messages, season, t])

  async function clearHistory() {
    if (!bonsaiId) return
    const { db } = await import('@/db/schema')
    if (conversationId) {
      await db.conversations.delete(conversationId)
      setConversationId(null)
    }
    setMessages([])
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const b64 = await compressImage(file, 800, 0.8)
    setPendingImage(b64)
    e.target.value = ''
  }

  const hasKey = !!config?.encryptedApiKey

  return (
    <AppShell showNav={false}>
      <Header
        showBack
        title={lang === 'es' ? 'Asistente IA' : 'AI Assistant'}
        actions={
          messages.length > 0 ? (
            <button
              onClick={clearHistory}
              className="rounded-full p-2"
              style={{ color: 'var(--text3)' }}
              title={lang === 'es' ? 'Limpiar historial' : 'Clear history'}
            >
              <Trash2 size={18} />
            </button>
          ) : null
        }
      />

      {!hasKey ? (
        <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
          <p className="text-sm" style={{ color: 'var(--text3)' }}>{t('ai.noKey')}</p>
        </div>
      ) : (
        <>
          {/* Context banner */}
          {bonsai && (
            <div
              className="mx-4 mt-2 mb-1 rounded-xl px-3 py-2"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs" style={{ color: 'var(--text3)' }}>
                {lang === 'es' ? 'Contexto: ' : 'Context: '}
                <em>{bonsai.name}</em> · {bonsai.species} · {t(`season.${season}`)}
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-2 pb-40">
            {messages.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <p className="text-sm font-medium" style={{ color: 'var(--text2)' }}>
                  {lang === 'es'
                    ? '¿En qué puedo ayudarte con este árbol?'
                    : 'How can I help you with this tree?'}
                </p>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>
                  {lang === 'es'
                    ? 'Diagnósticos, podas, trasplantes, técnicas...'
                    : 'Diagnosis, pruning, repotting, techniques...'}
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.isError ? (
                  <div
                    className="max-w-[90%] rounded-2xl px-4 py-3"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)' }}
                  >
                    <p className="mb-1.5 text-xs font-semibold" style={{ color: '#ef4444' }}>
                      {lang === 'es' ? 'Error de conexión con la IA' : 'AI connection error'}
                    </p>
                    <p className="text-xs leading-relaxed whitespace-pre-wrap font-mono" style={{ color: '#f87171' }}>
                      {formatAIError(msg.content.split('\n\n').slice(1).join('\n\n') || msg.content)}
                    </p>
                  </div>
                ) : (
                  <div
                    className="max-w-[80%] rounded-2xl px-4 py-2.5"
                    style={{
                      background: msg.role === 'user' ? 'var(--color-accent)' : 'var(--card)',
                      color: msg.role === 'user' ? 'var(--green1)' : 'var(--text1)',
                      border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    {msg.imageBase64 && (
                      <img
                        src={base64ToDataUrl(msg.imageBase64)}
                        alt=""
                        className="mb-2 max-w-full rounded-xl"
                      />
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                )}
              </div>
            ))}

            {thinking && (
              <div className="mb-3 flex justify-start">
                <div
                  className="flex items-center gap-2 rounded-2xl px-4 py-3"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text3)' }} />
                  <p className="text-sm" style={{ color: 'var(--text3)' }}>{t('ai.thinking')}</p>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div
            className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3"
            style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}
          >
            {pendingImage && (
              <div className="relative mb-2 inline-block">
                <img
                  src={base64ToDataUrl(pendingImage)}
                  alt=""
                  className="h-16 w-16 rounded-xl object-cover"
                />
                <button
                  onClick={() => setPendingImage(null)}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ background: '#ef4444' }}
                >
                  <X size={10} color="white" />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mb-0.5 rounded-full p-2.5"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text3)' }}
              >
                <Camera size={18} />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
                }}
                placeholder={lang === 'es' ? 'Escribí tu consulta…' : 'Write your question…'}
                rows={1}
                className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm focus:outline-none"
                style={{
                  background: 'var(--card)',
                  color: 'var(--text1)',
                  border: '1px solid var(--border)',
                  maxHeight: 120,
                }}
              />
              <button
                onClick={send}
                disabled={(!input.trim() && !pendingImage) || thinking}
                className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
                style={{ background: 'var(--color-accent)' }}
              >
                <Send size={16} style={{ color: 'var(--green1)' }} />
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef} type="file" accept="image/*" capture="environment"
            className="hidden" onChange={onFileChange}
          />
        </>
      )}
    </AppShell>
  )
}
