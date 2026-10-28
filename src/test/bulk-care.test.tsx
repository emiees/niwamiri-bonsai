import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import BulkCareForm from '../pages/BulkCareForm'
import { useBonsaiStore } from '../store/bonsaiStore'
import { storageService } from '../services/storage/DexieStorageService'
import i18n from '../i18n'
import * as aiFactory from '../hooks/useAI'
import { useAppStore } from '../store/appStore'
import type { AIService } from '../services/ai/AIService'
import { dateStrToTs } from '../utils/dates'
import type { Bonsai } from '../db/schema'

let host: HTMLDivElement
let root: Root
const trees: Bonsai[] = ['Uno', 'Dos', 'Tres'].map((name, index) => ({
  id: String(index),
  name,
  species: index === 2 ? 'Olmo' : 'Ficus',
  status: index === 2 ? 'dead' : 'developing',
  createdAt: 1,
  updatedAt: 1,
}))
const globals = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
const previous = globals.IS_REACT_ACT_ENVIRONMENT
beforeAll(() => {
  globals.IS_REACT_ACT_ENVIRONMENT = true
})
afterAll(() => {
  globals.IS_REACT_ACT_ENVIRONMENT = previous
})
beforeEach(async () => {
  await i18n.changeLanguage('es')
  useAppStore.setState((state) => ({
    config: state.config ? { ...state.config, encryptedApiKey: undefined } : null,
  }))
  useBonsaiStore.setState({ bonsais: trees, loading: false })
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  vi.spyOn(storageService, 'getBonsaiList').mockResolvedValue(trees)
  vi.spyOn(storageService, 'getCareProducts').mockResolvedValue(['Producto anterior'])
  vi.spyOn(storageService, 'getEventsByDateRange').mockResolvedValue([])
  vi.spyOn(storageService, 'saveBulkCares').mockResolvedValue(['a', 'b'])
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={['/cares/bulk']}>
        <Routes>
          <Route path="/cares/bulk" element={<BulkCareForm />} />
          <Route path="/" element={<p>Colección guardada</p>} />
        </Routes>
      </MemoryRouter>
    )
  )
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.restoreAllMocks()
})
function button(text: string, scope: ParentNode = host) {
  const found = [...scope.querySelectorAll('button')].find(
    (b) => b.textContent?.trim() === text || b.getAttribute('aria-label') === text
  )
  expect(found, text).toBeDefined()
  return found!
}
async function click(element: Element) {
  await act(async () => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}
async function fill(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  await act(async () => {
    const proto =
      element instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(element, value)
    element.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
function field(text: string) {
  const label = [...host.querySelectorAll('label')].find((l) => l.textContent?.trim() === text)
  expect(label, text).toBeDefined()
  return (
    label!.htmlFor ? document.getElementById(label!.htmlFor) : label!.querySelector('input')
  ) as HTMLInputElement
}
async function start() {
  await click(button('Seleccionar visibles'))
  await click(button('Continuar con 2 árboles'))
}

describe('F033 — flujo masivo', () => {
  it('selecciona visibles, conserva selecciones ocultas y deja incluir árboles inactivos', async () => {
    await fill(host.querySelector('input[type="search"]')!, 'Uno')
    await click(button('Seleccionar visibles'))
    await fill(host.querySelector('input[type="search"]')!, 'Dos')
    expect(host.textContent).toContain('Seleccionados: 1')
    await click(button('Seleccionados: 1'))
    expect(host.textContent).toContain('Uno')
    expect(host.textContent).not.toContain('Dos')
    await click(button('Seleccionados: 1'))
    await fill(host.querySelector('input[type="search"]')!, '')
    await click(host.querySelector('input[type="checkbox"]')!)
    expect(host.textContent).toContain('Tres')
    await click(button('Seleccionar visibles'))
    expect(host.textContent).toContain('Seleccionados: 3')
    await click(button('Quitar selección'))
    expect(button('Continuar con 0 árboles').disabled).toBe(true)
  })
  it('exige estado explícito y guarda datos comunes solo tras revisar', async () => {
    await start()
    await click(button('Revisar cuidados'))
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('Elegí el estado')
    expect(storageService.saveBulkCares).not.toHaveBeenCalled()
    await click(button('Bien'))
    await fill(field('Producto'), 'Abono común')
    await fill(field('Dosis de producto'), '2,5')
    await select(field('Unidad de Dosis de producto') as unknown as HTMLSelectElement, 'ml/L')
    await fill(host.querySelector('textarea')!, 'Mismo cuidado')
    await click(button('Revisar cuidados'))
    expect(host.textContent).toContain('Dosis de producto: 2.5 ml/L')
    expect(storageService.saveBulkCares).not.toHaveBeenCalled()
    await click(button('Guardar en 2 árboles'))
    expect(storageService.saveBulkCares).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'fertilizing',
        specificFields: { product: 'Abono común', dose: 2.5, doseUnit: 'ml/L' },
        recipients: trees.slice(0, 2).map((tree) => ({
          bonsaiId: tree.id,
          treeCondition: 'good',
          description: 'Mismo cuidado',
        })),
      })
    )
    expect(host.textContent).toBe('Colección guardada')
  })
  it('mantiene excepciones por árbol al cancelar el cambio de modo y volver de la selección', async () => {
    await start()
    await click(button('Bien'))
    await fill(host.querySelector('textarea')!, 'Común')
    await click(button('Por árbol'))
    const second = host.querySelectorAll('details')[1]
    await click(button('Regular', second))
    await fill(second.querySelector('textarea')!, 'Excepción')
    await click(button('Iguales para todos'))
    await click(button('Cancelar', host.querySelector('[role="alertdialog"]')!))
    expect(host.querySelectorAll('details')).toHaveLength(2)
    await click(button('Editar selección (2)'))
    await click(button('Continuar con 2 árboles'))
    expect(host.querySelectorAll('details')[1].querySelector('textarea')!.value).toBe('Excepción')
    await click(button('Revisar cuidados'))
    await click(button('Guardar en 2 árboles'))
    expect(storageService.saveBulkCares).toHaveBeenCalledWith(
      expect.objectContaining({
        recipients: [
          { bonsaiId: '0', treeCondition: 'good', description: 'Común' },
          { bonsaiId: '1', treeCondition: 'regular', description: 'Excepción' },
        ],
      })
    )
  })
  it('confirma reemplazar diferencias antes de volver al modo común', async () => {
    await start()
    await click(button('Bien'))
    await click(button('Por árbol'))
    await click(button('Regular', host.querySelectorAll('details')[1]))
    await click(button('Iguales para todos'))
    await click(button('Iguales para todos', host.querySelector('[role="alertdialog"]')!))
    expect(host.querySelectorAll('details')).toHaveLength(0)
    await click(button('Revisar cuidados'))
    await click(button('Guardar en 2 árboles'))
    expect(
      vi
        .mocked(storageService.saveBulkCares)
        .mock.calls[0][0].recipients.every((row) => row.treeCondition === 'good')
    ).toBe(true)
  })
  it('conserva el borrador ante fallos y bloquea un doble envío', async () => {
    await start()
    await click(button('Bien'))
    await fill(host.querySelector('textarea')!, 'Conservar')
    await click(button('Revisar cuidados'))
    vi.mocked(storageService.saveBulkCares).mockRejectedValueOnce(new Error('fallo'))
    await click(button('Guardar en 2 árboles'))
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('borrador se conserva')
    await click(button('Volver a editar'))
    expect(host.querySelector('textarea')!.value).toBe('Conservar')
    await click(button('Revisar cuidados'))
    let finish!: (ids: string[]) => void
    vi.mocked(storageService.saveBulkCares).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        })
    )
    const save = button('Guardar en 2 árboles')
    await act(async () => {
      save.click()
      save.click()
    })
    expect(storageService.saveBulkCares).toHaveBeenCalledTimes(2)
    await act(async () => finish(['a', 'b']))
  })
})

