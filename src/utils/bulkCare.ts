import type { Bonsai, TreeCondition } from '@/db/schema'
export interface TreeCareDraft {
  condition?: TreeCondition
  description: string
}
export function seedRecipients(
  ids: string[],
  drafts: Record<string, TreeCareDraft>,
  common: TreeCareDraft
) {
  return Object.fromEntries([...new Set(ids)].map((id) => [id, drafts[id] ?? { ...common }]))
}
export function selectTrees(
  trees: Bonsai[],
  query: string,
  species: string[],
  tags: string[],
  includeInactive: boolean
) {
  const q = query.trim().toLocaleLowerCase()
  return trees.filter(
    (tree) =>
      (includeInactive || !['dead', 'donated'].includes(tree.status)) &&
      (!q || `${tree.name} ${tree.species}`.toLocaleLowerCase().includes(q)) &&
      (!species.length || species.includes(tree.species)) &&
      tags.every((tag) => tree.tags?.includes(tag))
  )
}
