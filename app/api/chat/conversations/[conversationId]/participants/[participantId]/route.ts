import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// DELETE /api/chat/conversations/[conversationId]/participants/[participantId] - Remove participant
// PATCH /api/chat/conversations/[conversationId]/participants/[participantId] - Update role
export async function PATCH(
  request: Request,
  { params }: { params: { conversationId: string; participantId: string } }
) {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body // 'promote' | 'demote' | 'remove' | 'leave'

    // Get current user's role
    const { data: currentUserRole, error: roleError } = await supabase
      .from('conversation_participants')
      .select('role, user_id')
      .eq('conversation_id', params.conversationId)
      .eq('id', params.participantId)
      .single()

    if (roleError || !currentUserRole) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      )
    }

    const targetUserId = currentUserRole.user_id
    const targetRole = currentUserRole.role

    // Get current user's role
    const { data: myRole } = await supabase
      .from('conversation_participants')
      .select('role')
      .eq('conversation_id', params.conversationId)
      .eq('user_id', user.user.id)
      .single()

    // Validate permissions
    if (action === 'leave') {
      // Anyone can leave, but owner cannot leave if they're the only owner
      if (myRole?.role === 'owner') {
        const { data: otherOwners } = await supabase
          .from('conversation_participants')
          .select('id')
          .eq('conversation_id', params.conversationId)
          .eq('role', 'owner')

        if (!otherOwners || otherOwners.length <= 1) {
          return NextResponse.json(
            { error: 'Owner cannot leave group without another owner' },
            { status: 403 }
          )
        }
      }

      // Delete participant
      const { error } = await supabase
        .from('conversation_participants')
        .delete()
        .eq('id', params.participantId)

      if (error) {
        console.error('[v0] Error removing participant:', error)
        return NextResponse.json(
          { error: 'Failed to remove participant' },
          { status: 500 }
        )
      }

      // Remove from users_conversations
      await supabase
        .from('users_conversations')
        .delete()
        .eq('user_id', targetUserId)
        .eq('conversation_id', params.conversationId)

      return NextResponse.json({ success: true })
    }

    if (action === 'remove') {
      // Only owner and admin can remove
      if (myRole?.role !== 'owner' && myRole?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Only admins can remove participants' },
          { status: 403 }
        )
      }

      // Cannot remove owner
      if (targetRole === 'owner') {
        return NextResponse.json(
          { error: 'Cannot remove owner' },
          { status: 403 }
        )
      }

      const { error } = await supabase
        .from('conversation_participants')
        .delete()
        .eq('id', params.participantId)

      if (error) {
        console.error('[v0] Error removing participant:', error)
        return NextResponse.json(
          { error: 'Failed to remove participant' },
          { status: 500 }
        )
      }

      // Remove from users_conversations
      await supabase
        .from('users_conversations')
        .delete()
        .eq('user_id', targetUserId)
        .eq('conversation_id', params.conversationId)

      return NextResponse.json({ success: true })
    }

    if (action === 'promote') {
      // Only owner can promote
      if (myRole?.role !== 'owner') {
        return NextResponse.json(
          { error: 'Only owner can promote participants' },
          { status: 403 }
        )
      }

      // Cannot promote if already admin/owner
      if (targetRole === 'admin' || targetRole === 'owner') {
        return NextResponse.json(
          { error: 'Participant is already admin or owner' },
          { status: 400 }
        )
      }

      const { error } = await supabase
        .from('conversation_participants')
        .update({ role: 'admin' })
        .eq('id', params.participantId)

      if (error) {
        console.error('[v0] Error promoting participant:', error)
        return NextResponse.json(
          { error: 'Failed to promote participant' },
          { status: 500 }
        )
      }

      const { data: updated } = await supabase
        .from('conversation_participants')
        .select()
        .eq('id', params.participantId)
        .single()

      return NextResponse.json(updated)
    }

    if (action === 'demote') {
      // Only owner can demote
      if (myRole?.role !== 'owner') {
        return NextResponse.json(
          { error: 'Only owner can demote participants' },
          { status: 403 }
        )
      }

      // Cannot demote owner
      if (targetRole === 'owner') {
        return NextResponse.json(
          { error: 'Cannot demote owner' },
          { status: 403 }
        )
      }

      // Cannot demote if not admin
      if (targetRole !== 'admin') {
        return NextResponse.json(
          { error: 'Participant is not an admin' },
          { status: 400 }
        )
      }

      const { error } = await supabase
        .from('conversation_participants')
        .update({ role: 'participant' })
        .eq('id', params.participantId)

      if (error) {
        console.error('[v0] Error demoting participant:', error)
        return NextResponse.json(
          { error: 'Failed to demote participant' },
          { status: 500 }
        )
      }

      const { data: updated } = await supabase
        .from('conversation_participants')
        .select()
        .eq('id', params.participantId)
        .single()

      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[v0] Error in PATCH participant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
