'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConversationList } from './conversation-list'
import { ChatWindow } from './chat-window'
import type { ConversationWithDetails } from '@/lib/types/chat'

export function ChatContainer() {
  const router = useRouter()
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
        
        if (response.status === 401) {
          console.log('[v0] Unauthorized, redirecting to login')
          router.push('/auth/login')
          return
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch conversations: ${response.status}`)
        }

        const convs = await response.json()
        setConversations(Array.isArray(convs) ? convs : [])
        if (convs.length > 0 && !selectedConversation) {
          setSelectedConversation(convs[0])
        }
      } catch (error) {
        console.error('[v0] Error loading conversations:', error)
        setConversations([])
      } finally {
        setIsLoading(false)
      }
    }

    loadConversations()
  }, [selectedConversation, router])

  const handleCreateNew = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: null, isGroup: false }),
      })

      if (response.status === 401) {
        router.push('/auth/login')
        return
      }

      if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.status}`)
      }

      const newConv = await response.json()
      if (newConv) {
        const convRes = await fetch('/api/chat/conversations')
        if (convRes.ok) {
          const convs = await convRes.json()
          setConversations(Array.isArray(convs) ? convs : [])
          setSelectedConversation(convs.find((c: any) => c.id === newConv.id) || null)
        }
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
