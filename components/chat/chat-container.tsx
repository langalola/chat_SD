'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConversationList } from './conversation-list'
import { ChatWindow } from './chat-window'
import { CreateConversationModal } from './create-conversation-modal'
import { MobileConversationDrawer } from './mobile-conversation-drawer'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import type { ConversationWithDetails } from '@/lib/types/chat'

export function ChatContainer() {
  const router = useRouter()
  const [conversations, setConversations] = useState<ConversationWithDetails[]>(
    []
  )
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showMobileDrawer, setShowMobileDrawer] = useState(false)

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

  const handleCreateNew = () => {
    setShowCreateModal(true)
  }

  const handleConversationCreated = async (conversation: ConversationWithDetails) => {
    // Reload conversations
    const response = await fetch('/api/chat/conversations')
    if (response.ok) {
      const convs = await response.json()
      setConversations(Array.isArray(convs) ? convs : [])
      setSelectedConversation(conversation)
    }
  }

  return (
    <div className="flex h-full w-full bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-72 lg:w-80 border-r flex-col">
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation?.id || null}
          onSelect={setSelectedConversation}
          onCreateNew={handleCreateNew}
          isLoading={isLoading}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-3 border-b bg-card">
          <h1 className="text-lg font-bold">
            {selectedConversation?.name || 'Mensagens'}
          </h1>
          <Button
            onClick={() => setShowMobileDrawer(true)}
            size="icon"
            variant="ghost"
            className="rounded-lg h-9 w-9"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Chat window */}
        <div className="flex-1 overflow-hidden">
          {selectedConversation ? (
            <ChatWindow
              conversation={selectedConversation}
              onClose={() => setSelectedConversation(null)}
            />
          ) : (
            <div className="hidden md:flex w-full h-full items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">Selecione uma conversa</p>
                <p className="text-sm">Clique numa conversa para começar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Conversation Modal */}
      <CreateConversationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        recentConversations={conversations}
        onConversationCreated={handleConversationCreated}
      />

      {/* Mobile Drawer */}
      <MobileConversationDrawer
        isOpen={showMobileDrawer}
        onClose={() => setShowMobileDrawer(false)}
        conversations={conversations}
        selectedId={selectedConversation?.id || null}
        onSelect={setSelectedConversation}
        onCreateNew={handleCreateNew}
        isLoading={isLoading}
      />
    </div>
  )
}
