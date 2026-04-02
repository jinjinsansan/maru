// チップ単位数列（変更不可）
export const SEQ = [
  1, 2, 3, 5, 7, 9, 11, 13,
  16, 19, 22, 25, 28, 31,
  35, 39, 43, 47, 51, 55,
  60, 65, 70, 75, 80, 85, 90, 95, 100,
  106, 112, 118, 124, 130, 136, 142, 148, 154, 160,
  170, 180, 190, 200, 210, 220, 230, 240, 250
]

export interface SetData {
  id?: string
  session_id: string
  set_index: number
  results: string        // "OOXOXXO" (7文字)
  wins: number
  losses: number
  overshoot: number
  slashed: boolean
  used_unit_idx: number
  next_unit_idx: number
  set_profit: number
  cumulative_profit: number
}

/**
 * 勝敗判定
 */
export function calcWinsLosses(results: string) {
  const wins = results.split('').filter(r => r === 'O').length
  const losses = 7 - wins
  const diff = wins - losses
  return { wins, losses, diff }
}

/**
 * 負け越しマス（overshoot）計算
 */
export function calcOvershoot(prevOvershoot: number, diff: number): number {
  const newOvershoot = prevOvershoot - diff
  return newOvershoot < 0 ? 0 : newOvershoot
}

/**
 * 斜線処理: 勝ち(diff > 0)のとき、overshoot が newOvershoot より大きい非斜線セットを斜線化
 * 斜線化されたセットのIDリストを返す
 */
export function calcSlashed(
  sets: SetData[],
  newOvershoot: number,
  diff: number
): string[] {
  if (diff <= 0) return []
  const slashedIds: string[] = []
  for (let i = 0; i < sets.length; i++) {
    if (!sets[i].slashed && sets[i].overshoot > newOvershoot) {
      sets[i].slashed = true
      if (sets[i].id) slashedIds.push(sets[i].id!)
    }
  }
  return slashedIds
}

/**
 * 次セットのbet単位インデックス決定
 */
export function calcNextUnitIdx(
  sets: SetData[],
  usedUnitIdx: number,
  diff: number,
  newOvershoot: number
): number {
  if (diff < 0) {
    // 負け → 1段階UP
    return Math.min(usedUnitIdx + 1, SEQ.length - 1)
  }

  // 勝ち → 非斜線セットから overshoot が一致するものを後ろから検索
  let found = -1
  for (let i = sets.length - 1; i >= 0; i--) {
    if (!sets[i].slashed && sets[i].overshoot === newOvershoot) {
      found = sets[i].next_unit_idx
      break
    }
  }
  if (found >= 0) return found

  // 一致なし → 非斜線セットの中で overshoot が newOvershoot より大きく最も近いもの
  let best = -1
  let bestDiff = Infinity
  for (let i = 0; i < sets.length; i++) {
    if (!sets[i].slashed && sets[i].overshoot > newOvershoot) {
      const d = sets[i].overshoot - newOvershoot
      if (d < bestDiff) {
        bestDiff = d
        best = sets[i].next_unit_idx
      }
    }
  }
  return best >= 0 ? best : 0
}

/**
 * セット確定時の全計算を実行
 */
export function finalizeSet(
  results: string,
  prevSets: SetData[],
  sessionId: string,
  currentUnitIdx: number,
  prevCumulativeProfit: number,
  prevOvershoot: number
): { newSet: SetData; slashedIds: string[] } {
  const { wins, losses, diff } = calcWinsLosses(results)
  const newOvershoot = calcOvershoot(prevOvershoot, diff)

  // 斜線処理（prevSets を直接変更する）
  const slashedIds = calcSlashed(prevSets, newOvershoot, diff)

  // 次セットのbet単位インデックス
  const nextUnitIdx = calcNextUnitIdx(prevSets, currentUnitIdx, diff, newOvershoot)

  // 損益計算
  const setProfit = diff * SEQ[currentUnitIdx]
  const cumulativeProfit = prevCumulativeProfit + setProfit

  const newSet: SetData = {
    session_id: sessionId,
    set_index: prevSets.length + 1,
    results,
    wins,
    losses,
    overshoot: newOvershoot,
    slashed: false,
    used_unit_idx: currentUnitIdx,
    next_unit_idx: nextUnitIdx,
    set_profit: setProfit,
    cumulative_profit: cumulativeProfit,
  }

  return { newSet, slashedIds }
}
