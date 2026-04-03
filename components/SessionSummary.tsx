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
}

export default function SessionSummary({ sessions }: SessionSummaryProps) {
  if (sessions.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          まだセッションがありません
        </div>
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]
  const todaySessions = sessions.filter(s => s.started_at.startsWith(today))
  const todayProfit = todaySessions.reduce((sum, s) => sum + s.total_profit * s.chip_base, 0)

  return (
    <div className="space-y-3 fade-in">
      {/* 当日サマリー */}
      {todaySessions.length > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
              Today
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {todaySessions.length} sessions
            </span>
          </div>
          <div
            className="text-2xl font-semibold font-mono tracking-tight"
            style={{
              color: todayProfit >= 0 ? 'var(--color-profit-plus)' : 'var(--color-profit-minus)',
            }}
          >
            {todayProfit >= 0 ? '+' : ''}{todayProfit.toLocaleString()}
            <span className="text-sm font-normal ml-0.5" style={{ color: 'var(--text-muted)' }}>円</span>
          </div>
        </div>
      )}

      {/* 過去セッション一覧 */}
      <div>
        <h3 className="text-[10px] font-medium tracking-wider uppercase mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
          History
        </h3>
        <div className="space-y-1">
          {sessions.map(session => {
            const start = new Date(session.started_at)
            const end = session.ended_at ? new Date(session.ended_at) : null
            const profit = session.total_profit * session.chip_base
            const total = session.o_count + session.x_count
            const oPercent = total > 0 ? Math.round((session.o_count / total) * 100) : 0

            return (
              <div key={session.id} className="glass-card flex items-center justify-between px-3 py-2.5">
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {start.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}{' '}
                    <span className="font-mono">{start.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
                    {end && (
                      <span className="font-mono"> - {end.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                  {total > 0 && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono" style={{ color: 'var(--color-o)' }}>〇{oPercent}%</span>
                      <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{session.o_count}/{total}</span>
                    </div>
                  )}
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
        </div>
      </div>
    </div>
  )
}
