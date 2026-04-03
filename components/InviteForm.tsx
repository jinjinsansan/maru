'use client'

import { useState } from 'react'
import { validateInviteCode, loginWithCode, registerWithCode } from '@/app/actions/invite'
import { useRouter } from 'next/navigation'

export default function InviteForm() {
  const [code, setCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [needsName, setNeedsName] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (needsName) {
        if (!displayName.trim()) {
          setError('ニックネームを入力してください')
          setLoading(false)
          return
        }
        const result = await registerWithCode(code, displayName.trim())
        if (!result.success) {
          setError(result.error || '登録に失敗しました')
          setLoading(false)
          return
        }
        router.push('/mypage')
        return
      }

      const result = await validateInviteCode(code)
      if (!result.valid) {
        setError(result.error || '無効な招待コードです')
        setLoading(false)
        return
      }

      if (result.needsName) {
        setNeedsName(true)
        setLoading(false)
        return
      }

      const loginResult = await loginWithCode(code)
      if (!loginResult.success) {
        setError(loginResult.error || 'ログインに失敗しました')
        setLoading(false)
        return
      }
      router.push('/mypage')
    } catch {
      setError('エラーが発生しました')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto fade-in">
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <span className="text-2xl">〇❌</span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          パーティゲーム
        </h1>
        <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          {needsName ? 'ニックネームを設定してください' : '招待コードを入力してログイン'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!needsName ? (
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="INVITE CODE"
            maxLength={8}
            className="input-field w-full px-4 py-3 text-center text-base tracking-[0.25em] font-mono font-medium"
            autoFocus
          />
        ) : (
          <>
            <div className="text-center text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              コード: <span className="font-mono font-medium" style={{ color: 'var(--accent)' }}>{code}</span>
            </div>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="ニックネーム"
              maxLength={20}
              className="input-field w-full px-4 py-3 text-center text-base"
              autoFocus
            />
          </>
        )}

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#EF4444' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (!needsName && code.length < 8)}
          className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              処理中
            </>
          ) : needsName ? '登録してはじめる' : 'ログイン'}
        </button>

        {needsName && (
          <button
            type="button"
            onClick={() => { setNeedsName(false); setError('') }}
            className="w-full py-2 text-xs transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            戻る
          </button>
        )}
      </form>
    </div>
  )
}
