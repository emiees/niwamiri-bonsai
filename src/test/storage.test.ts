import { describe, it, expect, beforeEach, vi } from 'vitest'
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

// ── B026: conservar relaciones al editar y eliminar cuidados ────

describe('Cuidados — relaciones con calendario, fotos y notas', () => {
  let svc: DexieStorageService
  let bonsaiId: string
  const reminder = { date: 2000, description: 'Revisar el riego' }
  const careData = {
    type: 'watering' as const, date: 1000, treeCondition: 'good' as const,
    description: 'Riego inicial', followUpReminder: reminder,
  }

  beforeEach(async () => {
    svc = createService()
    bonsaiId = await svc.saveBonsai(bonsaiData)
  })

  async function linkedEvent(careId: string, type: 'care' | 'followup-reminder' = 'care') {
    return svc.saveEvent({
      bonsaiId, careId, type, careType: 'watering',
      title: type === 'care' ? 'Riego' : reminder.description,
      date: type === 'care' ? careData.date : reminder.date,
      completed: type === 'care',
    })
  }

  it('devuelve el historial completo en orden descendente aunque se inserte desordenado', async () => {
    for (const date of [2000, 7000, 1000, 5000, 3000, 6000, 4000]) {
      await svc.saveCare({ ...careData, bonsaiId, date })
    }
    expect((await svc.getCaresByBonsai(bonsaiId)).map((care) => care.date))
      .toEqual([7000, 6000, 5000, 4000, 3000, 2000, 1000])
  })

  it('edita sin cambiar ID, fecha de creación, fotos ni notas y actualiza sus eventos', async () => {
    const id = await svc.saveCare({ ...careData, bonsaiId })
    const original = (await svc.getCaresByBonsai(bonsaiId))[0]
    await linkedEvent(id)
    const reminderId = await linkedEvent(id, 'followup-reminder')
    const otherId = await svc.saveCare({ ...careData, bonsaiId })
    const otherReminderId = await linkedEvent(otherId, 'followup-reminder')
    const photoId = await svc.savePhoto({ bonsaiId, careId: id, imageData: 'foto', takenAt: 10, isMainPhoto: true })
    await svc.saveNote({ species: 'Ficus retusa', specimenId: bonsaiId, careId: id, classDate: 10, content: 'Nota vinculada' })

    await svc.updateCare(id, {
      type: 'fertilizing', date: 3000, description: 'Fertilización editada',
      followUpReminder: { date: 4000, description: 'Revisar fertilización' },
    }, 'Fertilización — Ficus')

    const updated = (await svc.getCaresByBonsai(bonsaiId)).find((care) => care.id === id)!
    expect(updated).toMatchObject({ id, createdAt: original.createdAt, type: 'fertilizing', date: 3000 })
    expect(await svc.getCaresByBonsai(bonsaiId)).toHaveLength(2)
    expect((await svc.getPhotosByBonsai(bonsaiId))[0]).toMatchObject({ id: photoId, careId: id, imageData: 'foto' })
    expect((await svc.getNotesBySpecimen(bonsaiId))[0].careId).toBe(id)
    const events = await svc.getEventsByBonsai(bonsaiId)
    expect(events.find((event) => event.type === 'care' && event.careId === id)).toMatchObject({ title: 'Fertilización — Ficus', date: 3000, careType: 'fertilizing' })
    expect(events.find((event) => event.id === reminderId)).toMatchObject({ date: 4000, careType: 'fertilizing', title: 'Revisar fertilización', careId: id })
    expect(events.find((event) => event.id === otherReminderId)).toMatchObject({ date: 2000, title: reminder.description, careId: otherId })
  })

  it('elimina sus eventos y conserva fotos, portada y notas sin un vínculo huérfano', async () => {
    const id = await svc.saveCare({ ...careData, bonsaiId })
    await linkedEvent(id)
    await linkedEvent(id, 'followup-reminder')
    const otherId = await svc.saveCare({ ...careData, bonsaiId })
    const otherEvent = await linkedEvent(otherId)
    const photoId = await svc.savePhoto({ bonsaiId, careId: id, imageData: 'foto', takenAt: 10, isMainPhoto: true })
    await svc.updateBonsai(bonsaiId, { mainPhotoId: photoId })
    await svc.saveNote({ species: 'Ficus retusa', specimenId: bonsaiId, careId: id, classDate: 10, content: 'Conservar nota' })

    await svc.deleteCare(id)

    expect((await svc.getCaresByBonsai(bonsaiId)).map((care) => care.id)).toEqual([otherId])
    expect((await svc.getEventsByBonsai(bonsaiId)).map((event) => event.id)).toEqual([otherEvent])
    const photos = await svc.getPhotosByBonsai(bonsaiId)
    expect(photos).toHaveLength(1)
    expect(photos[0]).toMatchObject({ id: photoId, imageData: 'foto', isMainPhoto: true })
    expect(photos[0].careId).toBeUndefined()
    expect((await svc.getBonsaiById(bonsaiId))?.mainPhotoId).toBe(photoId)
    const notes = await svc.getNotesBySpecimen(bonsaiId)
    expect(notes).toHaveLength(1)
    expect(notes[0].careId).toBeUndefined()
  })

  it('vincula un recordatorio antiguo inequívoco usando los datos originales al cambiar el tipo', async () => {
    const id = await svc.saveCare({ ...careData, bonsaiId })
    const legacyId = await svc.saveEvent({
      bonsaiId, type: 'followup-reminder', careType: 'watering', title: reminder.description, date: reminder.date, completed: false,
    })
    await svc.updateCare(id, { type: 'repotting', followUpReminder: { date: 5000, description: 'Revisar trasplante' } }, 'Trasplante')
    const events = await svc.getEventsByBonsai(bonsaiId)
    expect(events.filter((event) => event.type === 'followup-reminder')).toHaveLength(1)
    expect(events.find((event) => event.id === legacyId)).toMatchObject({ careId: id, careType: 'repotting', date: 5000, title: 'Revisar trasplante' })
  })

  it('elimina un recordatorio antiguo inequívoco sin borrar otros recordatorios del mismo tipo', async () => {
    const id = await svc.saveCare({ ...careData, bonsaiId })
    await svc.saveEvent({ bonsaiId, type: 'followup-reminder', careType: 'watering', title: reminder.description, date: reminder.date, completed: false })
    const unrelated = await svc.saveEvent({ bonsaiId, type: 'followup-reminder', careType: 'watering', title: 'Otro seguimiento', date: 6000, completed: false })
    await svc.deleteCare(id)
    expect((await svc.getEventsByBonsai(bonsaiId)).map((event) => event.id)).toEqual([unrelated])
  })

  it('conserva recordatorios antiguos ambiguos que podrían pertenecer a otro cuidado', async () => {
    const id = await svc.saveCare({ ...careData, bonsaiId })
    await svc.saveCare({ ...careData, bonsaiId })
    const ambiguousId = await svc.saveEvent({
      bonsaiId, type: 'followup-reminder', careType: 'watering', title: reminder.description, date: reminder.date, completed: false,
    })
    await svc.deleteCare(id)
    expect((await svc.getEventsByBonsai(bonsaiId)).map((event) => event.id)).toEqual([ambiguousId])
  })

  it('quita el recordatorio pendiente al editar sin seguimiento y conserva el completado', async () => {
    const id = await svc.saveCare({ ...careData, bonsaiId })
    await linkedEvent(id, 'followup-reminder')
    const completedId = await linkedEvent(id, 'followup-reminder')
    await svc.updateEvent(completedId, { completed: true })
    await svc.updateCare(id, { followUpReminder: undefined }, 'Riego')
    const followups = (await svc.getEventsByBonsai(bonsaiId)).filter((event) => event.type === 'followup-reminder')
    expect(followups.map((event) => event.id)).toEqual([completedId])
  })
})


