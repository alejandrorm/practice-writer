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

function getSentenceAtCursor(text: string, cursorPos: number): PendingSentence | null {
  if (!text) return null

  // Find sentence end: cursor may be right after punctuation or before it
  let end: number
  if (cursorPos > 0 && /[.!?]/.test(text[cursorPos - 1])) {
    end = cursorPos
  } else {
    end = cursorPos
    while (end < text.length && !/[.!?\n]/.test(text[end])) end++
    // Hit end of text or a line break first: sentence not yet complete
    if (end >= text.length || text[end] === '\n') return null
    end++  // include the punctuation
  }

  // Find sentence start: scan backwards from just before the period (line breaks also end a sentence)
  let start = end - 1
  while (start > 0 && !/[.!?\n]/.test(text[start - 1])) start--
  // Skip leading whitespace
  while (start < end && /\s/.test(text[start])) start++

  const sentenceText = text.slice(start, end).trim()
  if (!sentenceText || sentenceText.length < 2) return null

  return { text: sentenceText, start, end }
}

export function WritingEditor({ documentId, initialContent, initialCorrections }: WritingEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [corrections, setCorrections] = useState<CorrectionItem[]>(initialCorrections)
  const [suggestion, setSuggestion] = useState<AnalysisResult | null>(null)
  const [pendingSentence, setPendingSentence] = useState<PendingSentence | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

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

  const scheduleSentenceAnalysis = useCallback((sentence: PendingSentence) => {
    pendingAnalysis.current = sentence
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(runAnalysis, 800)
  }, [runAnalysis])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    const cursorPos = e.target.selectionStart ?? newContent.length
    setContent(newContent)

    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current)
    saveDebounceRef.current = setTimeout(() => saveDocument(newContent), 2000)

    const sentence = getSentenceAtCursor(newContent, cursorPos)
    if (sentence) scheduleSentenceAnalysis(sentence)
  }, [saveDocument, scheduleSentenceAnalysis])

  // Trigger analysis on text selection (mouseup with non-empty selection)
  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLTextAreaElement>) => {
    const { selectionStart, selectionEnd } = e.currentTarget
    if (selectionStart === selectionEnd) return

    const selectedText = content.slice(selectionStart, selectionEnd).trim()
    if (selectedText.length < 3) return

    scheduleSentenceAnalysis({ text: selectedText, start: selectionStart, end: selectionEnd })
  }, [content, scheduleSentenceAnalysis])

  const handleAccept = useCallback(async () => {
    if (!suggestion || !pendingSentence || isSubmitting.current) return
    isSubmitting.current = true

    const newContent = content.slice(0, pendingSentence.start) +
      suggestion.suggestion +
      content.slice(pendingSentence.end)

    setContent(newContent)
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
          onMouseUp={handleMouseUp}
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
