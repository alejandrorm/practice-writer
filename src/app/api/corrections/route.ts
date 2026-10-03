import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { corrections, documents } from '@/lib/db/schema'
import { eq, and, desc, SQL } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const documentId = request.nextUrl.searchParams.get('document_id')
  const type = request.nextUrl.searchParams.get('type')
  const wasAcceptedParam = request.nextUrl.searchParams.get('was_accepted')

  const conditions: SQL[] = [eq(corrections.userId, user.id)]
  if (documentId) conditions.push(eq(corrections.documentId, documentId))
  if (type) conditions.push(eq(corrections.correctionType, type))
  if (wasAcceptedParam !== null) {
    conditions.push(eq(corrections.wasAccepted, wasAcceptedParam === 'true'))
  }

  const results = await db.select().from(corrections)
    .where(and(...conditions))
    .orderBy(desc(corrections.createdAt))

  return NextResponse.json(results)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { documentId, originalText, correctedText, correctionType } = body
  if (!documentId || !originalText || !correctedText || !correctionType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify the document belongs to this user (S2: prevent IDOR)
  const [doc] = await db.select({ id: documents.id })
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.userId, user.id)))
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [correction] = await db.insert(corrections).values({
    documentId,
    userId: user.id,
    originalText,
    correctedText,
    correctionType,
    explanation: body.explanation ?? null,
    positionStart: body.positionStart ?? null,
    positionEnd: body.positionEnd ?? null,
    wasAccepted: body.wasAccepted ?? null,
  }).returning()

  return NextResponse.json(correction, { status: 201 })
}
