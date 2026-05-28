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

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const supabase = createClient()
        const { data: userData } = await supabase.auth.getUser()
        
        if (!userData.user) {
          router.push('/auth/login')
          return
        }

        setUser(userData.user)

        // Get profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.user.id)
          .single()

        if (profileData) {
          setProfile(profileData)
        }
      } catch (error) {
        console.error('[v0] Error loading profile:', error)
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

  const avatarLetter = profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'

  return (
    <>
      <DropdownMenu>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-10 w-10 bg-muted/50 hover:bg-muted"
          disabled={isLoading}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center font-bold text-sm text-primary-foreground">
            {avatarLetter}
          </div>
        </Button>

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
