// Database types for chat system
export interface Conversation {
  id: string
  name: string | null
  is_group: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  user_id: string
  content: string
  status: 'sent' | 'delivered' | 'read'
  replied_to_id?: string | null
  created_at: string
  updated_at: string
}

export interface MessageWithReply extends Message {
  replied_to?: Message | null
  sender?: Profile | null
}

export interface UsersConversation {
  id: string
  user_id: string
  conversation_id: string
  joined_at: string
}

export interface ConversationParticipant {
  id: string
  conversation_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url?: string | null
  created_at: string
  updated_at: string
}

export interface MessageStatus {
  id: string
  message_id: string
  user_id: string
  status: 'sent' | 'delivered' | 'read'
  updated_at: string
}

export interface ConversationWithDetails extends Conversation {
  messages?: MessageWithReply[]
  conversation_participants?: ConversationParticipant[]
  last_message?: Message | null
}

export interface TypingIndicator {
  userId: string
  isTyping: boolean
}

export interface UserSearchResult {
  id: string
  email: string
  full_name: string
}

