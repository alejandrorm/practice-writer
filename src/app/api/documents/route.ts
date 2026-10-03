import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema'
import { eq, desc, asc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sort = request.nextUrl.searchParams.get('sort')
  const orderBy = sort === 'title' ? asc(documents.title) : desc(documents.updatedAt)

  const docs = await db.select().from(documents)
    .where(eq(documents.userId, user.id))
    .orderBy(orderBy)

  return NextResponse.json(docs)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const title = String(body.title ?? 'New Entry').slice(0, 500)

  const [doc] = await db.insert(documents).values({
    userId: user.id,
    title,
    content: body.content ?? '',
  }).returning()

  return NextResponse.json(doc, { status: 201 })
}
