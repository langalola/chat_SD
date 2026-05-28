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
import { AlertCircle, Trash2 } from 'lucide-react'
import type { ConversationWithDetails } from '@/lib/types/chat'

interface GroupSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  conversation: ConversationWithDetails | null
  currentUserRole: string
  onGroupUpdated?: () => void
  onGroupDeleted?: () => void
}

export function GroupSettingsModal({
  isOpen,
  onClose,
  conversation,
  currentUserRole,
  onGroupUpdated,
  onGroupDeleted,
}: GroupSettingsModalProps) {
  const [name, setName] = useState(conversation?.name || '')
  const [avatar, setAvatar] = useState(conversation?.avatar_url || '')
  const [description, setDescription] = useState(
    conversation?.description || ''
  )
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'owner'
  const isOwner = currentUserRole === 'owner'

  const handleUpdate = async () => {
    if (!conversation) return

    setIsEditing(true)
    try {
      const response = await fetch(
        `/api/chat/conversations/${conversation.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            avatar_url: avatar.trim() || null,
            description: description.trim() || null,
          }),
        }
      )

      if (response.ok) {
        console.log('[v0] Grupo atualizado com sucesso')
        onGroupUpdated?.()
        onClose()
      }
    } catch (error) {
      console.error('[v0] Erro ao atualizar grupo:', error)
    } finally {
      setIsEditing(false)
    }
  }

  const handleDelete = async () => {
    if (!conversation || !isOwner) return

    setIsDeleting(true)
    try {
      const response = await fetch(
        `/api/chat/conversations/${conversation.id}`,
        {
          method: 'DELETE',
        }
      )

      if (response.ok) {
        console.log('[v0] Grupo eliminado com sucesso')
        onGroupDeleted?.()
        onClose()
      }
    } catch (error) {
      console.error('[v0] Erro ao eliminar grupo:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (!conversation) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurações do Grupo</DialogTitle>
          <DialogDescription>
            {isAdmin
              ? 'Edite os detalhes do grupo'
              : 'Informações do grupo'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium">Nome do Grupo</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isAdmin}
              className="mt-1"
            />
          </div>

          {/* Avatar */}
          <div>
            <label className="text-sm font-medium">Avatar</label>
            <Input
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="📚 ou https://..."
              disabled={!isAdmin}
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium">Descrição</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do grupo..."
              disabled={!isAdmin}
              className="mt-1 min-h-20"
            />
          </div>

          {/* Members Section */}
          <div>
            <p className="text-sm font-medium mb-2">
              Membros ({conversation.conversation_participants?.length || 0})
            </p>
            <ScrollArea className="h-48 border rounded-lg p-2">
              <div className="space-y-2 pr-4">
                {conversation.conversation_participants?.map((participant) => (
                  <div
                    key={participant.id}
                    className="p-2 rounded bg-muted/50 flex items-center justify-between"
                  >
                    <span className="text-sm font-medium truncate">
                      Membro • {participant.role}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Info Message */}
          {!isAdmin && (
            <div className="flex gap-2 p-3 bg-muted/50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Apenas administradores podem editar configurações do grupo
              </p>
            </div>
          )}

          {/* Delete Button (Owner Only) */}
          {isOwner && !showDeleteConfirm && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar Grupo
            </Button>
          )}

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="space-y-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm font-medium">
                Tem a certeza que deseja eliminar este grupo? Esta ação não pode
                ser desfeita.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Fechar
          </Button>
          {isAdmin && (
            <Button
              onClick={handleUpdate}
              disabled={isEditing}
              className="flex-1"
            >
              {isEditing ? 'Guardando...' : 'Guardar Alterações'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
