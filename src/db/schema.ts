import Dexie, { type Table } from 'dexie'

// ── TIPOS ──────────────────────────────────────────────────────

export type BonsaiStatus = 'developing' | 'maintenance' | 'recovery' | 'donated' | 'dead'
export type BonsaiStyle =
  | 'chokkan'
  | 'moyogi'
  | 'shakan'
  | 'kengai'
  | 'han-kengai'
  | 'hokidachi'
  | 'fukinagashi'
  | 'yose-ue'
  | 'literati'
  | 'other'
export type BonsaiSize = 'mame' | 'shohin' | 'chuhin' | 'dai'
export type BonsaiOrigin = 'prebonsai' | 'yamadori' | 'seed' | 'cutting' | 'gift' | 'purchase'

export type CareType =
  | 'watering'
  | 'fertilizing'
  | 'maintenance-pruning'
  | 'structural-pruning'
  | 'wiring'
  | 'wire-removal'
  | 'repotting'
  | 'root-pruning'
  | 'defoliation'
  | 'pest-treatment'
  | 'jin-shari'
  | 'relocation'
  | 'observation'
  | 'other'

export type TreeCondition = 'good' | 'regular' | 'problematic'
export type AIProvider = 'gemini' | 'openai' | 'claude'
export type SheetOrigin = 'local-db' | 'ai-generated' | 'edited' | 'manual'
export type NoteScope = 'species' | 'specimen' | 'care'

// ── ENTIDADES ─────────────────────────────────────────────────

export interface Bonsai {
  id: string // UUID
  name: string // Nombre/apodo del árbol
  species: string // Nombre científico
  commonName?: string // Nombre común (ej: "Ficus", "Olmo chino")
  style?: BonsaiStyle
  acquisitionDate?: string // ISO date
  germinationYear?: number // Año estimado de germinación
  origin?: BonsaiOrigin
  size?: BonsaiSize
  potAndSubstrate?: string
  location?: string
  status: BonsaiStatus
  generalNotes?: string
  mainPhotoId?: string // ref → Photo.id
  createdAt: number // timestamp
  updatedAt: number
}

export interface Care {
  id: string
  bonsaiId: string // ref → Bonsai.id
  type: CareType
  date: number // timestamp
  description?: string
  treeCondition: TreeCondition
  specificFields?: Record<string, unknown> // campos variables por tipo
  followUpReminder?: {
    date: number
    description: string
  }
  createdAt: number
}

export interface Photo {
  id: string
  bonsaiId: string // ref → Bonsai.id
  careId?: string // ref → Care.id (opcional)
  imageData: string // base64 comprimida (max 1200px, calidad 85%)
  takenAt: number // timestamp
  description?: string
  isMainPhoto: boolean
  createdAt: number
}

export interface ClassNote {
  id: string
  species: string // ANCLA OBLIGATORIA
  specimenId?: string // ref → Bonsai.id (opcional)
  careId?: string // ref → Care.id (opcional)
  classDate: number // timestamp
  title?: string
  content: string
  createdAt: number
  updatedAt: number
}

export interface SpeciesSheet {
  id: string
  species: string // nombre canónico
  origin: SheetOrigin
  content: Record<string, string> // campos de la ficha
  lastUpdated: number
}

export interface CalendarEvent {
  id: string
  bonsaiId?: string // ref → Bonsai.id (opcional para eventos globales)
  type: 'care' | 'manual-reminder' | 'followup-reminder' | 'ai-suggestion'
  careType?: CareType
  title: string
  description?: string
  date: number // timestamp
  completed: boolean
  createdAt: number
}

export interface AIConversation {
  id: string
  bonsaiId: string
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>
  createdAt: number
  updatedAt: number
}

export interface AppConfig {
  id: 1 // singleton
  language: 'es' | 'en'
  theme: 'dark' | 'light'
  hemisphere: 'north' | 'south'
  aiProvider: AIProvider
  aiModel?: string
  encryptedApiKey?: string // cifrada con Web Crypto API
  photoQuality: 'high' | 'medium' | 'low'
  pushNotifications: boolean
  onboardingCompleted: boolean
  fontSize: 'normal' | 'large'
}

// ── DATABASE CLASS ─────────────────────────────────────────────

export class NiwaMiriDB extends Dexie {
  bonsais!: Table<Bonsai>
  cares!: Table<Care>
  photos!: Table<Photo>
  classNotes!: Table<ClassNote>
  speciesSheets!: Table<SpeciesSheet>
  events!: Table<CalendarEvent>
  conversations!: Table<AIConversation>
  config!: Table<AppConfig>

  constructor() {
    super('NiwaMiriDB')
    this.version(1).stores({
      bonsais: '++id, species, status, updatedAt',
      cares: '++id, bonsaiId, type, date',
      photos: '++id, bonsaiId, careId, takenAt',
      classNotes: '++id, species, specimenId, careId, classDate',
      speciesSheets: '++id, &species',
      events: '++id, bonsaiId, type, date, completed',
      conversations: '++id, bonsaiId',
      config: '&id',
    })
  }
}

export const db = new NiwaMiriDB()
