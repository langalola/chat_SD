'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { X, Settings } from 'lucide-react'
import type { ConversationWithDetails, Message, TypingIndicator } from '@/lib/types/chat'
import { ChatRealtimeService } from '@/lib/supabase/realtime'
import { createClient } from '@/lib/supabase/client'
import { ManageGroupModal } from './manage-group-modal'
import { GroupSettingsModal } from './group-settings-modal'

interface ChatWindowProps {
  conversation: ConversationWithDetails | null
  onClose: () => void
}

export function ChatWindow({ conversation, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [showManageGroup, setShowManageGroup] = useState(false)
  const [showGroupSettings, setShowGroupSettings] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const realtimeServiceRef = useRef<ChatRealtimeService | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!conversation) return

    const supabase = createClient()
    realtimeServiceRef.current = new ChatRealtimeService()

    const loadMessages = async () => {
      try {
        const response = await fetch(
          `/api/chat/conversations/${conversation.id}/messages`
        )
        const msgs = await response.json()
        setMessages(msgs)

        // Get current user's role
        const partResponse = await fetch(
          `/api/chat/conversations/${conversation.id}/participants`
        )
        const participants = await partResponse.json()
        const { data: user } = await supabase.auth.getUser()
        const currentParticipant = participants.find(
          (p: any) => p.user_id === user.user?.id
        )
        if (currentParticipant) {
          setCurrentUserRole(currentParticipant.role)
        }
      } catch (error) {
        console.error('[v0] Error loading messages:', error)
      }
    }

    loadMessages()

    // Subscribe to real-time messages
    realtimeServiceRef.current.subscribeToMessages(
      supabase,
      conversation.id,
      (payload) => {
        console.log('[v0] New message:', payload)
        if (payload.new) {
          setMessages((prev) => [...prev, payload.new])
        }
      },
      (payload) => {
        console.log('[v0] Message deleted:', payload)
        if (payload.old) {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id))
        }
      },
      (payload) => {
        console.log('[v0] Message updated:', payload)
        if (payload.new) {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.new.id ? payload.new : m))
          )
        }
      }
    )

    // Subscribe to typing status
    realtimeServiceRef.current.subscribeToTyping(supabase, conversation.id, (payload) => {
      const { userId, isTyping } = payload.payload
      setTypingUsers((prev) => {
        const next = new Set(prev)
        if (isTyping) {
          next.add(userId)
        } else {
          next.delete(userId)
        }
        return next
      })
    })

    return () => {
      realtimeServiceRef.current?.unsubscribeAll()
    }
  }, [conversation])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!conversation || !newMessage.trim() || isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/chat/conversations/${conversation.id}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: newMessage,
            replied_to_id: replyTo?.id,
          }),
        }
      )
      const message = await response.json()
      if (message) {
        setMessages([...messages, message])
        setNewMessage('')
        setReplyTo(null)
      }
    } catch (error) {
      console.error('[v0] Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTyping = () => {
    if (!conversation) return
    const supabase = createClient()
    realtimeServiceRef.current?.broadcastTyping(supabase, conversation.id, '', true)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      realtimeServiceRef.current?.broadcastTyping(supabase, conversation.id, '', false)
    }, 1000)
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Selecione uma conversa</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="font-semibold text-lg">
            {conversation.name || 'Conversa Direta'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {conversation.conversation_participants?.length || 0} participantes
          </p>
        </div>
        <div className="flex gap-2">
          {conversation.is_group && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGroupSettings(true)}
              title="Configurações do grupo"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground">
            Sem mensagens ainda
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-3 group hover:bg-muted/50 p-2 rounded-lg transition">
              <div className="flex-1">
                {msg.replied_to_id && (
                  <div className="bg-muted/50 border-l-2 border-primary pl-2 mb-2 text-xs text-muted-foreground">
                    <p className="font-semibold">Resposta a mensagem</p>
                  </div>
                )}
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">{msg.content}</p>
                </div>
                <div className="flex gap-2 items-center mt-1">
                  <p className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {msg.status === 'read' ? '✓✓' : msg.status === 'delivered' ? '✓✓' : '✓'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(msg)}
                className="opacity-0 group-hover:opacity-100 transition"
              >
                Responder
              </Button>
            </div>
          ))
        )}
        {typingUsers.size > 0 && (
          <div className="flex gap-2 items-center text-xs text-muted-foreground">
            <p>Alguém está digitando</p>
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t p-4 space-y-2">
        {replyTo && (
          <div className="bg-muted p-2 rounded-lg flex items-start justify-between">
            <div className="text-xs">
              <p className="font-semibold">Respondendo a</p>
              <p className="text-muted-foreground truncate">{replyTo.content}</p>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="p-1 hover:bg-background rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value)
              handleTyping()
            }}
            placeholder="Digite uma mensagem..."
            className="min-h-10 max-h-24"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleSendMessage(e as any)
              }
            }}
          />
          <Button type="submit" disabled={isLoading || !newMessage.trim()}>
            Enviar
          </Button>
        </form>
      </div>

      {/* Manage Group Modal */}
      {conversation.is_group && (
        <ManageGroupModal
          isOpen={showManageGroup}
          onClose={() => setShowManageGroup(false)}
          conversationId={conversation.id}
          conversationName={conversation.name || 'Grupo'}
          participants={conversation.conversation_participants || []}
          currentUserRole={currentUserRole}
          onMembersUpdated={async () => {
            // Reload conversation data if needed
          }}
        />
      )}

      {/* Group Settings Modal */}
      {conversation.is_group && (
        <GroupSettingsModal
          isOpen={showGroupSettings}
          onClose={() => setShowGroupSettings(false)}
          conversation={conversation}
          currentUserRole={currentUserRole}
          onGroupUpdated={() => {
            // Reload conversation data if needed
            setShowGroupSettings(false)
          }}
          onGroupDeleted={() => {
            // Close chat window and reload list
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
