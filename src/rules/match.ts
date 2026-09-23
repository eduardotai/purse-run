import type { Fighter } from "./types"

export type Seat = {
  id: string
  points: number
  games: number
  wins: number
  board: Fighter[]
  bot: boolean
}

function closest(options: Seat[], points: number): Seat | null {
  if (options.length === 0) return null
  return options.slice().sort((a, b) => Math.abs(a.points - points) - Math.abs(b.points - points))[0] ?? null
}

export function pickOpponent(wins: number, selfId: string, points: number, pool: Seat[]): Seat | null {
  const same = pool.filter((seat) => seat.wins === wins && seat.id !== selfId)
  const ranked = (band: number) =>
    closest(
      same.filter((seat) => !seat.bot && seat.games >= 5 && Math.abs(seat.points - points) <= band),
      points,
    )
  return (
    ranked(50) ??
    ranked(100) ??
    ranked(200) ??
    closest(
      same.filter((seat) => !seat.bot && seat.games < 5),
      points,
    ) ??
    same.find((seat) => seat.bot) ??
    null
  )
}
