import { createClient } from '@/lib/supabase/server'
import type {
  Conversation,
  Message,
  ConversationWithDetails,
} from '@/lib/types/chat'

/**
 * Create a new conversation (1-on-1 or group)
 * Automatically adds the creator to users_conversations
 */
export async function createConversation(
  name: string | null,
  isGroup: boolean
): Promise<Conversation | null> {
  const supabase = await createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
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
    return null
  }

  return data as Conversation
}

/**
 * Get all conversations for the current user
 */
export async function getUserConversations(): Promise<ConversationWithDetails[]> {
  const supabase = await createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) throw new Error('Not authenticated')

  // Get conversations joined by user via users_conversations table
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(
      `
      *,
      messages(id, content, user_id, created_at, updated_at)
    `
    )
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[v0] Error fetching conversations:', error)
    return []
  }

  return (conversations || []) as ConversationWithDetails[]
}

/**
 * Get a single conversation with its messages
 */
export async function getConversation(
  conversationId: string
): Promise<ConversationWithDetails | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('conversations')
    .select(
      `
      *,
      messages(id, content, user_id, created_at, updated_at) |
      order(created_at.desc()),
      conversation_participants(id, user_id, role)
    `
    )
    .eq('id', conversationId)
    .single()

  if (error) {
    console.error('[v0] Error fetching conversation:', error)
    return null
  }

  return data as ConversationWithDetails
}

/**
 * Add a user to a conversation (for group chats)
 */
export async function addUserToConversation(
  conversationId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) throw new Error('Not authenticated')

  // First, add to users_conversations
  const { error: memberError } = await supabase
    .from('users_conversations')
    .insert({
      user_id: userId,
      conversation_id: conversationId,
    })

  if (memberError) {
    console.error('[v0] Error adding user to conversation:', memberError)
    return false
  }

  // Then add to conversation_participants
  const { error: participantError } = await supabase
    .from('conversation_participants')
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      role: 'member',
    })

  if (participantError) {
    console.error('[v0] Error adding participant:', participantError)
    return false
  }

  return true
}

/**
 * Send a message to a conversation
 */
export async function sendMessage(
  conversationId: string,
  content: string
): Promise<Message | null> {
  const supabase = await createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      user_id: user.user.id,
      content,
    })
    .select()
    .single()

  if (error) {
    console.error('[v0] Error sending message:', error)
    return null
  }

  return data as Message
}

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(
  conversationId: string,
  limit: number = 50
): Promise<Message[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[v0] Error fetching messages:', error)
    return []
  }

  return (data || []).reverse() as Message[]
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)

  if (error) {
    console.error('[v0] Error deleting message:', error)
    return false
  }

  return true
}

/**
 * Create a 1-on-1 conversation between two users
 * Returns existing conversation if already exists
 */
export async function getOrCreateDMConversation(
  otherUserId: string
): Promise<Conversation | null> {
  const supabase = await createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) throw new Error('Not authenticated')

  // Check if conversation already exists
  const { data: existingConversations } = await supabase
    .from('users_conversations')
    .select('conversation_id')
    .eq('user_id', user.user.id)

  if (existingConversations) {
    for (const conv of existingConversations) {
      // Check if other user is also in this conversation
      const { data: otherUserConv } = await supabase
        .from('users_conversations')
        .select('id')
        .eq('conversation_id', conv.conversation_id)
        .eq('user_id', otherUserId)
        .single()

      if (otherUserConv) {
        // Get full conversation details
        const { data: conversation } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conv.conversation_id)
          .single()

        return conversation as Conversation
      }
    }
  }

  // Create new DM conversation
  const { data: newConv, error } = await supabase
    .from('conversations')
    .insert({
      name: null,
      is_group: false,
      created_by: user.user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('[v0] Error creating DM conversation:', error)
    return null
  }

  // Add other user to conversation
  await addUserToConversation(newConv.id, otherUserId)

  return newConv as Conversation
}
