import { afterEach, describe, expect, it, vi } from 'vitest'
import { OpenAIProvider } from '../services/ai/OpenAIProvider'
import { GeminiProvider } from '../services/ai/GeminiProvider'
import { ClaudeProvider } from '../services/ai/ClaudeProvider'
import { buildReminderPrompt, parseReminder } from '../services/ai/reminderPrompt'
import type { BonsaiContext, ReminderRequest } from '../services/ai/AIService'
import type { Care } from '../db/schema'
import { dateStrToTs } from '../utils/dates'

const request: ReminderRequest = {
  type: 'fertilizing',
  date: dateStrToTs('2026-10-28'),
  specificFields: { product: 'Abono', dose: 2, doseUnit: 'g/L' },
  season: 'spring',
  language: 'en',
  trees: [
    {
      id: 'one',
      name: 'Uno',
      species: 'Ficus',
      status: 'developing',
      condition: 'good',
      description: 'Primero',
    },
    {
      id: 'two',
      name: 'Dos',
      species: 'Ulmus',
      status: 'maintenance',
      condition: 'regular',
      description: 'Excepción',
    },
  ],
}
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
describe('F036 — sugerencia común por proveedor', () => {
  it.each([
    ['OpenAI', OpenAIProvider],
    ['Gemini', GeminiProvider],
    ['Claude', ClaudeProvider],
  ] as const)(
    '%s consulta una sola vez con todas las especies y datos del cuidado',
    async (name, Provider) => {
      const response = '```json\n{"date":"2026-11-03","description":"Review the trees"}\n```'
      const fetch = vi
        .fn()
        .mockResolvedValue({
          ok: true,
          json: async () =>
            name === 'OpenAI'
              ? { choices: [{ message: { content: response } }] }
              : name === 'Gemini'
                ? { candidates: [{ content: { parts: [{ text: response }] } }] }
                : { content: [{ text: response }] },
        })
      vi.stubGlobal('fetch', fetch)
      const result = await new Provider('test-only-key').suggestBulkReminder(request)
      expect(fetch).toHaveBeenCalledTimes(1)
      const body = JSON.parse(fetch.mock.calls[0][1].body)
      const prompt = name === 'Gemini' ? body.contents[0].parts[0].text : body.messages[0].content
      for (const text of [
        'Ficus',
        'Ulmus',
        'regular',
        'Excepción',
        'Abono',
        'g/L',
        'English',
        '2026-10-28',
      ])
        expect(prompt).toContain(text)
      expect(result).toEqual({ date: dateStrToTs('2026-11-03'), description: 'Review the trees' })
    }
  )
  it('el caso individual reutiliza el mismo contrato sin inventar otros árboles', async () => {
    const provider = new OpenAIProvider('test-only-key')
    const bulk = vi
      .spyOn(provider, 'suggestBulkReminder')
      .mockResolvedValue({ date: 1, description: 'Ok' })
    const care: Care = {
      id: 'care',
      bonsaiId: 'one',
      type: request.type,
      date: request.date,
      treeCondition: 'regular',
      specificFields: request.specificFields,
      description: 'Individual',
      createdAt: 1,
    }
    const context: BonsaiContext = {
      bonsai: {
        id: 'one',
        name: 'Uno',
        species: 'Ficus',
        status: 'developing',
        createdAt: 1,
        updatedAt: 1,
      },
      recentCares: [],
      classNotes: [],
      season: 'spring',
    }
    await provider.suggestReminder(care, context, 'es')
    expect(bulk).toHaveBeenCalledWith(
      expect.objectContaining({
        language: 'es',
        specificFields: request.specificFields,
        trees: [
          {
            id: 'one',
            name: 'Uno',
            species: 'Ficus',
            status: 'developing',
            condition: 'regular',
            description: 'Individual',
          },
        ],
      })
    )
  })
  it.each([
    '{}',
    '{"date":"2026-02-30","description":"Invalid"}',
    '{"date":"2026-11-03","description":"  "}',
    '{"date":null,"description":"Invalid"}',
    '{"date":"2026-10-27","description":"Too early"}',
    'invalid JSON',
  ])('rechaza respuestas inválidas o anteriores al cuidado: %s', (text) => {
    expect(() => parseReminder(text, request.date)).toThrow()
  })
  it('ancla el día sugerido al mediodía local y admite timestamps compatibles', () => {
    expect(
      parseReminder('{"date":"2026-11-03","description":"  Revisar  "}', request.date)
    ).toEqual({ date: dateStrToTs('2026-11-03'), description: 'Revisar' })
    expect(
      parseReminder(
        JSON.stringify({ date: dateStrToTs('2026-11-04'), description: 'Timestamp' }),
        request.date
      ).date
    ).toBe(dateStrToTs('2026-11-04'))
    expect(buildReminderPrompt(request)).toContain('ONE editable follow-up')
  })
})
