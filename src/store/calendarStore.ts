import { create } from 'zustand'
import type { CalendarEvent } from '../db/schema'
import { storageService } from '../services/storage/DexieStorageService'

interface CalendarState {
  events: CalendarEvent[]
  fetchEvents: (from: number, to: number) => Promise<void>
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => Promise<string>
  updateEvent: (id: string, data: Partial<CalendarEvent>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],

  fetchEvents: async (from, to) => {
    const events = await storageService.getEventsByDateRange(from, to)
    set({ events })
  },

  addEvent: async (event) => {
    const id = await storageService.saveEvent(event)
    const current = get().events
    const saved = await storageService.getEventsByDateRange(
      Math.min(...current.map((e) => e.date), event.date),
      Math.max(...current.map((e) => e.date), event.date)
    )
    set({ events: saved })
    return id
  },

  updateEvent: async (id, data) => {
    await storageService.updateEvent(id, data)
    set((state) => ({
      events: state.events.map((e) => (e.id === id ? { ...e, ...data } : e)),
    }))
  },

  deleteEvent: async (id) => {
    await storageService.deleteEvent(id)
    set((state) => ({ events: state.events.filter((e) => e.id !== id) }))
  },
}))
