import type { Bonsai, Care, ClassNote, CareType } from '../../db/schema'

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
  imageBase64?: string // para consultas con foto
}

export interface BonsaiContext {
  bonsai: Bonsai
  recentCares: Care[]
  classNotes: ClassNote[]
  season: 'spring' | 'summer' | 'autumn' | 'winter'
}

export interface GeneralContext {
  bonsais: Array<{ name: string; species: string; commonName?: string; status: string }>
  recentJournalNotes: Array<{ title?: string; content: string; date: number }>
  season: 'spring' | 'summer' | 'autumn' | 'winter'
}

export interface AIService {
  // Identificar especie por foto
  identifySpecies(imageBase64: string, lang?: string): Promise<{
    species: string
    commonName: string
    confidence: 'high' | 'medium' | 'low'
    notes: string
  }>

  // Generar ficha técnica de especie
  generateSpeciesSheet(species: string): Promise<Record<string, string>>

  // Resumir notas de clase contextuales para un tipo de cuidado
  summarizeNotesForCare(
    notes: ClassNote[],
    careType: CareType,
    species: string
  ): Promise<string>

  // Chat libre contextualizado por ejemplar
  chat(messages: AIMessage[], context: BonsaiContext): Promise<string>

  // Chat general con contexto de toda la colección
  chatGeneral(messages: AIMessage[], context: GeneralContext): Promise<string>

  // Sugerir próximos cuidados
  suggestNextCares(context: BonsaiContext): Promise<
    Array<{
      careType: CareType
      suggestedDate: number
      reason: string
    }>
  >

  // Sugerir recordatorio para un cuidado recién registrado
  suggestReminder(
    care: Care,
    context: BonsaiContext
  ): Promise<{
    date: number
    description: string
  }>

  // Verificar que la API key es válida
  verifyConnection(apiKey: string): Promise<boolean>
}
