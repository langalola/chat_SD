'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, ChevronRight, X } from 'lucide-react'
import type { UserSearchResult, ConversationWithDetails } from '@/lib/types/chat'
import { createClient } from '@/lib/supabase/client'

interface CreateConversationModalProps {
  isOpen: boolean
  onClose: () => void
  recentConversations: ConversationWithDetails[]
  onConversationCreated: (conversation: ConversationWithDetails) => void
}

export function CreateConversationModal({
  isOpen,
  onClose,
  recentConversations,
  onConversationCreated,
}: CreateConversationModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Group form state
  const [groupStep, setGroupStep] = useState<'members' | 'details'>(
    'members'
  )
  const [selectedMembers, setSelectedMembers] = useState<UserSearchResult[]>([])
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [groupAvatar, setGroupAvatar] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const supabase = createClient()

  // Get unique members from recent conversations (for quick selection)
  const getRecentUsers = () => {
    const usersMap = new Map<string, UserSearchResult>()
    recentConversations.forEach((conv) => {
      conv.conversation_participants?.forEach((p) => {
        if (p.user_id) {
          // This is simplified - in real app you'd fetch user details
          usersMap.set(p.user_id, {
            id: p.user_id,
            email: '',
            full_name: `User ${p.user_id.slice(0, 8)}`,
          })
        }
      })
    })
    return Array.from(usersMap.values())
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)

    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `/api/search/users?q=${encodeURIComponent(query)}`
      )
      const results = await response.json()
      setSearchResults(Array.isArray(results) ? results : [])
    } catch (error) {
      console.error('[v0] Error searching users:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectUserDM = async (user: UserSearchResult) => {
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
        onConversationCreated(newConversation)
        setSearchQuery('')
        setSearchResults([])
        onClose()
      }
    } catch (error) {
      console.error('[v0] Error creating conversation:', error)
    }
  }

  const handleSelectMember = (user: UserSearchResult) => {
    if (selectedMembers.find((m) => m.id === user.id)) {
      setSelectedMembers(selectedMembers.filter((m) => m.id !== user.id))
    } else {
      setSelectedMembers([...selectedMembers, user])
    }
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName.trim(),
          isGroup: true,
          participantIds: selectedMembers.map((m) => m.id),
          avatar_url: groupAvatar || null,
          description: groupDescription || null,
        }),
      })
      const newConversation = await response.json()
      if (newConversation) {
        onConversationCreated(newConversation)
        // Reset form
        setGroupStep('members')
        setSelectedMembers([])
        setGroupName('')
        setGroupDescription('')
        setGroupAvatar('')
        onClose()
      }
    } catch (error) {
      console.error('[v0] Error creating group:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const recentUsers = getRecentUsers()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Conversa</DialogTitle>
          <DialogDescription>
            Inicie uma conversa ou crie um grupo
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dm" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dm">Mensagem Direta</TabsTrigger>
            <TabsTrigger value="group">Grupo</TabsTrigger>
          </TabsList>

          {/* Direct Message Tab */}
          <TabsContent value="dm" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar utilizadores..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSearchResults([])
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {isSearching ? (
              <div className="text-center text-sm text-muted-foreground py-4">
                Procurando...
              </div>
            ) : searchResults.length > 0 ? (
              <ScrollArea className="h-64">
                <div className="space-y-2 pr-4">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUserDM(user)}
                      className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{user.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            ) : searchQuery ? (
              <div className="text-center text-sm text-muted-foreground py-4">
                Nenhum utilizador encontrado
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-4">
                Digite para pesquisar utilizadores
              </div>
            )}
          </TabsContent>

          {/* Group Tab */}
          <TabsContent value="group" className="space-y-4">
            {groupStep === 'members' ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar utilizadores..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('')
                        setSearchResults([])
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>

                {/* Selected Members Tags */}
                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
                    {selectedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="bg-primary text-primary-foreground px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                      >
                        <span>{member.full_name}</span>
                        <button
                          onClick={() => handleSelectMember(member)}
                          className="hover:opacity-70"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recent Users Section */}
                {!searchQuery && recentUsers.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                      CONVERSAS RECENTES
                    </p>
                    <ScrollArea className="h-40">
                      <div className="space-y-2 pr-4">
                        {recentUsers.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleSelectMember(user)}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                              selectedMembers.find((m) => m.id === user.id)
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <p className="font-medium text-sm">
                              {user.full_name}
                            </p>
                            <p className="text-xs opacity-70">{user.email}</p>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Search Results */}
                {(searchQuery || !recentUsers.length) && (
                  <div>
                    {searchQuery && (
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        RESULTADOS
                      </p>
                    )}
                    <ScrollArea className="h-40">
                      <div className="space-y-2 pr-4">
                        {isSearching ? (
                          <div className="text-center text-sm text-muted-foreground py-4">
                            Procurando...
                          </div>
                        ) : searchResults.length > 0 ? (
                          searchResults.map((user) => (
                            <button
                              key={user.id}
                              onClick={() => handleSelectMember(user)}
                              className={`w-full text-left p-3 rounded-lg transition-colors ${
                                selectedMembers.find((m) => m.id === user.id)
                                  ? 'bg-primary text-primary-foreground'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              <p className="font-medium text-sm">
                                {user.full_name}
                              </p>
                              <p className="text-xs opacity-70">{user.email}</p>
                            </button>
                          ))
                        ) : searchQuery ? (
                          <div className="text-center text-sm text-muted-foreground py-4">
                            Nenhum utilizador encontrado
                          </div>
                        ) : null}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => onClose()}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => setGroupStep('details')}
                    disabled={selectedMembers.length === 0}
                    className="flex-1"
                  >
                    Seguinte
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Nome do Grupo</label>
                    <Input
                      placeholder="Ex: Projeto de Matemática"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Avatar (URL ou emoji)
                    </label>
                    <Input
                      placeholder="Ex: 📚 ou https://..."
                      value={groupAvatar}
                      onChange={(e) => setGroupAvatar(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Descrição</label>
                    <Textarea
                      placeholder="Descrição opcional do grupo..."
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      className="mt-1 min-h-20"
                    />
                  </div>

                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                      MEMBROS SELECIONADOS ({selectedMembers.length})
                    </p>
                    <div className="space-y-1">
                      {selectedMembers.map((member) => (
                        <p key={member.id} className="text-sm">
                          {member.full_name}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setGroupStep('members')}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleCreateGroup}
                    disabled={
                      !groupName.trim() || selectedMembers.length === 0 || isCreating
                    }
                    className="flex-1"
                  >
                    {isCreating ? 'Criando...' : 'Criar Grupo'}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
