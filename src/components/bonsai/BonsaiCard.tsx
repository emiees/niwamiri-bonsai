import { useEffect, useState } from 'react'
import { TreePine } from 'lucide-react'
import { storageService } from '@/services/storage/DexieStorageService'
import { calcAge, formatRelative } from '@/utils/dates'
import type { Bonsai } from '@/db/schema'

interface BonsaiCardProps {
  bonsai: Bonsai
  hasPending: boolean
  view: 'grid' | 'list'
  onClick: () => void
}

export default function BonsaiCard({ bonsai, hasPending, view, onClick }: BonsaiCardProps) {
  const [photoSrc, setPhotoSrc] = useState<string | null>(null)
  const [lastCareAt, setLastCareAt] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    if (bonsai.mainPhotoId) {
      storageService.getPhotosByBonsai(bonsai.id).then((photos) => {
        if (cancelled) return
        const main = photos.find((p) => p.id === bonsai.mainPhotoId)
        if (main) setPhotoSrc(main.imageData)
      }).catch(() => {})
    }
    storageService.getCaresByBonsai(bonsai.id).then((cares) => {
      if (cancelled) return
      if (cares.length > 0) setLastCareAt(cares[0].date)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [bonsai.id, bonsai.mainPhotoId])

  const age = bonsai.germinationYear ? calcAge(bonsai.germinationYear) : null
  const lastCareText = lastCareAt ? formatRelative(lastCareAt) : null
  const meta = [age ? `~${age}` : null, lastCareText].filter(Boolean).join(' · ')

  const Photo = (
    <div
      className="relative overflow-hidden"
      style={{
        background: 'var(--bg3)',
        ...(view === 'grid' ? {} : { width: 56, height: 56, borderRadius: 12, flexShrink: 0 }),
        ...(view === 'grid' ? { aspectRatio: '4/3', width: '100%' } : {}),
      }}
    >
      {photoSrc
        ? <img src={photoSrc} alt={bonsai.name} className="h-full w-full object-cover" />
        : (
          <TreePine
            size={view === 'grid' ? 32 : 22}
            className="absolute inset-0 m-auto"
            style={{ color: 'var(--text3)' }}
          />
        )
      }
      {hasPending && (
        <div
          className="absolute rounded-full bg-orange-400 shadow"
          style={{
            width: view === 'grid' ? 12 : 10,
            height: view === 'grid' ? 12 : 10,
            top: view === 'grid' ? 8 : 4,
            left: view === 'grid' ? 8 : 4,
          }}
        />
      )}
    </div>
  )

  if (view === 'list') {
    return (
      <button
        onClick={onClick}
        className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-white/5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {Photo}
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold" style={{ color: 'var(--text1)' }}>
            {bonsai.name}
          </span>
          <span className="truncate text-xs italic" style={{ color: 'var(--text3)' }}>
            {bonsai.species}
          </span>
          {meta && (
            <span className="text-[11px]" style={{ color: 'var(--text3)' }}>{meta}</span>
          )}
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className="flex flex-col overflow-hidden rounded-2xl text-left transition-transform duration-100 active:scale-[0.97]"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {Photo}
      <div className="flex flex-col gap-0.5 px-3 py-2.5">
        <span className="truncate text-sm font-semibold leading-tight" style={{ color: 'var(--text1)' }}>
          {bonsai.name}
        </span>
        <span className="truncate text-xs italic" style={{ color: 'var(--text3)' }}>
          {bonsai.species}
        </span>
        {meta && (
          <span className="mt-0.5 text-[11px]" style={{ color: 'var(--text3)' }}>{meta}</span>
        )}
      </div>
    </button>
  )
}
