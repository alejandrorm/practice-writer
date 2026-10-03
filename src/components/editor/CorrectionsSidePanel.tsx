'use client'

import { useState } from 'react'
import { TYPE_COLORS } from '@/lib/constants'
import type { CorrectionItem } from '@/lib/types'

interface CorrectionsSidePanelProps {
  corrections: CorrectionItem[]
}

const FILTERS = [
  { value: 'all', label: 'Todo' },
  { value: 'translation', label: 'Traducción' },
  { value: 'spelling', label: 'Ortografía' },
  { value: 'grammar', label: 'Gramática' },
  { value: 'expression', label: 'Expresión' },
]

export function CorrectionsSidePanel({ corrections }: CorrectionsSidePanelProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all'
    ? corrections
    : corrections.filter(c => c.correctionType === filter)

  if (!isOpen) {
    return (
      <div className="flex items-start border-l">
        <button
          onClick={() => setIsOpen(true)}
          className="flex flex-col items-center gap-2 px-2 py-4 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors h-full"
          title="Mostrar correcciones"
        >
          <span className="text-xs">◀</span>
          <span className="text-xs [writing-mode:vertical-rl] rotate-180 tracking-wide">
            Correcciones ({corrections.length})
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className="w-72 shrink-0 border-l bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b bg-white">
        <h2 className="font-medium text-sm">Correcciones ({corrections.length})</h2>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
          title="Ocultar panel"
        >
          ▶
        </button>
      </div>

      <div className="flex gap-1 p-2 flex-wrap border-b bg-white">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-xs px-2 py-1 rounded-full transition-colors ${
              filter === f.value
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">Sin correcciones</p>
        ) : (
          filtered.map(correction => (
            <div key={correction.id} className="p-3 border-b last:border-0 bg-white mb-px">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={`text-xs px-1.5 py-0.5 rounded ${TYPE_COLORS[correction.correctionType] ?? 'bg-gray-100 text-gray-600'}`}>
                  {correction.correctionType}
                </span>
                {correction.wasAccepted === true && <span className="text-xs text-green-600">✓</span>}
                {correction.wasAccepted === false && <span className="text-xs text-gray-400">—</span>}
              </div>
              <div className="text-xs text-gray-400 line-through mb-0.5 truncate">{correction.originalText}</div>
              <div className="text-sm text-gray-800">{correction.correctedText}</div>
              {correction.explanation && (
                <div className="text-xs text-gray-500 italic mt-1">{correction.explanation}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
