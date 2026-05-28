'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Crown, Shield, Trash2, Plus, Search, X } from 'lucide-react'
import type { ConversationParticipant } from '@/lib/types/chat'

interface ManageGroupModalProps {
  isOpen: boolean
  onClose: () => void
  conversationId: string
  conversationName: string
  participants: ConversationParticipant[]
  currentUserRole: string
  onMembersUpdated: () => Promise<void>
}

interface ParticipantWithProfile extends ConversationParticipant {
  profiles?: {
    id: string
    email: string
    full_name: string
    avatar_url?: string | null
  }
}

export function ManageGroupModal({
  isOpen,
  onClose,
  conversationId,
  conversationName,
  participants,
  currentUserRole,
  onMembersUpdated,
}: ManageGroupModalProps) {
  const [participantsList, setParticipantsList] = useState<ParticipantWithProfile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadParticipants()
    }
  }, [isOpen])

  const loadParticipants = async () => {
    try {
      const response = await fetch(
        `/api/chat/conversations/${conversationId}/participants`
      )
      const data = await response.json()
      setParticipantsList(data)
    } catch (error) {
      console.error('[v0] Error loading participants:', error)
    }
  }

  const handlePromote = async (participantId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/chat/conversations/${conversationId}/participants/${participantId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'promote' }),
        }
      )
      if (response.ok) {
        await loadParticipants()
      }
    } catch (error) {
      console.error('[v0] Error promoting participant:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async (participantId: string) => {
    if (!confirm('Tem a certeza que deseja remover este participante?')) return

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/chat/conversations/${conversationId}/participants/${participantId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'remove' }),
        }
      )
      if (response.ok) {
        await loadParticipants()
      }
    } catch (error) {
      console.error('[v0] Error removing participant:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = participantsList.filter(
    (p) =>
      p.profiles?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.profiles?.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{conversationName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Procurar participante..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Add Member Button */}
          {canManage && (
            <Button
              onClick={() => setShowAddMember(!showAddMember)}
              className="w-full"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Membro
            </Button>
          )}

          {/* Members List */}
          <ScrollArea className="h-96 border rounded-lg p-2">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Nenhum participante encontrado
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    {/* Info */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                        {participant.profiles?.full_name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {participant.profiles?.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {participant.profiles?.email}
                        </p>
                      </div>
                    </div>

                    {/* Role & Actions */}
                    <div className="flex items-center gap-2 ml-2">
                      {/* Role Badge */}
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10">
                        {participant.role === 'owner' && (
                          <>
                            <Crown className="w-3 h-3" />
                            Owner
                          </>
                        )}
                        {participant.role === 'admin' && (
                          <>
                            <Shield className="w-3 h-3" />
                            Admin
                          </>
                        )}
                        {participant.role === 'participant' && (
                          <span>Participante</span>
                        )}
                      </div>

                      {/* Actions */}
                      {canManage && participant.role !== 'owner' && (
                        <div className="flex gap-1">
                          {participant.role === 'participant' && currentUserRole === 'owner' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handlePromote(participant.id)}
                              disabled={isLoading}
                              title="Promover a admin"
                            >
                              <Shield className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemove(participant.id)}
                            disabled={isLoading}
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Total de participantes: {participantsList.length}</p>
            {currentUserRole !== 'participant' && (
              <p className="text-primary">Você é um {currentUserRole}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
