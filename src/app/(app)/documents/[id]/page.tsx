import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { documents, corrections } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { notFound, redirect } from 'next/navigation'
import { WritingEditor } from '@/components/editor/WritingEditor'
import { DocumentTitle } from '@/components/editor/DocumentTitle'

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [doc] = await db.select().from(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, user.id)))

  if (!doc) notFound()

  const docCorrections = await db.select().from(corrections)
    .where(and(eq(corrections.documentId, id), eq(corrections.userId, user.id)))
    .orderBy(desc(corrections.createdAt))

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="border-b px-6 py-2.5 bg-white">
        <DocumentTitle documentId={id} initialTitle={doc.title} />
      </div>
      <div className="flex-1 overflow-hidden">
        <WritingEditor
          documentId={id}
          initialContent={doc.content}
          initialCorrections={docCorrections.map(c => ({
            id: c.id,
            originalText: c.originalText,
            correctedText: c.correctedText,
            correctionType: c.correctionType,
            explanation: c.explanation,
            wasAccepted: c.wasAccepted,
            createdAt: c.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  )
}
