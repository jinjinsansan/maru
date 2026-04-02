'use client'

import { useState } from 'react'
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
  const sheetEnd = sheetStart + 20

  // 現在のシートを自動選択
  const autoSheet = Math.floor((currentSetIndex - 1) / 20)
  if (autoSheet !== activeSheet && autoSheet >= 0 && autoSheet <= 2) {
    // シート自動切り替えはレンダリング外で
  }

  return (
    <div className="px-2">
      {/* シートタブ */}
      <div className="flex gap-1 mb-2">
        {[0, 1, 2].map(sheet => (
          <button
            key={sheet}
            onClick={() => setActiveSheet(sheet)}
            className="px-3 py-1 text-xs rounded-t-md transition-colors"
            style={{
              background: activeSheet === sheet ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: activeSheet === sheet ? 'var(--accent-gold)' : '#666',
              borderBottom: activeSheet === sheet ? '2px solid var(--accent-gold)' : '2px solid transparent',
            }}
          >
            {sheet * 20 + 1}〜{(sheet + 1) * 20}
          </button>
        ))}
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="game-table w-full" style={{ minWidth: '700px' }}>
          <thead>
            <tr>
              <th className="label-cell"></th>
              {Array.from({ length: 20 }).map((_, i) => {
                const setNum = sheetStart + i + 1
                return (
                  <th key={i} className="text-xs text-gray-500 px-1" style={{ minWidth: '32px' }}>
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
                    value = setData.results[turnIdx] === 'O' ? '〇' : '❌'
                    color = setData.results[turnIdx] === 'O' ? 'var(--color-o)' : 'var(--color-x)'
                  } else if (isCurrentSet && currentTurns[turnIdx]) {
                    value = currentTurns[turnIdx] === 'O' ? '〇' : '❌'
                    color = currentTurns[turnIdx] === 'O' ? 'var(--color-o)' : 'var(--color-x)'
                  }

                  return (
                    <td
                      key={colIdx}
                      style={{
                        color,
                        background: isCurrentSet ? 'rgba(224,201,127,0.08)' : undefined,
                      }}
                      className="text-xs"
                    >
                      {value}
                    </td>
                  )
                })}
              </tr>
            ))}

            {/* 勝敗行 */}
            <tr className="separator-row">
              <td className="label-cell">勝敗</td>
              {Array.from({ length: 20 }).map((_, colIdx) => {
                const setIdx = sheetStart + colIdx
                const setData = sets[setIdx]
                if (!setData) return <td key={colIdx}></td>

                const isWin = setData.wins > setData.losses
                return (
                  <td
                    key={colIdx}
                    style={{
                      background: isWin ? 'var(--color-win-bg)' : 'var(--color-lose-bg)',
                      color: isWin ? 'var(--color-o)' : 'var(--color-x)',
                    }}
                    className="text-xs font-medium"
                  >
                    {setData.wins}/{setData.losses}
                  </td>
                )
              })}
            </tr>

            {/* 負け越し行 */}
            <tr>
              <td className="label-cell">負越し</td>
              {Array.from({ length: 20 }).map((_, colIdx) => {
                const setIdx = sheetStart + colIdx
                const setData = sets[setIdx]
                if (!setData) return <td key={colIdx}></td>

                return (
                  <td
                    key={colIdx}
                    className={`text-xs ${setData.slashed ? 'slashed' : ''}`}
                    style={{
                      color: setData.overshoot > 0 ? 'var(--color-overshoot)' : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    {setData.overshoot}
                  </td>
                )
              })}
            </tr>

            {/* チップ単位行 */}
            <tr>
              <td className="label-cell">単位</td>
              {Array.from({ length: 20 }).map((_, colIdx) => {
                const setIdx = sheetStart + colIdx
                const setData = sets[setIdx]
                if (!setData) return <td key={colIdx}></td>

                return (
                  <td
                    key={colIdx}
                    className={`text-xs ${setData.slashed ? 'slashed' : ''}`}
                    style={{ color: 'var(--color-chip-unit)' }}
                  >
                    {SEQ[setData.next_unit_idx]}
                  </td>
                )
              })}
            </tr>

            {/* 純利益(累計)行 */}
            <tr>
              <td className="label-cell">累計</td>
              {Array.from({ length: 20 }).map((_, colIdx) => {
                const setIdx = sheetStart + colIdx
                const setData = sets[setIdx]
                if (!setData) return <td key={colIdx}></td>

                const displayProfit = setData.cumulative_profit * chipBase
                return (
                  <td
                    key={colIdx}
                    className="text-xs font-medium"
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
