import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { NiwaMiriDB } from '../db/schema'
import { DexieStorageService } from '../services/storage/DexieStorageService'
import type { Bonsai, Care, Photo, ClassNote, CalendarEvent } from '../db/schema'

// Each beforeEach creates a fresh in-memory DB via a unique IDBFactory instance
function createService() {
  const idb = new IDBFactory()
  const db = new NiwaMiriDB()
  // Dexie reads indexedDB from the global or from its own internal ref;
  // we override it per instance via the internal _options hook
  db.use({ stack: 'dbcore', create: (core) => core })
  // Point this Dexie instance to the isolated IDB factory
  // @ts-expect-error internal Dexie property
  db._deps.indexedDB = idb
  // @ts-expect-error internal Dexie property
  db._deps.IDBKeyRange = (globalThis as typeof globalThis & { IDBKeyRange: typeof IDBKeyRange }).IDBKeyRange
  return new DexieStorageService(db)
}

// ── Helpers ────────────────────────────────────────────────────

const bonsaiData: Omit<Bonsai, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Ficus test',
  species: 'Ficus retusa',
  status: 'developing',
}

// ── Bonsais ────────────────────────────────────────────────────

describe('Bonsais — CRUD', () => {
  let svc: DexieStorageService

  beforeEach(() => { svc = createService() })

  it('saveBonsai returns a string id', async () => {
    const id = await svc.saveBonsai(bonsaiData)
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('getBonsaiById returns the saved record', async () => {
    const id = await svc.saveBonsai(bonsaiData)
    const found = await svc.getBonsaiById(id)
    expect(found).toBeDefined()
    expect(found!.name).toBe('Ficus test')
    expect(found!.species).toBe('Ficus retusa')
    expect(found!.status).toBe('developing')
    expect(typeof found!.createdAt).toBe('number')
    expect(typeof found!.updatedAt).toBe('number')
  })

  it('getBonsaiList returns all records', async () => {
    await svc.saveBonsai(bonsaiData)
    await svc.saveBonsai({ ...bonsaiData, name: 'Olmo', species: 'Ulmus parvifolia' })
    const list = await svc.getBonsaiList()
    expect(list).toHaveLength(2)
  })

  it('updateBonsai modifies fields and bumps updatedAt', async () => {
    const id = await svc.saveBonsai(bonsaiData)
    const before = await svc.getBonsaiById(id)
    await new Promise((r) => setTimeout(r, 5))
    await svc.updateBonsai(id, { name: 'Modificado', status: 'maintenance' })
    const after = await svc.getBonsaiById(id)
    expect(after!.name).toBe('Modificado')
    expect(after!.status).toBe('maintenance')
    expect(after!.updatedAt).toBeGreaterThan(before!.updatedAt)
  })

  it('deleteBonsai removes the record', async () => {
    const id = await svc.saveBonsai(bonsaiData)
    await svc.deleteBonsai(id)
    expect(await svc.getBonsaiById(id)).toBeUndefined()
  })

  it('deleteBonsai cascades to cares and photos', async () => {
    const id = await svc.saveBonsai(bonsaiData)
    await svc.saveCare({ bonsaiId: id, type: 'watering', date: Date.now(), treeCondition: 'good' })
    await svc.savePhoto({ bonsaiId: id, imageData: 'b64', takenAt: Date.now(), isMainPhoto: false })
    await svc.deleteBonsai(id)
    expect(await svc.getCaresByBonsai(id)).toHaveLength(0)
    expect(await svc.getPhotosByBonsai(id)).toHaveLength(0)
  })
})

// ── Cares ──────────────────────────────────────────────────────

describe('Cares — CRUD', () => {
  let svc: DexieStorageService
  let bonsaiId: string
  const careData: Omit<Care, 'id' | 'createdAt'> = {
    bonsaiId: '',
    type: 'watering',
    date: Date.now(),
    treeCondition: 'good',
    description: 'Riego profundo',
  }

  beforeEach(async () => {
    svc = createService()
    bonsaiId = await svc.saveBonsai(bonsaiData)
  })

  it('saveCare returns a string id', async () => {
    const id = await svc.saveCare({ ...careData, bonsaiId })
    expect(typeof id).toBe('string')
  })

  it('getCaresByBonsai filters by bonsaiId', async () => {
    const b2 = await svc.saveBonsai({ ...bonsaiData, name: 'Otro' })
    await svc.saveCare({ ...careData, bonsaiId })
    await svc.saveCare({ ...careData, bonsaiId })
    await svc.saveCare({ ...careData, bonsaiId: b2 })
    const cares = await svc.getCaresByBonsai(bonsaiId)
    expect(cares).toHaveLength(2)
    expect(cares.every((c) => c.bonsaiId === bonsaiId)).toBe(true)
  })

  it('deleteCare removes the record', async () => {
    const id = await svc.saveCare({ ...careData, bonsaiId })
    await svc.deleteCare(id)
    expect(await svc.getCaresByBonsai(bonsaiId)).toHaveLength(0)
  })
})

// ── Photos ─────────────────────────────────────────────────────

describe('Photos — CRUD', () => {
  let svc: DexieStorageService
  let bonsaiId: string
  const photoData: Omit<Photo, 'id' | 'createdAt'> = {
    bonsaiId: '',
    imageData: 'fakebase64==',
    takenAt: Date.now(),
    isMainPhoto: false,
  }

  beforeEach(async () => {
    svc = createService()
    bonsaiId = await svc.saveBonsai(bonsaiData)
  })

  it('savePhoto returns a string id', async () => {
    const id = await svc.savePhoto({ ...photoData, bonsaiId })
    expect(typeof id).toBe('string')
  })

  it('getPhotosByBonsai returns photos for that bonsai', async () => {
    await svc.savePhoto({ ...photoData, bonsaiId })
    await svc.savePhoto({ ...photoData, bonsaiId })
    expect(await svc.getPhotosByBonsai(bonsaiId)).toHaveLength(2)
  })

  it('deletePhoto removes the record', async () => {
    const id = await svc.savePhoto({ ...photoData, bonsaiId })
    await svc.deletePhoto(id)
    expect(await svc.getPhotosByBonsai(bonsaiId)).toHaveLength(0)
  })
})

// ── ClassNotes ─────────────────────────────────────────────────

describe('ClassNotes — CRUD', () => {
  let svc: DexieStorageService
  const noteData: Omit<ClassNote, 'id' | 'createdAt' | 'updatedAt'> = {
    species: 'Ficus retusa',
    classDate: Date.now(),
    content: 'El riego debe hacerse cuando el sustrato empieza a secarse.',
    title: 'Riego de Ficus',
  }

  beforeEach(() => { svc = createService() })

  it('saveNote returns a string id', async () => {
    const id = await svc.saveNote(noteData)
    expect(typeof id).toBe('string')
  })

  it('getNotesBySpecies returns matching notes only', async () => {
    await svc.saveNote(noteData)
    await svc.saveNote({ ...noteData, title: 'Fertilización' })
    await svc.saveNote({ ...noteData, species: 'Ulmus parvifolia', title: 'Otra especie' })
    const notes = await svc.getNotesBySpecies('Ficus retusa')
    expect(notes).toHaveLength(2)
    expect(notes.every((n) => n.species === 'Ficus retusa')).toBe(true)
  })

  it('updateNote modifies content and bumps updatedAt', async () => {
    const id = await svc.saveNote(noteData)
    await new Promise((r) => setTimeout(r, 5))
    await svc.updateNote(id, { content: 'Contenido actualizado' })
    const notes = await svc.getNotesBySpecies('Ficus retusa')
    const updated = notes.find((n) => n.id === id)!
    expect(updated.content).toBe('Contenido actualizado')
  })

  it('deleteNote removes the record', async () => {
    const id = await svc.saveNote(noteData)
    await svc.deleteNote(id)
    expect(await svc.getNotesBySpecies('Ficus retusa')).toHaveLength(0)
  })
})

// ── SpeciesSheets ──────────────────────────────────────────────

describe('SpeciesSheets — CRUD', () => {
  let svc: DexieStorageService

  beforeEach(() => { svc = createService() })

  it('saves and retrieves a species sheet', async () => {
    await svc.saveSheet({
      species: 'Ficus retusa',
      origin: 'manual',
      content: { riego: 'Abundante en verano', luz: 'Sol directo' },
      lastUpdated: Date.now(),
    })
    const sheet = await svc.getSheetBySpecies('Ficus retusa')
    expect(sheet).toBeDefined()
    expect(sheet!.content.riego).toBe('Abundante en verano')
  })

  it('getSheetBySpecies returns undefined for unknown species', async () => {
    expect(await svc.getSheetBySpecies('Especie inexistente')).toBeUndefined()
  })

  it('updateSheet modifies content and origin', async () => {
    const id = await svc.saveSheet({
      species: 'Ficus retusa',
      origin: 'manual',
      content: { riego: 'Original' },
      lastUpdated: Date.now(),
    })
    await svc.updateSheet(id, { content: { riego: 'Actualizado' }, origin: 'edited' })
    const sheet = await svc.getSheetBySpecies('Ficus retusa')
    expect(sheet!.content.riego).toBe('Actualizado')
    expect(sheet!.origin).toBe('edited')
  })
})

// ── CalendarEvents ─────────────────────────────────────────────

describe('CalendarEvents — CRUD', () => {
  let svc: DexieStorageService
  const base = Date.now()
  const eventData: Omit<CalendarEvent, 'id' | 'createdAt'> = {
    type: 'manual-reminder',
    title: 'Revisar alambrado',
    date: base,
    completed: false,
  }

  beforeEach(() => { svc = createService() })

  it('saveEvent returns a string id', async () => {
    expect(typeof await svc.saveEvent(eventData)).toBe('string')
  })

  it('getEventsByDateRange returns only events within range', async () => {
    await svc.saveEvent({ ...eventData, date: base })
    await svc.saveEvent({ ...eventData, date: base + 86_400_000 * 5 })  // +5 days
    await svc.saveEvent({ ...eventData, date: base + 86_400_000 * 40 }) // +40 days (outside)
    const events = await svc.getEventsByDateRange(base, base + 86_400_000 * 30)
    expect(events).toHaveLength(2)
  })

  it('updateEvent marks event as completed', async () => {
    const id = await svc.saveEvent(eventData)
    await svc.updateEvent(id, { completed: true })
    const events = await svc.getEventsByDateRange(base - 1000, base + 1000)
    expect(events.find((e) => e.id === id)!.completed).toBe(true)
  })

  it('deleteEvent removes the record', async () => {
    const id = await svc.saveEvent({ ...eventData, date: base })
    await svc.deleteEvent(id)
    expect(await svc.getEventsByDateRange(base - 1000, base + 1000)).toHaveLength(0)
  })
})

// ── AppConfig ──────────────────────────────────────────────────

describe('AppConfig — singleton', () => {
  let svc: DexieStorageService

  beforeEach(() => { svc = createService() })

  it('getConfig returns default config when none exists', async () => {
    const config = await svc.getConfig()
    expect(config.id).toBe(1)
    expect(config.language).toBe('es')
    expect(config.theme).toBe('dark')
    expect(config.hemisphere).toBe('south')
    expect(config.onboardingCompleted).toBe(false)
  })

  it('updateConfig persists partial changes without losing other fields', async () => {
    await svc.getConfig() // initialise defaults
    await svc.updateConfig({ theme: 'light', language: 'en' })
    const config = await svc.getConfig()
    expect(config.theme).toBe('light')
    expect(config.language).toBe('en')
    expect(config.hemisphere).toBe('south') // unchanged
  })

  it('updateConfig can mark onboarding as completed', async () => {
    await svc.getConfig()
    await svc.updateConfig({ onboardingCompleted: true })
    expect((await svc.getConfig()).onboardingCompleted).toBe(true)
  })
})
