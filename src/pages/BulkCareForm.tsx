import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { inputClass, inputStyle } from '@/components/care/styles'
import { TreePine } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import {
  CareChip,
  CareDetailsFields,
  CareTypeDateFields,
  ConditionFields,
  ReminderFields,
} from '@/components/care/CareFields'
import { useBonsaiStore } from '@/store/bonsaiStore'
import { storageService } from '@/services/storage/DexieStorageService'
import { CareValidationError } from '@/services/storage/StorageService'
import type { CareType } from '@/db/schema'
import {
  detailSummary,
  isValidDay,
  normalizeDetails,
  validateDetails,
  type DetailDraft,
} from '@/utils/careDetails'
import { seedRecipients, selectTrees, type TreeCareDraft } from '@/utils/bulkCare'
import { dateStrToTs, localToday } from '@/utils/dates'

export default function BulkCareForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { bonsais, fetchBonsais } = useBonsaiStore()
  const [step, setStep] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [species, setSpecies] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [inactive, setInactive] = useState(false)
  const [onlySelected, setOnlySelected] = useState(false)
  const [type, setType] = useState<CareType>('fertilizing')
  const [date, setDate] = useState(localToday)
  const [details, setDetails] = useState<DetailDraft>({})
  const [products, setProducts] = useState<string[]>([])
  const [common, setCommon] = useState<TreeCareDraft>({ description: '' })
  const [individual, setIndividual] = useState(false)
  const [drafts, setDrafts] = useState<Record<string, TreeCareDraft>>({})
  const [confirmCommon, setConfirmCommon] = useState(false)
  const [reminderDate, setReminderDate] = useState('')
  const [reminderDescription, setReminderDescription] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const lock = useRef(false)
  useEffect(() => {
    fetchBonsais().catch(() => setError(t('careList.loadError')))
  }, [fetchBonsais, t])
  useEffect(() => {
    let active = true
    storageService
      .getCareProducts()
      .then((list) => {
        if (active) setProducts(list)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])
  const recipients = selected.map((id) => ({
    id,
    tree: bonsais.find((tree) => tree.id === id),
    draft: individual ? (drafts[id] ?? common) : common,
  }))
  const visible = onlySelected
    ? bonsais.filter((tree) => selected.includes(tree.id))
    : selectTrees(bonsais, query, species, tags, inactive)
  const toggle = (items: string[], value: string) =>
    items.includes(value) ? items.filter((item) => item !== value) : [...items, value]
  function choose(ids: string[]) {
    setSelected([...new Set(ids)])
    setDrafts((current) => ({ ...current, ...seedRecipients(ids, current, common) }))
  }
  function changeMode(next: boolean) {
    if (next === individual) return
    if (
      !next &&
      recipients.some(
        ({ draft }) =>
          draft.condition !== common.condition || draft.description !== common.description
      )
    ) {
      setConfirmCommon(true)
      return
    }
    if (next)
      setDrafts((current) => ({
        ...current,
        ...Object.fromEntries(selected.map((id) => [id, { ...common }])),
      }))
    setIndividual(next)
  }
  function review() {
    const invalidFields = validateDetails(type, details)
    setErrors(invalidFields)
    const invalid =
      !isValidDay(date) ||
      invalidFields.length > 0 ||
      !!reminderDate !== !!reminderDescription.trim() ||
      (!!reminderDate && !isValidDay(reminderDate))
    const incomplete = recipients.filter(({ tree, draft }) => !tree || !draft.condition)
    if (invalid) {
      setError(t('careDetails.validationError'))
      return
    }
    if (incomplete.length) {
      setError(
        t('bulkCare.conditionsMissing', {
          names: incomplete.map(({ tree, id }) => tree?.name ?? id).join(', '),
        })
      )
      return
    }
    setError('')
    setStep(3)
  }
  async function save() {
    if (lock.current) return
    lock.current = true
    setSaving(true)
    setError('')
    try {
      const ids = await storageService.saveBulkCares({
        type,
        date: dateStrToTs(date),
        specificFields: normalizeDetails(type, details),
        typeLabel: t(`care.${type}`),
        followUpReminder: reminderDate
          ? { date: dateStrToTs(reminderDate), description: reminderDescription.trim() }
          : undefined,
        recipients: recipients.map(({ id, draft }) => ({
          bonsaiId: id,
          treeCondition: draft.condition!,
          description: draft.description.trim() || undefined,
        })),
      })
      navigate('/', { replace: true, state: { careSuccess: ids.length } })
    } catch (failure) {
      setError(
        failure instanceof CareValidationError
          ? t(`bulkCare.${failure.code}`, {
              name: bonsais.find((tree) => tree.id === failure.target)?.name ?? failure.target,
            })
          : t('bulkCare.saveError')
      )
      lock.current = false
      setSaving(false)
    }
  }
  return (
    <AppShell showNav={false}>
      <Header title={t('bulkCare.title')} showBack />
      <div className="flex flex-col gap-4 px-4 py-3 pb-8">
        <p className="text-xs" style={{ color: 'var(--text3)' }}>
          {t('bulkCare.step', { step })} · {t(`bulkCare.step${step}`)}
        </p>
        {step === 1 && (
          <>
            <input
              type="search"
              aria-label={t('bulkCare.search')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('common.search')}
              className={inputClass}
              style={inputStyle}
            />
            <fieldset>
              <legend className="mb-1 text-xs" style={{ color: 'var(--text3)' }}>
                {t('bulkCare.species')}
              </legend>
              <div className="flex flex-wrap gap-2">
                {[...new Set(bonsais.map((tree) => tree.species))].sort().map((value) => (
                  <CareChip
                    key={value}
                    active={species.includes(value)}
                    onClick={() => setSpecies(toggle(species, value))}
                  >
                    {value}
                  </CareChip>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-1 text-xs" style={{ color: 'var(--text3)' }}>
                {t('bulkCare.tags')}
              </legend>
              <div className="flex flex-wrap gap-2">
                {[...new Set(bonsais.flatMap((tree) => tree.tags ?? []))].sort().map((value) => (
                  <CareChip
                    key={value}
                    active={tags.includes(value)}
                    onClick={() => setTags(toggle(tags, value))}
                  >
                    {value}
                  </CareChip>
                ))}
              </div>
            </fieldset>
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text2)' }}>
              <input
                type="checkbox"
                checked={inactive}
                onChange={(e) => setInactive(e.target.checked)}
              />
              {t('bulkCare.includeInactive')}
            </label>
            <div className="flex flex-wrap gap-2">
              <CareChip onClick={() => choose([...selected, ...visible.map((tree) => tree.id)])}>
                {t('bulkCare.selectVisible')}
              </CareChip>
              <CareChip onClick={() => choose([])}>{t('bulkCare.clearSelection')}</CareChip>
              <CareChip active={onlySelected} onClick={() => setOnlySelected(!onlySelected)}>
                {t('bulkCare.selected', { count: selected.length })}
              </CareChip>
            </div>
            {!visible.length && (
              <p className="text-sm" style={{ color: 'var(--text3)' }}>
                {t('common.noResults')}
              </p>
            )}
            <div className="flex flex-col gap-2">
              {visible.map((tree) => (
                <label
                  key={tree.id}
                  className="flex items-center gap-3 rounded-2xl p-3"
                  style={inputStyle}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(tree.id)}
                    onChange={() => choose(toggle(selected, tree.id))}
                  />
                  <TreePine size={24} aria-hidden="true" style={{ color: 'var(--color-accent)' }} />
                  <span>
                    <span className="block text-sm font-semibold">{tree.name}</span>
                    <span className="text-xs" style={{ color: 'var(--text3)' }}>
                      {tree.species}
                      {tree.commonName ? ` · ${tree.commonName}` : ''}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <CareChip
              disabled={!selected.length}
              onClick={() => {
                setError('')
                setStep(2)
              }}
            >
              {t('bulkCare.continue', { count: selected.length })}
            </CareChip>
          </>
        )}
        {step === 2 && (
          <>
            <CareChip
              onClick={() => {
                setStep(1)
                setError('')
              }}
            >
              {t('bulkCare.editSelection', { count: selected.length })}
            </CareChip>
            <CareTypeDateFields
              type={type}
              date={date}
              onDate={setDate}
              hasDetails={Object.keys(details).length > 0}
              onType={(value) => {
                setType(value)
                setDetails({})
                setErrors([])
              }}
            />
            <CareDetailsFields
              type={type}
              value={details}
              onChange={setDetails}
              products={products}
              errors={errors}
            />
            <fieldset>
              <legend className="mb-2 text-xs" style={{ color: 'var(--text3)' }}>
                {t('bulkCare.conditionMode')}
              </legend>
              <div className="flex gap-2">
                <CareChip active={!individual} onClick={() => changeMode(false)}>
                  {t('bulkCare.sameForAll')}
                </CareChip>
                <CareChip active={individual} onClick={() => changeMode(true)}>
                  {t('bulkCare.perTree')}
                </CareChip>
              </div>
            </fieldset>
            {confirmCommon && (
              <div
                role="alertdialog"
                aria-label={t('bulkCare.replaceIndividual')}
                className="rounded-xl p-3"
                style={inputStyle}
              >
                <p className="mb-3 text-sm">{t('bulkCare.replaceIndividual')}</p>
                <div className="flex gap-2">
                  <CareChip onClick={() => setConfirmCommon(false)}>{t('common.cancel')}</CareChip>
                  <CareChip
                    onClick={() => {
                      setIndividual(false)
                      setDrafts(Object.fromEntries(selected.map((id) => [id, { ...common }])))
                      setConfirmCommon(false)
                    }}
                  >
                    {t('bulkCare.sameForAll')}
                  </CareChip>
                </div>
              </div>
            )}
            <ConditionFields
              condition={common.condition}
              description={common.description}
              onCondition={(value) => setCommon({ ...common, condition: value })}
              onDescription={(value) => setCommon({ ...common, description: value })}
            />
            {individual && (
              <>
                <CareChip
                  onClick={() =>
                    setDrafts((current) => ({
                      ...current,
                      ...Object.fromEntries(selected.map((id) => [id, { ...common }])),
                    }))
                  }
                >
                  {t('bulkCare.applyToAll')}
                </CareChip>
                {recipients.map(({ id, tree, draft }) => (
                  <details key={id} className="rounded-2xl p-3" style={inputStyle}>
                    <summary className="text-sm font-semibold">
                      {tree?.name ?? id} ·{' '}
                      {draft.condition
                        ? t(`condition.${draft.condition}`)
                        : t('bulkCare.pendingCondition')}
                      {draft.description ? ` · ${draft.description}` : ''}
                    </summary>
                    <div className="mt-3 flex flex-col gap-3">
                      <ConditionFields
                        condition={draft.condition}
                        description={draft.description}
                        onCondition={(value) =>
                          setDrafts({ ...drafts, [id]: { ...draft, condition: value } })
                        }
                        onDescription={(value) =>
                          setDrafts({ ...drafts, [id]: { ...draft, description: value } })
                        }
                      />
                    </div>
                  </details>
                ))}
              </>
            )}
            <ReminderFields
              date={reminderDate}
              description={reminderDescription}
              onDate={setReminderDate}
              onDescription={setReminderDescription}
              reviewDate={type === 'wiring' ? (details.reviewDate as string) : undefined}
            />
            <p className="text-xs" style={{ color: 'var(--text3)' }}>
              {t('bulkCare.photosLater')}
            </p>
            <CareChip disabled={!selected.length} onClick={review}>
              {t('bulkCare.review')}
            </CareChip>
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text1)' }}>
              {t(`care.${type}`)} · {date}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text2)' }}>
              {detailSummary({ type, specificFields: normalizeDetails(type, details) }, t)}
            </p>
            <p className="text-sm" style={{ color: 'var(--text2)' }}>
              {t('bulkCare.selected', { count: selected.length })}
            </p>
            {reminderDate && (
              <p className="text-sm" style={{ color: 'var(--text2)' }}>
                {t('careForm.reminder')}: {reminderDate} · {reminderDescription}
              </p>
            )}
            {recipients.map(({ id, tree, draft }) => (
              <div key={id} className="rounded-2xl p-3" style={inputStyle}>
                <h3 className="text-sm font-semibold">{tree?.name ?? id}</h3>
                <p className="text-sm">{draft.condition && t(`condition.${draft.condition}`)}</p>
                <p className="whitespace-pre-wrap text-sm">{draft.description}</p>
              </div>
            ))}
            <CareChip
              disabled={saving}
              onClick={() => {
                setStep(2)
                setError('')
              }}
            >
              {t('bulkCare.backToEdit')}
            </CareChip>
            <button
              disabled={saving || !selected.length}
              onClick={save}
              className="rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-50"
              style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
            >
              {saving ? t('common.loading') : t('bulkCare.save', { count: selected.length })}
            </button>
          </>
        )}
        {error && (
          <p role="alert" className="text-sm" style={{ color: 'var(--color-warn)' }}>
            {error}
          </p>
        )}
      </div>
    </AppShell>
  )
}
