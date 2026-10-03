import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { documents, corrections } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const [doc] = await db.select().from(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, user.id)))

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const docCorrections = await db.select().from(corrections)
    .where(eq(corrections.documentId, id))
    .orderBy(desc(corrections.createdAt))

  return NextResponse.json({ ...doc, corrections: docCorrections })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (body.title !== undefined) updateData.title = body.title
  if (body.content !== undefined) updateData.content = body.content

  const [doc] = await db.update(documents)
    .set(updateData)
    .where(and(eq(documents.id, id), eq(documents.userId, user.id)))
    .returning()

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(doc)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await db.delete(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, user.id)))

  return NextResponse.json({ success: true })
}
