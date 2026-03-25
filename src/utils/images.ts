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
