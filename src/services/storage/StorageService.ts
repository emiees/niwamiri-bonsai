import type {
  Bonsai,
  Care,
  Photo,
  ClassNote,
  SpeciesSheet,
  CalendarEvent,
  AppConfig,
} from '../../db/schema'

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
