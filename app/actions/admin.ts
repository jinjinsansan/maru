'use server'

import { createServerSupabaseClient } from '@/lib/supabase'
import { generateInviteCode } from '@/lib/auth'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getAuthUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function requireAdmin() {
  const user = await getAuthUser()
  if (!user) throw new Error('未認証')

  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!data?.is_admin) throw new Error('管理者権限がありません')
  return user
}

export async function createInviteCode(expiryDays: number = 7) {
  await requireAdmin()
  const user = await getAuthUser()
  const supabase = createServerSupabaseClient()

  const code = generateInviteCode()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiryDays)

  const { data, error } = await supabase
    .from('invite_codes')
    .insert({
      code,
      created_by: user!.id,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { invite: data }
}

export async function getInviteCodes() {
  await requireAdmin()
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('invite_codes')
    .select('*, used_user:users!invite_codes_used_by_fkey(display_name, email)')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { codes: data || [] }
}

export async function getAllMembers() {
  await requireAdmin()
  const supabase = createServerSupabaseClient()

  const { data: members, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { members: members || [] }
}

export async function getMemberSessions(userId?: string, dateFilter?: string) {
  await requireAdmin()
  const supabase = createServerSupabaseClient()

  let query = supabase
    .from('game_sessions')
    .select('*, user:users(display_name, email)')
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false })

  if (userId) {
    query = query.eq('user_id', userId)
  }

  if (dateFilter) {
    query = query.gte('started_at', `${dateFilter}T00:00:00`)
      .lt('started_at', `${dateFilter}T23:59:59`)
  }

  const { data, error } = await query

  if (error) return { error: error.message }
  return { sessions: data || [] }
}
