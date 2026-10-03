import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export type CorrectionType = 'translation' | 'spelling' | 'grammar' | 'expression' | 'ok'

export interface AnalysisResult {
  has_issues: boolean
  type: CorrectionType
  original: string
  suggestion: string
  explanation: string
}

const SYSTEM_PROMPT = `You are a French language tutor. Your student is a native Spanish speaker who is learning to write in FRENCH.

The student should be writing in FRENCH. Analyze the sentence they just wrote and detect any of these issues:

1. The sentence (or part of it) is in Spanish → type "translation", translate the whole sentence to French
2. A French word is misspelled → type "spelling"
3. The French grammar is incorrect → type "grammar"
4. The French is technically correct but sounds unnatural → type "expression"
5. The sentence is perfect French → type "ok"

CRITICAL RULE: If there is ANY Spanish word or phrase, you MUST return type "translation" and has_issues true. A sentence entirely in Spanish is NOT ok — it must be translated to French.

Return ONLY this JSON, no other text:
{
  "has_issues": boolean,
  "type": "translation" | "spelling" | "grammar" | "expression" | "ok",
  "original": "the sentence as written",
  "suggestion": "the corrected/translated French sentence",
  "explanation": "brief explanation in Spanish of what was corrected"
}

Examples:
- "Hoy fui al mercado." → has_issues: true, type: "translation", suggestion: "Aujourd'hui je suis allé au marché."
- "Je suis alé au marché." → has_issues: true, type: "spelling", suggestion: "Je suis allé au marché."
- "Je suis allé au marché." → has_issues: false, type: "ok"`

export async function analyzeSentence(sentence: string): Promise<AnalysisResult> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: sentence }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return { has_issues: false, type: 'ok', original: sentence, suggestion: sentence, explanation: '' }
  }
  try {
    return JSON.parse(jsonMatch[0]) as AnalysisResult
  } catch {
    return { has_issues: false, type: 'ok', original: sentence, suggestion: sentence, explanation: '' }
  }
}
