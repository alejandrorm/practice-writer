'use client'

import type { AnalysisResult } from '@/lib/ai/analyze'

const TYPE_LABELS: Record<string, string> = {
  translation: 'Traducción',
  spelling: 'Ortografía',
  grammar: 'Gramática',
  expression: 'Expresión',
}

const TYPE_COLORS: Record<string, string> = {
  translation: 'bg-blue-100 text-blue-700',
  spelling: 'bg-red-100 text-red-700',
  grammar: 'bg-orange-100 text-orange-700',
  expression: 'bg-purple-100 text-purple-700',
}

interface SuggestionPopoverProps {
  suggestion: AnalysisResult
  onAccept: () => void
  onDismiss: () => void
}

export function SuggestionPopover({ suggestion, onAccept, onDismiss }: SuggestionPopoverProps) {
  return (
    <div className="absolute bottom-4 left-4 right-4 z-10 bg-white border border-gray-200 rounded-xl shadow-lg p-4 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-1.5">
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[suggestion.type] ?? 'bg-gray-100 text-gray-700'}`}>
            {TYPE_LABELS[suggestion.type] ?? suggestion.type}
          </span>
          <div className="text-sm text-gray-400 line-through truncate">{suggestion.original}</div>
          <div className="text-base font-medium text-gray-900">{suggestion.suggestion}</div>
          {suggestion.explanation && (
            <div className="text-xs text-gray-500 italic">{suggestion.explanation}</div>
          )}
        </div>
        <div className="flex gap-2 shrink-0 pt-1">
          <button
            onClick={onAccept}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Aceptar <span className="opacity-60 text-xs">Tab</span>
          </button>
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Ignorar <span className="opacity-60 text-xs">Esc</span>
          </button>
        </div>
      </div>
    </div>
  )
}
