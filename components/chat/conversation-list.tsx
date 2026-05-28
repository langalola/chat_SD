'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, X } from 'lucide-react'
import type { ConversationWithDetails, UserSearchResult } from '@/lib/types/chat'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ProfileMenu } from './profile-menu'

interface ConversationListProps {
  conversations: ConversationWithDetails[]
  selectedId: string | null
  onSelect: (conversation: ConversationWithDetails) => void
  onCreateNew: () => void
  isLoading: boolean
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onCreateNew,
  isLoading,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  const handleSearch = async (query: string) => {
    setSearchQuery(query)

    if (!query || query.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    setShowSearchResults(true)
    try {
      const response = await fetch(`/api/search/users?q=${encodeURIComponent(query)}`)
      const results = await response.json()
      setSearchResults(Array.isArray(results) ? results : [])
    } catch (error) {
      console.error('[v0] Error searching users:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectUser = async (user: UserSearchResult) => {
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: null,
          isGroup: false,
          participantIds: [user.id],
        }),
      })
      const newConversation = await response.json()
      if (newConversation) {
        onSelect(newConversation)
        setSearchQuery('')
        setSearchResults([])
        setShowSearchResults(false)
      }
    } catch (error) {
      console.error('[v0] Error creating conversation:', error)
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    const name = conv.name || ''
    const lastMessage = conv.messages?.[conv.messages.length - 1]?.content || ''
    const searchTerm = searchQuery.toLowerCase()
    return name.toLowerCase().includes(searchTerm) || lastMessage.toLowerCase().includes(searchTerm)
  })

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold">Chats</h1>
          <div className="flex items-center gap-2">
            <Button
              onClick={onCreateNew}
              size="icon"
              variant="ghost"
              disabled={isLoading}
              className="rounded-full h-10 w-10 border border-muted-foreground/30 hover:bg-muted"
            >
              <Plus className="w-5 h-5" />
            </Button>
            <ProfileMenu />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Chats search..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 bg-muted/50 border-muted rounded-full"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('')
                setSearchResults([])
                setShowSearchResults(false)
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {showSearchResults && (
        <div className="border-b bg-muted/20 max-h-48 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Procurando...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-1 p-2">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                >
                  <p className="font-medium">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhum utilizador encontrado
            </div>
          )}
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Carregando...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Nenhuma conversa ainda
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conv) => {
              const lastMessage = conv.messages?.[conv.messages.length - 1]
              const isSelected = selectedId === conv.id

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv)}
                  className="w-full text-left transition-all"
                >
                  <Card
                    className={`border-0 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/40 hover:bg-muted/60'
                    }`}
                  >
                    <div className="p-3 flex items-center gap-3">
                      {/* Avatar */}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                          isSelected ? 'bg-primary-foreground/20' : 'bg-muted/60'
                        }`}
                      >
                        {(conv.name || 'D')[0].toUpperCase()}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="font-semibold truncate text-sm">
                            {conv.name || 'Conversa Direta'}
                          </p>
                          {lastMessage?.created_at && (
                            <p className={`text-xs whitespace-nowrap opacity-70 ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {formatDistanceToNow(new Date(lastMessage.created_at), {
                                locale: ptBR,
                                addSuffix: false,
                              })}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <p className={`text-xs truncate ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                            {lastMessage?.content || 'Sem mensagens'}
                          </p>
                          {lastMessage?.status === 'read' && (
                            <span className={`text-xs flex-shrink-0 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`}>✓✓</span>
                          )}
                        </div>
                      </div>

                      {/* Unread Indicator (if needed) */}
                      {false && (
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">2</span>
                        </div>
                      )}
                    </div>
                  </Card>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
