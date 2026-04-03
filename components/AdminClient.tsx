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
    if (code.used_by) return { text: 'Used', bg: 'rgba(132,142,156,0.1)', color: 'var(--text-muted)' }
    if (new Date(code.expires_at) < new Date()) return { text: 'Expired', bg: 'rgba(239,68,68,0.08)', color: 'var(--color-x)' }
    return { text: 'Active', bg: 'rgba(16,185,129,0.08)', color: 'var(--accent)' }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen min-h-dvh pb-8">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-primary)' }}>
        <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Admin
        </span>
        <div className="flex items-center gap-3">
          <a href="/mypage" className="text-[10px] font-medium px-2 py-1 rounded transition-colors"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
            Game
          </a>
          <button onClick={handleLogout} className="text-[10px] transition-colors" style={{ color: 'var(--text-muted)' }}>
            Logout
          </button>
        </div>
      </header>

      {/* タブ */}
      <div className="flex" style={{ borderBottom: '1px solid var(--border-primary)' }}>
        {(['invite', 'members'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2.5 text-xs font-medium tracking-wide transition-all"
            style={{
              color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            {t === 'invite' ? 'Invite Codes' : 'Members'}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4 max-w-2xl mx-auto fade-in">
        {/* 招待コード管理 */}
        {tab === 'invite' && (
          <div className="space-y-4">
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Expires:</span>
                <input
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value) || 7)}
                  min="1"
                  className="input-field w-14 px-2 py-1 text-center text-xs font-mono"
                />
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>days</span>
              </div>
              <button onClick={handleCreateCode} className="btn-primary ml-auto px-4 py-1.5 text-xs">
                Generate
              </button>
            </div>

            <div className="space-y-1.5">
              {codes.map(code => {
                const status = getCodeStatus(code)
                return (
                  <div key={code.id} className="glass-card flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold tracking-widest" style={{ color: 'var(--text-primary)' }}>
                        {code.code}
                      </span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={{ background: status.bg, color: status.color }}>
                        {status.text}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                        {new Date(code.expires_at).toLocaleDateString('ja-JP')}
                      </div>
                      {code.used_user && (
                        <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                          {code.used_user.display_name || code.used_user.email}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              {codes.length === 0 && (
                <div className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>
                  No invite codes yet
                </div>
              )}
            </div>
          </div>
        )}

        {/* メンバー管理 */}
        {tab === 'members' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-[10px] font-medium tracking-wider uppercase mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
                Members ({members.length})
              </h3>
              <div className="space-y-1.5">
                {members.map(member => (
                  <div key={member.id} className="glass-card flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                        {(member.display_name || member.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                          {member.display_name || member.email}
                        </div>
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{member.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {member.is_admin && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent)' }}>
                          Admin
                        </span>
                      )}
                      <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {new Date(member.last_login_at).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 日付フィルター */}
            <div className="glass-card p-3 flex items-center gap-2">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="input-field px-2 py-1 text-xs"
              />
              <button onClick={handleDateFilter} className="btn-primary px-3 py-1 text-[10px]">
                Filter
              </button>
              {dateFilter && (
                <button
                  onClick={() => { setDateFilter(''); getMemberSessions().then(r => { if (r.sessions) setSessions(r.sessions) }) }}
                  className="text-[10px] transition-colors" style={{ color: 'var(--text-muted)' }}
                >
                  Reset
                </button>
              )}
            </div>

            {/* セッション一覧 */}
            <div>
              <h3 className="text-[10px] font-medium tracking-wider uppercase mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
                Sessions
              </h3>
              <div className="space-y-1.5">
                {sessions.map(session => {
                  const profit = session.total_profit * session.chip_base
                  return (
                    <div key={session.id} className="glass-card flex items-center justify-between px-4 py-2.5">
                      <div>
                        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                          {session.user?.display_name || session.user?.email}
                        </span>
                        <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {new Date(session.started_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}{' '}
                          {new Date(session.started_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {new Date(session.ended_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span
                        className="font-mono font-semibold text-sm"
                        style={{
                          color: profit >= 0 ? 'var(--color-profit-plus)' : 'var(--color-profit-minus)',
                        }}
                      >
                        {profit >= 0 ? '+' : ''}{profit.toLocaleString()}
                      </span>
                    </div>
                  )
                })}
                {sessions.length === 0 && (
                  <div className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>
                    No sessions found
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
