import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import Inventory from '../pages/Inventory'
import { storageService } from '../services/storage/DexieStorageService'
import { useBonsaiStore } from '../store/bonsaiStore'
import i18n from '../i18n'
import type { Bonsai } from '../db/schema'

const trees: Bonsai[] = [
  {
    id: 'living',
    name: 'Vivo Ficus',
    species: 'Ficus retusa',
    commonName: 'Ficus',
    status: 'developing',
    tags: ['grupo'],
    style: 'chokkan',
    size: 'shohin',
    createdAt: 1,
    updatedAt: 1,
  },
  {
    id: 'dead',
    name: 'Fallecido Ficus',
    species: 'Ficus retusa',
    commonName: 'Ficus',
    status: 'dead',
    tags: ['grupo'],
    style: 'chokkan',
    size: 'shohin',
    createdAt: 1,
    updatedAt: 1,
  },
  {
    id: 'recovery',
    name: 'Vivo Olmo',
    species: 'Ulmus parvifolia',
    commonName: 'Olmo',
    status: 'recovery',
    tags: ['otro'],
    style: 'moyogi',
    createdAt: 1,
    updatedAt: 1,
  },
  {
    id: 'donated',
    name: 'Donado Ficus',
    species: 'Ficus retusa',
    commonName: 'Ficus',
    status: 'donated',
    tags: ['otro'],
    style: 'chokkan',
    createdAt: 1,
    updatedAt: 1,
  },
]
let host: HTMLDivElement, root: Root
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
  vi.spyOn(storageService, 'getEventsByDateRange').mockResolvedValue([])
  vi.spyOn(storageService, 'getCaresByBonsai').mockResolvedValue([])
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.restoreAllMocks()
})
async function render(list = trees) {
  vi.mocked(storageService.getBonsaiList).mockResolvedValue(list)
  useBonsaiStore.setState({ bonsais: list })
  await act(async () =>
    root.render(
      <MemoryRouter>
        <Inventory />
      </MemoryRouter>
    )
  )
}
function button(text: string, scope: ParentNode = host) {
  const result = [...scope.querySelectorAll('button')].find(
    (item) => item.textContent?.trim() === text || item.getAttribute('aria-label') === text
  )
  expect(result, text).toBeDefined()
  return result!
}
async function click(element: HTMLElement) {
  await act(async () => element.click())
}
function shown() {
  return trees
    .filter((tree) =>
      [...host.querySelectorAll('button')].some((item) => item.textContent?.startsWith(tree.name))
    )
    .map((tree) => tree.id)
}
async function open() {
  await click(button(i18n.t('inventory.advancedFilters')))
  return host.querySelector('[role="dialog"]')!
}
function check() {
  return host.querySelector<HTMLInputElement>('[role="dialog"] input[type="checkbox"]')!
}
async function apply() {
  await click(button('Aplicar', host.querySelector('[role="dialog"]')!))
}

describe('F037 — visibilidad de fallecidos en Mi Colección', () => {
  it('oculta solo fallecidos en grilla y lista y conserva la colección completa en el store', async () => {
    await render()
    expect(shown()).toEqual(['living', 'recovery', 'donated'])
    await click(button('List view'))
    expect(shown()).toEqual(['living', 'recovery', 'donated'])
    expect(useBonsaiStore.getState().bonsais).toEqual(trees)
    await click(button('Grid view'))
    expect(shown()).toHaveLength(3)
  })
  it('muestra fallecidos al aplicar el check y permite reabrir y desactivar con filtros activos', async () => {
    await render()
    await open()
    expect(check().checked).toBe(false)
    await click(check())
    await apply()
    expect(shown()).toHaveLength(4)
    expect(button('Filtros avanzados').textContent).toBe('1')
    await open()
    expect(check().checked).toBe(true)
    await click(check())
    await apply()
    expect(shown()).not.toContain('dead')
    expect(button('Filtros avanzados').textContent).toBe('')
  })
  it('al elegir solo Fallecido activa el check y cuenta un único grupo en el badge', async () => {
    await render()
    let panel = await open()
    await click(button('Fallecido', panel))
    expect(check().checked).toBe(true)
    await apply()
    expect(shown()).toEqual(['dead'])
    expect(button('Filtros avanzados').textContent).toBe('1')
    panel = await open()
    await click(check())
    expect(button('Fallecido', panel).getAttribute('aria-pressed')).toBe('false')
    await apply()
    expect(shown()).toEqual(['living', 'recovery', 'donated'])
  })
  it('al desmarcar retira solo el estado fallecido y conserva los otros estados elegidos', async () => {
    await render()
    let panel = await open()
    await click(button('En desarrollo', panel))
    await click(button('Fallecido', panel))
    await apply()
    expect(shown()).toEqual(['living', 'dead'])
    panel = await open()
    await click(check())
    expect(button('En desarrollo', panel).getAttribute('aria-pressed')).toBe('true')
    await apply()
    expect(shown()).toEqual(['living'])
  })
  it('combina visibilidad con búsqueda, especie, etiqueta, estilo y tamaño; limpiar vuelve a ocultar', async () => {
    await render()
    const search = host.querySelector<HTMLInputElement>('input[placeholder="Buscar..."]')!
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(
        search,
        'ficus'
      )
      search.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await click(button('Ficus'))
    await click(button('# grupo'))
    let panel = await open()
    await click(check())
    await click(
      [...panel.querySelectorAll('button')].find((item) => item.textContent?.startsWith('Chokkan'))!
    )
    await click(
      [...panel.querySelectorAll('button')].find((item) => item.textContent?.startsWith('Shohin'))!
    )
    await apply()
    expect(shown()).toEqual(['living', 'dead'])
    expect(button('Filtros avanzados').textContent).toBe('3')
    panel = await open()
    await click(button('Limpiar', panel))
    expect(shown()).toEqual(['living'])
    expect(search.value).toBe('ficus')
    expect(button('Filtros avanzados').textContent).toBe('')
    await open()
    expect(check().checked).toBe(false)
  })
  it('cerrar el panel sin aplicar descarta el cambio del check', async () => {
    await render()
    const panel = await open()
    await click(check())
    await click(button('Cerrar', panel))
    expect(shown()).not.toContain('dead')
    await open()
    expect(check().checked).toBe(false)
  })
  it('con solo fallecidos muestra sin resultados y permite abrir filtros para recuperarlos', async () => {
    await render([trees[1]])
    expect(shown()).toEqual([])
    expect(host.textContent).toContain(i18n.t('common.noResults'))
    expect(host.textContent).not.toContain(i18n.t('inventory.empty'))
    expect(host.textContent).toContain(i18n.t('inventory.deceasedHidden'))
    await click(button('Abrir filtros'))
    await click(check())
    await apply()
    expect(shown()).toEqual(['dead'])
  })
  it('una colección sin registros conserva su estado vacío y el alta inicial', async () => {
    await render([])
    expect(host.textContent).toContain(i18n.t('inventory.empty'))
    expect(button(i18n.t('inventory.addFirst'))).toBeDefined()
    expect(host.textContent).not.toContain(i18n.t('inventory.deceasedHidden'))
  })
  it('traduce el nuevo check al inglés', async () => {
    await i18n.changeLanguage('en')
    await render()
    const panel = await open()
    expect(panel.textContent).toContain('Show deceased trees')
    await click(check())
    await click(button('Apply', panel))
    expect(shown()).toHaveLength(4)
  })
})
