import { describe, expect, it } from 'vitest'
import {
  CARE_TYPES,
  decimal,
  detailSummary,
  fieldsFor,
  isValidDay,
  normalizeDetails,
  validateDetails,
} from '../utils/careDetails'
import {
  filterCares,
  EMPTY_CARE_FILTERS,
  invalidCareRange,
  readCareFilters,
} from '../utils/careFilters'
import { seedRecipients, selectTrees } from '../utils/bulkCare'
import { dateStrToTs } from '../utils/dates'
import i18n from '../i18n'
import type { Bonsai, Care } from '../db/schema'

describe('Detalles de cuidados', () => {
  it.each(CARE_TYPES)('%s conserva el registro rápido sin detalles', (type) => {
    expect(fieldsFor(type).length).toBeGreaterThan(0)
    expect(validateDetails(type, {})).toEqual([])
  })
  it('acepta coma decimal, exige unidad y rechaza dosis inválidas', () => {
    expect(decimal('2,5')).toBe(2.5)
    expect(decimal(',5')).toBe(0.5)
    expect(decimal('2.')).toBe(2)
    for (const dose of ['0', '-1', 'Infinity', '2x', '1,2,3'])
      expect(validateDetails('fertilizing', { dose, doseUnit: 'g/L' })).toEqual(['dose'])
    expect(validateDetails('fertilizing', { dose: '2,5' })).toEqual(['dose'])
    expect(
      normalizeDetails('fertilizing', { dose: '2,5', doseUnit: ' g/L ', future: { kept: true } })
    ).toEqual({ dose: 2.5, doseUnit: 'g/L', future: { kept: true } })
  })
  it('normaliza varios calibres sin perder sus zonas ni campos desconocidos', () => {
    const details = {
      material: 'copper',
      wires: [
        { gauge: '1,5', zone: 'ápice', future: 1 },
        { gauge: '2', zone: 'tronco' },
      ],
    }
    expect(validateDetails('wiring', details)).toEqual([])
    expect(normalizeDetails('wiring', details).wires).toEqual([
      { gauge: 1.5, zone: 'ápice', future: 1 },
      { gauge: 2, zone: 'tronco' },
    ])
    expect(validateDetails('wiring', { wires: [{ gauge: '0' }] })).toEqual(['wires'])
  })
  it('limita porcentajes y elimina el porcentaje de defoliación total', () => {
    expect(validateDetails('repotting', { rootPercent: '101' })).toEqual(['rootPercent'])
    expect(validateDetails('defoliation', { extent: 'partial', percent: '0' })).toEqual([])
    expect(normalizeDetails('defoliation', { extent: 'total', percent: 75, future: 1 })).toEqual({
      extent: 'total',
      future: 1,
    })
    expect(isValidDay('2026-02-30')).toBe(false)
    expect(isValidDay('2026-10-27')).toBe(true)
  })
  it('resume producto, dosis y varios calibres con etiquetas traducidas', async () => {
    await i18n.changeLanguage('es')
    expect(
      detailSummary(
        {
          type: 'fertilizing',
          specificFields: { product: 'Producto X', dose: 2.5, doseUnit: 'g/L' },
        },
        i18n.t
      )
    ).toContain('Dosis: 2.5 g/L')
    expect(
      detailSummary(
        {
          type: 'wiring',
          specificFields: { wires: [{ gauge: 1.5, zone: 'ápice' }, { gauge: 2 }] },
        },
        i18n.t
      )
    ).toContain('1.5 mm (ápice), 2 mm')
  })
})

