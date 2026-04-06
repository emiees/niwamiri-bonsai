/**
 * Extrae fecha y hora del EXIF de un archivo JPEG.
 * Escanea los primeros 64 KB buscando el patrón ASCII "YYYY:MM:DD HH:MM:SS".
 * Retorna la fecha ISO y el timestamp en zona local del dispositivo, o null si no hay EXIF.
 */
export function extractExifDatetime(buffer: ArrayBuffer): { date: string; takenAt: number } | null {
  const bytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 65536))
  const isDigit = (b: number) => b >= 0x30 && b <= 0x39
  for (let i = 0; i < bytes.length - 19; i++) {
    if (
      bytes[i + 4] === 0x3a && bytes[i + 7] === 0x3a &&
      bytes[i + 10] === 0x20 && bytes[i + 13] === 0x3a && bytes[i + 16] === 0x3a
    ) {
      if (
        isDigit(bytes[i]) && isDigit(bytes[i + 1]) && isDigit(bytes[i + 2]) && isDigit(bytes[i + 3]) &&
        isDigit(bytes[i + 5]) && isDigit(bytes[i + 6]) &&
        isDigit(bytes[i + 8]) && isDigit(bytes[i + 9]) &&
        isDigit(bytes[i + 11]) && isDigit(bytes[i + 12]) &&
        isDigit(bytes[i + 14]) && isDigit(bytes[i + 15]) &&
        isDigit(bytes[i + 17]) && isDigit(bytes[i + 18])
      ) {
        const year = String.fromCharCode(bytes[i], bytes[i + 1], bytes[i + 2], bytes[i + 3])
        const month = String.fromCharCode(bytes[i + 5], bytes[i + 6])
        const day = String.fromCharCode(bytes[i + 8], bytes[i + 9])
        const hour = String.fromCharCode(bytes[i + 11], bytes[i + 12])
        const min = String.fromCharCode(bytes[i + 14], bytes[i + 15])
        const sec = String.fromCharCode(bytes[i + 17], bytes[i + 18])
        const y = parseInt(year), m = parseInt(month), d = parseInt(day)
        const h = parseInt(hour), mi = parseInt(min), s = parseInt(sec)
        if (
          y >= 1990 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31 &&
          h >= 0 && h <= 23 && mi >= 0 && mi <= 59 && s >= 0 && s <= 59
        ) {
          return {
            date: `${year}-${month}-${day}`,
            takenAt: new Date(y, m - 1, d, h, mi, s).getTime(),
          }
        }
      }
    }
  }
  return null
}

// Compress image to max 1200px on longest side, quality 85%
export async function compressImage(
  file: File,
  maxPx = 1200,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const { width, height } = img
      const scale = Math.min(1, maxPx / Math.max(width, height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      resolve(dataUrl.split(',')[1]) // return base64 without prefix
    }
    img.onerror = reject
    img.src = url
  })
}

export function base64ToDataUrl(base64: string, mime = 'image/jpeg'): string {
  return `data:${mime};base64,${base64}`
}
