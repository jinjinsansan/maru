'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getSupabaseWithUser() {
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
  return { supabase, user }
}

export async function startSession(chipBase: number) {
  const { supabase, user } = await getSupabaseWithUser()
  if (!user) return { error: '未認証' }

  const { data, error } = await supabase
    .from('game_sessions')
    .insert({ user_id: user.id, chip_base: chipBase })
    .select()
    .single()

  if (error) return { error: error.message }
  return { session: data }
}

export async function endSession(sessionId: string, totalProfit: number, oCount: number, xCount: number) {
  const { supabase, user } = await getSupabaseWithUser()
  if (!user) return { error: '未認証' }

  const { error } = await supabase
    .from('game_sessions')
    .update({
      ended_at: new Date().toISOString(),
      total_profit: totalProfit,
      o_count: oCount,
      x_count: xCount,
    })
    .eq('id', sessionId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function saveSet(setData: {
  session_id: string
  set_index: number
  results: string
  wins: number
  losses: number
  overshoot: number
  slashed: boolean
  used_unit_idx: number
  next_unit_idx: number
  set_profit: number
  cumulative_profit: number
}) {
  const { supabase, user } = await getSupabaseWithUser()
  if (!user) return { error: '未認証' }

  const { data, error } = await supabase
    .from('sets')
    .insert(setData)
    .select()
    .single()

  if (error) return { error: error.message }
  return { set: data }
}

export async function updateSlashedSets(setIds: string[]) {
  if (setIds.length === 0) return { success: true }

  const { supabase, user } = await getSupabaseWithUser()
  if (!user) return { error: '未認証' }

  const { error } = await supabase
    .from('sets')
    .update({ slashed: true })
    .in('id', setIds)

  if (error) return { error: error.message }
  return { success: true }
}

export async function updateSessionCounts(sessionId: string, oCount: number, xCount: number) {
  const { supabase, user } = await getSupabaseWithUser()
  if (!user) return { error: '未認証' }

  const { error } = await supabase
    .from('game_sessions')
    .update({ o_count: oCount, x_count: xCount })
    .eq('id', sessionId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function getActiveSession() {
  const { supabase, user } = await getSupabaseWithUser()
  if (!user) return { error: '未認証' }

  const { data: session } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('user_id', user.id)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (!session) return { session: null, sets: [] }

  const { data: sets } = await supabase
    .from('sets')
    .select('*')
    .eq('session_id', session.id)
    .order('set_index', { ascending: true })

  return { session, sets: sets || [] }
}

export async function getSessionHistory() {
  const { supabase, user } = await getSupabaseWithUser()
  if (!user) return { error: '未認証' }

  const { data } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('user_id', user.id)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false })

  return { sessions: data || [] }
}

export async function getUserProfile() {
  const { supabase, user } = await getSupabaseWithUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return data
}
