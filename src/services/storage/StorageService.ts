import type {
  Bonsai,
  Care,
  Photo,
  ClassNote,
  JournalNote,
  SpeciesSheet,
  CalendarEvent,
  AppConfig,
  CareType,
  TreeCondition,
} from '../../db/schema'

export interface BulkCareRequest {
  type: CareType
  date: number
  specificFields?: Record<string, unknown>
  followUpReminder?: Care['followUpReminder']
  typeLabel: string
  recipients: { bonsaiId: string; treeCondition: TreeCondition; description?: string }[]
}

export class CareValidationError extends Error {
  code: 'missing-tree' | 'invalid-data'
  target: string
  constructor(code: 'missing-tree' | 'invalid-data', target = '') {
    super(code)
    this.code = code
    this.target = target
  }
}

export interface StorageService {
  // Bonsais
  getBonsaiList(): Promise<Bonsai[]>
  getBonsaiById(id: string): Promise<Bonsai | undefined>
  saveBonsai(bonsai: Omit<Bonsai, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>
  updateBonsai(id: string, data: Partial<Bonsai>): Promise<void>
  deleteBonsai(id: string): Promise<void>

  // Cares
  getCaresByBonsai(bonsaiId: string): Promise<Care[]>
  saveCare(care: Omit<Care, 'id' | 'createdAt'>): Promise<string>
  saveBulkCares(request: BulkCareRequest): Promise<string[]>
  getCareProducts(): Promise<string[]>
  updateCare(id: string, data: Partial<Omit<Care, 'id' | 'bonsaiId' | 'createdAt'>>, eventTitle: string): Promise<void>
  deleteCare(id: string): Promise<void>

  // Photos
  getPhotosByBonsai(bonsaiId: string): Promise<Photo[]>
  savePhoto(photo: Omit<Photo, 'id' | 'createdAt'>): Promise<string>
  deletePhoto(id: string): Promise<void>

  // Class Notes
  getNotesBySpecies(species: string): Promise<ClassNote[]>
  getNotesBySpecimen(specimenId: string): Promise<ClassNote[]>
  saveNote(note: Omit<ClassNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>
  updateNote(id: string, data: Partial<ClassNote>): Promise<void>
  deleteNote(id: string): Promise<void>

  // Journal Notes
  getJournalNotes(): Promise<JournalNote[]>
  saveJournalNote(note: Omit<JournalNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>
  updateJournalNote(id: string, data: Partial<JournalNote>): Promise<void>
  deleteJournalNote(id: string): Promise<void>

  // Species Sheets
  getSheetBySpecies(species: string): Promise<SpeciesSheet | undefined>
  saveSheet(sheet: Omit<SpeciesSheet, 'id'>): Promise<string>
  updateSheet(id: string, data: Partial<SpeciesSheet>): Promise<void>

  // Calendar Events
  getEventsByDateRange(from: number, to: number): Promise<CalendarEvent[]>
  saveEvent(event: Omit<CalendarEvent, 'id' | 'createdAt'>): Promise<string>
  updateEvent(id: string, data: Partial<CalendarEvent>): Promise<void>
  deleteEvent(id: string): Promise<void>

  // Config
  getConfig(): Promise<AppConfig>
  updateConfig(data: Partial<AppConfig>): Promise<void>
}
