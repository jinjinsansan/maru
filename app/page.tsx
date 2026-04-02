'use client'

import { useState } from 'react'
import { validateInviteCode, loginWithCode, registerWithCode } from './actions/invite'
import { useRouter } from 'next/navigation'

export default function InvitePage() {
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
      // ニックネーム入力ステップ
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

      // 招待コード検証ステップ
      const result = await validateInviteCode(code)
      if (!result.valid) {
        setError(result.error || '無効な招待コードです')
        setLoading(false)
        return
      }

      if (result.needsName) {
        // 新規 → ニックネーム入力へ
        setNeedsName(true)
        setLoading(false)
        return
      }

      // 既存ユーザー → ログイン
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--accent-gold)' }}>
            〇❌パーティゲーム
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            {needsName ? 'ニックネームを設定してください' : '招待コードを入力してログイン'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!needsName ? (
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="招待コード（8文字）"
              maxLength={8}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white text-center text-lg tracking-widest placeholder:text-gray-500 focus:outline-none focus:border-[var(--accent-gold)] transition-colors"
              autoFocus
            />
          ) : (
            <>
              <div className="text-center text-sm text-gray-400 mb-2">
                コード: <span style={{ color: 'var(--accent-gold)' }}>{code}</span>
              </div>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="ニックネーム"
                maxLength={20}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white text-center text-lg placeholder:text-gray-500 focus:outline-none focus:border-[var(--accent-gold)] transition-colors"
                autoFocus
              />
            </>
          )}

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || (!needsName && code.length < 8)}
            className="w-full py-3 rounded-lg font-medium text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, var(--accent-gold), #c9a84c)',
              color: '#1a1a2e',
            }}
          >
            {loading ? '処理中...' : needsName ? '登録してはじめる' : 'ログイン'}
          </button>

          {needsName && (
            <button
              type="button"
              onClick={() => { setNeedsName(false); setError('') }}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              戻る
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
