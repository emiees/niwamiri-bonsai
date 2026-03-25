import { storageService } from '../services/storage/DexieStorageService'
import type { StorageService } from '../services/storage/StorageService'

// Single access point — swap implementation here when migrating to Supabase
export function useStorage(): StorageService {
  return storageService
}
