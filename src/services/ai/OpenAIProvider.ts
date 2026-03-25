import type { AIService, AIMessage, BonsaiContext } from './AIService'
import type { ClassNote, CareType, Care } from '../../db/schema'

const OPENAI_API_BASE = 'https://api.openai.com/v1'

export class OpenAIProvider implements AIService {
  private apiKey: string
  private model: string

  constructor(apiKey: string, model = 'gpt-4o-mini') {
    this.apiKey = apiKey
    this.model = model
  }

  private async complete(
    messages: Array<{ role: string; content: string | unknown[] }>
  ): Promise<string> {
    const res = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.model, messages }),
    })
    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`)
    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? ''
  }

  async identifySpecies(imageBase64: string, lang = 'es') {
    const langInstruction = lang === 'es'
      ? 'Respond in Spanish (except the species scientific name, which must stay in Latin).'
      : 'Respond in English.'
    const text = await this.complete([
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          {
            type: 'text',
            text: `Identify the bonsai/plant species. ${langInstruction} Respond ONLY in JSON: {"species": "scientific latin name", "commonName": "most common local name", "confidence": "high|medium|low", "notes": "..."}`,
          },
        ],
      },
    ])
    return JSON.parse(text.replace(/```json\n?|\n?```/g, ''))
  }

  async generateSpeciesSheet(species: string): Promise<Record<string, string>> {
    const text = await this.complete([
      {
        role: 'user',
        content: `Generate a technical bonsai care sheet for "${species}". Respond ONLY in JSON (keys in Spanish): origen, clima, luz, riego, fertilizacion, poda, trasplante, sustrato, plagas, observaciones`,
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
    return this.complete([
      {
        role: 'user',
        content: `Summarize class notes about "${species}" relevant to "${careType}". Be concise (3-5 sentences). Respond in Spanish.\n\nNotes:\n${notesText}`,
      },
    ])
  }

  async chat(messages: AIMessage[], context: BonsaiContext): Promise<string> {
    const system = `You are NiwaMirî, an expert bonsai assistant.
Tree: ${context.bonsai.name} (${context.bonsai.species}), status: ${context.bonsai.status}, season: ${context.season}.
Respond in Spanish.`

    const openaiMessages = [
      { role: 'system', content: system },
      ...messages.map((m) => ({
        role: m.role,
        content: m.imageBase64
          ? [
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${m.imageBase64}` } },
              { type: 'text', text: m.content },
            ]
          : m.content,
      })),
    ]

    return this.complete(openaiMessages)
  }

  async suggestNextCares(context: BonsaiContext) {
    const text = await this.complete([
      {
        role: 'user',
        content: `Suggest next 3 care tasks for bonsai ${context.bonsai.species}, status: ${context.bonsai.status}, season: ${context.season}. Respond ONLY in JSON array: [{"careType":"...","suggestedDate":<ms>,"reason":"..."}]`,
      },
    ])
    return JSON.parse(text.replace(/```json\n?|\n?```/g, ''))
  }

  async suggestReminder(care: Care, context: BonsaiContext) {
    const text = await this.complete([
      {
        role: 'user',
        content: `Care registered: ${care.type} for ${context.bonsai.species} in ${context.season}. Suggest a follow-up reminder. JSON only: {"date":<ms>,"description":"..."}. Description in Spanish.`,
      },
    ])
    return JSON.parse(text.replace(/```json\n?|\n?```/g, ''))
  }

  async verifyConnection(apiKey: string): Promise<boolean> {
    try {
      const res = await fetch(`${OPENAI_API_BASE}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      return res.ok
    } catch {
      return false
    }
  }
}
