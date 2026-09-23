import type { Fighter, Run, RunResult } from "../rules/types"
import type { Ribbon } from "../rules/rewards"

const CURRENT = "purse-run.current"
const RESULTS = "purse-run.results"
const PROFILE = "purse-run.profile"
const PVP = "purse-run.pvp"
const RIBBONS = "purse-run.ribbons"
const GHOSTS = "purse-run.ghosts"

export type Profile = { version: 1; id: string; name: string }
export type PvpRecord = { version: 1; points: number; games: number }

export type KeyValue = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isRun(value: unknown): value is Run {
  if (!isRecord(value)) return false
  return (
    value.version === 1 &&
    typeof value.seed === "string" &&
    typeof value.rngState === "number" &&
    typeof value.wins === "number" &&
    typeof value.hearts === "number" &&
    typeof value.gold === "number" &&
    typeof value.enemyGold === "number" &&
    typeof value.nextInstance === "number" &&
    (value.phase === "shop" || value.phase === "result") &&
    (value.endReason === null || value.endReason === "hearts" || value.endReason === "abandon") &&
    Array.isArray(value.player) &&
    Array.isArray(value.enemy) &&
    Array.isArray(value.shop) &&
    Array.isArray(value.actions) &&
    Array.isArray(value.lastLog)
  )
}

function isResult(value: unknown): value is RunResult {
  if (!isRecord(value)) return false
  return (
    value.version === 1 &&
    typeof value.id === "string" &&
    typeof value.seed === "string" &&
    Array.isArray(value.actions) &&
    value.practice === true &&
    value.opponent === "ai" &&
    value.mode === "pve" &&
    typeof value.wins === "number" &&
    typeof value.turns === "number" &&
    (value.endReason === "hearts" || value.endReason === "abandon") &&
    Array.isArray(value.finalPlayer) &&
    Array.isArray(value.finalEnemy) &&
    Array.isArray(value.lastLog)
  )
}

function readJson(storage: KeyValue, key: string): unknown {
  const raw = storage.getItem(key)
  if (raw === null) return undefined
  try {
    const parsed: unknown = JSON.parse(raw)
    return parsed
  } catch {
    return undefined
  }
}

export function loadCurrent(storage: KeyValue): Run | null {
  const parsed = readJson(storage, CURRENT)
  return isRun(parsed) ? parsed : null
}

export function saveCurrent(run: Run, storage: KeyValue): void {
  storage.setItem(CURRENT, JSON.stringify(run))
}

export function clearCurrent(storage: KeyValue): void {
  storage.removeItem(CURRENT)
}

export function loadResults(storage: KeyValue): RunResult[] {
  const parsed = readJson(storage, RESULTS)
  if (!Array.isArray(parsed)) return []
  const results: RunResult[] = []
  for (const item of parsed) {
    if (!isResult(item)) return []
    results.push(item)
  }
  return results
}

export function saveResults(results: RunResult[], storage: KeyValue): void {
  storage.setItem(RESULTS, JSON.stringify(results))
}

export function loadProfile(storage: KeyValue): Profile {
  const parsed = readJson(storage, PROFILE)
  const name =
    isRecord(parsed) && parsed.version === 1 && typeof parsed.name === "string" && parsed.name.trim().length > 0
      ? parsed.name.trim().slice(0, 24)
      : "You"
  const id = isRecord(parsed) && typeof parsed.id === "string" && parsed.id.length > 0 ? parsed.id : ""
  return { version: 1, id, name }
}

export function saveProfile(profile: Profile, storage: KeyValue): void {
  storage.setItem(
    PROFILE,
    JSON.stringify({ version: 1, id: profile.id, name: profile.name.trim().slice(0, 24) || "You" }),
  )
}

export function loadPvp(storage: KeyValue): PvpRecord {
  const parsed = readJson(storage, PVP)
  if (
    !isRecord(parsed) ||
    parsed.version !== 1 ||
    typeof parsed.points !== "number" ||
    typeof parsed.games !== "number"
  ) {
    return { version: 1, points: 1000, games: 0 }
  }
  return { version: 1, points: Math.max(0, Math.floor(parsed.points)), games: Math.max(0, Math.floor(parsed.games)) }
}

export function savePvp(record: PvpRecord, storage: KeyValue): void {
  storage.setItem(PVP, JSON.stringify(record))
}

function isRibbon(value: unknown): value is Ribbon {
  if (!isRecord(value)) return false
  return value.version === 1 && typeof value.runId === "string" && typeof value.wins === "number"
}

export function loadRibbons(storage: KeyValue): Ribbon[] {
  const parsed = readJson(storage, RIBBONS)
  if (!Array.isArray(parsed)) return []
  const ribbons: Ribbon[] = []
  for (const item of parsed) {
    if (!isRibbon(item)) return []
    ribbons.push(item)
  }
  return ribbons
}

export function saveRibbons(ribbons: Ribbon[], storage: KeyValue): void {
  storage.setItem(RIBBONS, JSON.stringify(ribbons))
}

export type GhostEntry = { id: string; wins: number; board: Fighter[] }

function isGhost(value: unknown): value is GhostEntry {
  if (!isRecord(value)) return false
  return typeof value.id === "string" && typeof value.wins === "number" && Array.isArray(value.board)
}

export function loadGhosts(storage: KeyValue): GhostEntry[] {
  const parsed = readJson(storage, GHOSTS)
  if (!Array.isArray(parsed)) return []
  const entries: GhostEntry[] = []
  for (const item of parsed) {
    if (!isGhost(item)) return []
    entries.push({ id: item.id, wins: item.wins, board: item.board })
  }
  return entries
}

export function saveGhost(entry: GhostEntry, storage: KeyValue): void {
  const rest = loadGhosts(storage).filter((ghost) => !(ghost.id === entry.id && ghost.wins === entry.wins))
  storage.setItem(GHOSTS, JSON.stringify([...rest, entry]))
}
