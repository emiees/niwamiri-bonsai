import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import SelectRow from '@/components/ui/SelectRow'
import { inputClass, inputStyle } from './styles'

export default function QuantityField({
  id,
  label,
  value,
  unit,
  units,
  onValue,
  onUnit,
}: {
  id: string
  label: string
  value: string
  unit: string
  units: string[]
  onValue: (value: string) => void
  onUnit: (value: string) => void
}) {
  const { t } = useTranslation()
  const [customChosen, setCustomChosen] = useState(false)
  const custom = customChosen || (!!unit && !units.includes(unit))
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs">
        {label}
      </label>
      <div className="grid grid-cols-2 items-center gap-2">
        <input
          id={id}
          inputMode="decimal"
          value={value}
          onChange={(e) => onValue(e.target.value)}
          className={inputClass}
          style={inputStyle}
        />
        <div>
          <label htmlFor={`${id}-unit`} className="sr-only">
            {t('careDetails.unitFor', { field: label })}
          </label>
          <SelectRow
            id={`${id}-unit`}
            value={custom ? '__custom__' : unit}
            onChange={(next) => {
              setCustomChosen(next === '__custom__')
              onUnit(next === '__custom__' ? (custom ? unit : '') : next)
            }}
            options={[
              { value: '', label: t('careDetails.selectUnit') },
              ...units.map((option) => ({
                value: option,
                label: t(`careDetails.units.${option}`, { defaultValue: option }),
              })),
              { value: '__custom__', label: t('careDetails.otherUnit') },
            ]}
          />
        </div>
      </div>
      {custom && (
        <label className="mt-2 block text-xs">
          {t('careDetails.customUnitFor', { field: label })}
          <input
            value={unit}
            onChange={(e) => onUnit(e.target.value)}
            className={`${inputClass} mt-1`}
            style={inputStyle}
          />
        </label>
      )}
    </div>
  )
}
