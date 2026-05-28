'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { EditProfileModal } from './edit-profile-modal'

export function ProfileMenu() {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('[v0] Error logging out:', error)
    }
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="rounded-full h-10 w-10 border border-muted-foreground/30 hover:bg-muted flex items-center justify-center bg-gradient-to-br from-primary to-primary/60 font-bold text-sm text-primary-foreground"
          title="Menu de perfil"
        >
          A
        </button>

        {showMenu && (
          <div className="absolute right-0 top-12 w-56 bg-card border rounded-lg shadow-lg p-3 space-y-2 z-50">
            <div className="border-b pb-2">
              <p className="text-sm font-medium">Utilizador</p>
              <p className="text-xs text-muted-foreground">adilshaguala0@gmail.com</p>
            </div>

            <button
              onClick={() => {
                setShowEditProfile(true)
                setShowMenu(false)
              }}
              className="w-full text-left px-2 py-2 text-sm hover:bg-muted rounded flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Editar Perfil
            </button>

            <button
              onClick={() => {
                handleLogout()
                setShowMenu(false)
              }}
              className="w-full text-left px-2 py-2 text-sm text-red-600 hover:bg-muted rounded flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Terminar Sessão
            </button>
          </div>
        )}
      </div>

      <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        profile={null}
        onProfileUpdated={() => {}}
      />
    </>
  )
}
