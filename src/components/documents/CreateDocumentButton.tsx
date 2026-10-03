'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function CreateDocumentButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Entry' }),
      })
      const doc = await res.json()
      router.push(`/documents/${doc.id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
    >
      {loading ? 'Creando...' : '+ Nuevo documento'}
    </button>
  )
}
