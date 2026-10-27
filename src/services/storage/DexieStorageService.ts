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
import { CareValidationError, type BulkCareRequest, type StorageService } from './StorageService'
import { CARE_TYPES, normalizeDetails, validateDetails } from '../../utils/careDetails'

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

  async getCareProducts(): Promise<string[]> {
    const cares = await this.db.cares.toArray()
    return [...new Set(cares.flatMap((care) => [care.specificFields?.product, care.specificFields?.sealant])
      .filter((value): value is string => typeof value === 'string' && !!value.trim()))].sort((a, b) => a.localeCompare(b))
  }

  async saveBulkCares(request: BulkCareRequest): Promise<string[]> {
    const db = this.db
    return db.transaction('rw', [db.bonsais, db.cares, db.events], async () => {
      if (!CARE_TYPES.includes(request.type) || !Number.isFinite(request.date)
        || !request.recipients.length || validateDetails(request.type, request.specificFields ?? {}).length
        || (request.followUpReminder && (!Number.isFinite(request.followUpReminder.date) || !request.followUpReminder.description.trim()))) {
        throw new CareValidationError('invalid-data')
      }
      const recipients = [...new Map(request.recipients.map((row) => [row.bonsaiId, row])).values()]
      const trees = await db.bonsais.bulkGet(recipients.map((row) => row.bonsaiId))
      for (const [index, row] of recipients.entries()) {
        if (!trees[index]) throw new CareValidationError('missing-tree', row.bonsaiId)
        if (!['good', 'regular', 'problematic'].includes(row.treeCondition)) throw new CareValidationError('invalid-data', row.bonsaiId)
      }
      const ids: string[] = []
      for (const [index, row] of recipients.entries()) {
        const id = await this.saveCare({ ...row, type: request.type, date: request.date,
          specificFields: normalizeDetails(request.type, request.specificFields ?? {}),
          followUpReminder: request.followUpReminder })
        await this.saveEvent({ bonsaiId: row.bonsaiId, careId: id, careType: request.type,
          type: 'care', title: `${request.typeLabel} — ${trees[index]!.name}`, date: request.date, completed: true })
        if (request.followUpReminder) await this.saveEvent({ bonsaiId: row.bonsaiId, careId: id,
          careType: request.type, type: 'followup-reminder', title: request.followUpReminder.description,
          date: request.followUpReminder.date, completed: false })
        ids.push(id)
      }
      return ids
    })
  }

  private async getCareEvents(care: Care): Promise<CalendarEvent[]> {
    const events = await this.getEventsByBonsai(care.bonsaiId)
    const linked = events.filter((event) => event.careId === care.id)
    const reminder = care.followUpReminder
    if (!reminder) return linked

    // Los recordatorios antiguos no tenían careId. Solo asociarlos si hay un
    // único cuidado que coincida; nunca borrar por tipo de cuidado solamente.
    const owners = await this.db.cares.where('bonsaiId').equals(care.bonsaiId).filter(
      (candidate) => candidate.type === care.type
        && candidate.followUpReminder?.date === reminder.date
        && candidate.followUpReminder.description === reminder.description
    ).count()
    if (owners === 1) {
      linked.push(...events.filter((event) => !event.careId
        && event.type === 'followup-reminder'
        && event.careType === care.type
        && event.date === reminder.date
        && event.title === reminder.description))
    }
    return linked
  }

  async updateCare(
    id: string,
    data: Partial<Omit<Care, 'id' | 'bonsaiId' | 'createdAt'>>,
    eventTitle: string
  ): Promise<void> {
    const db = this.db
    await db.transaction('rw', [db.cares, db.events], async () => {
      const previous = await db.cares.get(id)
      if (!previous) throw new Error('Care not found')
      const events = await this.getCareEvents(previous)
      const care = { ...previous, ...data, id, bonsaiId: previous.bonsaiId, createdAt: previous.createdAt }
      await db.cares.put(care)

      const eventData = {
        bonsaiId: care.bonsaiId, careId: id, careType: care.type,
        title: eventTitle, date: care.date,
      }
      const careEvents = events.filter((event) => event.type === 'care')
      if (careEvents.length) {
        for (const event of careEvents) await this.updateEvent(event.id, eventData)
      } else {
        await this.saveEvent({ ...eventData, type: 'care', completed: true })
      }

      const pendingReminders = events.filter((event) => event.type === 'followup-reminder' && !event.completed)
      if (care.followUpReminder) {
        const reminderData = {
          bonsaiId: care.bonsaiId, careId: id, careType: care.type,
          title: care.followUpReminder.description, date: care.followUpReminder.date,
        }
        if (pendingReminders.length) {
          await this.updateEvent(pendingReminders[0].id, reminderData)
          for (const duplicate of pendingReminders.slice(1)) await this.deleteEvent(duplicate.id)
        } else {
          await this.saveEvent({ ...reminderData, type: 'followup-reminder', completed: false })
        }
      } else {
        for (const reminder of pendingReminders) await this.deleteEvent(reminder.id)
      }
    })
  }

  async deleteCare(id: string): Promise<void> {
    const db = this.db
    await db.transaction('rw', [db.cares, db.events, db.photos, db.classNotes], async () => {
      const care = await db.cares.get(id)
      if (!care) return
      const events = await this.getCareEvents(care)
      await db.events.bulkDelete(events.map((event) => event.id))
      // Conservar las fotos y notas del árbol, quitando solo el vínculo al cuidado.
      await db.photos.where('careId').equals(id).modify((photo) => { delete photo.careId })
      await db.classNotes.where('careId').equals(id).modify((note) => { delete note.careId })
      await db.cares.delete(id)
    })
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

  async updatePhoto(id: string, data: Partial<Photo>): Promise<void> {
    await this.db.photos.update(id, data)
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

  async getEventsByBonsai(bonsaiId: string): Promise<CalendarEvent[]> {
    return this.db.events.where('bonsaiId').equals(bonsaiId).toArray()
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
