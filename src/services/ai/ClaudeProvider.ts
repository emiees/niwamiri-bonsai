import type { AIService, AIMessage, BonsaiContext, GeneralContext } from './AIService'
import type { ClassNote, CareType, Care } from '../../db/schema'

const CLAUDE_API_BASE = 'https://api.anthropic.com/v1'

export class ClaudeProvider implements AIService {
  private apiKey: string
  private model: string

  constructor(apiKey: string, model = 'claude-haiku-4-5-20251001') {
    this.apiKey = apiKey
    this.model = model
  }

  private async complete(
    system: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string | unknown[] }>
  ): Promise<string> {
    const res = await fetch(`${CLAUDE_API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        system,
        messages,
      }),
    })
    if (!res.ok) throw new Error(`Claude API error: ${res.status}`)
    const data = await res.json()
    return data.content?.[0]?.text ?? ''
  }

  async identifySpecies(imageBase64: string, lang = 'es') {
    const langInstruction = lang === 'es'
      ? 'Respond in Spanish (except the species scientific name, which must stay in Latin).'
      : 'Respond in English.'
    const text = await this.complete('You are a bonsai expert. Identify plant species from images.', [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
          { type: 'text', text: `Identify this species. ${langInstruction} Respond ONLY in JSON: {"species":"scientific latin name","commonName":"most common local name","confidence":"high|medium|low","notes":"..."}` },
        ],
      },
    ])
    return JSON.parse(text.replace(/```json\n?|\n?```/g, ''))
  }

  async generateSpeciesSheet(species: string): Promise<Record<string, string>> {
    const text = await this.complete('You are a bonsai expert.', [
      {
        role: 'user',
        content: `Generate technical bonsai care sheet for "${species}". JSON only (keys in Spanish): origen, clima, luz, riego, fertilizacion, poda, trasplante, sustrato, plagas, observaciones`,
      },
    ])
    return JSON.parse(text.replace(/```json\n?|\n?```/g, ''))
  }

  async summarizeNotesForCare(
    notes: ClassNote[],
    careType: CareType,
    species: string
  ): Promise<string> {
    if (notes.length === 0) return ''
    const notesText = notes.map((n) => `- ${n.title ?? ''}: ${n.content}`).join('\n')
    return this.complete('You are a bonsai class assistant.', [
      {
        role: 'user',
        content: `Summarize notes about "${species}" relevant to "${careType}". 3-5 sentences. Spanish.\n\nNotes:\n${notesText}`,
      },
    ])
  }

  async chat(messages: AIMessage[], context: BonsaiContext): Promise<string> {
    const system = `You are NiwaMirî, an expert bonsai assistant.
Tree: ${context.bonsai.name} (${context.bonsai.species}), status: ${context.bonsai.status}, season: ${context.season}.
Respond in Spanish.`

    const claudeMessages = messages.map((m) => ({
      role: m.role,
      content: m.imageBase64
        ? [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: m.imageBase64 } },
            { type: 'text', text: m.content },
          ]
        : m.content,
    }))

    return this.complete(system, claudeMessages as Parameters<typeof this.complete>[1])
  }

  async chatGeneral(messages: AIMessage[], context: GeneralContext): Promise<string> {
    const treeList = context.bonsais
      .map((b) => `${b.name} (${b.commonName ?? b.species}, ${b.status})`)
      .join(', ') || 'ninguno'
    const notesSummary = context.recentJournalNotes.slice(0, 5)
      .map((n) => `- ${n.title ? n.title + ': ' : ''}${n.content.slice(0, 120)}`)
      .join('\n') || 'ninguna'

    const system = `Sos NiwaMirî, asistente experto en bonsái con acceso a la colección completa del usuario.
Colección (${context.bonsais.length} árboles): ${treeList}
Estación actual: ${context.season}
Notas recientes de bitácora:\n${notesSummary}
Respondé en español. Sé conciso y útil.`

    const claudeMessages = messages.map((m) => ({
      role: m.role,
      content: m.imageBase64
        ? [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: m.imageBase64 } },
            { type: 'text', text: m.content },
          ]
        : m.content,
    }))

    return this.complete(system, claudeMessages as Parameters<typeof this.complete>[1])
  }

  async suggestNextCares(context: BonsaiContext) {
    const text = await this.complete('You are a bonsai expert.', [
      {
        role: 'user',
        content: `Next 3 care tasks for ${context.bonsai.species}, status: ${context.bonsai.status}, season: ${context.season}. JSON array only: [{"careType":"...","suggestedDate":<ms>,"reason":"..."}]`,
      },
    ])
    return JSON.parse(text.replace(/```json\n?|\n?```/g, ''))
  }

  async suggestReminder(care: Care, context: BonsaiContext) {
    const text = await this.complete('You are a bonsai expert.', [
      {
        role: 'user',
        content: `Care: ${care.type} for ${context.bonsai.species} in ${context.season}. Follow-up reminder JSON: {"date":<ms>,"description":"..."}. Spanish description.`,
      },
    ])
    return JSON.parse(text.replace(/```json\n?|\n?```/g, ''))
  }

  async verifyConnection(apiKey: string): Promise<boolean> {
    try {
      const res = await fetch(`${CLAUDE_API_BASE}/models`, {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
      })
      return res.ok
    } catch {
      return false
    }
  }
}
