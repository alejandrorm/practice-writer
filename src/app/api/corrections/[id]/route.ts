import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { corrections } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const { wasAccepted } = body
  if (wasAccepted !== true && wasAccepted !== false && wasAccepted !== null) {
    return NextResponse.json({ error: 'Invalid wasAccepted value' }, { status: 400 })
  }

  const [correction] = await db.update(corrections)
    .set({ wasAccepted })
    .where(and(eq(corrections.id, id), eq(corrections.userId, user.id)))
    .returning()

  if (!correction) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(correction)
}
