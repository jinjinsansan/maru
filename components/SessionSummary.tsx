'use client'

interface SessionSummaryProps {
  sessions: {
    id: string
    started_at: string
    ended_at: string | null
    total_profit: number
    chip_base: number
    o_count: number
    x_count: number
  }[]
  chipBase?: number
}

export default function SessionSummary({ sessions }: SessionSummaryProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center text-gray-500 text-sm py-4">
        まだセッションがありません
      </div>
    )
  }

  // 当日セッションのフィルタ
  const today = new Date().toISOString().split('T')[0]
  const todaySessions = sessions.filter(s => s.started_at.startsWith(today))
  const todayProfit = todaySessions.reduce((sum, s) => sum + s.total_profit * s.chip_base, 0)

  return (
    <div className="space-y-4">
      {/* 当日サマリー */}
      {todaySessions.length > 0 && (
        <div className="rounded-lg p-3 bg-white/5 border border-white/10">
          <h3 className="text-xs text-gray-400 mb-2">本日の収益</h3>
          <div
            className="text-2xl font-bold"
            style={{
              color: todayProfit >= 0 ? 'var(--color-profit-plus)' : 'var(--color-profit-minus)',
            }}
          >
            {todayProfit >= 0 ? '+' : ''}{todayProfit.toLocaleString()}円
          </div>
          <div className="text-xs text-gray-500 mt-1">{todaySessions.length}セッション</div>
        </div>
      )}

      {/* 過去セッション一覧 */}
      <div>
        <h3 className="text-xs text-gray-400 mb-2">セッション履歴</h3>
        <div className="space-y-1">
          {sessions.map(session => {
            const start = new Date(session.started_at)
            const end = session.ended_at ? new Date(session.ended_at) : null
            const profit = session.total_profit * session.chip_base
            const total = session.o_count + session.x_count
            const oPercent = total > 0 ? Math.round((session.o_count / total) * 100) : 0

            return (
              <div key={session.id} className="flex items-center justify-between rounded-md px-3 py-2 bg-white/3 text-xs">
                <div>
                  <span className="text-gray-400">
                    {start.toLocaleDateString('ja-JP')} {start.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                    {end && ` ~ ${end.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`}
                  </span>
                  {total > 0 && (
                    <span className="text-gray-600 ml-2">
                      〇{oPercent}% ({session.o_count}/{total})
                    </span>
                  )}
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
        </div>
      </div>
    </div>
  )
}
