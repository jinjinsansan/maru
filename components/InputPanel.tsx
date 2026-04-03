'use client'

import { SEQ } from '@/lib/gameLogic'

interface InputPanelProps {
  currentTurns: string[]
  onInput: (value: 'O' | 'X') => void
  onUndo: () => void
  currentUnitIdx: number
  chipBase: number
  cumulativeProfit: number
  disabled?: boolean
}

export default function InputPanel({
  currentTurns,
  onInput,
  onUndo,
  currentUnitIdx,
  chipBase,
  cumulativeProfit,
  disabled = false,
}: InputPanelProps) {
  const turnCount = currentTurns.length
  const chipUnit = SEQ[currentUnitIdx]

  return (
    <div className="sticky top-0 z-10 backdrop-blur-xl px-4 py-3 sm:py-4"
      style={{ background: 'rgba(24,26,32,0.92)', borderBottom: '1px solid var(--border-primary)' }}>

      {/* bet情報バー */}
      <div className="flex justify-between items-center text-xs mb-3 px-0.5">
        <div className="flex items-center gap-1.5">
          <span style={{ color: 'var(--text-muted)' }}>BET</span>
          <span className="font-mono font-semibold" style={{ color: 'var(--color-chip-unit)' }}>{chipUnit}</span>
          <span style={{ color: 'var(--text-muted)' }}>({(chipUnit * chipBase).toLocaleString()}円)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ color: 'var(--text-muted)' }}>P/L</span>
          <span
            className="font-mono font-semibold"
            style={{ color: cumulativeProfit >= 0 ? 'var(--color-profit-plus)' : 'var(--color-profit-minus)' }}
          >
            {cumulativeProfit >= 0 ? '+' : ''}{cumulativeProfit}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>({cumulativeProfit >= 0 ? '+' : ''}{(cumulativeProfit * chipBase).toLocaleString()}円)</span>
        </div>
      </div>

      {/* ターンスロット */}
      <div className="flex justify-center gap-1.5 sm:gap-2 mb-3">
        {Array.from({ length: 7 }).map((_, i) => {
          const isActive = i === turnCount
          const isO = currentTurns[i] === 'O'
          const isX = currentTurns[i] === 'X'
          const isFilled = !!currentTurns[i]

          return (
            <div
              key={i}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-150"
              style={{
                border: `1.5px solid ${isActive ? 'var(--accent)' : isFilled ? (isO ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)') : 'var(--border-primary)'}`,
                background: isO ? 'rgba(16,185,129,0.1)' : isX ? 'rgba(239,68,68,0.1)' : isActive ? 'rgba(16,185,129,0.04)' : 'var(--bg-secondary)',
                color: isO ? 'var(--color-o)' : isX ? 'var(--color-x)' : 'var(--text-muted)',
                boxShadow: isActive ? '0 0 0 1px rgba(16,185,129,0.15)' : 'none',
              }}
            >
              {isFilled ? (isO ? '〇' : '✕') : i + 1}
            </div>
          )
        })}
      </div>

      {/* 入力ボタン */}
      <div className="flex justify-center gap-3 sm:gap-4">
        <button
          onClick={() => onInput('O')}
          disabled={disabled || turnCount >= 7}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl text-xl sm:text-2xl font-bold transition-all duration-150 active:scale-90 disabled:opacity-20"
          style={{
            background: 'rgba(16,185,129,0.12)',
            border: '1.5px solid rgba(16,185,129,0.4)',
            color: 'var(--color-o)',
          }}
        >
          〇
        </button>
        <button
          onClick={() => onInput('X')}
          disabled={disabled || turnCount >= 7}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl text-xl sm:text-2xl font-bold transition-all duration-150 active:scale-90 disabled:opacity-20"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1.5px solid rgba(239,68,68,0.35)',
            color: 'var(--color-x)',
          }}
        >
          ✕
        </button>
        <button
          onClick={onUndo}
          disabled={disabled || turnCount === 0}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl text-xs font-medium transition-all duration-150 active:scale-90 disabled:opacity-20"
          style={{
            background: 'var(--bg-elevated)',
            border: '1.5px solid var(--border-primary)',
            color: 'var(--text-secondary)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-0.5">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
          戻す
        </button>
      </div>

      <div className="text-center text-[10px] mt-2 font-medium tracking-wider"
        style={{ color: 'var(--text-muted)' }}>
        TURN {Math.min(turnCount + 1, 7)} / 7
      </div>
    </div>
  )
}
