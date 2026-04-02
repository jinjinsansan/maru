'use server'

import { createServerSupabaseClient } from '@/lib/supabase'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * 招待コード検証: 未使用 or 既にこのコードで登録済みかチェック
 */
export async function validateInviteCode(code: string): Promise<{ valid: boolean; needsName: boolean; error?: string }> {
  if (!code || code.trim().length === 0) {
    return { valid: false, needsName: false, error: '招待コードを入力してください' }
  }

  const supabase = createServerSupabaseClient()
  const upperCode = code.toUpperCase().trim()

  const { data, error } = await supabase
    .from('invite_codes')
    .select('*')
    .eq('code', upperCode)
    .single()

  if (error || !data) {
    return { valid: false, needsName: false, error: '無効な招待コードです' }
  }

  // 有効期限チェック
  if (new Date(data.expires_at) < new Date()) {
    return { valid: false, needsName: false, error: '招待コードの有効期限が切れています' }
  }

  // 使用済み → 既存ユーザーの再ログイン
  if (data.used_by) {
    return { valid: true, needsName: false }
  }

  // 未使用 → 新規登録（ニックネームが必要）
  return { valid: true, needsName: true }
}

/**
 * 招待コードでログイン（既存ユーザー）
 */
export async function loginWithCode(code: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient()
  const upperCode = code.toUpperCase().trim()
  const email = `${upperCode.toLowerCase()}@marugame.local`
  const password = upperCode

  const cookieStore = await cookies()
  const clientSupabase = createServerClient(
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

  const { error: signInError } = await clientSupabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    return { success: false, error: 'ログインに失敗しました' }
  }

  // last_login_at 更新
  await supabase.from('users').update({ last_login_at: new Date().toISOString() }).eq('email', email)

  return { success: true }
}

/**
 * 招待コードで新規登録
 */
export async function registerWithCode(code: string, displayName: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient()
  const upperCode = code.toUpperCase().trim()
  const email = `${upperCode.toLowerCase()}@marugame.local`
  const password = upperCode

  // Supabase Auth でユーザー作成
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return { success: false, error: 'ユーザー作成に失敗しました: ' + authError?.message }
  }

  // users テーブルに登録
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      display_name: displayName,
    })

  if (userError) {
    return { success: false, error: 'ユーザー情報の保存に失敗しました: ' + userError.message }
  }

  // 招待コードを使用済みに
  await supabase
    .from('invite_codes')
    .update({ used_by: authData.user.id, used_at: new Date().toISOString() })
    .eq('code', upperCode)

  // セッション作成（パスワードでサインイン）
  const cookieStore = await cookies()
  const clientSupabase = createServerClient(
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

  const { error: signInError } = await clientSupabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    return { success: false, error: 'ログインに失敗しました: ' + signInError.message }
  }

  return { success: true }
}
