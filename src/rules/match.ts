import type { Fighter } from "./types"

export type Seat = {
  id: string
  points: number
  games: number
  wins: number
  board: Fighter[]
  bot: boolean
}

function closest(seats: Seat[], youPoints: number): Seat | null {
  const ranked = seats.slice().sort((a, b) => {
    const gap = Math.abs(a.points - youPoints) - Math.abs(b.points - youPoints)
    if (gap !== 0) return gap
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  })
  return ranked[0] ?? null
}

export function pickOpponent(wins: number, youId: string, youPoints: number, pool: readonly Seat[]): Seat | null {
  const same = pool.filter((seat) => seat.id !== youId && seat.wins === wins && seat.board.length > 0)
  const humans = same.filter((seat) => !seat.bot && seat.games >= 5)
  for (const window of [50, 100, 200]) {
    const near = humans.filter((seat) => Math.abs(seat.points - youPoints) <= window)
    const hit = closest(near, youPoints)
    if (hit) return hit
  }
  const placement = closest(
    same.filter((seat) => !seat.bot && seat.games < 5),
    youPoints,
  )
  if (placement) return placement
  if (wins > 8) return null
  return same.find((seat) => seat.bot) ?? null
}
