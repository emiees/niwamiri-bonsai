import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import BonsaiDetail from '../pages/BonsaiDetail'
import CareList from '../pages/CareList'
import CareForm from '../pages/CareForm'
import Gallery from '../pages/Gallery'
import ClassNotes from '../pages/ClassNotes'
import SpeciesSheet from '../pages/SpeciesSheet'
import Calendar from '../pages/Calendar'
import { useBonsaiStore } from '../store/bonsaiStore'
import { useCalendarStore } from '../store/calendarStore'
import { storageService } from '../services/storage/DexieStorageService'
import i18n from '../i18n'
import { useAppStore } from '../store/appStore'
import * as aiFactory from '../hooks/useAI'
import type { AIService } from '../services/ai/AIService'
import type { Bonsai, Care, Photo, ClassNote, SpeciesSheet as Sheet } from '../db/schema'

const bonsai: Bonsai = {
  id: 'tree',
  name: 'Ficus de prueba',
  species: 'Ficus retusa',
  status: 'developing',
  createdAt: 1,
  updatedAt: 1,
}
let cares: Care[]
let host: HTMLDivElement
let root: Root
const reactGlobals = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
const previousActEnvironment = reactGlobals.IS_REACT_ACT_ENVIRONMENT

function CurrentLocation() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname}</output>
}

async function render(entry = '/bonsai/tree') {
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[entry]}>
        <CurrentLocation />
        <Routes>
          <Route path="/bonsai/:id" element={<BonsaiDetail />} />
          <Route path="/bonsai/:id/cares" element={<CareList />} />
          <Route path="/bonsai/:id/care" element={<CareForm />} />
          <Route path="/bonsai/:id/care/:careId" element={<CareForm />} />
          <Route path="/bonsai/:id/gallery" element={<Gallery />} />
          <Route path="/bonsai/:id/notes" element={<ClassNotes />} />
          <Route path="/bonsai/:id/sheet" element={<SpeciesSheet />} />
          <Route path="/calendar" element={<Calendar />} />
        </Routes>
      </MemoryRouter>
    )
  })
}

function button(label: string, scope: ParentNode = host): HTMLButtonElement {
  const found = Array.from(scope.querySelectorAll('button')).find(
    (element) =>
      element.textContent?.trim() === label || element.getAttribute('aria-label') === label
  )
  expect(found, `Botón «${label}»`).toBeDefined()
  return found!
}

