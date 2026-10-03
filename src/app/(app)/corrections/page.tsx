import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { corrections, documents } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TYPE_LABELS, TYPE_COLORS } from '@/lib/constants'

export default async function CorrectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const allCorrections = await db.select({
    id: corrections.id,
    originalText: corrections.originalText,
    correctedText: corrections.correctedText,
    correctionType: corrections.correctionType,
    explanation: corrections.explanation,
    wasAccepted: corrections.wasAccepted,
    createdAt: corrections.createdAt,
    documentId: corrections.documentId,
    documentTitle: documents.title,
  })
    .from(corrections)
    .leftJoin(documents, eq(corrections.documentId, documents.id))
    .where(eq(corrections.userId, user.id))
    .orderBy(desc(corrections.createdAt))

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-8">
      <h1 className="text-xl font-semibold mb-6">
        Todas las correcciones{' '}
        <span className="text-gray-400 font-normal text-base">({allCorrections.length})</span>
      </h1>

      {allCorrections.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>Aún no hay correcciones registradas</p>
          <p className="text-sm mt-1">
            Las correcciones aparecen aquí cuando practicas en el editor
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {allCorrections.map(correction => (
            <div key={correction.id} className="p-4 bg-white border rounded-xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[correction.correctionType] ?? 'bg-gray-100 text-gray-600'}`}>
                      {TYPE_LABELS[correction.correctionType] ?? correction.correctionType}
                    </span>
                    {correction.wasAccepted === true && (
                      <span className="text-xs text-green-600">Aceptada</span>
                    )}
                    {correction.wasAccepted === false && (
                      <span className="text-xs text-gray-400">Ignorada</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400 line-through mb-1">{correction.originalText}</div>
                  <div className="text-base text-gray-900">{correction.correctedText}</div>
                  {correction.explanation && (
                    <div className="text-sm text-gray-500 italic mt-1">{correction.explanation}</div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-gray-400">
                    {new Date(correction.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </div>
                  {correction.documentId && (
                    <Link
                      href={`/documents/${correction.documentId}`}
                      className="text-xs text-blue-500 hover:underline mt-1 block"
                    >
                      {correction.documentTitle ?? 'Ver documento'}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
