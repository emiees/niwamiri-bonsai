import type { TFunction } from 'i18next'
import type { Care, CareType } from '@/db/schema'
import type { CareDetailsByType } from '@/types/careDetails'
import { dateStrToTs, tsToDateStr } from './dates'

export const CARE_TYPES: CareType[] = [
  'watering',
  'fertilizing',
  'maintenance-pruning',
  'structural-pruning',
  'wiring',
  'wire-removal',
  'repotting',
  'root-pruning',
  'defoliation',
  'pest-treatment',
  'jin-shari',
  'relocation',
  'observation',
  'other',
]
export const CARE_ICONS: Record<CareType, string> = {
  watering: '💧',
  fertilizing: '🌿',
  'maintenance-pruning': '✂️',
  'structural-pruning': '🌳',
  wiring: '🔗',
  'wire-removal': '📎',
  repotting: '🪴',
  'root-pruning': '🌱',
  defoliation: '🍃',
  'pest-treatment': '🐛',
  'jin-shari': '🪵',
  relocation: '📍',
  observation: '👁️',
  other: '📝',
}
export type DetailDraft = Record<string, unknown>
type Field = {
  key: string
  kind?: 'number' | 'date' | 'product' | 'wires'
  options?: string[]
  unit?: string
  units?: string[]
  positive?: boolean
  max?: number
}
type FieldsFor<K extends CareType> = (Field & {
  key: Extract<keyof CareDetailsByType[K], string>
})[]
const dose: Field & { key: 'dose' } = {
  key: 'dose',
  kind: 'number',
  positive: true,
  unit: 'doseUnit',
  units: ['ml/L', 'g/L', 'ml/tree', 'g/tree'],
}
const zone = { key: 'zone' } as const
const goal = { key: 'goal' } as const
const intensity = { key: 'intensity', options: ['light', 'medium', 'strong'] } as const
const material = { key: 'material', options: ['aluminum', 'copper', 'other'] }
export const DETAIL_FIELDS = {
  watering: [
    { key: 'method', options: ['can', 'immersion', 'spray', 'other'] },
    { key: 'volume', kind: 'number', unit: 'volumeUnit', units: ['ml', 'L'] },
    { key: 'drainage' },
  ],
  fertilizing: [
    { key: 'product', kind: 'product' },
    { key: 'presentation', options: ['solid', 'liquid', 'other'] },
    dose,
    { key: 'method', options: ['substrate', 'foliar', 'irrigation', 'other'] },
    { key: 'npk' },
    { key: 'amount', kind: 'number', unit: 'amountUnit', units: ['ml/tree', 'L/tree'] },
  ],
  'maintenance-pruning': [
    zone,
    goal,
    { ...intensity, options: [...intensity.options] },
    { key: 'tool' },
  ],
  'structural-pruning': [
    zone,
    goal,
    { ...intensity, options: [...intensity.options] },
    { key: 'tool' },
    { key: 'sealant', kind: 'product' },
  ],
  wiring: [
    { ...material, key: 'material' },
    { key: 'wires', kind: 'wires' },
    { key: 'reviewDate', kind: 'date' },
  ],
  'wire-removal': [
    zone,
    { ...material, key: 'material' },
    { key: 'wires', kind: 'wires' },
    {
      key: 'duration',
      kind: 'number',
      unit: 'durationUnit',
      units: ['days', 'weeks', 'months', 'years'],
    },
    { key: 'result' },
  ],
  repotting: [
    { key: 'oldPot' },
    { key: 'newPot' },
    { key: 'substrate' },
    { key: 'rootPercent', kind: 'number', max: 100 },
    { key: 'rootCondition' },
  ],
  'root-pruning': [
    { key: 'rootPercent', kind: 'number', max: 100 },
    zone,
    { key: 'rootCondition' },
    { key: 'substrate' },
    { key: 'tool' },
  ],
  defoliation: [
    { key: 'extent', options: ['partial', 'total'] },
    zone,
    { key: 'percent', kind: 'number', max: 100 },
    goal,
    { key: 'regrowthDate', kind: 'date' },
  ],
  'pest-treatment': [
    { key: 'problem' },
    { key: 'product', kind: 'product' },
    dose,
    { key: 'method', options: ['substrate', 'foliar', 'spray', 'other'] },
  ],
  'jin-shari': [
    { key: 'technique', options: ['jin', 'shari', 'both'] },
    zone,
    { key: 'product', kind: 'product' },
  ],
  relocation: [
    { key: 'oldLocation' },
    { key: 'newLocation' },
    { key: 'reason' },
    { key: 'light', options: ['sun', 'partial-shade', 'shade', 'other'] },
  ],
  observation: [zone, { key: 'symptoms' }],
  other: [{ key: 'intervention' }, { key: 'details' }],
} satisfies { [K in CareType]: FieldsFor<K> }