async function click(element: Element) {
  await act(async () => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

async function fill(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(element, value)
    element.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function openSection(key: string) {
  const title = i18n.t(`bonsaiDetail.sections.${key}`)
  const sectionButton = Array.from(host.querySelectorAll('button')).find((element) =>
    element.textContent?.startsWith(title)
  )!
  expect(sectionButton).toBeDefined()
  await click(sectionButton)
  return sectionButton.parentElement!
}

function location() {
  return host.querySelector('[data-testid="location"]')?.textContent
}

beforeAll(() => {
  reactGlobals.IS_REACT_ACT_ENVIRONMENT = true
})
afterAll(() => {
  reactGlobals.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment
})

beforeEach(async () => {
  cares = Array.from({ length: 7 }, (_, index) => ({
    id: `care-${index}`,
    bonsaiId: bonsai.id,
    type: 'watering',
    date: new Date(2026, 9, 20 - index, 12).getTime(),
    treeCondition: 'good',
    description: `Observación ${index}`,
    createdAt: index,
  }))
  useBonsaiStore.setState({ bonsais: [bonsai], loading: false })
  useCalendarStore.setState({ events: [] })
  vi.spyOn(storageService, 'getCareProducts').mockResolvedValue([])
  vi.spyOn(storageService, 'getCaresByBonsai').mockImplementation(async (id) =>
    cares.filter((care) => care.bonsaiId === id)
  )
  vi.spyOn(storageService, 'getPhotosByBonsai').mockResolvedValue([])
  vi.spyOn(storageService, 'getNotesBySpecimen').mockResolvedValue([])
  vi.spyOn(storageService, 'getNotesBySpecies').mockResolvedValue([])
  vi.spyOn(storageService, 'getSheetBySpecies').mockResolvedValue(undefined)
  vi.spyOn(storageService, 'getEventsByDateRange').mockResolvedValue([])
  vi.spyOn(storageService, 'saveEvent').mockResolvedValue('event')
  vi.spyOn(storageService, 'updateCare').mockImplementation(async (id, data) => {
    cares = cares.map((care) => (care.id === id ? { ...care, ...data } : care))
  })
  vi.spyOn(storageService, 'saveCare').mockImplementation(async (data) => {
    cares.push({ ...data, id: 'new-care', createdAt: 100 })
    return 'new-care'
  })
  vi.spyOn(storageService, 'deleteCare').mockImplementation(async (id) => {
    cares = cares.filter((care) => care.id !== id)
  })
  await i18n.changeLanguage('es')
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.restoreAllMocks()
})

describe('B026 — historial de cuidados', () => {
  it('abre todos los cuidados desde el resumen de cinco y permite editar el séptimo', async () => {
    await render()
    const section = await openSection('cares')
    expect(section.querySelectorAll('button')).toHaveLength(7) // cabecera, cinco registros y acceso al listado
    await click(button('Ver todos (7)'))
    expect(location()).toBe('/bonsai/tree/cares')
    expect(host.querySelectorAll('article')).toHaveLength(7)
    expect(host.textContent).toContain('Observación 6')

    await click(host.querySelectorAll('article')[6].querySelector('button')!)
    expect(location()).toBe('/bonsai/tree/care/care-6')
    const description = host.querySelector('textarea')!
    expect(description.value).toBe('Observación 6')
    await fill(description, 'Cuidado antiguo actualizado')
    await fill(host.querySelector<HTMLInputElement>('input[type="date"]')!, '2026-10-01')
    await click(button('Guardar'))
    expect(location()).toBe('/bonsai/tree/cares')
    expect(host.textContent).toContain('Cuidado antiguo actualizado')
    expect(storageService.updateCare).toHaveBeenCalledWith(
      'care-6',
      expect.objectContaining({
        description: 'Cuidado antiguo actualizado',
        date: new Date(2026, 9, 1, 12).getTime(),
      }),
      expect.any(String)
    )
    expect(storageService.saveCare).not.toHaveBeenCalled()
    expect(storageService.deleteCare).not.toHaveBeenCalled()
  })

  it.each([0, 5])('mantiene acceso al listado con %i cuidados', async (count) => {
    cares = cares.slice(0, count)
    await render()
    await openSection('cares')
    await click(button(count ? `Ver todos (${count})` : 'Ver cuidados'))
    expect(location()).toBe('/bonsai/tree/cares')
    expect(host.querySelectorAll('article')).toHaveLength(count)
    if (!count) expect(host.textContent).toContain(i18n.t('bonsaiDetail.noCares'))
  })

  it('busca cuidados y distingue una búsqueda sin resultados', async () => {
    await render('/bonsai/tree/cares')
    const search = host.querySelector<HTMLInputElement>('input[type="search"]')!
    await fill(search, 'Observación 6')
    expect(host.querySelectorAll('article')).toHaveLength(1)
    await fill(search, 'sin coincidencias')
    expect(host.textContent).toContain('Sin resultados')
    await fill(search, 'riego')
    expect(host.querySelectorAll('article')).toHaveLength(7)
  })

  it('permite cancelar la eliminación y solo borra al confirmar', async () => {
    await render('/bonsai/tree/cares')
    await click(host.querySelector('article')!.querySelectorAll('button')[1])
    expect(storageService.deleteCare).not.toHaveBeenCalled()
    await click(button('Cancelar'))
    expect(host.querySelectorAll('article')).toHaveLength(7)
    await click(host.querySelector('article')!.querySelectorAll('button')[1])
    await click(button('Eliminar', host.querySelector('[role="dialog"]')!))
    expect(storageService.deleteCare).toHaveBeenCalledWith('care-0')
    expect(host.querySelectorAll('article')).toHaveLength(6)
    expect(location()).toBe('/bonsai/tree/cares')
  })

  it('conserva el registro visible si falla la eliminación', async () => {
    vi.mocked(storageService.deleteCare).mockRejectedValueOnce(new Error('fallo de almacenamiento'))
    await render('/bonsai/tree/cares')
    await click(host.querySelector('article')!.querySelectorAll('button')[1])
    await click(button('Eliminar', host.querySelector('[role="dialog"]')!))
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('No se pudo eliminar')
    expect(host.querySelectorAll('article')).toHaveLength(7)
  })

  it('crea un cuidado desde el listado y vuelve al historial actualizado', async () => {
    await render('/bonsai/tree/cares')
    await click(button('Agregar cuidado'))
    expect(location()).toBe('/bonsai/tree/care')
    await fill(host.querySelector('textarea')!, 'Nuevo cuidado desde el historial')
    await click(button('Guardar'))
    expect(location()).toBe('/bonsai/tree/cares')
    expect(host.querySelectorAll('article')).toHaveLength(8)
    expect(host.textContent).toContain('Nuevo cuidado desde el historial')
  })

  it('traduce el acceso y la nueva pantalla al inglés', async () => {
    await i18n.changeLanguage('en')
    await render()
    await openSection('cares')
    await click(button('See all (7)'))
    expect(location()).toBe('/bonsai/tree/cares')
    expect(button('Add care')).toBeDefined()
    expect(host.textContent).toContain('Care history')
  })
})

describe('Revisión de otras listas resumidas', () => {
  it('abre todas las fotos desde el resumen de galería', async () => {
    const photos: Photo[] = Array.from({ length: 8 }, (_, index) => ({
      id: `photo-${index}`,
      bonsaiId: bonsai.id,
      imageData: 'dGVzdA==',
      takenAt: index,
      isMainPhoto: false,
      createdAt: index,
    }))
    vi.mocked(storageService.getPhotosByBonsai).mockResolvedValue(photos)
    await render()
    const section = await openSection('gallery')
    expect(section.querySelectorAll('img')).toHaveLength(6)
    await click(button('Ver galería completa'))
    expect(location()).toBe('/bonsai/tree/gallery')
    expect(host.querySelectorAll('img')).toHaveLength(8)
  })

  it('abre todas las notas desde el resumen de tres', async () => {
    const notes: ClassNote[] = Array.from({ length: 4 }, (_, index) => ({
      id: `note-${index}`,
      species: bonsai.species,
      specimenId: bonsai.id,
      title: `Nota ${index}`,
      content: `Contenido ${index}`,
      classDate: index,
      createdAt: index,
      updatedAt: index,
    }))
    vi.mocked(storageService.getNotesBySpecimen).mockResolvedValue(notes)
    vi.mocked(storageService.getNotesBySpecies).mockResolvedValue(notes)
    await render()
    await openSection('notes')
    expect(host.textContent).not.toContain('Contenido 0')
    await click(button('Ver todas las notas'))
    expect(location()).toBe('/bonsai/tree/notes')
    for (const note of notes) expect(host.textContent).toContain(note.content)
  })

  it('abre todos los campos de la ficha técnica desde el resumen de tres', async () => {
    const sheet: Sheet = {
      id: 'sheet',
      species: bonsai.species,
      origin: 'manual',
      lastUpdated: 1,
      content: {
        luz: 'Campo luz',
        riego: 'Campo riego',
        poda: 'Campo poda',
        sustrato: 'Campo sustrato',
      },
    }
    vi.mocked(storageService.getSheetBySpecies).mockResolvedValue(sheet)
    await render()
    await openSection('speciesSheet')
    expect(host.textContent).not.toContain('Campo sustrato')
    await click(button('Ver ficha completa'))
    expect(location()).toBe('/bonsai/tree/sheet')
    expect(host.textContent).toContain('Campo sustrato')
  })

  it('muestra todos los eventos del día aunque el calendario limite los indicadores a tres', async () => {
    const date = new Date()
    date.setDate(15)
    date.setHours(12, 0, 0, 0)
    vi.mocked(storageService.getEventsByDateRange).mockResolvedValue(
      Array.from({ length: 5 }, (_, index) => ({
        id: `event-${index}`,
        type: 'manual-reminder',
        title: `Evento ${index}`,
        date: date.getTime(),
        completed: false,
        createdAt: index,
      }))
    )
    await render('/calendar')
    await click(button('15'))
    for (let index = 0; index < 5; index++) expect(host.textContent).toContain(`Evento ${index}`)
  })
})

describe('F034/F035 — historial filtrado y edición de detalles', () => {
  it('combina producto, tipo y fotos del cuidado, conserva filtros al editar e informa éxito', async () => {
    cares[0] = {
      ...cares[0],
      type: 'fertilizing',
      specificFields: { product: 'Abono X', dose: 2, doseUnit: 'g/L', future: { preserved: true } },
    }
    vi.mocked(storageService.getPhotosByBonsai).mockResolvedValue([
      {
        id: 'photo',
        bonsaiId: 'tree',
        careId: cares[0].id,
        imageData: '',
        takenAt: 1,
        createdAt: 1,
        isMainPhoto: false,
      },
      {
        id: 'orphan',
        bonsaiId: 'tree',
        imageData: '',
        takenAt: 1,
        createdAt: 1,
        isMainPhoto: true,
      },
    ])
    await render('/bonsai/tree/cares?type=fertilizing&photos=with&q=Abono')
    expect(host.querySelectorAll('article')).toHaveLength(1)
    expect(host.textContent).toContain('Dosis de producto: 2 g/L')
    await click(host.querySelector('article button')!)
    const doseLabel = [...host.querySelectorAll('label')].find(
      (label) => label.textContent === 'Dosis de producto'
    )!
    await fill(document.getElementById(doseLabel.htmlFor)! as HTMLInputElement, '3,5')
    await click(button('Guardar'))
    expect(host.querySelectorAll('article')).toHaveLength(1)
    expect(host.textContent).toContain('Cuidado guardado')
    expect(host.querySelector<HTMLInputElement>('input[type="search"]')!.value).toBe('Abono')
    expect(storageService.updateCare).toHaveBeenCalledWith(
      'care-0',
      expect.objectContaining({
        specificFields: {
          product: 'Abono X',
          dose: 3.5,
          doseUnit: 'g/L',
          future: { preserved: true },
        },
      }),
      expect.any(String)
    )
    await click(host.querySelector('article button')!)
    const changeType = [...host.querySelectorAll('button')].find((element) =>
      element.textContent?.includes('Alambrado')
    )!
    await click(changeType)
    await click(button('Cambiar tipo'))
    await click(button('Guardar'))
    expect(host.querySelectorAll('article')).toHaveLength(0)
    expect(host.textContent).toContain('Cuidado guardado')
    await click(button('Limpiar filtros'))
    expect(host.querySelector<HTMLInputElement>('input[type="search"]')!.value).toBe('Abono')
    await click(button('Limpiar búsqueda'))
    expect(host.querySelectorAll('article')).toHaveLength(7)
  })

  it('solo considera fotos con careId y conserva los filtros tras eliminar', async () => {
    vi.mocked(storageService.getPhotosByBonsai).mockResolvedValue([
      {
        id: 'gallery',
        bonsaiId: 'tree',
        imageData: '',
        takenAt: 1,
        createdAt: 1,
        isMainPhoto: true,
      },
    ])
    await render('/bonsai/tree/cares?photos=with')
    expect(host.querySelectorAll('article')).toHaveLength(0)
    await click(button('Limpiar filtros'))
    expect(host.querySelectorAll('article')).toHaveLength(7)
    await click(button('Filtros de cuidados'))
    await click(button('Sin fotos', host.querySelector('[role="dialog"]')!))
    await click(button('Aplicar filtros'))
    await click(host.querySelector('article')!.querySelectorAll('button')[1])
    await click(button('Eliminar', host.querySelector('[role="dialog"]')!))
    expect(host.querySelectorAll('article')).toHaveLength(6)
    expect(host.textContent).toContain('Sin fotos ×')
  })

  it('impide aplicar rangos invertidos en el panel', async () => {
    await render('/bonsai/tree/cares')
    await click(button('Filtros de cuidados'))
    const period = host.querySelector('select')!
    await act(async () => {
      period.value = 'custom'
      period.dispatchEvent(new Event('change', { bubbles: true }))
    })
    const dates = host.querySelectorAll<HTMLInputElement>('input[type="date"]')
    await fill(dates[0], '2026-10-28')
    await fill(dates[1], '2026-10-27')
    expect(button('Aplicar filtros').disabled).toBe(true)
    expect(host.querySelector('[role="alert"]')!.textContent).toContain('rango de fechas')
  })
})

describe('B029 — limpieza de seguimiento individual', () => {
  it('quita fecha y texto al editar y guarda sin recrear un evento vacío', async () => {
    cares[0].followUpReminder = {
      date: new Date(2026, 10, 3, 12).getTime(),
      description: 'Seguimiento anterior',
    }
    await render('/bonsai/tree/care/care-0')
    expect(host.querySelector('input[value="Seguimiento anterior"]')).not.toBeNull()
    await click(button('Quitar recordatorio'))
    expect(host.querySelectorAll<HTMLInputElement>('input[type="date"]')[1].value).toBe('')
    await click(button('Guardar'))
    expect(storageService.updateCare).toHaveBeenCalledWith(
      'care-0',
      expect.objectContaining({ followUpReminder: undefined }),
      expect.any(String)
    )
    expect(storageService.saveEvent).not.toHaveBeenCalled()
  })
})

describe('F036/M015 — sugerencia en el formulario individual compartido', () => {
  it('envía detalles e idioma, deja editar la sugerencia y no guarda al solicitarla', async () => {
    const previousConfig = useAppStore.getState().config
    const suggest = vi
      .fn()
      .mockResolvedValue({
        date: new Date(2026, 10, 3, 12).getTime(),
        description: 'Revisar individual',
      })
    vi.spyOn(aiFactory, 'createAIService').mockResolvedValue({
      suggestReminder: suggest,
    } as unknown as AIService)
    useAppStore.setState({ config: { ...previousConfig!, encryptedApiKey: 'test-config' } })
    try {
      cares[0] = { ...cares[0], type: 'fertilizing', specificFields: { product: 'Solo producto' } }
      await render('/bonsai/tree/care/care-0')
      await click(button('Sugerir con IA'))
      expect(suggest).toHaveBeenCalledWith(
        expect.objectContaining({ specificFields: { product: 'Solo producto' } }),
        expect.objectContaining({ bonsai }),
        'es'
      )
      expect(storageService.updateCare).not.toHaveBeenCalled()
      expect(host.querySelector('input[value="Revisar individual"]')).not.toBeNull()
      await click(button('Quitar recordatorio'))
      await click(button('Guardar'))
      expect(storageService.updateCare).toHaveBeenCalledWith(
        'care-0',
        expect.objectContaining({
          followUpReminder: undefined,
          specificFields: { product: 'Solo producto' },
        }),
        expect.any(String)
      )
    } finally {
      await act(async () => useAppStore.setState({ config: previousConfig }))
    }
  })
})
