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

  // 計算済みの値
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
    console.log('startSession result:', result)
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

    // 7ターン完了 → セット確定
    if (newTurns.length === 7) {
      const results = newTurns.join('')
      const setCopy = sets.map(s => ({ ...s }))

      const { newSet, slashedIds } = finalizeSet(
        results,
        setCopy,
        session.id,
        currentUnitIdx,
        cumulativeProfit,
        prevOvershoot,
      )

      // DB保存
      const [saveResult] = await Promise.all([
        saveSet(newSet),
        updateSlashedSets(slashedIds),
        updateSessionCounts(
          session.id,
          totalO + newSet.wins,
          totalX + newSet.losses,
        ),
      ])

      if (saveResult.set) {
        newSet.id = saveResult.set.id
      }

      // 斜線反映
      const updatedSets = setCopy.map(s => {
        if (slashedIds.includes(s.id!)) {
          return { ...s, slashed: true }
        }
        return s
      })

      setSets([...updatedSets, newSet])
      setCurrentTurns([])
    }
  }

  const handleUndo = () => {
    if (currentTurns.length > 0) {
      setCurrentTurns(prev => prev.slice(0, -1))
    }
  }

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-8">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h1 className="text-lg font-bold" style={{ color: 'var(--accent-gold)' }}>
          〇❌パーティ
        </h1>
        <div className="flex items-center gap-3">
          {user?.is_admin && (
            <a href="/admin" className="text-xs text-gray-400 hover:text-white transition-colors">
              管理者
            </a>
          )}
          <div className="flex items-center gap-2">
            {user?.avatar_url && (
              <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full" />
            )}
            <span className="text-sm text-gray-300">{user?.display_name || user?.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </header>

      {/* セッション未開始 */}
      {!session && (
        <div className="px-4 mt-6 space-y-6">
          <div className="rounded-lg p-4 bg-white/5 border border-white/10">
            <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--accent-gold)' }}>
              ゲーム設定
            </h2>
            <div className="flex items-center gap-2 mb-4">
              <label className="text-xs text-gray-400">1チップ =</label>
              <input
                type="number"
                value={chipBaseInput}
                onChange={(e) => setChipBaseInput(e.target.value)}
                min="1"
                className="w-20 px-2 py-1 rounded bg-white/5 border border-white/20 text-white text-center text-sm focus:outline-none focus:border-[var(--accent-gold)]"
              />
              <span className="text-xs text-gray-400">円</span>
            </div>
            <button
              onClick={handleStartSession}
              className="w-full py-3 rounded-lg font-bold text-lg transition-all active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, var(--accent-gold), #c9a84c)',
                color: '#1a1a2e',
              }}
            >
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
            <div className="flex justify-center gap-6 py-2 text-xs">
              <span style={{ color: 'var(--color-o)' }}>
                〇 {Math.round((totalO / totalTurns) * 100)}% ({totalO}回)
              </span>
              <span style={{ color: 'var(--color-x)' }}>
                ❌ {Math.round((totalX / totalTurns) * 100)}% ({totalX}回)
              </span>
            </div>
          )}

          {/* 管理表 */}
          <div className="mt-2">
            <GameBoard
              sets={sets}
              chipBase={chipBase}
              currentTurns={currentTurns}
              currentSetIndex={sets.length + 1}
            />
          </div>

          {/* ゲーム終了ボタン */}
          <div className="px-4 mt-6">
            <button
              onClick={handleEndSession}
              className="w-full py-2 rounded-lg text-sm font-medium bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              ゲーム終了
            </button>
          </div>
        </>
      )}
    </div>
  )
}
