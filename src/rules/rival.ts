import { fighterById, skillById } from "./cards"
import { drawShop } from "./shop"
import type { Fighter, Offer, SkillId } from "./types"

export const FIGHTER_COST = 3
export const SKILL_COST = 3
export const REROLL_COST = 2
export const SELL_VALUE = 1

export type ShopMode = "fighters-first" | "skills-first"

export type ShopState = {
  wins: number
  gold: number
  board: Fighter[]
  nextInstance: number
  rngState: number
  shop: (Offer | null)[]
}

function clampGold(gold: number): number {
  return Math.min(15, Math.max(0, gold))
}

export function seatLimit(wins: number): number {
  if (wins <= 1) return 3
  if (wins <= 3) return 4
  return 5
}

export function canHoldSkill(fighter: Fighter, id: SkillId): boolean {
  const [first, second] = fighter.skills
  return (first === null || second === null) && first !== id && second !== id
}

export function bestFighterSlot(shop: (Offer | null)[], gold: number): number | null {
  if (gold < FIGHTER_COST) return null
  let bestIndex: number | null = null
  let bestScore = -1
  shop.forEach((offer, index) => {
    if (!offer || offer.kind !== "fighter") return
    const card = fighterById(offer.card)
    const score = card.attack + card.health
    if (bestIndex === null || score > bestScore) {
      bestIndex = index
      bestScore = score
    }
  })
  return bestIndex
}

export function bestSkillBuy(
  shop: (Offer | null)[],
  board: Fighter[],
  gold: number,
): { slot: number; fighter: number } | null {
  if (gold < SKILL_COST) return null
  let bestSlot = -1
  let bestFighter = -1
  let bestN = -1
  shop.forEach((offer, slot) => {
    if (!offer || offer.kind !== "skill") return
    const skill = skillById(offer.card)
    const fighter = board.findIndex((unit) => canHoldSkill(unit, offer.card))
    if (fighter < 0) return
    if (bestSlot < 0 || skill.n > bestN) {
      bestSlot = slot
      bestFighter = fighter
      bestN = skill.n
    }
  })
  return bestSlot < 0 ? null : { slot: bestSlot, fighter: bestFighter }
}

function pushFighter(state: ShopState, card: Fighter["card"]): void {
  const printed = fighterById(card)
  state.board.push({
    instance: state.nextInstance,
    card,
    gainedAttack: 0,
    health: printed.health,
    skills: [null, null],
  })
  state.nextInstance += 1
  state.gold = clampGold(state.gold - FIGHTER_COST)
}

function giveSkill(state: ShopState, card: SkillId, fighterIndex: number): void {
  const fighter = state.board[fighterIndex]
  if (!fighter) return
  if (fighter.skills[0] === null) fighter.skills = [card, fighter.skills[1]]
  else fighter.skills = [fighter.skills[0], card]
  state.gold = clampGold(state.gold - SKILL_COST)
}

export function runPolicy(state: ShopState, mode: ShopMode): void {
  let rerolls = 0
  while (true) {
    let bought = false
    const phases = mode === "skills-first" ? (["skill", "fighter"] as const) : (["fighter", "skill"] as const)
    for (const phase of phases) {
      if (phase === "fighter") {
        while (state.board.length < seatLimit(state.wins)) {
          const slot = bestFighterSlot(state.shop, state.gold)
          if (slot === null) break
          const offer = state.shop[slot]
          if (!offer || offer.kind !== "fighter") break
          state.shop[slot] = null
          pushFighter(state, offer.card)
          bought = true
        }
      } else {
        while (true) {
          const pick = bestSkillBuy(state.shop, state.board, state.gold)
          if (!pick) break
          const offer = state.shop[pick.slot]
          if (!offer || offer.kind !== "skill") break
          state.shop[pick.slot] = null
          giveSkill(state, offer.card, pick.fighter)
          bought = true
        }
      }
    }
    if (!bought && state.gold >= 5 && rerolls < 3) {
      rerolls += 1
      const drawn = drawShop(state.wins, state.rngState)
      state.rngState = drawn.state
      state.shop = drawn.shop
      state.gold = clampGold(state.gold - REROLL_COST)
      continue
    }
    break
  }
}

export function buyRival(input: {
  wins: number
  gold: number
  board: Fighter[]
  nextInstance: number
  rngState: number
}): { gold: number; board: Fighter[]; nextInstance: number; rngState: number } {
  const drawn = drawShop(input.wins, input.rngState)
  const state: ShopState = {
    wins: input.wins,
    gold: input.gold,
    board: input.board.map((fighter) => ({
      instance: fighter.instance,
      card: fighter.card,
      gainedAttack: fighter.gainedAttack,
      health: fighter.health,
      skills: [fighter.skills[0], fighter.skills[1]],
    })),
    nextInstance: input.nextInstance,
    rngState: drawn.state,
    shop: drawn.shop,
  }
  runPolicy(state, "fighters-first")
  return {
    gold: state.gold,
    board: state.board,
    nextInstance: state.nextInstance,
    rngState: state.rngState,
  }
}
