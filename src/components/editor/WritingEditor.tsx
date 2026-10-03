'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import { SuggestionPopover } from './SuggestionPopover'
import { CorrectionsSidePanel } from './CorrectionsSidePanel'
import type { AnalysisResult } from '@/lib/ai/analyze'
import type { CorrectionItem } from '@/lib/types'

interface PendingSentence {
  text: string
  start: number
  end: number
}

interface WritingEditorProps {
  documentId: string
  initialContent: string
  initialCorrections: CorrectionItem[]
}

export function WritingEditor({ documentId, initialContent, initialCorrections }: WritingEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [corrections, setCorrections] = useState<CorrectionItem[]>(initialCorrections)
  const [suggestion, setSuggestion] = useState<AnalysisResult | null>(null)
  const [pendingSentence, setPendingSentence] = useState<PendingSentence | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const lastAnalyzedEnd = useRef(initialContent.length)
  const pendingAnalysis = useRef<PendingSentence | null>(null)
  const isSubmitting = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const saveDocument = useCallback(async (newContent: string) => {
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      })
      if (!res.ok) console.error('[save] failed:', res.status)
    } catch (err) {
      console.error('[save] network error:', err)
    }
  }, [documentId])

  const runAnalysis = useCallback(async () => {
    const pending = pendingAnalysis.current
    if (!pending) return

    lastAnalyzedEnd.current = pending.end
    pendingAnalysis.current = null

    setIsAnalyzing(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence: pending.text }),
      })
      if (!res.ok) return
      const result: AnalysisResult = await res.json()
      if (result.has_issues) {
        setSuggestion(result)
        setPendingSentence(pending)
      }
    } catch {
      // silently ignore network errors during analysis
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)

    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current)
    saveDebounceRef.current = setTimeout(() => saveDocument(newContent), 2000)

    const unanalyzed = newContent.slice(lastAnalyzedEnd.current)
    const match = /^(.*?[.!?])(\s|$)/.exec(unanalyzed)
    if (!match) return

    const sentenceText = match[1].trim()
    if (!sentenceText) return
    const leadingSpace = match[1].length - match[1].trimStart().length
    const sentenceStart = lastAnalyzedEnd.current + leadingSpace
    const sentenceEnd = lastAnalyzedEnd.current + match[1].length

    pendingAnalysis.current = { text: sentenceText, start: sentenceStart, end: sentenceEnd }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(runAnalysis, 800)
  }, [saveDocument, runAnalysis])

  const handleAccept = useCallback(async () => {
    if (!suggestion || !pendingSentence || isSubmitting.current) return
    isSubmitting.current = true

    const newContent = content.slice(0, pendingSentence.start) +
      suggestion.suggestion +
      content.slice(pendingSentence.end)

    setContent(newContent)
    lastAnalyzedEnd.current = pendingSentence.start + suggestion.suggestion.length
    setSuggestion(null)
    setPendingSentence(null)

    try {
      const res = await fetch('/api/corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          originalText: suggestion.original,
          correctedText: suggestion.suggestion,
          correctionType: suggestion.type,
          explanation: suggestion.explanation,
          positionStart: pendingSentence.start,
          positionEnd: pendingSentence.end,
          wasAccepted: true,
        }),
      })
      if (res.ok) {
        const correction = await res.json()
        setCorrections(prev => [correction, ...prev])
      }
      saveDocument(newContent)
    } finally {
      isSubmitting.current = false
    }
  }, [suggestion, pendingSentence, content, documentId, saveDocument])

  const handleDismiss = useCallback(async () => {
    if (!suggestion || !pendingSentence || isSubmitting.current) return
    isSubmitting.current = true

    setSuggestion(null)
    setPendingSentence(null)

    try {
      const res = await fetch('/api/corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          originalText: suggestion.original,
          correctedText: suggestion.suggestion,
          correctionType: suggestion.type,
          explanation: suggestion.explanation,
          positionStart: pendingSentence.start,
          positionEnd: pendingSentence.end,
          wasAccepted: false,
        }),
      })
      if (res.ok) {
        const correction = await res.json()
        setCorrections(prev => [correction, ...prev])
      }
    } finally {
      isSubmitting.current = false
    }
  }, [suggestion, pendingSentence, documentId])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!suggestion) return
      if (e.key === 'Escape') { e.preventDefault(); handleDismiss() }
      if (e.key === 'Tab') { e.preventDefault(); handleAccept() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [suggestion, handleAccept, handleDismiss])

  return (
    <div className="flex h-full">
      <div className="flex-1 relative min-w-0">
        {suggestion && (
          <SuggestionPopover
            suggestion={suggestion}
            onAccept={handleAccept}
            onDismiss={handleDismiss}
          />
        )}
        {!suggestion && isAnalyzing && (
          <div className="absolute top-3 right-3 text-xs text-gray-300 select-none">analizando…</div>
        )}
        <textarea
          value={content}
          onChange={handleChange}
          className="w-full h-full p-6 text-lg leading-relaxed resize-none border-0 outline-none bg-transparent"
          style={{ fontFamily: 'Georgia, serif', minHeight: 'calc(100vh - 8rem)' }}
          placeholder="Commence à écrire ici… (puedes mezclar español y francés)"
          spellCheck={false}
        />
      </div>
      <CorrectionsSidePanel corrections={corrections} />
    </div>
  )
}
