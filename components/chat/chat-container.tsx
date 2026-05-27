'use client'

import { useEffect, useState } from 'react'
import { ConversationList } from './conversation-list'
import { ChatWindow } from './chat-window'
import { createConversation, getUserConversations } from '@/lib/supabase/chat'
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
        const convs = await getUserConversations()
        setConversations(convs)
        if (convs.length > 0 && !selectedConversation) {
          setSelectedConversation(convs[0])
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadConversations()
  }, [])

  const handleCreateNew = async () => {
    setIsLoading(true)
    try {
      const newConv = await createConversation(null, false)
      if (newConv) {
        const convs = await getUserConversations()
        setConversations(convs)
        setSelectedConversation(
          convs.find((c) => c.id === newConv.id) || null
        )
      }
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
