import type { AIService, AIMessage, BonsaiContext, GeneralContext } from './AIService'
import type { ClassNote, CareType, Care } from '../../db/schema'

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

export class GeminiProvider implements AIService {
  private apiKey: string
  private model: string

  constructor(apiKey: string, model = 'gemini-2.5-flash') {
    this.apiKey = apiKey
    this.model = model
  }

  private async generateContent(prompt: string, imageBase64?: string): Promise<string> {
    const parts: unknown[] = [{ text: prompt }]
    if (imageBase64) {
      parts.unshift({
        inlineData: { mimeType: 'image/jpeg', data: imageBase64 },
      })
    }

    const res = await fetch(
      `${GEMINI_API_BASE}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] }),
      }
    )

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`Gemini ${res.status}: ${body}`)
    }
    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  }

  async identifySpecies(imageBase64: string, lang = 'es') {
    const langInstruction = lang === 'es'
      ? 'Respond in Spanish (except the species scientific name, which must stay in Latin).'
      : 'Respond in English.'
    const prompt = `You are a bonsai expert. Identify the plant species in this image. ${langInstruction}
Respond ONLY in JSON format: {"species": "scientific latin name", "commonName": "most common local name", "confidence": "high|medium|low", "notes": "..."}`
    const text = await this.generateContent(prompt, imageBase64)
    const json = JSON.parse(text.replace(/```json\n?|\n?```/g, ''))
    return json
  }

  async generateSpeciesSheet(species: string): Promise<Record<string, string>> {
    const prompt = `Generate a technical care sheet for bonsai species "${species}".
Respond ONLY in JSON with these keys (in Spanish): origen, clima, luz, riego, fertilizacion, poda, trasplante, sustrato, plagas, observaciones`
    const text = await this.generateContent(prompt)
    return JSON.parse(text.replace(/```json\n?|\n?```/g, ''))
  }

  async summarizeNotesForCare(
    notes: ClassNote[],
    careType: CareType,
    species: string
  ): Promise<string> {
    if (notes.length === 0) return ''
    const notesText = notes.map((n) => `- ${n.title ?? ''}: ${n.content}`).join('\n')
    const prompt = `You are assisting a bonsai student. Summarize the following class notes about "${species}" that are relevant for the care type "${careType}". Be concise (3-5 sentences max). Respond in Spanish.\n\nNotes:\n${notesText}`
    return this.generateContent(prompt)
  }

  async chat(messages: AIMessage[], context: BonsaiContext): Promise<string> {
    const recentCaresSummary = context.recentCares.slice(0, 7).map((c) => {
      const date = new Date(c.date).toLocaleDateString('es-AR')
      const desc = c.description ? ` — "${c.description}"` : ''
      return `• ${date}: ${c.type} (${c.treeCondition})${desc}`
    }).join('\n') || 'ninguno registrado'
    const systemPrompt = `You are NiwaMirî, an expert bonsai assistant.
Contexto actual:
- Árbol: ${context.bonsai.name} (${context.bonsai.species})
- Estado: ${context.bonsai.status}
- Estación: ${context.season}
- Últimos cuidados registrados:
${recentCaresSummary}
Responde siempre en español. Sé útil y conciso. Cuando sea relevante, considera el historial de cuidados al dar sugerencias.`

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Entendido. Estoy listo para ayudarte.' }] },
      ...messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [
          ...(m.imageBase64
            ? [{ inlineData: { mimeType: 'image/jpeg', data: m.imageBase64 } }]
            : []),
          { text: m.content },
        ],
      })),
    ]

    const res = await fetch(
      `${GEMINI_API_BASE}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      }
    )

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`Gemini ${res.status}: ${body}`)
    }
    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  }

  async chatGeneral(messages: AIMessage[], context: GeneralContext): Promise<string> {
    const treeList = context.bonsais
      .map((b) => `${b.name} (${b.commonName ?? b.species}, ${b.status})`)
      .join(', ') || 'ninguno'
    const notesSummary = context.recentJournalNotes.slice(0, 5)
      .map((n) => `- ${n.title ? n.title + ': ' : ''}${n.content.slice(0, 120)}`)
      .join('\n') || 'ninguna'

    const systemPrompt = `Sos NiwaMirî, asistente experto en bonsái con acceso a la colección completa del usuario.
Colección (${context.bonsais.length} árboles): ${treeList}
Estación actual: ${context.season}
Notas recientes de bitácora:\n${notesSummary}
Respondé en español. Sé conciso y útil.`

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Entendido. Tengo el contexto de tu colección. ¿En qué te puedo ayudar?' }] },
      ...messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [
          ...(m.imageBase64
            ? [{ inlineData: { mimeType: 'image/jpeg', data: m.imageBase64 } }]
            : []),
          { text: m.content },
        ],
      })),
    ]

    const res = await fetch(
      `${GEMINI_API_BASE}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      }
    )
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`Gemini ${res.status}: ${body}`)
    }
    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  }

  async suggestNextCares(context: BonsaiContext) {
    const prompt = `You are a bonsai expert. Suggest the next 3 care tasks for:
- Species: ${context.bonsai.species}
- Current status: ${context.bonsai.status}
- Season: ${context.season}
- Last cares: ${context.recentCares.slice(0, 5).map((c) => `${c.type} (${new Date(c.date).toLocaleDateString()})`).join(', ') || 'none'}

Respond ONLY in JSON array: [{"careType": "...", "suggestedDate": <unix_timestamp_ms>, "reason": "..."}]
Use valid careType values: watering, fertilizing, maintenance-pruning, structural-pruning, wiring, wire-removal, repotting, root-pruning, defoliation, pest-treatment, jin-shari, relocation, observation, other`

    const text = await this.generateContent(prompt)
    return JSON.parse(text.replace(/```json\n?|\n?```/g, ''))
  }

  async suggestReminder(care: Care, context: BonsaiContext) {
    const prompt = `A bonsai care was just registered:
- Type: ${care.type}
- Tree: ${context.bonsai.species}
- Season: ${context.season}
- Date: ${new Date(care.date).toLocaleDateString()}

Suggest a follow-up reminder. Respond ONLY in JSON: {"date": <unix_timestamp_ms>, "description": "..."}
The description should be in Spanish and concise.`

    const text = await this.generateContent(prompt)
    return JSON.parse(text.replace(/```json\n?|\n?```/g, ''))
  }

  async verifyConnection(apiKey: string): Promise<boolean> {
    try {
      const res = await fetch(
        `${GEMINI_API_BASE}/models?key=${apiKey}`
      )
      return res.ok
    } catch {
      return false
    }
  }
}
