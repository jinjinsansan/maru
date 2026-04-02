'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { getUserProfile } from '@/app/actions/game'
import { createInviteCode, getInviteCodes, getAllMembers, getMemberSessions } from '@/app/actions/admin'

interface InviteCode {
  id: string
  code: string
  created_at: string
  expires_at: string
  used_by: string | null
  used_at: string | null
  used_user: { display_name: string | null; email: string } | null
}

interface Member {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  is_admin: boolean
  last_login_at: string
}

interface MemberSession {
  id: string
  user_id: string
  started_at: string
  ended_at: string
  total_profit: number
  chip_base: number
  o_count: number
  x_count: number
  user: { display_name: string | null; email: string }
}

export default function AdminClient() {
  const [tab, setTab] = useState<'invite' | 'members'>('invite')
  const [codes, setCodes] = useState<InviteCode[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [sessions, setSessions] = useState<MemberSession[]>([])
  const [expiryDays, setExpiryDays] = useState(7)
  const [dateFilter, setDateFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const loadData = useCallback(async () => {
    const profile = await getUserProfile()
    if (!profile?.is_admin) {
      window.location.href = '/mypage'
      return
    }
    setIsAdmin(true)

    const [codesResult, membersResult, sessionsResult] = await Promise.all([
      getInviteCodes(),
      getAllMembers(),
      getMemberSessions(),
    ])

    if (codesResult.codes) setCodes(codesResult.codes)
    if (membersResult.members) setMembers(membersResult.members)
    if (sessionsResult.sessions) setSessions(sessionsResult.sessions)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateCode = async () => {
    const result = await createInviteCode(expiryDays)
    if (result.invite) {
      setCodes(prev => [result.invite, ...prev])
    }
  }

  const handleDateFilter = async () => {
    const result = await getMemberSessions(undefined, dateFilter || undefined)
    if (result.sessions) setSessions(result.sessions)
  }

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const getCodeStatus = (code: InviteCode) => {
    if (code.used_by) return { text: '使用済', color: 'text-gray-500' }
    if (new Date(code.expires_at) < new Date()) return { text: '期限切れ', color: 'text-red-400' }
    return { text: '未使用', color: 'text-green-400' }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen pb-8">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h1 className="text-lg font-bold" style={{ color: 'var(--accent-gold)' }}>
          管理者パネル
        </h1>
        <div className="flex items-center gap-3">
          <a href="/mypage" className="text-xs text-gray-400 hover:text-white transition-colors">
            マイページ
          </a>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </header>

      {/* タブ */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setTab('invite')}
          className="flex-1 py-2 text-sm font-medium transition-colors"
          style={{
            color: tab === 'invite' ? 'var(--accent-gold)' : '#666',
            borderBottom: tab === 'invite' ? '2px solid var(--accent-gold)' : '2px solid transparent',
          }}
        >
          招待コード
        </button>
        <button
          onClick={() => setTab('members')}
          className="flex-1 py-2 text-sm font-medium transition-colors"
          style={{
            color: tab === 'members' ? 'var(--accent-gold)' : '#666',
            borderBottom: tab === 'members' ? '2px solid var(--accent-gold)' : '2px solid transparent',
          }}
        >
          メンバー
        </button>
      </div>

      <div className="px-4 mt-4">
        {/* 招待コード管理 */}
        {tab === 'invite' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">有効期限:</label>
              <input
                type="number"
                value={expiryDays}
                onChange={(e) => setExpiryDays(parseInt(e.target.value) || 7)}
                min="1"
                className="w-16 px-2 py-1 rounded bg-white/5 border border-white/20 text-white text-center text-sm focus:outline-none"
              />
              <span className="text-xs text-gray-400">日</span>
              <button
                onClick={handleCreateCode}
                className="ml-auto px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-gold), #c9a84c)',
                  color: '#1a1a2e',
                }}
              >
                コード生成
              </button>
            </div>

            <div className="space-y-1">
              {codes.map(code => {
                const status = getCodeStatus(code)
                return (
                  <div key={code.id} className="flex items-center justify-between rounded-md px-3 py-2 bg-white/3 border border-white/5">
                    <div>
                      <span className="font-mono text-sm tracking-wider" style={{ color: 'var(--accent-gold)' }}>
                        {code.code}
                      </span>
                      <span className={`ml-2 text-xs ${status.color}`}>{status.text}</span>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <div>期限: {new Date(code.expires_at).toLocaleDateString('ja-JP')}</div>
                      {code.used_user && (
                        <div className="text-gray-400">
                          {code.used_user.display_name || code.used_user.email}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* メンバー管理 */}
        {tab === 'members' && (
          <div className="space-y-4">
            {/* メンバー一覧 */}
            <div>
              <h3 className="text-xs text-gray-400 mb-2">メンバー一覧 ({members.length}名)</h3>
              <div className="space-y-1">
                {members.map(member => (
                  <div key={member.id} className="flex items-center justify-between rounded-md px-3 py-2 bg-white/3 border border-white/5">
                    <div className="flex items-center gap-2">
                      {member.avatar_url && (
                        <img src={member.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                      )}
                      <div>
                        <div className="text-sm">{member.display_name || member.email}</div>
                        <div className="text-xs text-gray-500">{member.email}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {member.is_admin && <span className="text-yellow-500 mr-1">管理者</span>}
                      最終: {new Date(member.last_login_at).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 日付フィルター */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-2 py-1 rounded bg-white/5 border border-white/20 text-white text-sm focus:outline-none"
              />
              <button
                onClick={handleDateFilter}
                className="px-3 py-1 rounded text-xs bg-white/10 text-gray-300 hover:bg-white/20 transition-colors"
              >
                絞り込み
              </button>
              {dateFilter && (
                <button
                  onClick={() => { setDateFilter(''); getMemberSessions().then(r => { if (r.sessions) setSessions(r.sessions) }) }}
                  className="px-2 py-1 rounded text-xs text-gray-500 hover:text-white transition-colors"
                >
                  リセット
                </button>
              )}
            </div>

            {/* セッション一覧 */}
            <div>
              <h3 className="text-xs text-gray-400 mb-2">セッション一覧</h3>
              <div className="space-y-1">
                {sessions.map(session => {
                  const profit = session.total_profit * session.chip_base
                  return (
                    <div key={session.id} className="flex items-center justify-between rounded-md px-3 py-2 bg-white/3 border border-white/5 text-xs">
                      <div>
                        <span className="text-gray-300">
                          {session.user?.display_name || session.user?.email}
                        </span>
                        <span className="text-gray-500 ml-2">
                          {new Date(session.started_at).toLocaleDateString('ja-JP')}{' '}
                          {new Date(session.started_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                          {' ~ '}
                          {new Date(session.ended_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span
                        className="font-bold"
                        style={{
                          color: profit >= 0 ? 'var(--color-profit-plus)' : 'var(--color-profit-minus)',
                        }}
                      >
                        {profit >= 0 ? '+' : ''}{profit.toLocaleString()}円
                      </span>
                    </div>
                  )
                })}
                {sessions.length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-4">
                    セッションがありません
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
