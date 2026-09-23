export type Rank = "I" | "II" | "III" | "IV" | "V"

export function publicRank(points: number, games: number): Rank | null {
  if (games < 5) return null
  if (points <= 899) return "I"
  if (points <= 1099) return "II"
  if (points <= 1299) return "III"
  if (points <= 1499) return "IV"
  return "V"
}

function roundHalfAway(value: number): number {
  const sign = value < 0 ? -1 : 1
  const abs = Math.abs(value)
  const floor = Math.floor(abs)
  const frac = abs - floor
  if (frac < 0.5) return sign * floor
  return sign * (floor + 1)
}

export function pointChange(you: number, them: number, result: 0 | 0.5 | 1, gamesBefore: number): number {
  const expected = 1 / (1 + 10 ** ((them - you) / 400))
  const k = gamesBefore < 5 ? 40 : 24
  return roundHalfAway(k * (result - expected))
}

export function applyPoints(points: number, delta: number): number {
  return Math.max(0, points + delta)
}

export function scoreOf(outcome: "win" | "loss" | "mutual"): 0 | 0.5 | 1 {
  if (outcome === "win") return 1
  if (outcome === "loss") return 0
  return 0.5
}
