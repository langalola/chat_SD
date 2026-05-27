'use client'

import { useEffect, useState } from 'react'
import { ConversationList } from './conversation-list'
import { ChatWindow } from './chat-window'
import type { ConversationWithDetails } from '@/lib/types/chat'

export function ChatContainer() {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>(
    []
  )
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadConversations = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/chat/conversations')
        const convs = await response.json()
        setConversations(convs)
        if (convs.length > 0 && !selectedConversation) {
          setSelectedConversation(convs[0])
        }
      } catch (error) {
        console.error('[v0] Error loading conversations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadConversations()
  }, [])

  const handleCreateNew = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: null, isGroup: false }),
      })
      const newConv = await response.json()
      if (newConv) {
        const convRes = await fetch('/api/chat/conversations')
        const convs = await convRes.json()
        setConversations(convs)
        setSelectedConversation(convs.find((c: any) => c.id === newConv.id) || null)
      }
    } catch (error) {
      console.error('[v0] Error creating conversation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-full w-full gap-4 bg-background">
      {/* Left sidebar - Conversation list */}
      <div className="w-72 border rounded-lg">
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation?.id || null}
          onSelect={setSelectedConversation}
          onCreateNew={handleCreateNew}
          isLoading={isLoading}
        />
      </div>

      {/* Right side - Chat window */}
      <div className="flex-1 border rounded-lg">
        <ChatWindow
          conversation={selectedConversation}
          onClose={() => setSelectedConversation(null)}
        />
      </div>
    </div>
  )
}
