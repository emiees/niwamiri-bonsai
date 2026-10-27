import type { Care, CareType } from '@/db/schema'
import { CARE_TYPES, isValidDay } from './careDetails'
import { dateStrToTs, tsToDateStr } from './dates'
export interface CareFilters {
  types: CareType[]
  period: 'all' | '7' | '30' | '90' | 'custom'
  from: string
  to: string
  photos: 'all' | 'with' | 'without'
}
export const EMPTY_CARE_FILTERS: CareFilters = {
  types: [],
  period: 'all',
  from: '',
  to: '',
  photos: 'all',
}
export function readCareFilters(params: URLSearchParams): CareFilters {
  const period = params.get('period') ?? 'all'
  const photos = params.get('photos') ?? 'all'
  return {
    types: [
      ...new Set(
        params
          .getAll('type')
          .filter((type): type is CareType => CARE_TYPES.includes(type as CareType))
      ),
    ],
    period: ['7', '30', '90', 'custom'].includes(period)
      ? (period as CareFilters['period'])
      : 'all',
    photos: ['with', 'without'].includes(photos) ? (photos as CareFilters['photos']) : 'all',
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
  }
}
export function invalidCareRange(filters: CareFilters) {
  return (
    filters.period === 'custom' &&
    ((!!filters.from && !isValidDay(filters.from)) ||
      (!!filters.to && !isValidDay(filters.to)) ||
      (!!filters.from && !!filters.to && filters.from > filters.to))
  )
}
export function filterCares(
  cares: Care[],
  filters: CareFilters,
  photoIds: Set<string>,
  matchesSearch: (care: Care) => boolean,
  now = Date.now()
) {
  if (invalidCareRange(filters)) return []
  let from = filters.period === 'custom' && filters.from ? dateStrToTs(filters.from) : -Infinity
  let to = filters.period === 'custom' && filters.to ? dateStrToTs(filters.to) : Infinity
  if (['7', '30', '90'].includes(filters.period)) {
    const start = new Date(now)
    start.setDate(start.getDate() - (Number(filters.period) - 1))
    from = start.getTime()
    to = now
  }
  // Comparar días locales completos, incluso cuando cambia el horario de verano.
  const fromDay = Number.isFinite(from) ? tsToDateStr(from) : ''
  const toDay = Number.isFinite(to) ? tsToDateStr(to) : ''
  return cares
    .filter(
      (care) =>
        (!filters.types.length || filters.types.includes(care.type)) &&
        (!fromDay || tsToDateStr(care.date) >= fromDay) &&
        (!toDay || tsToDateStr(care.date) <= toDay) &&
        (filters.photos === 'all' ||
          (filters.photos === 'with' ? photoIds.has(care.id) : !photoIds.has(care.id))) &&
        matchesSearch(care)
    )
    .sort((a, b) => b.date - a.date)
}
