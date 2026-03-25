import { db } from './schema'
import type { Bonsai, Care, AppConfig } from './schema'

export async function seedDatabase() {
  const count = await db.bonsais.count()
  if (count > 0) return // already seeded

  const now = Date.now()

  const bonsai1: Omit<Bonsai, 'id'> = {
    name: 'Ficus viejo',
    species: 'Ficus retusa',
    style: 'moyogi',
    acquisitionDate: '2020-03-15',
    germinationYear: 2010,
    origin: 'purchase',
    size: 'chuhin',
    potAndSubstrate: 'Maceta oval cerámica, akadama 60% / pumita 40%',
    location: 'Exterior - semisombra',
    status: 'maintenance',
    generalNotes: 'Árbol con buen nebari, en formación de ramificación secundaria.',
    createdAt: now,
    updatedAt: now,
  }

  const bonsai2: Omit<Bonsai, 'id'> = {
    name: 'Olmo de la clase',
    species: 'Ulmus parvifolia',
    style: 'chokkan',
    acquisitionDate: '2022-08-01',
    origin: 'gift',
    size: 'shohin',
    status: 'developing',
    generalNotes: 'Pre-bonsai obtenido en clase. En etapa de engrosamiento de tronco.',
    createdAt: now,
    updatedAt: now,
  }

  const [id1, id2] = await db.bonsais.bulkAdd([bonsai1 as Bonsai, bonsai2 as Bonsai], {
    allKeys: true,
  })

  const cares: Omit<Care, 'id'>[] = [
    {
      bonsaiId: id1 as string,
      type: 'watering',
      date: now - 1000 * 60 * 60 * 24,
      treeCondition: 'good',
      description: 'Riego profundo hasta escorrentía.',
      createdAt: now,
    },
    {
      bonsaiId: id1 as string,
      type: 'fertilizing',
      date: now - 1000 * 60 * 60 * 24 * 7,
      treeCondition: 'good',
      description: 'Fertilizante equilibrado NPK 7-7-7.',
      createdAt: now,
    },
    {
      bonsaiId: id2 as string,
      type: 'repotting',
      date: now - 1000 * 60 * 60 * 24 * 30,
      treeCondition: 'regular',
      description: 'Trasplante con poda de raíces leve.',
      createdAt: now,
    },
  ]

  await db.cares.bulkAdd(cares as Care[])

  const config: AppConfig = {
    id: 1,
    language: 'es',
    theme: 'dark',
    hemisphere: 'south',
    aiProvider: 'gemini',
    photoQuality: 'high',
    pushNotifications: false,
    onboardingCompleted: false,
    fontSize: 'normal',
  }

  await db.config.put(config)
}
