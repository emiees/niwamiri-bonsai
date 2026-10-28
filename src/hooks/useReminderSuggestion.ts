import { useEffect, useRef, useState } from 'react'
import type { ReminderSuggestion } from '@/services/ai/AIService'
import { validateReminderSuggestion } from '@/services/ai/reminderPrompt'

// Los cambios de contexto, la edición y la limpieza invalidan respuestas tardías.
export function useReminderSuggestion(contextKey: string) {
  const revision = useRef(0)
  const flight = useRef<number | null>(null)
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  useEffect(
    () => () => {
      revision.current++
      flight.current = null
      setPendingKey(null)
      setErrorKey(null)
    },
    [contextKey]
  )
  function invalidate() {
    revision.current++
    flight.current = null
    setPendingKey(null)
    setErrorKey(null)
  }
  async function suggest(
    request: () => Promise<ReminderSuggestion>,
    apply: (result: ReminderSuggestion) => void
  ) {
    if (flight.current !== null) return
    const token = ++revision.current
    flight.current = token
    setPendingKey(contextKey)
    setErrorKey(null)
    try {
      const result = validateReminderSuggestion(await request())
      if (revision.current === token) apply(result)
    } catch {
      if (revision.current === token) setErrorKey(contextKey)
    } finally {
      if (revision.current === token) {
        flight.current = null
        setPendingKey(null)
      }
    }
  }
  return {
    suggesting: pendingKey === contextKey,
    suggestionError: errorKey === contextKey,
    suggest,
    invalidate,
  }
}