export function fieldsFor(type: CareType): Field[] {
  return DETAIL_FIELDS[type]
}
export function isValidDay(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(dateStrToTs(value)) &&
    tsToDateStr(dateStrToTs(value)) === value
  )
}
export function decimal(value: unknown): number {
  if (typeof value === 'number') return value
  const text = String(value ?? '')
    .trim()
    .replace(',', '.')
  return /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) ? Number(text) : NaN
}
const filled = (value: unknown) => value !== undefined && value !== null && value !== ''
export function validateDetails(type: CareType, data: DetailDraft): string[] {
  const errors: string[] = []
  for (const field of fieldsFor(type)) {
    const value = data[field.key]
    if (
      !filled(value) ||
      (type === 'defoliation' && field.key === 'percent' && data.extent !== 'partial')
    )
      continue
    if (field.kind === 'number') {
      const n = decimal(value)
      if (
        !Number.isFinite(n) ||
        n < 0 ||
        (field.positive && n <= 0) ||
        (field.max !== undefined && n > field.max) ||
        (field.unit && !String(data[field.unit] ?? '').trim())
      )
        errors.push(field.key)
    }
    if (field.kind === 'date' && !isValidDay(String(value))) errors.push(field.key)
    if (
      field.kind === 'wires' &&
      (!Array.isArray(value) ||
        value.some(
          (wire) => !wire || !Number.isFinite(decimal(wire.gauge)) || decimal(wire.gauge) <= 0
        ))
    )
      errors.push(field.key)
  }
  return errors
}
export function normalizeDetails(type: CareType, data: DetailDraft): DetailDraft {
  // Conservar campos desconocidos mientras no cambie el tipo, incluidos backups futuros.
  const result = { ...data }
  for (const field of fieldsFor(type)) {
    const value = result[field.key]
    if (!filled(value)) {
      delete result[field.key]
      continue
    }
    if (field.kind === 'number') result[field.key] = decimal(value)
    else if (field.kind === 'wires' && Array.isArray(value))
      result[field.key] = value.map((wire) => ({ ...wire, gauge: decimal(wire.gauge) }))
    else if (typeof value === 'string') result[field.key] = value.trim()
    if (field.unit && typeof result[field.unit] === 'string')
      result[field.unit] = (result[field.unit] as string).trim()
  }
  if (type === 'defoliation' && result.extent !== 'partial') delete result.percent
  return result
}
export function detailSummary(care: Pick<Care, 'type' | 'specificFields'>, t: TFunction): string {
  const data = care.specificFields ?? {}
  return fieldsFor(care.type)
    .flatMap((field) => {
      const value = data[field.key]
      if (!filled(value) || (Array.isArray(value) && !value.length)) return []
      let text: string
      if (field.kind === 'wires' && Array.isArray(value))
        text = value
          .map((wire) => `${wire.gauge} mm${wire.zone ? ` (${wire.zone})` : ''}`)
          .join(', ')
      else if (field.options?.includes(String(value))) text = t(`careDetails.options.${value}`)
      else text = String(value)
      if (field.unit && data[field.unit])
        text += ` ${t(`careDetails.units.${data[field.unit]}`, { defaultValue: String(data[field.unit]) })}`
      if (field.max === 100) text += '%'
      return `${t(`careDetails.fields.${field.key}`)}: ${text}`
    })
    .join(' · ')
}
