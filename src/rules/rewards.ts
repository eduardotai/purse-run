import type { RunResult } from "./types"

export type Ribbon = { runId: string; wins: number }

export function syncRibbons(results: RunResult[], existing: Ribbon[]): Ribbon[] {
  const seen = new Set(existing.map((ribbon) => ribbon.runId))
  const next = existing.slice()
  for (const result of results) {
    if (result.mode !== "pve" || seen.has(result.id)) continue
    seen.add(result.id)
    next.push({ runId: result.id, wins: result.wins })
  }
  return next
}