describe('F033/F035 — cuidados masivos y detalles', () => {
  let svc: DexieStorageService
  beforeEach(() => { svc = createService() })
  async function request() {
    const a = await svc.saveBonsai(bonsaiData)
    const b = await svc.saveBonsai({ ...bonsaiData, name: 'Segundo' })
    return { type: 'fertilizing' as const, date: new Date(2026, 9, 27, 12).getTime(), typeLabel: 'Fertilización',
      specificFields: { product: 'Abono X', dose: 2.5, doseUnit: 'ml/L', unknown: { retained: true } },
      followUpReminder: { date: new Date(2026, 10, 10, 12).getTime(), description: 'Revisar' },
      recipients: [{ bonsaiId: a, treeCondition: 'good' as const, description: 'Común' }, { bonsaiId: b, treeCondition: 'regular' as const, description: 'Excepción' }] }
  }
  it('crea un cuidado independiente, calendario y seguimiento por árbol, sin duplicados', async () => {
    const data = await request()
    data.recipients.push(data.recipients[0])
    const ids = await svc.saveBulkCares(data)
    expect(new Set(ids).size).toBe(2)
    const first = (await svc.getCaresByBonsai(data.recipients[0].bonsaiId))[0]
    const second = (await svc.getCaresByBonsai(data.recipients[1].bonsaiId))[0]
    expect(first.treeCondition).toBe('good'); expect(second.treeCondition).toBe('regular')
    expect(second.description).toBe('Excepción')
    expect(first.specificFields).toEqual(data.specificFields)
    const events = await svc.getEventsByDateRange(0, Number.MAX_SAFE_INTEGER)
    expect(events).toHaveLength(4)
    expect(events.filter((e) => e.careId === first.id)).toHaveLength(2)
    await svc.updateCare(first.id, { description: 'Editado' }, 'Fertilización — Ficus')
    await svc.deleteCare(first.id)
    expect((await svc.getCaresByBonsai(second.bonsaiId))[0]).toEqual(second)
    expect(await svc.getEventsByDateRange(0, Number.MAX_SAFE_INTEGER)).toHaveLength(2)
    expect((await svc.getBonsaiById(second.bonsaiId))!.status).toBe('developing')
  })
  it('revierte todos los cuidados y eventos si falla un seguimiento posterior', async () => {
    const data = await request()
    const save = svc.saveEvent.bind(svc)
    let calls = 0
    vi.spyOn(svc, 'saveEvent').mockImplementation(async (event) => {
      if (++calls === 4) throw new Error('fallo de escritura')
      return save(event)
    })
    await expect(svc.saveBulkCares(data)).rejects.toThrow('fallo de escritura')
    for (const row of data.recipients) expect(await svc.getCaresByBonsai(row.bonsaiId)).toEqual([])
    expect(await svc.getEventsByDateRange(0, Number.MAX_SAFE_INTEGER)).toEqual([])
  })
  it('guarda solo producto en cada árbol y rechaza seguimientos vacíos sin escribir', async () => {
    const data = await request()
    await expect(svc.saveBulkCares({ ...data, followUpReminder: { ...data.followUpReminder, description: ' ' } })).rejects.toMatchObject({ code: 'invalid-data' })
    await svc.saveBulkCares({ ...data, specificFields: { product: 'Solo producto' }, followUpReminder: undefined })
    for (const row of data.recipients) {
      const cares = await svc.getCaresByBonsai(row.bonsaiId)
      expect(cares).toHaveLength(1); expect(cares[0].specificFields).toEqual({ product: 'Solo producto' })
      expect(cares[0].followUpReminder).toBeUndefined()
    }
    expect(await svc.getEventsByDateRange(0, Number.MAX_SAFE_INTEGER)).toHaveLength(2)
  })
  it('valida los destinatarios y detalles antes de escribir y permite repetir una intervención legítima', async () => {
    const data = await request()
    await expect(svc.saveBulkCares({ ...data, recipients: [...data.recipients, { bonsaiId: 'missing', treeCondition: 'good' }] })).rejects.toMatchObject({ code: 'missing-tree', target: 'missing' })
    await expect(svc.saveBulkCares({ ...data, specificFields: { dose: 0, doseUnit: 'g/L' } })).rejects.toMatchObject({ code: 'invalid-data' })
    expect(await svc.getCaresByBonsai(data.recipients[0].bonsaiId)).toEqual([])
    await svc.saveBulkCares({ ...data, recipients: [data.recipients[0]], followUpReminder: undefined })
    await svc.saveBulkCares({ ...data, recipients: [data.recipients[0]], followUpReminder: undefined })
    expect(await svc.getCaresByBonsai(data.recipients[0].bonsaiId)).toHaveLength(2)
    expect(await svc.getCareProducts()).toEqual(['Abono X'])
  })
})
