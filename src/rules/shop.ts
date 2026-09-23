import { cardsOf } from "./cards"
import { rollD6, rollIndex } from "./rng"
import type { FighterId, Offer, Rarity } from "./types"

const RARITY_DOWN: readonly Rarity[] = ["rare", "uncommon", "common"]

function slotKinds(wins: number): ("fighter" | "skill")[] {
  if (wins <= 1) return ["fighter", "fighter", "fighter", "skill"]
  if (wins <= 3) return ["fighter", "fighter", "skill", "skill"]
  return ["fighter", "skill", "skill", "skill"]
}

function rarityFromRoll(wins: number, roll: number): Rarity {
  if (wins <= 3) return roll >= 5 ? "uncommon" : "common"
  if (wins <= 5) {
    if (roll === 6) return "rare"
    if (roll >= 4) return "uncommon"
    return "common"
  }
  if (roll >= 5) return "rare"
  if (roll >= 3) return "uncommon"
  return "common"
}

function bag(kind: "fighter" | "skill", rarity: Rarity): readonly string[] {
  const start = RARITY_DOWN.indexOf(rarity)
  for (let step = start; step < RARITY_DOWN.length; step += 1) {
    const rarityAt = RARITY_DOWN[step]
    if (!rarityAt) continue
    const found = cardsOf(kind, rarityAt)
    if (found.length > 0) return found
  }
  throw new Error(`empty ${kind} bag`)
}

export function drawShop(wins: number, state: number): { shop: Offer[]; state: number } {
  const kinds = slotKinds(wins)
  const rollRarity = wins >= 2
  const shop: Offer[] = []
  for (const kind of kinds) {
    let rarity: Rarity = "common"
    if (rollRarity) {
      const rolled = rollD6(state)
      state = rolled.state
      rarity = rarityFromRoll(wins, rolled.roll)
    }
    const choices = bag(kind, rarity)
    const picked = rollIndex(state, choices.length)
    state = picked.state
    const card = choices[picked.index]
    if (!card) throw new Error("shop index missed the bag")
    if (kind === "fighter") shop.push({ kind: "fighter", card: card as FighterId })
    else shop.push({ kind: "skill", card })
  }
  return { shop, state }
}
