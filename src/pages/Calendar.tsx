import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Plus, Check, X } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { useCalendarStore } from '@/store/calendarStore'
import { useBonsaiStore } from '@/store/bonsaiStore'
import { formatDate } from '@/utils/dates'
import type { CalendarEvent } from '@/db/schema'

// ── Color coding ────────────────────────────────────────────────

const EVENT_COLORS: Record<CalendarEvent['type'], string> = {
  'care': '#22c55e',
  'manual-reminder': '#eab308',
  'followup-reminder': '#f97316',
  'ai-suggestion': '#a855f7',
}

// ── Add reminder sheet ──────────────────────────────────────────

function AddReminderSheet({
  bonsais,
  onClose,
  onSaved,
}: {
  bonsais: { id: string; name: string }[]
  onClose: () => void
  onSaved: () => void
}) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'es'
  const { addEvent } = useCalendarStore()

  const today = new Date()
  const defaultDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [bonsaiId, setBonsaiId] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!title.trim()) return
    setSaving(true)
    await addEvent({
      bonsaiId: bonsaiId || undefined,
      type: 'manual-reminder',
      title: title.trim(),
      date: new Date(date).getTime(),
      completed: false,
    })
    onSaved()
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl"
        style={{ background: 'var(--bg)', maxHeight: '80dvh' }}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text1)' }}>
            {lang === 'es' ? 'Nuevo recordatorio' : 'New reminder'}
          </h2>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-xl px-3 py-1.5 text-sm" style={{ color: 'var(--text2)' }}>
              {t('common.cancel')}
            </button>
            <button
              onClick={save}
              disabled={!title.trim() || saving}
              className="rounded-xl px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
              style={{ background: 'var(--color-accent)', color: 'var(--green1)' }}
            >
              {saving ? '...' : t('common.save')}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-3 px-5 pb-8">
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text3)' }}>
              {lang === 'es' ? 'Descripción *' : 'Description *'}
            </label>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={lang === 'es' ? 'Ej: Revisar el alambrado' : 'E.g. Check the wiring'}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{ background: 'var(--bg3)', color: 'var(--text1)', border: '1px solid var(--border)' }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text3)' }}>
              {lang === 'es' ? 'Fecha' : 'Date'}
            </label>
            <input
              type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{ background: 'var(--bg3)', color: 'var(--text1)', border: '1px solid var(--border)' }}
            />
          </div>
          {bonsais.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text3)' }}>
                {lang === 'es' ? 'Árbol (opcional)' : 'Tree (optional)'}
              </label>
              <select
                value={bonsaiId}
                onChange={(e) => setBonsaiId(e.target.value)}
                className="w-full appearance-none rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                style={{ background: 'var(--bg3)', color: 'var(--text1)', border: '1px solid var(--border)' }}
              >
                <option value="">{lang === 'es' ? 'Ninguno' : 'None'}</option>
                {bonsais.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Month grid ──────────────────────────────────────────────────

function MonthGrid({
  year, month,
  eventsByDate,
  selectedDay,
  onSelectDay,
}: {
  year: number
  month: number
  eventsByDate: Record<string, CalendarEvent[]>
  selectedDay: string | null
  onSelectDay: (key: string) => void
}) {
  const { i18n } = useTranslation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'es'

  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  const DAY_HEADERS = lang === 'en'
    ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    : ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="px-4">
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((h) => (
          <div key={h} className="py-1 text-center text-[10px] font-semibold" style={{ color: 'var(--text3)' }}>
            {h}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const key = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const dayEvents = eventsByDate[key] ?? []
          const isToday = key === todayKey
          const isSelected = key === selectedDay

          return (
            <button
              key={i}
              onClick={() => onSelectDay(key)}
              className="flex flex-col items-center gap-0.5 rounded-xl py-1"
              style={{
                background: isSelected ? 'var(--color-accent)' : isToday ? 'var(--bg3)' : 'transparent',
              }}
            >
              <span
                className="text-sm font-medium"
                style={{ color: isSelected ? 'var(--green1)' : isToday ? 'var(--color-accent)' : 'var(--text1)' }}
              >
                {day}
              </span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5">
                  {dayEvents.slice(0, 3).map((e, j) => (
                    <div
                      key={j}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: EVENT_COLORS[e.type] }}
                    />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────

export default function Calendar() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'es'

  const { events, fetchEvents, updateEvent } = useCalendarStore()
  const { bonsais, fetchBonsais } = useBonsaiStore()

  const [view, setView] = useState<'month' | 'list'>('month')
  const [today] = useState(new Date())
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [filterType, setFilterType] = useState<CalendarEvent['type'] | 'all'>('all')
  const [filterBonsaiId, setFilterBonsaiId] = useState<string>('')

  useEffect(() => { fetchBonsais() }, [fetchBonsais])

  useEffect(() => {
    if (view === 'month') {
      const from = new Date(viewYear, viewMonth, 1).getTime()
      const to = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59).getTime()
      fetchEvents(from, to)
    } else {
      const from = Date.now()
      const to = from + 30 * 24 * 60 * 60 * 1000
      fetchEvents(from, to)
    }
  }, [view, viewYear, viewMonth, fetchEvents])

  // Group events by date key (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    for (const ev of events) {
      const d = new Date(ev.date)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      if (!map[key]) map[key] = []
      map[key].push(ev)
    }
    return map
  }, [events])

  const selectedEvents = selectedDay ? (eventsByDate[selectedDay] ?? []) : []

  // 30-day list: group by date (with filters)
  const listGroups = useMemo(() => {
    const filtered = events.filter((ev) => {
      if (filterType !== 'all' && ev.type !== filterType) return false
      if (filterBonsaiId && ev.bonsaiId !== filterBonsaiId) return false
      return true
    })
    const sorted = [...filtered].sort((a, b) => a.date - b.date)
    const groups: { dateKey: string; events: CalendarEvent[] }[] = []
    for (const ev of sorted) {
      const d = new Date(ev.date)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      const g = groups.find((g) => g.dateKey === key)
      if (g) g.events.push(ev)
      else groups.push({ dateKey: key, events: [ev] })
    }
    return groups
  }, [events, filterType, filterBonsaiId])

  const MONTH_NAMES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const MONTH_NAMES_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const monthLabel = lang === 'en'
    ? `${MONTH_NAMES_EN[viewMonth]} ${viewYear}`
    : `${MONTH_NAMES_ES[viewMonth]} ${viewYear}`

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
    setSelectedDay(null)
  }

  const EventRow = ({ ev }: { ev: CalendarEvent }) => {
    const bonsai = bonsais.find((b) => b.id === ev.bonsaiId)
    return (
      <div
        className="flex items-start gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)', opacity: ev.completed ? 0.5 : 1 }}
      >
        <div
          className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: EVENT_COLORS[ev.type] }}
        />
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium"
            style={{
              color: 'var(--text1)',
              textDecoration: ev.completed ? 'line-through' : 'none',
            }}
          >
            {ev.title}
          </p>
          {bonsai && (
            <p className="text-xs" style={{ color: 'var(--text3)' }}>{bonsai.name}</p>
          )}
          <p className="text-xs" style={{ color: 'var(--text3)' }}>
            {t(`calendar.eventTypes.${ev.type}`)}
          </p>
        </div>
        {!ev.completed && (
          <button
            onClick={() => updateEvent(ev.id, { completed: true })}
            className="shrink-0 flex items-center gap-1 rounded-xl px-2 py-1 text-xs"
            style={{ background: 'var(--bg3)', color: 'var(--text3)' }}
          >
            <Check size={12} />
          </button>
        )}
      </div>
    )
  }

  return (
    <AppShell showNav>
      <Header
        title={t('calendar.title')}
        actions={
          <div className="flex items-center gap-1">
            <button
              onClick={() => setView((v) => v === 'month' ? 'list' : 'month')}
              className="rounded-xl px-3 py-1.5 text-xs font-medium"
              style={{
                background: 'var(--bg3)',
                color: 'var(--text2)',
                border: '1px solid var(--border)',
              }}
            >
              {view === 'month' ? t('calendar.listView') : t('calendar.monthView')}
            </button>
          </div>
        }
      />

      {view === 'month' ? (
        <>
          {/* Month nav */}
          <div className="flex items-center justify-between px-4 py-2">
            <button onClick={prevMonth} className="rounded-full p-1.5" style={{ color: 'var(--text2)' }}>
              <ChevronLeft size={18} />
            </button>
            <p className="text-sm font-semibold" style={{ color: 'var(--text1)' }}>{monthLabel}</p>
            <button onClick={nextMonth} className="rounded-full p-1.5" style={{ color: 'var(--text2)' }}>
              <ChevronRight size={18} />
            </button>
          </div>

          <MonthGrid
            year={viewYear}
            month={viewMonth}
            eventsByDate={eventsByDate}
            selectedDay={selectedDay}
            onSelectDay={(k) => setSelectedDay(selectedDay === k ? null : k)}
          />

          {/* Day events panel */}
          {selectedDay && (
            <div className="mx-4 mt-3 overflow-hidden rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between px-4 py-2.5">
                <p className="text-xs font-semibold" style={{ color: 'var(--text3)' }}>
                  {formatDate(new Date(selectedDay + 'T12:00:00').getTime())}
                </p>
                <button onClick={() => setSelectedDay(null)}>
                  <X size={15} style={{ color: 'var(--text3)' }} />
                </button>
              </div>
              {selectedEvents.length === 0 ? (
                <p className="px-4 pb-3 text-sm" style={{ color: 'var(--text3)' }}>
                  {t('calendar.noEvents')}
                </p>
              ) : (
                selectedEvents.map((ev) => <EventRow key={ev.id} ev={ev} />)
              )}
            </div>
          )}
        </>
      ) : (
        /* 30-day list */
        <div className="flex flex-col pb-4 gap-4">
          {/* Filter chips */}
          <div className="flex flex-col gap-2 px-4">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {(['all', 'care', 'manual-reminder', 'followup-reminder', 'ai-suggestion'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className="shrink-0 rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    background: filterType === type ? (type === 'all' ? 'var(--color-accent)' : EVENT_COLORS[type as CalendarEvent['type']] + '33') : 'var(--bg3)',
                    color: filterType === type ? (type === 'all' ? 'var(--green1)' : EVENT_COLORS[type as CalendarEvent['type']]) : 'var(--text3)',
                    border: `1px solid ${filterType === type ? (type === 'all' ? 'transparent' : EVENT_COLORS[type as CalendarEvent['type']]) : 'var(--border)'}`,
                  }}
                >
                  {type === 'all' ? (lang === 'es' ? 'Todos' : 'All') : t(`calendar.eventTypes.${type}`)}
                </button>
              ))}
            </div>
            {bonsais.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setFilterBonsaiId('')}
                  className="shrink-0 rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    background: filterBonsaiId === '' ? 'var(--color-accent)' : 'var(--bg3)',
                    color: filterBonsaiId === '' ? 'var(--green1)' : 'var(--text3)',
                    border: `1px solid ${filterBonsaiId === '' ? 'transparent' : 'var(--border)'}`,
                  }}
                >
                  {lang === 'es' ? 'Todos los árboles' : 'All trees'}
                </button>
                {bonsais.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setFilterBonsaiId(b.id)}
                    className="shrink-0 rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      background: filterBonsaiId === b.id ? 'var(--color-accent)' : 'var(--bg3)',
                      color: filterBonsaiId === b.id ? 'var(--green1)' : 'var(--text3)',
                      border: `1px solid ${filterBonsaiId === b.id ? 'transparent' : 'var(--border)'}`,
                    }}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col px-4 gap-4">
          {listGroups.length === 0 ? (
            <p className="py-20 text-center text-sm" style={{ color: 'var(--text3)' }}>
              {t('calendar.noEvents')}
            </p>
          ) : (
            listGroups.map((group) => (
              <div key={group.dateKey}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text3)' }}>
                  {formatDate(new Date(group.dateKey + 'T12:00:00').getTime())}
                </p>
                <div className="overflow-hidden rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  {group.events.map((ev) => <EventRow key={ev.id} ev={ev} />)}
                </div>
              </div>
            ))
          )}
          </div>
        </div>
      )}

      {/* Color legend */}
      <div className="flex flex-wrap gap-3 px-4 py-2 pb-4">
        {Object.entries(EVENT_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ background: color }} />
            <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
              {t(`calendar.eventTypes.${type}`)}
            </span>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
        style={{ background: 'var(--color-accent)' }}
      >
        <Plus size={24} style={{ color: 'var(--green1)' }} />
      </button>

      {showAdd && (
        <AddReminderSheet
          bonsais={bonsais.map((b) => ({ id: b.id, name: b.name }))}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false)
            if (view === 'month') {
              const from = new Date(viewYear, viewMonth, 1).getTime()
              const to = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59).getTime()
              fetchEvents(from, to)
            } else {
              fetchEvents(Date.now(), Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          }}
        />
      )}
    </AppShell>
  )
}
