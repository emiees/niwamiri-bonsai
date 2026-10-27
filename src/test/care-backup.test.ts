import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { db } from '../db/schema'
import { exportBackup, exportBonsaiBackup, importBackup } from '../utils/backup'

function read(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = reject
    reader.readAsArrayBuffer(blob)
  })
}
beforeEach(async () => {
  await Promise.all(db.tables.map((table) => table.clear()))
})
afterEach(async () => {
  await Promise.all(db.tables.map((table) => table.clear()))
})
describe('F035 — compatibilidad de backups', () => {
  it.each(['full', 'tree'])(
    'exporta y restaura detalles conocidos y desconocidos: %s',
    async (mode) => {
      await db.bonsais.add({
        id: 'tree',
        name: 'Ficus',
        species: 'Ficus',
        status: 'maintenance',
        createdAt: 1,
        updatedAt: 1,
      })
      const care = {
        id: 'care',
        bonsaiId: 'tree',
        type: 'wiring' as const,
        date: 100,
        treeCondition: 'regular' as const,
        specificFields: {
          wires: [{ gauge: 1.5, zone: 'tronco' }, { gauge: 2 }],
          future: { arbitrary: [1, 2] },
        },
        createdAt: 1,
      }
      await db.cares.add(care)
      const blob = mode === 'full' ? await exportBackup() : await exportBonsaiBackup('tree')
      const buffer = await read(blob)
      const zip = await JSZip.loadAsync(buffer)
      expect(JSON.parse(await zip.file('data.json')!.async('text')).cares[0]).toEqual(care)
      await db.cares.clear()
      await importBackup(new File([buffer], 'backup.zip'), 'replace')
      expect(await db.cares.get('care')).toEqual(care)
    }
  )
  it('restaura archivos antiguos sin detalles y conserva registros al combinar', async () => {
    const old = {
      id: 'old',
      bonsaiId: 'tree',
      type: 'watering',
      date: 1,
      treeCondition: 'good',
      createdAt: 1,
    }
    const zip = new JSZip().file('data.json', JSON.stringify({ version: 1, cares: [old] }))
    const data = await zip.generateAsync({ type: 'uint8array' })
    await db.cares.add({ ...old, id: 'existing', type: 'watering', treeCondition: 'good' })
    await importBackup(new File([new Uint8Array(data)], 'old.zip'), 'merge')
    expect(await db.cares.get('old')).toEqual(old)
    expect(await db.cares.count()).toBe(2)
  })
})
