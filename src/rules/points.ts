export type FightScore = 0 | 0.5 | 1
export type PublicRank = "I" | "II" | "III" | "IV" | "V"

export function roundHalfAwayFromZero(value: number): number {
  const negative = value < 0
  const abs = Math.abs(value)
  const whole = Math.floor(abs)
  const fraction = abs - whole
  const rounded = fraction >= 0.5 ? whole + 1 : whole
  return negative ? -rounded : rounded
}

export function expectedScore(you: number, them: number): number {
  return 1 / (1 + 10 ** ((them - you) / 400))
}

export function pointChange(you: number, them: number, result: FightScore, gamesBefore: number): number {
  const k = gamesBefore < 5 ? 40 : 24
  return roundHalfAwayFromZero(k * (result - expectedScore(you, them)))
}

export function applyPoints(points: number, delta: number): number {
  return Math.max(0, points + delta)
}

export function publicRank(points: number, games: number): PublicRank | null {
  if (games < 5) return null
  if (points <= 899) return "I"
  if (points <= 1099) return "II"
  if (points <= 1299) return "III"
  if (points <= 1499) return "IV"
  return "V"
}
