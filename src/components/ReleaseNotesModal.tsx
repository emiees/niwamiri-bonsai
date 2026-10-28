import { useTranslation } from 'react-i18next'
import StartupModal from './StartupModal'

export default function ReleaseNotesModal({ onContinue }: { onContinue: () => void }) {
  const { t } = useTranslation()
  const bullets = t('releaseNotes.bullets', { returnObjects: true }) as string[]

  return (
    <StartupModal title={t('releaseNotes.title')} actionLabel={t('releaseNotes.continue')} onContinue={onContinue}>
      <ul className="list-disc space-y-3 pl-5 text-sm" style={{ color: 'var(--text2)' }}>
        {bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
      </ul>
    </StartupModal>
  )
}
