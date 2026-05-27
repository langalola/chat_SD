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
  created_at: string
  updated_at: string
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

export interface ConversationWithDetails extends Conversation {
  messages?: Message[]
  participants?: ConversationParticipant[]
  last_message?: Message | null
}
