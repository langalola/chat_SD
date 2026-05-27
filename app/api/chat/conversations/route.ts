import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get conversations where user is a member
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(
        `
        *,
        messages:messages(id, content, user_id, created_at, updated_at),
        conversation_participants:conversation_participants(id, user_id, role)
      `
      )
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching conversations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      )
    }

    return NextResponse.json(conversations || [])
  } catch (error) {
    console.error('[v0] Error in GET /api/chat/conversations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, isGroup } = body

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        name,
        is_group: isGroup,
        created_by: user.user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating conversation:', error)
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('[v0] Error in POST /api/chat/conversations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
