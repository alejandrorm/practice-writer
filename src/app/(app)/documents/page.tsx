import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { documents, corrections } from '@/lib/db/schema'
import { eq, desc, count } from 'drizzle-orm'
import Link from 'next/link'
import { CreateDocumentButton } from '@/components/documents/CreateDocumentButton'

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [docs, correctionCounts] = await Promise.all([
    db.select({
      id: documents.id,
      title: documents.title,
      content: documents.content,
      updatedAt: documents.updatedAt,
    })
      .from(documents)
      .where(eq(documents.userId, user.id))
      .orderBy(desc(documents.updatedAt)),

    db.select({ documentId: corrections.documentId, count: count() })
      .from(corrections)
      .where(eq(corrections.userId, user.id))
      .groupBy(corrections.documentId),
  ])

  const countMap = Object.fromEntries(correctionCounts.map(c => [c.documentId, c.count]))

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Mis documentos</h1>
        <CreateDocumentButton />
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-1">Aún no tienes documentos</p>
          <p className="text-sm">Crea uno nuevo para empezar a practicar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map(doc => (
            <Link
              key={doc.id}
              href={`/documents/${doc.id}`}
              className="block p-4 bg-white border rounded-xl hover:border-gray-400 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-medium text-gray-900 group-hover:text-black">{doc.title}</h2>
                  {doc.content && (
                    <p className="text-sm text-gray-400 mt-0.5 truncate">
                      {doc.content.slice(0, 100)}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-gray-400">
                    {new Date(doc.updatedAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                  {(countMap[doc.id] ?? 0) > 0 && (
                    <div className="text-xs text-blue-500 mt-0.5">
                      {countMap[doc.id]} correcciones
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
