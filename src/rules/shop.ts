import { FIGHTERS, SKILLS } from "./cards"
import { rollD6, rollIndex } from "./rng"
import type { Offer, Rarity } from "./types"

type SlotKind = Offer["kind"]

function pattern(wins: number): SlotKind[] {
  if (wins <= 1) return ["fighter", "fighter", "fighter", "skill"]
  if (wins <= 3) return ["fighter", "fighter", "skill", "skill"]
  return ["fighter", "skill", "skill", "skill"]
}

function rarityFromFace(wins: number, face: number): Rarity {
  if (wins <= 3) return face === 5 || face === 6 ? "uncommon" : "common"
  if (wins <= 5) {
    if (face === 6) return "rare"
    if (face === 4 || face === 5) return "uncommon"
    return "common"
  }
  if (face === 5 || face === 6) return "rare"
  if (face === 3 || face === 4) return "uncommon"
  return "common"
}

function bag(kind: SlotKind, rarity: Rarity): readonly string[] {
  const pool = kind === "fighter" ? FIGHTERS : SKILLS
  let current: Rarity | null = rarity
  while (current) {
    const cards = pool.filter((card) => card.rarity === current).map((card) => card.id)
    if (cards.length > 0) return cards
    current = current === "rare" ? "uncommon" : current === "uncommon" ? "common" : null
  }
  throw new Error(`no ${kind} cards at or below ${rarity}`)
}

export function drawShop(wins: number, state: number): { state: number; shop: Offer[] } {
  const shop: Offer[] = []
  for (const kind of pattern(wins)) {
    let rarity: Rarity = "common"
    if (wins > 1) {
      const rolled = rollD6(state)
      state = rolled.state
      rarity = rarityFromFace(wins, rolled.face)
    }
    const cards = bag(kind, rarity)
    const picked = rollIndex(state, cards.length)
    state = picked.state
    const card = cards[picked.index]
    if (card === undefined) throw new Error(`empty ${kind} index ${picked.index}`)
    if (kind === "fighter") {
      const fighter = FIGHTERS.find((entry) => entry.id === card)
      if (!fighter) throw new Error(`unknown fighter ${card}`)
      shop.push({ kind, card: fighter.id })
    } else {
      shop.push({ kind, card })
    }
  }
  return { state, shop }
}
