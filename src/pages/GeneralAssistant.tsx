import { useEffect, useState, useRef, useCallback } from 'react'
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

// ID especial para la conversación general (sin árbol)
const GENERAL_CONVERSATION_ID = 'general'

type Message = { role: 'user' | 'assistant'; content: string; imageBase64?: string; timestamp: number }

export default function GeneralAssistant() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'es'

  const { bonsais } = useBonsaiStore()
  const config = useAppStore((s) => s.config)
  const season = useSeason()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [thinking, setThinking] = useState(false)
  const [conversationDbId, setConversationDbId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar conversación general existente
  useEffect(() => {
    import('@/db/schema').then(({ db }) => {
      db.conversations.where('bonsaiId').equals(GENERAL_CONVERSATION_ID).first().then((conv) => {
        if (conv) {
          setConversationDbId(conv.id)
          setMessages(conv.messages)
        }
      })
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  async function saveConversation(msgs: Message[]) {
    const { db } = await import('@/db/schema')
    const now = Date.now()
    if (conversationDbId) {
      await db.conversations.update(conversationDbId, { messages: msgs, updatedAt: now })
    } else {
      const { v4: uuidv4 } = await import('uuid')
      const id = uuidv4()
      await db.conversations.add({
        id,
        bonsaiId: GENERAL_CONVERSATION_ID,
        messages: msgs,
        createdAt: now,
        updatedAt: now,
      })
      setConversationDbId(id)
    }
  }

  const send = useCallback(async () => {
    if ((!input.trim() && !pendingImage) || !config?.encryptedApiKey) return
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
      const journalNotes = await storageService.getJournalNotes()
      const svc = await createAIService(config.encryptedApiKey, config.aiProvider, config.aiModel)
      const reply = await svc.chatGeneral(
        updated.map((m) => ({ role: m.role, content: m.content, imageBase64: m.imageBase64 })),
        {
          bonsais: bonsais.map((b) => ({
            name: b.name,
            species: b.species,
            commonName: b.commonName,
            status: b.status,
          })),
          recentJournalNotes: journalNotes.slice(0, 10).map((n) => ({
            title: n.title,
            content: n.content,
            date: n.date,
          })),
          season,
        }
      )
      const assistantMsg: Message = { role: 'assistant', content: reply, timestamp: Date.now() }
      const finalMsgs = [...updated, assistantMsg]
      setMessages(finalMsgs)
      await saveConversation(finalMsgs)
    } catch {
      const errMsg: Message = {
        role: 'assistant',
        content: t('ai.error'),
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setThinking(false)
    }
  }, [input, pendingImage, config, messages, bonsais, season, t])

  async function clearHistory() {
    const { db } = await import('@/db/schema')
    if (conversationDbId) {
      await db.conversations.delete(conversationDbId)
      setConversationDbId(null)
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
    <AppShell showNav>
      <Header
        title={lang === 'es' ? 'Asistente' : 'Assistant'}
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
          {/* Banner de contexto */}
          <div
            className="mx-4 mt-2 mb-1 rounded-xl px-3 py-2"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text3)' }}>
              {lang === 'es' ? 'Colección: ' : 'Collection: '}
              <em>{bonsais.length} {lang === 'es' ? 'árboles' : 'trees'}</em>
              {' · '}
              {t(`season.${season}`)}
            </p>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-4 py-2 pb-40">
            {messages.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <p className="text-sm font-medium" style={{ color: 'var(--text2)' }}>
                  {lang === 'es'
                    ? '¿En qué puedo ayudarte?'
                    : 'How can I help you?'}
                </p>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>
                  {lang === 'es'
                    ? 'Consultá sobre tu colección, técnicas, estaciones...'
                    : 'Ask about your collection, techniques, seasons...'}
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
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

          {/* Barra de input */}
          <div
            className="fixed bottom-0 left-0 right-0 px-4 pb-[calc(4rem+env(safe-area-inset-bottom))] pt-3"
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
                placeholder={t('ai.placeholder')}
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
