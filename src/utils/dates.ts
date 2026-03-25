import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  differenceInYears,
  differenceInMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'

export function formatDate(timestamp: number, pattern = 'dd/MM/yyyy'): string {
  return format(new Date(timestamp), pattern, { locale: es })
}

export function formatRelative(timestamp: number): string {
  const date = new Date(timestamp)
  if (isToday(date)) return 'hoy'
  if (isYesterday(date)) return 'ayer'
  return formatDistanceToNow(date, { addSuffix: true, locale: es })
}

export function calcAge(germinationYear?: number): string {
  if (!germinationYear) return '—'
  const years = new Date().getFullYear() - germinationYear
  return years === 1 ? '1 año' : `${years} años`
}

export function calcAgeFromDate(acquisitionDate?: string): string {
  if (!acquisitionDate) return '—'
  const date = new Date(acquisitionDate)
  const years = differenceInYears(new Date(), date)
  const months = differenceInMonths(new Date(), date) % 12
  if (years === 0) return months === 1 ? '1 mes' : `${months} meses`
  return years === 1 ? '1 año' : `${years} años`
}
