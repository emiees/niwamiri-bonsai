import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  differenceInYears,
  differenceInMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'

// ── Conversiones locales de fecha ────────────────────────────────
// La DB almacena timestamps en UTC (milisegundos).
// Estas funciones convierten entre 'YYYY-MM-DD' y timestamps
// usando siempre la zona horaria local del dispositivo, para que
// la app se adapte automáticamente al país donde se usa.

/**
 * Convierte 'YYYY-MM-DD' a timestamp anclado al mediodía local.
 * Evita el problema de `new Date('YYYY-MM-DD')` que parsea como UTC
 * medianoche y en UTC-3 muestra el día anterior.
 */
export function dateStrToTs(dateStr: string): number {
  return new Date(dateStr + 'T12:00:00').getTime()
}

/**
 * Convierte un timestamp a 'YYYY-MM-DD' en la zona horaria local
 * del dispositivo. Usar en lugar de toISOString().split('T')[0]
 * (que daría la fecha en UTC).
 */
export function tsToDateStr(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Retorna 'YYYY-MM-DD' de hoy en la zona horaria local del dispositivo.
 */
export function localToday(): string {
  return tsToDateStr(Date.now())
}

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
  const date = new Date(dateStrToTs(acquisitionDate))
  const years = differenceInYears(new Date(), date)
  const months = differenceInMonths(new Date(), date) % 12
  if (years === 0) return months === 1 ? '1 mes' : `${months} meses`
  return years === 1 ? '1 año' : `${years} años`
}
