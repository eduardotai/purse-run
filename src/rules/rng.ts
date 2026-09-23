export function hashSeed(seed: string): number {
  let hash = 2166136261
  for (const byte of new TextEncoder().encode(seed)) {
    hash = Math.imul(hash ^ byte, 16777619) >>> 0
  }
  return hash
}

export function nextUnit(state: number): { state: number; unit: number } {
  let t = (state + 0x6d2b79f5) >>> 0
  const next = t
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t = (t ^ (t + Math.imul(t ^ (t >>> 7), t | 61))) >>> 0
  const unit = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return { state: next, unit }
}

export function rollD6(state: number): { state: number; roll: number } {
  const next = nextUnit(state)
  return { state: next.state, roll: Math.floor(next.unit * 6) + 1 }
}

export function rollIndex(state: number, length: number): { state: number; index: number } {
  const next = nextUnit(state)
  return { state: next.state, index: Math.floor(next.unit * length) }
}
