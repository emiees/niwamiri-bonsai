import { create } from 'zustand'
import type { Bonsai } from '../db/schema'
import { storageService } from '../services/storage/DexieStorageService'

interface BonsaiState {
  bonsais: Bonsai[]
  loading: boolean
  fetchBonsais: () => Promise<void>
  addBonsai: (bonsai: Omit<Bonsai, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>
  updateBonsai: (id: string, data: Partial<Bonsai>) => Promise<void>
  deleteBonsai: (id: string) => Promise<void>
}

export const useBonsaiStore = create<BonsaiState>((set, get) => ({
  bonsais: [],
  loading: false,

  fetchBonsais: async () => {
    set({ loading: true })
    const bonsais = await storageService.getBonsaiList()
    set({ bonsais, loading: false })
  },

  addBonsai: async (bonsai) => {
    const id = await storageService.saveBonsai(bonsai)
    await get().fetchBonsais()
    return id
  },

  updateBonsai: async (id, data) => {
    await storageService.updateBonsai(id, data)
    await get().fetchBonsais()
  },

  deleteBonsai: async (id) => {
    await storageService.deleteBonsai(id)
    set((state) => ({ bonsais: state.bonsais.filter((b) => b.id !== id) }))
  },
}))
