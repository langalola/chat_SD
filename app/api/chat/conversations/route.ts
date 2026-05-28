import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[v0] Fetching conversations for user:', user.user.id)

    // Get conversations where user is a member via users_conversations
    const { data: userConversations, error: userConvError } = await supabase
      .from('users_conversations')
      .select('conversation_id')
      .eq('user_id', user.user.id)

    if (userConvError) {
      console.error('[v0] Error fetching user conversations:', userConvError)
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      )
    }

    console.log('[v0] User conversations:', userConversations)

    const conversationIds = userConversations?.map((uc) => uc.conversation_id) || []

    if (conversationIds.length === 0) {
      return NextResponse.json([])
    }

    // Get full conversation details
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(
        `
        *,
        messages:messages(id, content, user_id, created_at, updated_at, status, replied_to_id),
        conversation_participants:conversation_participants(id, user_id, role)
      `
      )
      .in('id', conversationIds)
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
    const { name, isGroup, participantIds, avatar_url, description } = body

    console.log('[v0] Creating conversation for user:', user.user.id, 'with participants:', participantIds)

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        name,
        is_group: isGroup || false,
        created_by: user.user.id,
        avatar_url: avatar_url || null,
        description: description || null,
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

    // Add additional participants if provided
    if (participantIds && participantIds.length > 0) {
      const participants = participantIds.map((id: string) => ({
        conversation_id: conversation.id,
        user_id: id,
        role: 'participant',
      }))

      // Also add to users_conversations
      const usersConversations = participantIds.map((id: string) => ({
        user_id: id,
        conversation_id: conversation.id,
      }))

      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert(participants)

      const { error: userConvError } = await supabase
        .from('users_conversations')
        .insert(usersConversations)

      if (participantError || userConvError) {
        console.error('[v0] Error adding participants:', participantError || userConvError)
      }
    }

    console.log('[v0] Created conversation:', conversation)

    // Add creator as owner to conversation_participants and users_conversations
    const { error: creatorParticipantError } = await supabase
      .from('conversation_participants')
      .insert({
        conversation_id: conversation.id,
        user_id: user.user.id,
        role: 'owner',
      })

    const { error: creatorUserConvError } = await supabase
      .from('users_conversations')
      .insert({
        user_id: user.user.id,
        conversation_id: conversation.id,
      })

    if (creatorParticipantError || creatorUserConvError) {
      console.error(
        '[v0] Error adding creator:',
        creatorParticipantError || creatorUserConvError
      )
    }

    // Add additional participants if provided
    if (participantIds && participantIds.length > 0) {
      const participants = participantIds.map((id: string) => ({
        conversation_id: conversation.id,
        user_id: id,
        role: 'participant',
      }))

      // Also add to users_conversations
      const usersConversations = participantIds.map((id: string) => ({
        user_id: id,
        conversation_id: conversation.id,
      }))

      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert(participants)

      const { error: userConvError } = await supabase
        .from('users_conversations')
        .insert(usersConversations)

      if (participantError || userConvError) {
        console.error('[v0] Error adding participants:', participantError || userConvError)
      }
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
