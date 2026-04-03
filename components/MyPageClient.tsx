'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { finalizeSet, SEQ, type SetData } from '@/lib/gameLogic'
import InputPanel from '@/components/InputPanel'
import GameBoard from '@/components/GameBoard'
import SessionSummary from '@/components/SessionSummary'
import {
  startSession,
  endSession,
  saveSet,
  updateSlashedSets,
  updateSessionCounts,
  getActiveSession,
  getSessionHistory,
  getUserProfile,
} from '@/app/actions/game'

interface UserProfile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  is_admin: boolean
}

interface GameSession {
  id: string
  chip_base: number
  started_at: string
  ended_at: string | null
  total_profit: number
  o_count: number
  x_count: number
}

export default function MyPageClient() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<GameSession | null>(null)
  const [sets, setSets] = useState<SetData[]>([])
  const [currentTurns, setCurrentTurns] = useState<string[]>([])
  const [chipBase, setChipBase] = useState(1)
  const [chipBaseInput, setChipBaseInput] = useState('1')
  const [history, setHistory] = useState<GameSession[]>([])
  const [loading, setLoading] = useState(true)

  const currentUnitIdx = sets.length > 0 ? sets[sets.length - 1].next_unit_idx : 0
  const cumulativeProfit = sets.length > 0 ? sets[sets.length - 1].cumulative_profit : 0
  const prevOvershoot = sets.length > 0 ? sets[sets.length - 1].overshoot : 0
  const totalO = sets.reduce((sum, s) => sum + s.wins, 0)
  const totalX = sets.reduce((sum, s) => sum + s.losses, 0)
  const totalTurns = totalO + totalX

  const loadData = useCallback(async () => {
    const [profile, activeResult, historyResult] = await Promise.all([
      getUserProfile(),
      getActiveSession(),
      getSessionHistory(),
    ])

    if (profile) setUser(profile)

    if (activeResult.session) {
      setSession(activeResult.session)
      setChipBase(activeResult.session.chip_base)
      setChipBaseInput(String(activeResult.session.chip_base))
      const loadedSets = (activeResult.sets || []).map((s: Record<string, unknown>) => ({
        id: s.id as string,
        session_id: s.session_id as string,
        set_index: s.set_index as number,
        results: s.results as string,
        wins: s.wins as number,
        losses: s.losses as number,
        overshoot: s.overshoot as number,
        slashed: s.slashed as boolean,
        used_unit_idx: s.used_unit_idx as number,
        next_unit_idx: s.next_unit_idx as number,
        set_profit: s.set_profit as number,
        cumulative_profit: s.cumulative_profit as number,
      }))
      setSets(loadedSets)
    }

    if (historyResult.sessions) setHistory(historyResult.sessions)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleStartSession = async () => {
    const base = parseFloat(chipBaseInput) || 1
    setChipBase(base)
    const result = await startSession(base)
    if (result.error) {
      alert('エラー: ' + result.error)
      return
    }
    if (result.session) {
      setSession(result.session)
      setSets([])
      setCurrentTurns([])
    }
  }

  const handleEndSession = async () => {
    if (!session) return
    await endSession(session.id, cumulativeProfit, totalO, totalX)
    const updatedSession = { ...session, ended_at: new Date().toISOString(), total_profit: cumulativeProfit, o_count: totalO, x_count: totalX }
    setHistory(prev => [updatedSession, ...prev])
    setSession(null)
    setSets([])
    setCurrentTurns([])
  }

  const handleInput = async (value: 'O' | 'X') => {
    if (!session) return
    const newTurns = [...currentTurns, value]
    setCurrentTurns(newTurns)

    if (newTurns.length === 7) {
      const results = newTurns.join('')
      const setCopy = sets.map(s => ({ ...s }))

      const { newSet, slashedIds } = finalizeSet(
        results, setCopy, session.id, currentUnitIdx, cumulativeProfit, prevOvershoot,
      )

      const [saveResult] = await Promise.all([
        saveSet(newSet),
        updateSlashedSets(slashedIds),
        updateSessionCounts(session.id, totalO + newSet.wins, totalX + newSet.losses),
      ])

      if (saveResult.set) newSet.id = saveResult.set.id

      const updatedSets = setCopy.map(s =>
        slashedIds.includes(s.id!) ? { ...s, slashed: true } : s
      )

      setSets([...updatedSets, newSet])
      setCurrentTurns([])
    }
  }

  const handleUndo = () => {
    if (currentTurns.length > 0) setCurrentTurns(prev => prev.slice(0, -1))
  }

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="min-h-screen min-h-dvh pb-8">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-primary)' }}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            〇❌
          </span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            {user?.display_name || 'Guest'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {user?.is_admin && (
            <a href="/admin" className="text-[10px] font-medium px-2 py-1 rounded transition-colors"
              style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent)' }}>
              Admin
            </a>
          )}
          <button onClick={handleLogout} className="text-[10px] transition-colors" style={{ color: 'var(--text-muted)' }}>
            Logout
          </button>
        </div>
      </header>

      {/* セッション未開始 */}
      {!session && (
        <div className="px-4 mt-6 max-w-lg mx-auto space-y-5 fade-in">
          <div className="glass-card p-5">
            <h2 className="text-[10px] font-medium tracking-wider uppercase mb-4" style={{ color: 'var(--text-muted)' }}>
              Game Settings
            </h2>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>1 chip =</span>
              <input
                type="number"
                value={chipBaseInput}
                onChange={(e) => setChipBaseInput(e.target.value)}
                min="1"
                className="input-field w-20 px-2 py-1.5 text-center text-sm font-mono"
              />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>円</span>
            </div>
            <button onClick={handleStartSession} className="btn-primary w-full py-3 text-sm">
              ゲーム開始
            </button>
          </div>

          <SessionSummary sessions={history} />
        </div>
      )}

      {/* セッション中 */}
      {session && (
        <>
          <InputPanel
            currentTurns={currentTurns}
            onInput={handleInput}
            onUndo={handleUndo}
            currentUnitIdx={currentUnitIdx}
            chipBase={chipBase}
            cumulativeProfit={cumulativeProfit}
          />

          {/* 〇❌パーセント表示 */}
          {totalTurns > 0 && (
            <div className="flex justify-center gap-4 py-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-o)' }} />
                <span className="text-[10px] font-mono font-medium" style={{ color: 'var(--color-o)' }}>
                  {Math.round((totalO / totalTurns) * 100)}%
                </span>
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>({totalO})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-x)' }} />
                <span className="text-[10px] font-mono font-medium" style={{ color: 'var(--color-x)' }}>
                  {Math.round((totalX / totalTurns) * 100)}%
                </span>
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>({totalX})</span>
              </div>
            </div>
          )}

          <div className="mt-2">
            <GameBoard
              sets={sets}
              chipBase={chipBase}
              currentTurns={currentTurns}
              currentSetIndex={sets.length + 1}
            />
          </div>

          <div className="px-4 mt-6 max-w-lg mx-auto">
            <button
              onClick={handleEndSession}
              className="w-full py-2.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: 'var(--color-x)',
              }}
            >
              ゲーム終了
            </button>
          </div>
        </>
      )}
    </div>
  )
}
