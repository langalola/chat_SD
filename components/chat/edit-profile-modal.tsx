'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: any
  onProfileUpdated: (profile: any) => void
}

export function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}: EditProfileModalProps) {
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [description, setDescription] = useState(profile?.description || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!fullName.trim()) {
      setError('Nome é obrigatório')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        throw new Error('Utilizador não autenticado')
      }

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          description: description.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userData.user.id)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      onProfileUpdated(updatedProfile)
      onClose()
    } catch (err) {
      console.error('[v0] Error updating profile:', err)
      setError('Erro ao atualizar perfil. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Atualize suas informações de perfil
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input
              id="fullName"
              placeholder="Seu nome"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isSaving}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Fale um pouco sobre você..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
              rows={4}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar Alterações'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
