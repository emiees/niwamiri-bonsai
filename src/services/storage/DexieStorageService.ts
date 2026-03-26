import { v4 as uuidv4 } from 'uuid'
import { db as defaultDb, NiwaMiriDB } from '../../db/schema'
import type {
  Bonsai,
  Care,
  Photo,
  ClassNote,
  JournalNote,
  SpeciesSheet,
  CalendarEvent,
  AppConfig,
} from '../../db/schema'
import type { StorageService } from './StorageService'

const DEFAULT_CONFIG: AppConfig = {
  id: 1,
  language: 'es',
  theme: 'dark',
  hemisphere: 'south',
  aiProvider: 'gemini',
  photoQuality: 'high',
  pushNotifications: false,
  onboardingCompleted: false,
  fontSize: 'normal',
}

export class DexieStorageService implements StorageService {
  private db: NiwaMiriDB

  // Accepts an optional db instance for testing (dependency injection)
  constructor(db?: NiwaMiriDB) {
    this.db = db ?? defaultDb
  }

  // ── Bonsais ──────────────────────────────────────────────────

  async getBonsaiList(): Promise<Bonsai[]> {
    return this.db.bonsais.orderBy('updatedAt').reverse().toArray()
  }

  async getBonsaiById(id: string): Promise<Bonsai | undefined> {
    return this.db.bonsais.get(id)
  }

  async saveBonsai(bonsai: Omit<Bonsai, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Date.now()
    const id = uuidv4()
    await this.db.bonsais.add({ ...bonsai, id, createdAt: now, updatedAt: now })
    return id
  }

  async updateBonsai(id: string, data: Partial<Bonsai>): Promise<void> {
    await this.db.bonsais.update(id, { ...data, updatedAt: Date.now() })
  }

  async deleteBonsai(id: string): Promise<void> {
    const db = this.db
    await db.transaction('rw', [db.bonsais, db.cares, db.photos, db.events, db.conversations], async () => {
      await db.bonsais.delete(id)
      await db.cares.where('bonsaiId').equals(id).delete()
      await db.photos.where('bonsaiId').equals(id).delete()
      await db.events.where('bonsaiId').equals(id).delete()
      await db.conversations.where('bonsaiId').equals(id).delete()
    })
  }

  // ── Cares ────────────────────────────────────────────────────

  async getCaresByBonsai(bonsaiId: string): Promise<Care[]> {
    return this.db.cares.where('bonsaiId').equals(bonsaiId).reverse().sortBy('date')
  }

  async saveCare(care: Omit<Care, 'id' | 'createdAt'>): Promise<string> {
    const id = uuidv4()
    await this.db.cares.add({ ...care, id, createdAt: Date.now() })
    return id
  }

  async deleteCare(id: string): Promise<void> {
    await this.db.cares.delete(id)
  }

  // ── Photos ───────────────────────────────────────────────────

  async getPhotosByBonsai(bonsaiId: string): Promise<Photo[]> {
    return this.db.photos.where('bonsaiId').equals(bonsaiId).reverse().sortBy('takenAt')
  }

  async savePhoto(photo: Omit<Photo, 'id' | 'createdAt'>): Promise<string> {
    const id = uuidv4()
    await this.db.photos.add({ ...photo, id, createdAt: Date.now() })
    return id
  }

  async deletePhoto(id: string): Promise<void> {
    await this.db.photos.delete(id)
  }

  // ── Class Notes ──────────────────────────────────────────────

  async getNotesBySpecies(species: string): Promise<ClassNote[]> {
    return this.db.classNotes.where('species').equals(species).reverse().sortBy('classDate')
  }

  async getNotesBySpecimen(specimenId: string): Promise<ClassNote[]> {
    return this.db.classNotes.where('specimenId').equals(specimenId).reverse().sortBy('classDate')
  }

  async saveNote(note: Omit<ClassNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Date.now()
    const id = uuidv4()
    await this.db.classNotes.add({ ...note, id, createdAt: now, updatedAt: now })
    return id
  }

  async updateNote(id: string, data: Partial<ClassNote>): Promise<void> {
    await this.db.classNotes.update(id, { ...data, updatedAt: Date.now() })
  }

  async deleteNote(id: string): Promise<void> {
    await this.db.classNotes.delete(id)
  }

  // ── Journal Notes ────────────────────────────────────────────

  async getJournalNotes(): Promise<JournalNote[]> {
    return this.db.journalNotes.orderBy('date').reverse().toArray()
  }

  async saveJournalNote(note: Omit<JournalNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Date.now()
    const id = uuidv4()
    await this.db.journalNotes.add({ ...note, id, createdAt: now, updatedAt: now })
    return id
  }

  async updateJournalNote(id: string, data: Partial<JournalNote>): Promise<void> {
    await this.db.journalNotes.update(id, { ...data, updatedAt: Date.now() })
  }

  async deleteJournalNote(id: string): Promise<void> {
    await this.db.journalNotes.delete(id)
  }

  // ── Species Sheets ───────────────────────────────────────────

  async getSheetBySpecies(species: string): Promise<SpeciesSheet | undefined> {
    return this.db.speciesSheets.where('species').equals(species).first()
  }

  async saveSheet(sheet: Omit<SpeciesSheet, 'id'>): Promise<string> {
    const id = uuidv4()
    await this.db.speciesSheets.add({ ...sheet, id })
    return id
  }

  async updateSheet(id: string, data: Partial<SpeciesSheet>): Promise<void> {
    await this.db.speciesSheets.update(id, { ...data, lastUpdated: Date.now() })
  }

  // ── Calendar Events ──────────────────────────────────────────

  async getEventsByDateRange(from: number, to: number): Promise<CalendarEvent[]> {
    return this.db.events.where('date').between(from, to, true, true).toArray()
  }

  async saveEvent(event: Omit<CalendarEvent, 'id' | 'createdAt'>): Promise<string> {
    const id = uuidv4()
    await this.db.events.add({ ...event, id, createdAt: Date.now() })
    return id
  }

  async updateEvent(id: string, data: Partial<CalendarEvent>): Promise<void> {
    await this.db.events.update(id, data)
  }

  async deleteEvent(id: string): Promise<void> {
    await this.db.events.delete(id)
  }

  // ── Config ───────────────────────────────────────────────────

  async getConfig(): Promise<AppConfig> {
    const config = await this.db.config.get(1)
    if (!config) {
      await this.db.config.put(DEFAULT_CONFIG)
      return DEFAULT_CONFIG
    }
    return config
  }

  async updateConfig(data: Partial<AppConfig>): Promise<void> {
    await this.db.config.update(1, data)
  }
}

export const storageService = new DexieStorageService()
