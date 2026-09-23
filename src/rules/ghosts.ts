import { fighterById } from "./cards"
import { seatLimit } from "./rival"
import type { Fighter, FighterId } from "./types"

export type ServedBot = {
  label: string
  rating: 1000
  wins: number
  board: Fighter[]
}

const LINE: readonly FighterId[] = ["c42", "c33", "c24", "u44", "u35"]

export function serveOpponent(wins: number): ServedBot | null {
  if (!Number.isInteger(wins) || wins < 0 || wins > 8) return null
  const limit = seatLimit(wins)
  const board: Fighter[] = LINE.slice(0, limit).map((card, index) => ({
    instance: index + 1,
    card,
    gainedAttack: 0,
    health: fighterById(card).health,
    skills: [index === 0 ? "jab" : null, null],
  }))
  return { label: `Bot ${wins}`, rating: 1000, wins, board }
}
