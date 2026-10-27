import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import BulkCareForm from '../pages/BulkCareForm'
import { useBonsaiStore } from '../store/bonsaiStore'
import { storageService } from '../services/storage/DexieStorageService'
import i18n from '../i18n'
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
  useBonsaiStore.setState({ bonsais: trees, loading: false })
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
    await fill(field('Dosis'), '2,5')
    await fill(host.querySelector('[aria-label="Unidad de Dosis"]')!, 'ml/L')
    await fill(host.querySelector('textarea')!, 'Mismo cuidado')
    await click(button('Revisar cuidados'))
    expect(host.textContent).toContain('Dosis: 2.5 ml/L')
    expect(storageService.saveBulkCares).not.toHaveBeenCalled()
    await click(button('Guardar en 2 árboles'))
    expect(storageService.saveBulkCares).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'fertilizing',
        specificFields: { product: 'Abono común', dose: 2.5, doseUnit: 'ml/L' },
        recipients: trees
          .slice(0, 2)
          .map((tree) => ({
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
