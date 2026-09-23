import type { Fighter, Run, RunResult } from "../rules/types"
import type { Ribbon } from "../rules/rewards"

const CURRENT = "purse-run.current"
const RESULTS = "purse-run.results"
const PROFILE = "purse-run.profile"
const PVP = "purse-run.pvp"
const GHOSTS = "purse-run.ghosts"
const RIBBONS = "purse-run.ribbons"

export type Profile = { version: 1; id: string; name: string }
export type PvpRecord = { version: 1; points: number; games: number }
export type Ghost = { id: string; wins: number; board: Fighter[] }

function readJson(storage: Storage, key: string): unknown {
  const raw = storage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function isRun(value: unknown): value is Run {
  if (!value || typeof value !== "object") return false
  const run = value as Run
  return run.version === 1 && typeof run.seed === "string" && (run.phase === "shop" || run.phase === "result")
}

export function loadCurrent(storage: Storage): Run | null {
  const value = readJson(storage, CURRENT)
  return isRun(value) ? value : null
}

export function saveCurrent(run: Run, storage: Storage): void {
  storage.setItem(CURRENT, JSON.stringify(run))
}

export function clearCurrent(storage: Storage): void {
  storage.removeItem(CURRENT)
}

export function loadResults(storage: Storage): RunResult[] {
  const value = readJson(storage, RESULTS)
  if (!Array.isArray(value)) return []
  return value.filter((item): item is RunResult => {
    if (!item || typeof item !== "object") return false
    return (item as RunResult).version === 1 && typeof (item as RunResult).id === "string"
  })
}

export function saveResults(results: RunResult[], storage: Storage): void {
  storage.setItem(RESULTS, JSON.stringify(results))
}

export function loadProfile(storage: Storage): Profile {
  const value = readJson(storage, PROFILE)
  if (!value || typeof value !== "object") return { version: 1, id: "", name: "You" }
  const profile = value as Profile
  if (profile.version !== 1 || typeof profile.name !== "string") return { version: 1, id: "", name: "You" }
  return { version: 1, id: typeof profile.id === "string" ? profile.id : "", name: profile.name }
}

export function saveProfile(profile: Profile, storage: Storage): void {
  storage.setItem(PROFILE, JSON.stringify(profile))
}

export function loadPvp(storage: Storage): PvpRecord {
  const value = readJson(storage, PVP)
  if (!value || typeof value !== "object") return { version: 1, points: 1000, games: 0 }
  const record = value as PvpRecord
  if (record.version !== 1 || typeof record.points !== "number" || typeof record.games !== "number") {
    return { version: 1, points: 1000, games: 0 }
  }
  return record
}

export function savePvp(record: PvpRecord, storage: Storage): void {
  storage.setItem(PVP, JSON.stringify(record))
}

export function loadGhosts(storage: Storage): Ghost[] {
  const value = readJson(storage, GHOSTS)
  if (!Array.isArray(value)) return []
  return value.filter((item): item is Ghost => {
    if (!item || typeof item !== "object") return false
    const ghost = item as Ghost
    return typeof ghost.id === "string" && typeof ghost.wins === "number" && Array.isArray(ghost.board)
  })
}

export function saveGhost(ghost: Ghost, storage: Storage): void {
  const ghosts = loadGhosts(storage).filter((item) => !(item.id === ghost.id && item.wins === ghost.wins))
  ghosts.push(ghost)
  storage.setItem(GHOSTS, JSON.stringify(ghosts))
}

export function loadRibbons(storage: Storage): Ribbon[] {
  const value = readJson(storage, RIBBONS)
  if (!Array.isArray(value)) return []
  return value.filter((item): item is Ribbon => {
    if (!item || typeof item !== "object") return false
    const ribbon = item as Ribbon
    return typeof ribbon.runId === "string" && typeof ribbon.wins === "number"
  })
}

export function saveRibbons(ribbons: Ribbon[], storage: Storage): void {
  storage.setItem(RIBBONS, JSON.stringify(ribbons))
}
