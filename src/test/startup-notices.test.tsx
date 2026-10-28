import { act, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import WelcomeScreen from '../components/WelcomeScreen'
import { APP_VERSION } from '../utils/appVersion'
import { useAppStore } from '../store/appStore'
import { useBonsaiStore } from '../store/bonsaiStore'
import { storageService } from '../services/storage/DexieStorageService'
import i18n from '../i18n'

const counts = vi.hoisted(() => ({ cares: 0, photos: 0, notes: 0 }))
vi.mock('../db/schema', () => {
  const table = (key: keyof typeof counts) => ({
    where: () => ({ above: () => ({ count: async () => counts[key] }) }),
  })
  return { db: { cares: table('cares'), photos: table('photos'), classNotes: table('notes') } }
})
vi.mock('../services/storage/DexieStorageService', () => ({
  storageService: { getEventsByDateRange: vi.fn().mockResolvedValue([]) },
}))

const approvedBullets = [
  'Árboles fallecidos ocultos por defecto, con opción para mostrarlos desde filtros.',
  'Cuidados de fertilización con dosis opcional y selectores de unidades.',
  'Recordatorios sugeridos desde cuidados masivos con sugerencias de IA y opción para quitarlos.',
  'Corrección de errores.',
]
const VERSION_KEY = 'niwamiri_last_seen_version'
const SESSION_KEY = 'niwamiri_welcome_shown'
let host: HTMLDivElement, root: Root
const globals = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
const previous = globals.IS_REACT_ACT_ENVIRONMENT
beforeAll(() => { globals.IS_REACT_ACT_ENVIRONMENT = true })
afterAll(() => { globals.IS_REACT_ACT_ENVIRONMENT = previous })
beforeEach(async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-28T12:00:00'))
  localStorage.clear()
  sessionStorage.clear()
  counts.cares = counts.photos = counts.notes = 0
  vi.mocked(storageService.getEventsByDateRange).mockResolvedValue([])
  useAppStore.getState().updateConfig({ lastBackupAt: 1 })
  useBonsaiStore.setState({ bonsais: [] })
  await i18n.changeLanguage('es')
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

function Location() { return <output>{useLocation().pathname}</output> }
async function render() {
  await act(async () => root.render(
    <StrictMode><MemoryRouter><WelcomeScreen /><Location /></MemoryRouter></StrictMode>
  ))
}
async function reload() {
  await act(async () => root.unmount())
  root = createRoot(host)
  await render()
}
function button(prefix: string) {
  const found = [...host.querySelectorAll('button')].find((b) => b.textContent?.startsWith(prefix))
  expect(found, prefix).toBeDefined()
  return found!
}
async function click(prefix: string) { await act(async () => button(prefix).click()) }
async function seconds(amount: number) {
  for (let i = 0; i < amount; i++) await act(async () => { vi.advanceTimersByTime(1000) })
}
function heading() { return host.querySelector('h2')?.textContent }

describe('F038 — novedades y bienvenida encadenadas', () => {
  it('muestra el texto exacto aprobado, sin marcarlo como leído ni consumir el temporizador', async () => {
    await render()
    expect(heading()).toBe('Novedades de esta versión')
    expect([...host.querySelectorAll('li')].map((li) => li.textContent)).toEqual(approvedBullets)
    expect(host.textContent).toContain(`v${APP_VERSION}`)
    expect(localStorage.getItem(VERSION_KEY)).toBeNull()
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull()
    await seconds(30)
    expect(heading()).toBe('Novedades de esta versión')
    expect(document.activeElement).toBe(button('Continuar'))
    await click('Continuar')
    expect(localStorage.getItem(VERSION_KEY)).toBe(APP_VERSION)
    expect(host.querySelectorAll('[role="dialog"]')).toHaveLength(1)
    expect(host.querySelector('ul')).toBeNull()
    expect(button('Entrar').textContent).toBe('Entrar (10)')
    await seconds(9)
    expect(button('Entrar').textContent).toBe('Entrar (1)')
    await seconds(1)
    expect(host.querySelector('[role="dialog"]')).toBeNull()
  })

  it('recargar antes de Continuar conserva las novedades sin reconocerlas', async () => {
    await render()
    await reload()
    expect(heading()).toBe('Novedades de esta versión')
    expect(localStorage.getItem(VERSION_KEY)).toBeNull()
  })

  it('tras reconocerlas no las repite en la sesión ni en una sesión nueva', async () => {
    await render()
    await click('Continuar')
    await click('Entrar')
    await reload()
    expect(host.querySelector('[role="dialog"]')).toBeNull()
    sessionStorage.clear()
    await reload()
    expect(button('Entrar').textContent).toBe('Entrar (10)')
    expect(host.querySelector('ul')).toBeNull()
  })

  it.each(['1.4.0', '1.0.0'])('una versión vista %s no suprime la actual aunque la sesión ya tenga bienvenida', async (seen) => {
    localStorage.setItem(VERSION_KEY, seen)
    sessionStorage.setItem(SESSION_KEY, '1')
    await render()
    expect(heading()).toBe('Novedades de esta versión')
    expect(host.querySelectorAll('li')).toHaveLength(4)
    await click('Continuar')
    expect(localStorage.getItem(VERSION_KEY)).toBe(APP_VERSION)
    expect(button('Entrar').textContent).toBe('Entrar (10)')
  })

  it('la versión ya vista muestra solo bienvenida y mantiene el cierre manual', async () => {
    localStorage.setItem(VERSION_KEY, APP_VERSION)
    await render()
    expect(host.querySelector('ul')).toBeNull()
    await click('Entrar')
    expect(host.querySelector('[role="dialog"]')).toBeNull()
  })

  it('con alerta de backup la bienvenida no se cierra y el acceso navega', async () => {
    counts.cares = 4
    await render()
    await click('Continuar')
    expect(button('Entrar').textContent).toBe('Entrar')
    await seconds(15)
    expect(host.querySelector('[role="dialog"]')).not.toBeNull()
    await click('Hacer backup')
    expect(host.querySelector('[role="dialog"]')).toBeNull()
    expect(host.querySelector('output')?.textContent).toBe('/settings/backup')
  })

  it('con colección sin backup conserva el aviso y la suspensión del temporizador', async () => {
    useAppStore.getState().updateConfig({ lastBackupAt: undefined })
    useBonsaiStore.setState({ bonsais: [{ id: 'tree', name: 'Ficus', species: 'Ficus', status: 'developing', tags: [], createdAt: 1, updatedAt: 1 }] })
    await render()
    await click('Continuar')
    expect(button('Tu colección no tiene backup')).toBeDefined()
    await seconds(15)
    expect(button('Entrar').textContent).toBe('Entrar')
  })

  it('conserva el acceso a calendario desde la bienvenida posterior', async () => {
    vi.mocked(storageService.getEventsByDateRange).mockResolvedValue([
      { id: 'event', bonsaiId: 'tree', type: 'care', title: 'Riego', careType: 'watering', date: 1, completed: false, createdAt: 1 },
    ])
    await render()
    await click('Continuar')
    await click('1 cuidado vencido')
    expect(host.querySelector('output')?.textContent).toBe('/calendar')
    expect(host.querySelector('[role="dialog"]')).toBeNull()
  })

  it('traduce las novedades y la secuencia al inglés', async () => {
    await i18n.changeLanguage('en')
    await render()
    expect(heading()).toBe('What’s new in this version')
    expect(host.querySelectorAll('li')).toHaveLength(4)
    expect(host.textContent).toContain('Fertilization care with optional doses and unit selectors.')
    await click('Continue')
    expect(button('Enter').textContent).toBe('Enter (10)')
  })

  it('mantiene el foco dentro del modal y lo devuelve al control anterior al cerrar', async () => {
    const previousButton = document.createElement('button')
    document.body.append(previousButton)
    previousButton.focus()
    await render()
    const next = button('Continuar')
    await act(async () => { next.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })) })
    expect(document.activeElement).toBe(next)
    await click('Continuar')
    expect(document.activeElement).toBe(button('Entrar'))
    await click('Entrar')
    expect(document.activeElement).toBe(previousButton)
    previousButton.remove()
  })

  it('si el navegador bloquea la persistencia permite completar los dos pasos', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Bloqueado') })
    await render()
    await click('Continuar')
    await click('Entrar')
    expect(host.querySelector('[role="dialog"]')).toBeNull()
  })
})
