import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeSentence } from '@/lib/ai/analyze'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sentence } = await request.json()
  if (!sentence?.trim()) return NextResponse.json({ error: 'No sentence provided' }, { status: 400 })

  try {
    const result = await analyzeSentence(sentence)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[analyze] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
