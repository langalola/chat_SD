'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { ConversationWithDetails, Message } from '@/lib/types/chat'

interface ChatWindowProps {
  conversation: ConversationWithDetails | null
  onClose: () => void
}

export function ChatWindow({ conversation, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!conversation) return

    const loadMessages = async () => {
      try {
        const response = await fetch(
          `/api/chat/conversations/${conversation.id}/messages`
        )
        const msgs = await response.json()
        setMessages(msgs)
      } catch (error) {
        console.error('[v0] Error loading messages:', error)
      }
    }

    loadMessages()
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
          body: JSON.stringify({ content: newMessage }),
        }
      )
      const message = await response.json()
      if (message) {
        setMessages([...messages, message])
        setNewMessage('')
      }
    } catch (error) {
      console.error('[v0] Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
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
        <Button variant="ghost" size="sm" onClick={onClose}>
          Fechar
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground">
            Sem mensagens ainda
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <div className="flex-1">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">{msg.content}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
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
    </div>
  )
}
