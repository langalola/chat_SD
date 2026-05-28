import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', params.conversationId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) {
      console.error('[v0] Error fetching messages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    return NextResponse.json(messages || [])
  } catch (error) {
    console.error('[v0] Error in GET messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, replied_to_id } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    console.log('[v0] Creating message with replied_to_id:', replied_to_id)

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: params.conversationId,
        user_id: user.user.id,
        content: content.trim(),
        replied_to_id: replied_to_id || null,
        status: 'sent',
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating message:', error)
      return NextResponse.json(
        { error: 'Failed to create message' },
        { status: 500 }
      )
    }

    // Auto-mark message as delivered for sender
    if (message) {
      await supabase.from('message_status').insert({
        message_id: message.id,
        user_id: user.user.id,
        status: 'delivered',
      })

      // Update message status to delivered
      await supabase
        .from('messages')
        .update({ status: 'delivered' })
        .eq('id', message.id)
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error('[v0] Error in POST message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
