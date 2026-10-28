import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { CareDetailsFields, ReminderFields } from '../components/care/CareFields'
import { useReminderSuggestion } from '../hooks/useReminderSuggestion'
import type { CareType } from '../db/schema'
import type { DetailDraft } from '../utils/careDetails'
import type { ReminderSuggestion } from '../services/ai/AIService'
import i18n from '../i18n'

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
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
})
async function render(element: React.ReactNode) {
  await act(async () => root.render(element))
}
async function click(text: string) {
  const button = [...host.querySelectorAll('button')].find(
    (button) => button.textContent?.trim() === text
  )!
  expect(button, text).toBeDefined()
  await act(async () => button.click())
}
async function fill(labelText: string, value: string) {
  const label = [...host.querySelectorAll('label')].find(
    (label) => label.textContent?.trim() === labelText
  )!
  expect(label, labelText).toBeDefined()
  const element = (
    label.htmlFor ? document.getElementById(label.htmlFor) : label.querySelector('input')
  ) as HTMLInputElement | HTMLSelectElement
  await act(async () => {
    const proto =
      element instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(element, value)
    element.dispatchEvent(
      new Event(element instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true })
    )
  })
}
function Details({
  initial = {},
  type = 'fertilizing',
}: {
  initial?: DetailDraft
  type?: CareType
}) {
  const [value, setValue] = useState(initial)
  return (
    <>
      <CareDetailsFields type={type} value={value} onChange={setValue} products={[]} />
      <output>{JSON.stringify(value)}</output>
    </>
  )
}
function snapshot() {
  return JSON.parse(host.querySelector('output')!.textContent!)
}

describe('M015/B028 — cantidades y unidad seleccionable', () => {
  it('permite solo producto y no muestra una segunda cantidad por defecto', async () => {
    await render(<Details />)
    await fill('Producto', 'Mi producto')
    expect(snapshot()).toEqual({ product: 'Mi producto' })
    expect(host.textContent).not.toContain('Agregar volumen aplicado')
    expect(host.querySelectorAll('select')).toHaveLength(3) // presentación, unidad de dosis y método
    expect(
      [...host.querySelectorAll('option')].some((option) => option.textContent === 'Otra unidad')
    ).toBe(true)
  })
  it('solo ofrece el volumen adicional para concentraciones y conserva decimales libres', async () => {
    await render(<Details />)
    await fill('Dosis de producto', '2,5')
    await fill('Unidad de Dosis de producto', 'ml/L')
    await click('Agregar volumen aplicado por árbol (opcional)')
    await fill('Cantidad de preparado aplicada por árbol', '500')
    await fill('Unidad de Cantidad de preparado aplicada por árbol', 'ml/tree')
    expect(snapshot()).toEqual({
      dose: '2,5',
      doseUnit: 'ml/L',
      amount: '500',
      amountUnit: 'ml/tree',
    })
    await click('Quitar cantidad aplicada')
    await fill('Unidad de Dosis de producto', 'g/tree')
    expect(host.textContent).not.toContain('Agregar volumen aplicado')
    expect(snapshot()).toEqual({ dose: '2,5', doseUnit: 'g/tree' })
  })
  it('acepta otra unidad y recupera cantidades y campos históricos sin ocultarlos', async () => {
    await render(
      <Details
        initial={{
          product: 'Anterior',
          dose: 3,
          doseUnit: 'cucharadas/maceta',
          amount: 10,
          amountUnit: 'g/tree',
          future: { kept: true },
        }}
      />
    )
    expect(host.querySelector<HTMLInputElement>('input[value="cucharadas/maceta"]')).not.toBeNull()
    expect(host.querySelector<HTMLInputElement>('input[value="10"]')).not.toBeNull()
    await fill('Unidad personalizada de Dosis de producto', 'gotas/L')
    expect(snapshot()).toMatchObject({
      dose: 3,
      doseUnit: 'gotas/L',
      amount: 10,
      amountUnit: 'g/tree',
      future: { kept: true },
    })
    await fill('Unidad de Dosis de producto', 'ml/L')
    expect(host.querySelector('input[value="gotas/L"]')).toBeNull()
    await fill('Unidad de Dosis de producto', '__custom__')
    await fill('Unidad personalizada de Dosis de producto', 'mg/L')
    expect(snapshot().doseUnit).toBe('mg/L')
  })
})

