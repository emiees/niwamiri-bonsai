import JSZip from 'jszip'
import { db } from '../db/schema'

export async function exportBonsaiBackup(bonsaiId: string): Promise<Blob> {
  const [bonsai, allCares, allPhotos, allNotes, allSheets, allEvents] = await Promise.all([
    db.bonsais.get(bonsaiId),
    db.cares.where('bonsaiId').equals(bonsaiId).toArray(),
    db.photos.where('bonsaiId').equals(bonsaiId).toArray(),
    db.classNotes.where('specimenId').equals(bonsaiId).toArray(),
    db.speciesSheets.toArray(),
    db.events.where('bonsaiId').equals(bonsaiId).toArray(),
  ])

  const speciesSheet = bonsai?.species
    ? allSheets.find((s) => s.species === bonsai.species) ?? null
    : null

  const zip = new JSZip()
  const photosWithoutData = allPhotos.map(({ imageData: _, ...rest }) => rest)
  zip.file('data.json', JSON.stringify({
    version: 1,
    exportedAt: Date.now(),
    bonsais: bonsai ? [bonsai] : [],
    cares: allCares,
    photos: photosWithoutData,
    classNotes: allNotes,
    speciesSheets: speciesSheet ? [speciesSheet] : [],
    events: allEvents,
    conversations: [],
    config: [],
  }, null, 2))

  const photosFolder = zip.folder('photos')!
  for (const photo of allPhotos) {
    if (photo.imageData) {
      photosFolder.file(`${photo.id}.jpg`, photo.imageData, { base64: true })
    }
  }

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
}

export async function exportBackup(): Promise<Blob> {
  const [bonsais, cares, photos, classNotes, speciesSheets, events, conversations, journalNotes, config] =
    await Promise.all([
      db.bonsais.toArray(),
      db.cares.toArray(),
      db.photos.toArray(),
      db.classNotes.toArray(),
      db.speciesSheets.toArray(),
      db.events.toArray(),
      db.conversations.toArray(),
      db.journalNotes.toArray(),
      db.config.toArray(),
    ])

  const zip = new JSZip()

  // JSON data (without photo image data to keep it clean)
  const photosWithoutData = photos.map(({ imageData: _, ...rest }) => rest)
  const jsonData = {
    version: 2,
    exportedAt: Date.now(),
    bonsais, cares, photos: photosWithoutData,
    classNotes, speciesSheets, events, conversations, journalNotes, config,
  }
  zip.file('data.json', JSON.stringify(jsonData, null, 2))

  // Photos folder (fotos de cuidados/galería)
  const photosFolder = zip.folder('photos')!
  for (const photo of photos) {
    if (photo.imageData) {
      photosFolder.file(`${photo.id}.jpg`, photo.imageData, { base64: true })
    }
  }

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
}

const OPFS_FILENAME = 'niwamiri-auto-backup.zip'

/**
 * Genera un backup completo y lo guarda en el Origin Private File System (OPFS).
 * No requiere permiso del usuario. Devuelve true si fue exitoso.
 */
export async function saveAutoBackupToOPFS(): Promise<boolean> {
  try {
    const blob = await exportBackup()
    const root = await navigator.storage.getDirectory()
    const fh = await root.getFileHandle(OPFS_FILENAME, { create: true })
    const writable = await fh.createWritable()
    await writable.write(blob)
    await writable.close()
    return true
  } catch {
    return false
  }
}

/**
 * Descarga el último backup automático guardado en OPFS.
 * Devuelve false si no hay ninguno guardado.
 */
export async function downloadAutoBackup(): Promise<boolean> {
  try {
    const root = await navigator.storage.getDirectory()
    const fh = await root.getFileHandle(OPFS_FILENAME)
    const file = await fh.getFile()
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = `niwamiri_auto_backup_${new Date().toISOString().slice(0, 10)}.zip`
    a.click()
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Devuelve true si existe un backup automático en OPFS.
 */
export async function hasAutoBackup(): Promise<boolean> {
  try {
    const root = await navigator.storage.getDirectory()
    await root.getFileHandle(OPFS_FILENAME)
    return true
  } catch {
    return false
  }
}

export async function importBackup(file: File, mode: 'replace' | 'merge'): Promise<void> {
  const zip = await JSZip.loadAsync(file)

  const dataFile = zip.file('data.json')
  if (!dataFile) throw new Error('Invalid backup: missing data.json')

  const text = await dataFile.async('text')
  const data = JSON.parse(text)

  // Restore photo image data from photos/ folder
  if (data.photos?.length) {
    for (const photo of data.photos) {
      const imgFile = zip.file(`photos/${photo.id}.jpg`)
      if (imgFile) {
        photo.imageData = await imgFile.async('base64')
      }
    }
  }

  await db.transaction(
    'rw',
    [db.bonsais, db.cares, db.photos, db.classNotes, db.speciesSheets, db.events, db.conversations, db.journalNotes, db.config],
    async () => {
      if (mode === 'replace') {
        await Promise.all([
          db.bonsais.clear(),
          db.cares.clear(),
          db.photos.clear(),
          db.classNotes.clear(),
          db.speciesSheets.clear(),
          db.events.clear(),
          db.conversations.clear(),
          db.journalNotes.clear(),
        ])
      }

      if (data.bonsais?.length) await db.bonsais.bulkPut(data.bonsais)
      if (data.cares?.length) await db.cares.bulkPut(data.cares)
      if (data.photos?.length) await db.photos.bulkPut(data.photos)
      if (data.classNotes?.length) await db.classNotes.bulkPut(data.classNotes)
      if (data.speciesSheets?.length) await db.speciesSheets.bulkPut(data.speciesSheets)
      if (data.events?.length) await db.events.bulkPut(data.events)
      if (data.conversations?.length) await db.conversations.bulkPut(data.conversations)
      if (data.journalNotes?.length) await db.journalNotes.bulkPut(data.journalNotes)
      if (data.config?.length) await db.config.bulkPut(data.config)
    }
  )
}
