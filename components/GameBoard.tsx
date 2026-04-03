'use client'

import { useState, useEffect } from 'react'
import { SEQ, type SetData } from '@/lib/gameLogic'

interface GameBoardProps {
  sets: SetData[]
  chipBase: number
  currentTurns: string[]
  currentSetIndex: number
}

export default function GameBoard({ sets, chipBase, currentTurns, currentSetIndex }: GameBoardProps) {
  const [activeSheet, setActiveSheet] = useState(0)

  const sheetStart = activeSheet * 20

  // 自動シート切り替え
  useEffect(() => {
    const autoSheet = Math.floor((currentSetIndex - 1) / 20)
    if (autoSheet >= 0 && autoSheet <= 2) setActiveSheet(autoSheet)
  }, [currentSetIndex])

  return (
    <div className="px-2 sm:px-4">
      {/* シートタブ */}
      <div className="flex gap-0.5 mb-2">
        {[0, 1, 2].map(sheet => (
          <button
            key={sheet}
            onClick={() => setActiveSheet(sheet)}
            className="px-3 py-1.5 text-[10px] font-medium tracking-wide rounded-t-lg transition-all"
            style={{
              background: activeSheet === sheet ? 'var(--bg-card)' : 'transparent',
              color: activeSheet === sheet ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: activeSheet === sheet ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            {sheet * 20 + 1} - {(sheet + 1) * 20}
          </button>
        ))}
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto -mx-2 px-2 pb-2">
        <table className="game-table w-full" style={{ minWidth: '640px' }}>
          <thead>
            <tr>
              <th className="label-cell"></th>
              {Array.from({ length: 20 }).map((_, i) => {
                const setNum = sheetStart + i + 1
                const isCurrent = setNum === currentSetIndex
                return (
                  <th key={i} className="font-mono" style={{
                    minWidth: '28px',
                    fontSize: '0.6rem',
                    color: isCurrent ? 'var(--accent)' : 'var(--text-muted)',
                    fontWeight: isCurrent ? 600 : 400,
                  }}>
                    {setNum}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {/* 7ターン行 */}
            {Array.from({ length: 7 }).map((_, turnIdx) => (
              <tr key={`turn-${turnIdx}`}>
                <td className="label-cell">{turnIdx + 1}</td>
                {Array.from({ length: 20 }).map((_, colIdx) => {
                  const setIdx = sheetStart + colIdx
                  const setData = sets[setIdx]
                  const isCurrentSet = setIdx === currentSetIndex - 1

                  let value = ''
                  let color = ''

                  if (setData) {
                    value = setData.results[turnIdx] === 'O' ? '〇' : '✕'
                    color = setData.results[turnIdx] === 'O' ? 'var(--color-o)' : 'var(--color-x)'
                  } else if (isCurrentSet && currentTurns[turnIdx]) {
                    value = currentTurns[turnIdx] === 'O' ? '〇' : '✕'
                    color = currentTurns[turnIdx] === 'O' ? 'var(--color-o)' : 'var(--color-x)'
                  }

                  return (
                    <td
                      key={colIdx}
                      style={{
                        color,
                        background: isCurrentSet ? 'rgba(16,185,129,0.04)' : undefined,
                        fontWeight: value ? 500 : 400,
                      }}
                    >
                      {value}
                    </td>
                  )
                })}
              </tr>
            ))}

            {/* 勝敗行 */}
            <tr className="separator-row">
              <td className="label-cell">W/L</td>
              {Array.from({ length: 20 }).map((_, colIdx) => {
                const setIdx = sheetStart + colIdx
                const setData = sets[setIdx]
                if (!setData) return <td key={colIdx}></td>

                const isWin = setData.wins > setData.losses
                return (
                  <td
                    key={colIdx}
                    className="font-mono font-medium"
                    style={{
                      background: isWin ? 'var(--color-win-bg)' : 'var(--color-lose-bg)',
                      color: isWin ? 'var(--color-o)' : 'var(--color-x)',
                    }}
                  >
                    {setData.wins}/{setData.losses}
                  </td>
                )
              })}
            </tr>

            {/* 負け越し行 */}
            <tr>
              <td className="label-cell">OS</td>
              {Array.from({ length: 20 }).map((_, colIdx) => {
                const setIdx = sheetStart + colIdx
                const setData = sets[setIdx]
                if (!setData) return <td key={colIdx}></td>

                return (
                  <td
                    key={colIdx}
                    className={`font-mono ${setData.slashed ? 'slashed' : ''}`}
                    style={{
                      color: setData.overshoot > 0 ? 'var(--color-overshoot)' : 'var(--text-muted)',
                      opacity: setData.overshoot === 0 && !setData.slashed ? 0.3 : undefined,
                    }}
                  >
                    {setData.overshoot}
                  </td>
                )
              })}
            </tr>

            {/* チップ単位行 */}
            <tr>
              <td className="label-cell">UNIT</td>
              {Array.from({ length: 20 }).map((_, colIdx) => {
                const setIdx = sheetStart + colIdx
                const setData = sets[setIdx]
                if (!setData) return <td key={colIdx}></td>

                return (
                  <td
                    key={colIdx}
                    className={`font-mono font-medium ${setData.slashed ? 'slashed' : ''}`}
                    style={{ color: 'var(--color-chip-unit)' }}
                  >
                    {SEQ[setData.next_unit_idx]}
                  </td>
                )
              })}
            </tr>

            {/* 純利益(累計)行 */}
            <tr>
              <td className="label-cell">P/L</td>
              {Array.from({ length: 20 }).map((_, colIdx) => {
                const setIdx = sheetStart + colIdx
                const setData = sets[setIdx]
                if (!setData) return <td key={colIdx}></td>

                const displayProfit = setData.cumulative_profit * chipBase
                return (
                  <td
                    key={colIdx}
                    className="font-mono font-semibold"
                    style={{
                      color: setData.cumulative_profit >= 0 ? 'var(--color-profit-plus)' : 'var(--color-profit-minus)',
                    }}
                  >
                    {displayProfit >= 0 ? '+' : ''}{displayProfit.toLocaleString()}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