let resolveRequest: (value: ReminderSuggestion) => void
function Reminder({ context = 'first', reject = false }: { context?: string; reject?: boolean }) {
  const [date, setDate] = useState('2026-11-01')
  const [description, setDescription] = useState('Original')
  const suggestion = useReminderSuggestion(context)
  return (
    <ReminderFields
      date={date}
      description={description}
      canSuggest
      suggesting={suggestion.suggesting}
      suggestionError={suggestion.suggestionError}
      onDate={(value) => {
        suggestion.invalidate()
        setDate(value)
      }}
      onDescription={(value) => {
        suggestion.invalidate()
        setDescription(value)
      }}
      onClear={() => {
        suggestion.invalidate()
        setDate('')
        setDescription('')
      }}
      onSuggest={() =>
        suggestion.suggest(
          () =>
            reject
              ? Promise.reject(new Error('network'))
              : new Promise((resolve) => {
                  resolveRequest = resolve
                }),
          (result) => {
            setDate('2026-11-10')
            setDescription(result.description)
          }
        )
      }
    />
  )
}
const valid = { date: new Date(2026, 10, 10, 12).getTime(), description: 'Nueva sugerencia' }
describe('B029/F036 — recordatorio compartido y respuestas tardías', () => {
  it('comparte el título de Detalles y mantiene la fecha vacía con altura y ancho declarados', async () => {
    await render(
      <>
        <Details />
        <Reminder />
      </>
    )
    const titles = host.querySelectorAll('section h2')
    expect(titles).toHaveLength(2)
    expect(titles[0].className).toBe(titles[1].className)
    await click('Quitar recordatorio')
    const input = host.querySelector<HTMLInputElement>('input[type="date"]')!
    expect(input.value).toBe('')
    expect(input.className).toContain('min-h-[44px]')
    expect(input.className).toContain('w-full')
    expect(host.querySelector('input[value="Original"]')).toBeNull()
  })
  it('no restaura un recordatorio quitado mientras esperaba la IA', async () => {
    await render(<Reminder />)
    await click('Sugerir con IA')
    await click('Quitar recordatorio')
    await act(async () => resolveRequest(valid))
    expect(host.querySelector<HTMLInputElement>('input[type="date"]')!.value).toBe('')
    expect(host.textContent).not.toContain('Quitar recordatorio')
  })
  it('no sobrescribe una edición manual mientras esperaba la IA', async () => {
    await render(<Reminder />)
    await click('Sugerir con IA')
    await fill('Descripción del recordatorio', 'Editado manualmente')
    await act(async () => resolveRequest(valid))
    expect(host.querySelector('input[value="Editado manualmente"]')).not.toBeNull()
  })
  it('cancela al cambiar contexto y permite volver a pedir sin quedar cargando', async () => {
    await render(<Reminder />)
    await click('Sugerir con IA')
    const oldResolve = resolveRequest
    await render(<Reminder context="second" />)
    await render(<Reminder />)
    expect(host.querySelector<HTMLButtonElement>('button')!.disabled).toBe(false)
    await act(async () => oldResolve(valid))
    expect(host.querySelector('input[value="Original"]')).not.toBeNull()
    await click('Sugerir con IA')
    await act(async () => resolveRequest(valid))
    expect(host.querySelector('input[value="Nueva sugerencia"]')).not.toBeNull()
  })
  it('muestra errores sin borrar lo escrito y permite reintentar', async () => {
    await render(<Reminder reject />)
    await click('Sugerir con IA')
    expect(host.querySelector('[role="alert"]')).not.toBeNull()
    expect(host.querySelector('input[value="Original"]')).not.toBeNull()
    await render(<Reminder />)
    await click('Sugerir con IA')
    await act(async () => resolveRequest(valid))
    expect(host.querySelector('[role="alert"]')).toBeNull()
  })
})
