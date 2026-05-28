import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or owner of the conversation
    const { data: participant, error: partError } = await supabase
      .from('conversation_participants')
      .select('role')
      .eq('conversation_id', params.conversationId)
      .eq('user_id', user.user.id)
      .single()

    if (partError || !participant) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    if (participant.role !== 'admin' && participant.role !== 'owner') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()
    const { name, avatar_url, description } = body

    // Update conversation
    const { data: conversation, error } = await supabase
      .from('conversations')
      .update({
        name: name || null,
        avatar_url: avatar_url || null,
        description: description || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.conversationId)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error updating conversation:', error)
      return NextResponse.json(
        { error: 'Failed to update conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('[v0] Error in PATCH conversation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only owner can delete
    const { data: participant, error: partError } = await supabase
      .from('conversation_participants')
      .select('role')
      .eq('conversation_id', params.conversationId)
      .eq('user_id', user.user.id)
      .single()

    if (partError || !participant || participant.role !== 'owner') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Delete conversation (cascade will handle related data)
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', params.conversationId)

    if (error) {
      console.error('[v0] Error deleting conversation:', error)
      return NextResponse.json(
        { error: 'Failed to delete conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error in DELETE conversation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
