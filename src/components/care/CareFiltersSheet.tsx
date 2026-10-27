import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { inputClass, inputStyle } from '@/components/care/styles'
import { CARE_TYPES } from '@/utils/careDetails'
import { invalidCareRange, type CareFilters } from '@/utils/careFilters'
import { CareChip } from './CareFields'

export default function CareFiltersSheet({
  filters,
  onApply,
  onClose,
}: {
  filters: CareFilters
  onApply: (filters: CareFilters) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(filters)
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    panel.current?.querySelector<HTMLElement>('button')?.focus()
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return
      const controls = panel.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input, select'
      )
      if (!controls?.length) return
      const first = controls[0],
        last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', keydown)
    return () => {
      document.removeEventListener('keydown', keydown)
      previous?.focus()
    }
  }, [onClose])
  return (
    <>
      <div className="fixed inset-0 z-[55] bg-black/50" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="care-filters-title"
        className="fixed bottom-0 left-0 right-0 z-[60] max-h-[85dvh] overflow-y-auto rounded-t-3xl px-5 pt-5"
        style={{
          background: 'var(--bg)',
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="care-filters-title"
            className="text-base font-semibold"
            style={{ color: 'var(--text1)' }}
          >
            {t('careFilters.title')}
          </h2>
          <CareChip onClick={onClose}>{t('common.cancel')}</CareChip>
        </div>
        <div className="flex flex-col gap-4">
          <fieldset>
            <legend className="mb-2 text-xs" style={{ color: 'var(--text3)' }}>
              {t('careForm.type')}
            </legend>
            <div className="flex flex-wrap gap-2">
              {CARE_TYPES.map((type) => (
                <CareChip
                  key={type}
                  active={draft.types.includes(type)}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      types: draft.types.includes(type)
                        ? draft.types.filter((value) => value !== type)
                        : [...draft.types, type],
                    })
                  }
                >
                  {t(`care.${type}`)}
                </CareChip>
              ))}
            </div>
          </fieldset>
          <label className="text-xs" style={{ color: 'var(--text3)' }}>
            {t('careFilters.period')}
            <select
              value={draft.period}
              onChange={(e) =>
                setDraft({ ...draft, period: e.target.value as CareFilters['period'] })
              }
              className={`${inputClass} mt-1`}
              style={inputStyle}
            >
              {(['all', '7', '30', '90', 'custom'] as const).map((period) => (
                <option key={period} value={period}>
                  {t(`careFilters.periods.${period}`)}
                </option>
              ))}
            </select>
          </label>
          {draft.period === 'custom' && (
            <div className="flex flex-wrap gap-2">
              {(['from', 'to'] as const).map((key) => (
                <label
                  key={key}
                  className="min-w-0 flex-1 text-xs"
                  style={{ color: 'var(--text3)' }}
                >
                  {t(`careFilters.${key}`)}
                  <input
                    type="date"
                    value={draft[key]}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                    className={`${inputClass} mt-1`}
                    style={inputStyle}
                  />
                </label>
              ))}
            </div>
          )}
          <fieldset>
            <legend className="mb-2 text-xs" style={{ color: 'var(--text3)' }}>
              {t('careForm.photos')}
            </legend>
            <div className="flex gap-2">
              {(['all', 'with', 'without'] as const).map((photos) => (
                <CareChip
                  key={photos}
                  active={draft.photos === photos}
                  onClick={() => setDraft({ ...draft, photos })}
                >
                  {t(`careFilters.photos.${photos}`)}
                </CareChip>
              ))}
            </div>
          </fieldset>
          {invalidCareRange(draft) && (
            <p role="alert" className="text-sm" style={{ color: 'var(--color-warn)' }}>
              {t('careFilters.invalidRange')}
            </p>
          )}
          <CareChip disabled={!!invalidCareRange(draft)} onClick={() => onApply(draft)}>
            {t('careFilters.apply')}
          </CareChip>
        </div>
      </div>
    </>
  )
}
