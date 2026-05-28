import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/chat/conversations/[conversationId]/participants
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

    // Get all participants for the conversation
    const { data: participants, error } = await supabase
      .from('conversation_participants')
      .select(`
        id,
        user_id,
        role,
        joined_at,
        profiles:user_id(id, email, full_name, avatar_url)
      `)
      .eq('conversation_id', params.conversationId)
      .order('joined_at', { ascending: true })

    if (error) {
      console.error('[v0] Error fetching participants:', error)
      return NextResponse.json(
        { error: 'Failed to fetch participants' },
        { status: 500 }
      )
    }

    return NextResponse.json(participants || [])
  } catch (error) {
    console.error('[v0] Error in GET participants:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/chat/conversations/[conversationId]/participants - Add participant
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

    // Check if current user is admin or owner
    const { data: currentUserRole, error: roleError } = await supabase
      .from('conversation_participants')
      .select('role')
      .eq('conversation_id', params.conversationId)
      .eq('user_id', user.user.id)
      .single()

    if (roleError || !currentUserRole || (currentUserRole.role !== 'admin' && currentUserRole.role !== 'owner')) {
      return NextResponse.json(
        { error: 'Only admins and owners can add participants' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId } = body

    // Add participant
    const { data: participant, error } = await supabase
      .from('conversation_participants')
      .insert({
        conversation_id: params.conversationId,
        user_id: userId,
        role: 'participant',
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error adding participant:', error)
      return NextResponse.json(
        { error: 'Failed to add participant' },
        { status: 500 }
      )
    }

    // Also add to users_conversations
    await supabase.from('users_conversations').insert({
      user_id: userId,
      conversation_id: params.conversationId,
    })

    return NextResponse.json(participant)
  } catch (error) {
    console.error('[v0] Error in POST participant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
