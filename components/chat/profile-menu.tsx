'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { EditProfileModal } from './edit-profile-modal'

export function ProfileMenu() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setError(null)
        const supabase = createClient()
        
        // Get authenticated user
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !currentUser) {
          console.log('[v0] Auth error or no user:', authError)
          router.push('/auth/login')
          return
        }

        console.log('[v0] Logged in user:', currentUser.id, currentUser.email)
        setUser(currentUser)

        // Fetch profile from API instead of direct query
        try {
          const response = await fetch(`/api/profiles/${currentUser.id}`)
          if (response.ok) {
            const profileData = await response.json()
            console.log('[v0] Profile loaded:', profileData)
            setProfile(profileData)
          } else {
            console.log('[v0] Profile not found, using email as fallback')
            setProfile({
              id: currentUser.id,
              full_name: currentUser.email?.split('@')[0] || 'Utilizador',
              email: currentUser.email,
            })
          }
        } catch (apiError) {
          console.error('[v0] Error fetching profile from API:', apiError)
          setProfile({
            id: currentUser.id,
            full_name: currentUser.email?.split('@')[0] || 'Utilizador',
            email: currentUser.email,
          })
        }
      } catch (error) {
        console.error('[v0] Error loading profile:', error)
        setError('Erro ao carregar perfil')
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [router])

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('[v0] Error logging out:', error)
    }
  }

  const handleProfileUpdated = (updatedProfile: any) => {
    setProfile(updatedProfile)
  }

  if (!user) return null

  const avatarLetter = profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-10 w-10 border border-muted-foreground/30 hover:bg-muted"
            disabled={isLoading}
            title="Menu de perfil"
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center font-bold text-sm text-primary-foreground">
              {avatarLetter}
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{profile?.full_name || 'Utilizador'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setShowEditProfile(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Editar Perfil</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Terminar Sessão</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        profile={profile}
        onProfileUpdated={handleProfileUpdated}
      />
    </>
  )
}
