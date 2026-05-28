'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, X } from 'lucide-react'
import type { ConversationWithDetails, UserSearchResult } from '@/lib/types/chat'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
      // Create a new 1-on-1 conversation with the selected user
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

  return (
    <div className="w-full h-full flex flex-col bg-background border-r">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <Button onClick={onCreateNew} className="w-full" disabled={isLoading}>
          <Plus className="w-4 h-4 mr-2" /> Nova Conversa
        </Button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar utilizadores..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
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
        <div className="border-b bg-muted/30 max-h-48 overflow-y-auto">
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
                  className="w-full text-left p-2 rounded hover:bg-muted transition-colors text-sm"
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
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">
            Carregando...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            Nenhuma conversa ainda
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedId === conv.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {conv.name || 'Conversa Direta'}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.messages?.[conv.messages.length - 1]?.content ||
                        'Sem mensagens'}
                    </p>
                  </div>
                  {conv.updated_at && (
                    <p className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                      {formatDistanceToNow(new Date(conv.updated_at), {
                        locale: ptBR,
                        addSuffix: false,
                      })}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
