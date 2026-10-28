import { useId, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import CareSection from './CareSection'
import QuantityField from './QuantityField'
import SelectRow from '@/components/ui/SelectRow'
import { useTranslation } from 'react-i18next'
import type { CareType, TreeCondition } from '@/db/schema'
import { CARE_TYPES, CARE_ICONS, fieldsFor, type DetailDraft } from '@/utils/careDetails'

import { inputClass, inputStyle } from './styles'

export function CareChip({
  active = false,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      {...props}
      className="rounded-xl px-3 py-2 text-xs font-medium disabled:opacity-50"
      style={{
        background: active ? 'var(--color-accent)' : 'var(--card)',
        color: active ? 'var(--green1)' : 'var(--text2)',
        border: '1px solid var(--border)',
      }}
    >
      {children}
    </button>
  )
}

export function CareTypeDateFields({
  type,
  date,
  onType,
  onDate,
  hasDetails,
}: {
  type: CareType
  date: string
  onType: (value: CareType) => void
  onDate: (value: string) => void
  hasDetails: boolean
}) {
  const { t } = useTranslation()
  const [pendingType, setPendingType] = useState<CareType | null>(null)
  return (
    <>
      <fieldset>
        <legend className="mb-2 text-xs font-semibold" style={{ color: 'var(--text3)' }}>
          {t('careForm.type')}
        </legend>
        <div className="flex flex-wrap gap-2">
          {CARE_TYPES.map((value) => (
            <CareChip
              key={value}
              active={type === value}
              onClick={() => {
                if (value === type) return
                if (hasDetails) setPendingType(value)
                else onType(value)
              }}
            >
              {CARE_ICONS[value]} {t(`care.${value}`)}
            </CareChip>
          ))}
        </div>
      </fieldset>
      {pendingType && (
        <div
          role="alertdialog"
          aria-label={t('careDetails.changeType')}
          className="rounded-xl p-3"
          style={inputStyle}
        >
          <p className="mb-3 text-sm">{t('careDetails.changeType')}</p>
          <div className="flex gap-2">
            <CareChip onClick={() => setPendingType(null)}>{t('common.cancel')}</CareChip>
            <CareChip
              onClick={() => {
                onType(pendingType)
                setPendingType(null)
              }}
            >
              {t('careDetails.replaceDetails')}
            </CareChip>
          </div>
        </div>
      )}
      <label className="block text-xs" style={{ color: 'var(--text3)' }}>
        {t('careForm.date')}
        <input
          type="date"
          required
          value={date}
          onChange={(e) => onDate(e.target.value)}
          className={`${inputClass} mt-1.5`}
          style={inputStyle}
        />
      </label>
    </>
  )
}

export function ConditionFields({
  condition,
  description,
  onCondition,
  onDescription,
}: {
  condition?: TreeCondition
  description: string
  onCondition: (value: TreeCondition) => void
  onDescription: (value: string) => void
}) {
  const { t } = useTranslation()
  return (
    <>
      <fieldset>
        <legend className="mb-2 text-xs" style={{ color: 'var(--text3)' }}>
          {t('careForm.condition')}
        </legend>
        <div className="flex flex-wrap gap-2">
          {(['good', 'regular', 'problematic'] as const).map((value) => (
            <CareChip key={value} active={condition === value} onClick={() => onCondition(value)}>
              {t(`condition.${value}`)}
            </CareChip>
          ))}
        </div>
      </fieldset>
      <label className="block text-xs" style={{ color: 'var(--text3)' }}>
        {t('careForm.description')}
        <textarea
          rows={3}
          value={description}
          onChange={(e) => onDescription(e.target.value)}
          className={`${inputClass} mt-1.5 resize-none`}
          style={inputStyle}
        />
      </label>
    </>
  )
}

export function ReminderFields({
  date,
  description,
  onDate,
  onDescription,
  onClear,
  onSuggest,
  canSuggest,
  suggesting,
  suggestionError,
  reviewDate,
  scope,
  invalid = false,
}: {
  date: string
  description: string
  onDate: (value: string) => void
  onDescription: (value: string) => void
  onClear: () => void
  onSuggest: () => void
  canSuggest: boolean
  suggesting: boolean
  suggestionError: boolean
  reviewDate?: string
  scope?: string
  invalid?: boolean
}) {
  const { t } = useTranslation()
  const id = useId()
  const fieldStyle = {
    background: 'var(--bg3)',
    color: 'var(--text1)',
    border: '1px solid var(--border)',
  }
  return (
    <CareSection title={t('careForm.reminder')}>
      {scope && (
        <p className="text-xs" style={{ color: 'var(--text3)' }}>
          {scope}
        </p>
      )}
      {reviewDate && (
        <button
          type="button"
          className="text-left text-sm"
          style={{ color: 'var(--color-accent)' }}
          onClick={() => {
            onDate(reviewDate)
            if (!description) onDescription(t('careDetails.reviewReminder'))
          }}
        >
          {t('careDetails.useReviewDate')}
        </button>
      )}
      <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <label htmlFor={`${id}-date`} className="sr-only">
            {t('careDetails.reminderDate')}
          </label>
          <input
            id={`${id}-date`}
            type="date"
            value={date}
            onChange={(e) => onDate(e.target.value)}
            aria-invalid={invalid}
            className={`${inputClass} block min-h-[44px] min-w-0`}
            style={fieldStyle}
          />
        </div>
        <button
          type="button"
          onClick={onSuggest}
          disabled={suggesting || !canSuggest}
          className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold disabled:opacity-40"
          style={{ ...fieldStyle, color: 'var(--color-accent)' }}
        >
          {suggesting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {t('careForm.suggestReminder')}
        </button>
      </div>
      {(date || description) && (
        <label className="text-xs" style={{ color: 'var(--text3)' }}>
          {t('careDetails.reminderDescription')}
          <input
            value={description}
            onChange={(e) => onDescription(e.target.value)}
            aria-invalid={invalid}
            className={`${inputClass} mt-1`}
            style={fieldStyle}
          />
        </label>
      )}
      {(date || description || suggesting) && (
        <button
          type="button"
          onClick={onClear}
          className="self-start text-sm"
          style={{ color: 'var(--color-accent)' }}
        >
          {t('careDetails.clearReminder')}
        </button>
      )}
      {!canSuggest && (
        <p className="text-xs" style={{ color: 'var(--text3)' }}>
          {t('careDetails.aiUnavailable')}
        </p>
      )}
      {suggestionError && (
        <p role="alert" className="text-sm" style={{ color: 'var(--color-warn)' }}>
          {t('careDetails.suggestionError')}
        </p>
      )}
      {invalid && (
        <p role="alert" className="text-sm" style={{ color: 'var(--color-warn)' }}>
          {t('careDetails.incompleteReminder')}
        </p>
      )}
    </CareSection>
  )
}

export function CareDetailsFields({
  type,
  value,
  onChange,
  products,
  errors = [],
}: {
  type: CareType
  value: DetailDraft
  onChange: (value: DetailDraft) => void
  products: string[]
  errors?: string[]
}) {
  const { t } = useTranslation()
  const id = useId()
  const [amountExpanded, setAmountExpanded] = useState(false)
  const hasAmount = (value.amount !== undefined && value.amount !== '') || !!value.amountUnit
  const concentration = /\/\s*l$/i.test(String(value.doseUnit ?? ''))
  const showAmount = hasAmount || (amountExpanded && concentration)
  const update = (key: string, next: unknown) => onChange({ ...value, [key]: next })
  const labelFor = (key: string) => t(`careDetails.fields.${key}`)
  return (
    <CareSection title={t('careDetails.title')}>
      <p className="text-xs" style={{ color: 'var(--text3)' }}>
        {t('careDetails.optional')}
      </p>
      <datalist id={`${id}-products`}>
        {products.map((product) => (
          <option key={product} value={product} />
        ))}
      </datalist>
      {fieldsFor(type)
        .filter((field) => field.key !== 'amount' || type !== 'fertilizing' || showAmount)
        .filter(
          (field) =>
            !(type === 'defoliation' && field.key === 'percent' && value.extent !== 'partial')
        )
        .map((field) => {
          const fieldId = `${id}-${field.key}`
          const text =
            typeof value[field.key] === 'string' || typeof value[field.key] === 'number'
              ? String(value[field.key])
              : ''
          if (field.kind === 'wires') {
            const wires = Array.isArray(value.wires)
              ? (value.wires as {
                  gauge?: string | number
                  zone?: string
                  [key: string]: unknown
                }[])
              : []
            return (
              <div key={field.key}>
                <p className="mb-2 text-xs">{labelFor(field.key)}</p>
                <div className="flex flex-col gap-2">
                  {wires.map((wire, index) => (
                    <div key={index} className="flex flex-wrap items-end gap-2">
                      <label className="min-w-0 flex-1 text-xs">
                        {t('careDetails.gauge', { number: index + 1 })}
                        <input
                          value={wire.gauge ?? ''}
                          inputMode="decimal"
                          onChange={(e) =>
                            update(
                              'wires',
                              wires.map((row, i) =>
                                i === index ? { ...row, gauge: e.target.value } : row
                              )
                            )
                          }
                          className={inputClass}
                          style={inputStyle}
                        />
                      </label>
                      <label className="min-w-0 flex-1 text-xs">
                        {labelFor('zone')}
                        <input
                          value={wire.zone ?? ''}
                          onChange={(e) =>
                            update(
                              'wires',
                              wires.map((row, i) =>
                                i === index ? { ...row, zone: e.target.value } : row
                              )
                            )
                          }
                          className={inputClass}
                          style={inputStyle}
                        />
                      </label>
                      <CareChip
                        aria-label={t('careDetails.removeWire', { number: index + 1 })}
                        onClick={() =>
                          update(
                            'wires',
                            wires.filter((_, i) => i !== index)
                          )
                        }
                      >
                        ×
                      </CareChip>
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <CareChip onClick={() => update('wires', [...wires, { gauge: '', zone: '' }])}>
                    {t('careDetails.addWire')}
                  </CareChip>
                </div>
                {errors.includes(field.key) && (
                  <p role="alert" className="mt-1 text-xs" style={{ color: 'var(--color-warn)' }}>
                    {t('careDetails.invalid', { field: labelFor(field.key) })}
                  </p>
                )}
              </div>
            )
          }
          if (field.unit)
            return (
              <div key={field.key}>
                <QuantityField
                  id={fieldId}
                  label={labelFor(field.key)}
                  value={text}
                  unit={String(value[field.unit] ?? '')}
                  units={field.units ?? []}
                  onValue={(next) => update(field.key, next)}
                  onUnit={(next) => update(field.unit!, next)}
                />
                {field.key === 'dose' && (
                  <p className="mt-1 text-xs" style={{ color: 'var(--text3)' }}>
                    {t('careDetails.doseHelp')}
                  </p>
                )}
                {errors.includes(field.key) && (
                  <p role="alert" className="mt-1 text-xs" style={{ color: 'var(--color-warn)' }}>
                    {t('careDetails.invalid', { field: labelFor(field.key) })}
                  </p>
                )}
              </div>
            )
          return (
            <div key={field.key}>
              <label htmlFor={fieldId} className="mb-1 block text-xs">
                {labelFor(field.key)}
                {field.max === 100 ? ' (%)' : ''}
              </label>
              {field.options ? (
                <SelectRow
                  id={fieldId}
                  value={text}
                  onChange={(next) => update(field.key, next)}
                  options={[
                    { value: '', label: t('careDetails.unspecified') },
                    ...(!field.options.includes(text) && text
                      ? [{ value: text, label: text }]
                      : []),
                    ...field.options.map((option) => ({
                      value: option,
                      label: t(`careDetails.options.${option}`),
                    })),
                  ]}
                />
              ) : (
                <input
                  id={fieldId}
                  type={field.kind === 'date' ? 'date' : 'text'}
                  inputMode={field.kind === 'number' ? 'decimal' : undefined}
                  list={field.kind === 'product' ? `${id}-products` : undefined}
                  value={text}
                  onChange={(e) => update(field.key, e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                />
              )}
              {errors.includes(field.key) && (
                <p role="alert" className="mt-1 text-xs" style={{ color: 'var(--color-warn)' }}>
                  {t('careDetails.invalid', { field: labelFor(field.key) })}
                </p>
              )}
            </div>
          )
        })}
      {type === 'fertilizing' && concentration && !showAmount && (
        <CareChip onClick={() => setAmountExpanded(true)}>{t('careDetails.addAmount')}</CareChip>
      )}
      {type === 'fertilizing' && showAmount && (
        <CareChip
          onClick={() => {
            setAmountExpanded(false)
            onChange({ ...value, amount: undefined, amountUnit: undefined })
          }}
        >
          {t('careDetails.removeAmount')}
        </CareChip>
      )}
    </CareSection>
  )
}
