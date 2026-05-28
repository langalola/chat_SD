import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: user } = await supabase.auth.getUser()

    if (!user.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Search users by email or full_name
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
      .neq('id', user.user.id) // Exclude current user
      .limit(20)

    if (error) {
      console.error('[v0] Error searching users:', error)
      return NextResponse.json({ error: 'Failed to search users' }, { status: 500 })
    }

    return NextResponse.json(profiles || [])
  } catch (error) {
    console.error('[v0] Error in GET /api/search/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
