import type { RunResult } from "./types"

export type Ribbon = {
  version: 1
  runId: string
  wins: number
}

export function ribbonFrom(result: RunResult): Ribbon {
  return { version: 1, runId: result.id, wins: result.wins }
}

export function syncRibbons(results: readonly RunResult[], ribbons: readonly Ribbon[]): Ribbon[] {
  const seen = new Set(ribbons.map((ribbon) => ribbon.runId))
  const next = ribbons.slice()
  for (const result of results) {
    if (seen.has(result.id)) continue
    next.push(ribbonFrom(result))
    seen.add(result.id)
  }
  return next
}
