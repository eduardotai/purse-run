import { buyRival } from "./rival"
import { hashSeed } from "./rng"
import type { Fighter } from "./types"

export const BOT_RATING = 1000

export type Ghost = {
  label: string
  rating: 1000
  wins: number
  board: Fighter[]
}

export function serveOpponent(wins: number): Ghost | null {
  if (!Number.isInteger(wins) || wins < 0 || wins > 8) return null
  const bought = buyRival({
    wins,
    gold: 10,
    board: [],
    nextInstance: 1,
    rngState: hashSeed(`bot-${wins}`),
  })
  return { label: `Bot ${wins}`, rating: BOT_RATING, wins, board: bought.board }
}
