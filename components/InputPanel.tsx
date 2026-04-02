'use client'

import { SEQ } from '@/lib/gameLogic'

interface InputPanelProps {
  currentTurns: string[]  // 現在のセットの入力済みターン ['O', 'X', ...]
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
    <div className="sticky top-0 z-10 backdrop-blur-md bg-[#1a1a2e]/80 border-b border-white/10 px-4 py-3">
      {/* bet情報バー */}
      <div className="flex justify-between text-xs mb-3 px-1">
        <span>
          bet単位: <span style={{ color: 'var(--color-chip-unit)' }} className="font-bold">{chipUnit}</span>
          <span className="text-gray-500 ml-1">({(chipUnit * chipBase).toLocaleString()}円)</span>
        </span>
        <span>
          累計:
          <span
            className="font-bold ml-1"
            style={{ color: cumulativeProfit >= 0 ? 'var(--color-profit-plus)' : 'var(--color-profit-minus)' }}
          >
            {cumulativeProfit >= 0 ? '+' : ''}{cumulativeProfit}
          </span>
          <span className="text-gray-500 ml-1">({cumulativeProfit >= 0 ? '+' : ''}{(cumulativeProfit * chipBase).toLocaleString()}円)</span>
        </span>
      </div>

      {/* ターンスロット */}
      <div className="flex justify-center gap-1.5 mb-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="w-9 h-9 rounded-md flex items-center justify-center text-sm font-bold border"
            style={{
              borderColor: i === turnCount ? 'var(--accent-gold)' : 'rgba(255,255,255,0.15)',
              background: currentTurns[i]
                ? currentTurns[i] === 'O'
                  ? 'rgba(76,175,80,0.2)'
                  : 'rgba(244,67,54,0.2)'
                : 'rgba(255,255,255,0.03)',
              color: currentTurns[i] === 'O' ? 'var(--color-o)' : currentTurns[i] === 'X' ? 'var(--color-x)' : 'rgba(255,255,255,0.2)',
            }}
          >
            {currentTurns[i] ? (currentTurns[i] === 'O' ? '〇' : '❌') : i + 1}
          </div>
        ))}
      </div>

      {/* 入力ボタン */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => onInput('O')}
          disabled={disabled || turnCount >= 7}
          className="w-[60px] h-[60px] rounded-xl text-2xl font-bold transition-all active:scale-95 disabled:opacity-30"
          style={{
            background: 'rgba(76,175,80,0.2)',
            border: '2px solid #4caf50',
            color: '#81c784',
          }}
        >
          〇
        </button>
        <button
          onClick={() => onInput('X')}
          disabled={disabled || turnCount >= 7}
          className="w-[60px] h-[60px] rounded-xl text-2xl font-bold transition-all active:scale-95 disabled:opacity-30"
          style={{
            background: 'rgba(244,67,54,0.2)',
            border: '2px solid #f44336',
            color: '#ef9a9a',
          }}
        >
          ❌
        </button>
        <button
          onClick={onUndo}
          disabled={disabled || turnCount === 0}
          className="w-[60px] h-[60px] rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-30 bg-white/5 border border-white/20 text-gray-400"
        >
          戻す
        </button>
      </div>

      <div className="text-center text-xs text-gray-500 mt-2">
        ターン {Math.min(turnCount + 1, 7)} / 7
      </div>
    </div>
  )
}
