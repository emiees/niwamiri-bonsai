import { useEffect } from 'react'
import { useBonsaiStore } from '../store/bonsaiStore'

export function useBonsaiList() {
  const { bonsais, loading, fetchBonsais } = useBonsaiStore()

  useEffect(() => {
    fetchBonsais()
  }, [fetchBonsais])

  return { bonsais, loading }
}
