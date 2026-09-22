import type { Run, RunResult } from "../rules/types"

const CURRENT = "purse-run.current"
const RESULTS = "purse-run.results"

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
