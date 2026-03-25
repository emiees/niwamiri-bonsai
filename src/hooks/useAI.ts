import type { AIService } from '../services/ai/AIService'
import { GeminiProvider } from '../services/ai/GeminiProvider'
import { OpenAIProvider } from '../services/ai/OpenAIProvider'
import { ClaudeProvider } from '../services/ai/ClaudeProvider'
import { decryptApiKey } from '../utils/crypto'

export async function createAIService(
  encryptedApiKey: string,
  provider: string,
  model?: string
): Promise<AIService> {
  const apiKey = await decryptApiKey(encryptedApiKey)

  switch (provider) {
    case 'openai':
      return new OpenAIProvider(apiKey, model)
    case 'claude':
      return new ClaudeProvider(apiKey, model)
    case 'gemini':
    default:
      return new GeminiProvider(apiKey, model)
  }
}
