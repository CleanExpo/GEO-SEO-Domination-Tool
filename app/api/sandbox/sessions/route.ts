import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/sandbox/sessions - List all active sessions
export async function GET(request: NextRequest) {
  try {
    const { data: sessions, error } = await supabase
      .from('sandbox_sessions')
      .select('*')
      .eq('active', true)
      .order('last_accessed', { ascending: false })

    if (error) throw error

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error fetching sandbox sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

// POST /api/sandbox/sessions - Create new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_name, git_repo_url } = body

    if (!session_name) {
      return NextResponse.json(
        { error: 'session_name is required' },
        { status: 400 }
      )
    }

    const { data: session, error } = await supabase
      .from('sandbox_sessions')
      .insert({
        session_name,
        git_repo_url: git_repo_url || null,
        file_tree: {},
        open_files: [],
        active: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error('Error creating sandbox session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