const care = (id: string, date: number, type: Care['type'] = 'watering'): Care => ({
  id,
  date,
  type,
  bonsaiId: 'tree',
  treeCondition: 'good',
  createdAt: 1,
})
describe('Filtros del historial', () => {
  const cares = [
    care('last', new Date(2026, 9, 27, 23, 59).getTime()),
    care('first', new Date(2026, 9, 21, 0, 0).getTime(), 'wiring'),
    care('old', dateStrToTs('2026-10-20')),
    care('future', dateStrToTs('2026-10-28')),
  ]
  it('incluye ambos días completos y límites abiertos', () => {
    expect(
      filterCares(
        cares,
        { ...EMPTY_CARE_FILTERS, period: 'custom', from: '2026-10-21', to: '2026-10-27' },
        new Set(),
        () => true
      ).map((c) => c.id)
    ).toEqual(['last', 'first'])
    expect(
      filterCares(
        cares,
        { ...EMPTY_CARE_FILTERS, period: 'custom', to: '2026-10-20' },
        new Set(),
        () => true
      ).map((c) => c.id)
    ).toEqual(['old'])
  })
  it('los últimos siete días incluyen hoy y excluyen el futuro', () => {
    expect(
      filterCares(
        cares,
        { ...EMPTY_CARE_FILTERS, period: '7' },
        new Set(),
        () => true,
        dateStrToTs('2026-10-27')
      ).map((c) => c.id)
    ).toEqual(['last', 'first'])
  })
  it('cuenta días de calendario a través de un cambio de horario', () => {
    const rows = [
      care('inside', new Date(2026, 2, 3, 0, 1).getTime()),
      care('outside', new Date(2026, 2, 2, 23, 59).getTime()),
    ]
    expect(
      filterCares(
        rows,
        { ...EMPTY_CARE_FILTERS, period: '7' },
        new Set(),
        () => true,
        new Date(2026, 2, 9, 12).getTime()
      ).map((c) => c.id)
    ).toEqual(['inside'])
  })
  it('combina OR entre tipos y AND entre fotos, fechas y búsqueda', () => {
    const filters = {
      ...EMPTY_CARE_FILTERS,
      types: ['watering', 'wiring'] as Care['type'][],
      photos: 'with' as const,
    }
    expect(
      filterCares(cares, filters, new Set(['first', 'last']), (c) => c.id === 'first').map(
        (c) => c.id
      )
    ).toEqual(['first'])
    expect(
      filterCares(cares, { ...filters, photos: 'without' }, new Set(['first', 'last']), () => true)
    ).toHaveLength(2)
  })
  it('rechaza rangos invertidos o inválidos y limpia parámetros desconocidos', () => {
    expect(
      invalidCareRange({
        ...EMPTY_CARE_FILTERS,
        period: 'custom',
        from: '2026-10-28',
        to: '2026-10-27',
      })
    ).toBe(true)
    expect(invalidCareRange({ ...EMPTY_CARE_FILTERS, period: 'custom', from: '2026-02-30' })).toBe(
      true
    )
    expect(
      readCareFilters(new URLSearchParams('type=wiring&type=bad&type=wiring&period=bad&photos=bad'))
    ).toEqual({ ...EMPTY_CARE_FILTERS, types: ['wiring'] })
  })
})

describe('Selección y borradores masivos', () => {
  it('mantiene excepciones, no duplica árboles y hereda valores en nuevas selecciones', () => {
    expect(
      seedRecipients(
        ['a', 'a', 'b'],
        { a: { condition: 'regular', description: 'excepción' } },
        { condition: 'good', description: 'común' }
      )
    ).toEqual({
      a: { condition: 'regular', description: 'excepción' },
      b: { condition: 'good', description: 'común' },
    })
  })
  it('combina especie y todas las etiquetas y excluye inactivos salvo elección explícita', () => {
    const trees = [
      { id: 'a', name: 'Uno', species: 'Ficus', status: 'developing', tags: ['x', 'y'] },
      { id: 'b', name: 'Dos', species: 'Ficus', status: 'dead', tags: ['x'] },
    ] as Bonsai[]
    expect(selectTrees(trees, 'ficus', ['Ficus'], ['x'], false).map((b) => b.id)).toEqual(['a'])
    expect(selectTrees(trees, '', [], ['x', 'y'], true).map((b) => b.id)).toEqual(['a'])
    expect(selectTrees(trees, '', [], [], true)).toHaveLength(2)
  })
})
