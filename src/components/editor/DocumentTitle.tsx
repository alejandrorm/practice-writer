'use client'

import { useState, useCallback } from 'react'

interface DocumentTitleProps {
  documentId: string
  initialTitle: string
}

export function DocumentTitle({ documentId, initialTitle }: DocumentTitleProps) {
  const [title, setTitle] = useState(initialTitle)

  const handleBlur = useCallback(async () => {
    const trimmed = title.trim()
    if (!trimmed) { setTitle(initialTitle); return }
    await fetch(`/api/documents/${documentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: trimmed }),
    })
  }, [title, documentId, initialTitle])

  return (
    <input
      value={title}
      onChange={e => setTitle(e.target.value)}
      onBlur={handleBlur}
      className="text-lg font-medium w-full outline-none bg-transparent placeholder:text-gray-400"
      placeholder="Título del documento"
    />
  )
}