async function select(element: HTMLSelectElement, value: string) {
  await act(async () => {
    element.value = value
    element.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

describe('B027/B029/F036 — pasos y seguimiento masivo', () => {
  it('restablece ventana, main y foco solo al cambiar de paso', async () => {
    const main = host.querySelector('main')!
    main.scrollTop = 800
    document.documentElement.scrollTop = 800
    await start()
    expect(main.scrollTop).toBe(0)
    expect(document.documentElement.scrollTop).toBe(0)
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'auto' })
    expect(document.activeElement?.textContent).toContain('Paso 2')
    const calls = vi.mocked(window.scrollTo).mock.calls.length
    await fill(field('Producto'), 'Mantener')
    expect(window.scrollTo).toHaveBeenCalledTimes(calls)
    await click(button('Bien'))
    main.scrollTop = 900
    await click(button('Revisar cuidados'))
    expect(main.scrollTop).toBe(0)
    main.scrollTop = 900
    await click(button('Volver a editar'))
    expect(main.scrollTop).toBe(0)
    expect(field('Producto').value).toBe('Mantener')
  })
  it('guarda solo producto por árbol, exige completar el seguimiento o quitarlo', async () => {
    await start()
    await click(button('Bien'))
    await fill(field('Producto'), 'Solo producto')
    const reminder = host.querySelectorAll<HTMLInputElement>('input[type="date"]')[1]
    await fill(reminder, '2026-11-03')
    await click(button('Revisar cuidados'))
    expect(storageService.saveBulkCares).not.toHaveBeenCalled()
    expect(host.textContent).toContain('quitá el recordatorio')
    await click(button('Quitar recordatorio'))
    await click(button('Revisar cuidados'))
    await click(button('Guardar en 2 árboles'))
    expect(storageService.saveBulkCares).toHaveBeenCalledWith(
      expect.objectContaining({
        specificFields: { product: 'Solo producto' },
        followUpReminder: undefined,
      })
    )
  })
  it('pide una sola sugerencia editable para todas las especies, sin guardar hasta confirmar', async () => {
    const suggest = vi
      .fn()
      .mockResolvedValue({ date: dateStrToTs('2026-11-03'), description: 'Revisar el conjunto' })
    vi.spyOn(aiFactory, 'createAIService').mockResolvedValue({
      suggestBulkReminder: suggest,
    } as unknown as AIService)
    await act(async () =>
      useAppStore.setState((state) => ({
        config: { ...state.config!, encryptedApiKey: 'test-config' },
      }))
    )
    await click(host.querySelector('input[type="checkbox"]')!)
    await click(button('Seleccionar visibles'))
    await click(button('Continuar con 3 árboles'))
    await click(button('Regular'))
    await fill(field('Producto'), 'Abono de prueba')
    await click(button('Sugerir con IA'))
    expect(suggest).toHaveBeenCalledTimes(1)
    expect(suggest).toHaveBeenCalledWith(
      expect.objectContaining({
        specificFields: { product: 'Abono de prueba' },
        trees: trees.map((tree) => ({
          id: tree.id,
          name: tree.name,
          species: tree.species,
          status: tree.status,
          condition: 'regular',
          description: '',
        })),
      })
    )
    expect(storageService.saveBulkCares).not.toHaveBeenCalled()
    expect(host.textContent).toContain('Recordatorio común para 3 árboles')
    const description = [...host.querySelectorAll('input')].find(
      (input) => input.value === 'Revisar el conjunto'
    )!
    await fill(description, 'Revisar editado')
    await click(button('Revisar cuidados'))
    await click(button('Guardar en 3 árboles'))
    expect(storageService.saveBulkCares).toHaveBeenCalledWith(
      expect.objectContaining({
        followUpReminder: { date: dateStrToTs('2026-11-03'), description: 'Revisar editado' },
      })
    )
  })
})
