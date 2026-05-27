'use client'

import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data?.user) {
        redirect('/auth/login')
      }
      setUser(data.user)
      setLoading(false)
    }

    getUser()
  }, [])

  if (loading) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-8 p-8">
      <div>
        <h1 className="text-4xl font-bold">Welcome to Chat</h1>
        <p className="text-gray-600 mt-2">Logged in as: {user.email}</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Chat Feature</h2>
        <p className="text-gray-600 mb-4">
          This is your protected chat page. Only authenticated users can access this page.
        </p>
        <button
          onClick={async () => {
            await supabase.auth.signOut()
            redirect('/auth/login')
          }}
          className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
