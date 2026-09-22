import { fighterById, skillById } from "./cards"
import { drawShop } from "./shop"
import type { Fighter, Offer, SkillId } from "./types"

function seatLimit(wins: number): number {
  if (wins <= 1) return 3
  if (wins <= 3) return 4
  return 5
}

function clampGold(gold: number): number {
  return Math.min(15, Math.max(0, gold))
}

function canHold(fighter: Fighter, id: SkillId): boolean {
  const [first, second] = fighter.skills
  return (first === null || second === null) && first !== id && second !== id
}

function legalSkill(board: Fighter[], id: SkillId): boolean {
  return board.some((fighter) => canHold(fighter, id))
}

function bestFighterSlot(offers: (Offer | null)[]): number | null {
  let best: number | null = null
  let bestScore = -1
  for (let index = 0; index < offers.length; index++) {
    const offer = offers[index]
    if (!offer || offer.kind !== "fighter") continue
    const printed = fighterById(offer.card)
    const score = printed.attack + printed.health
    if (best === null || score > bestScore) {
      best = index
      bestScore = score
    }
  }
  return best
}

function bestSkillSlot(offers: (Offer | null)[], board: Fighter[]): number | null {
  let best: number | null = null
  let bestN = -1
  for (let index = 0; index < offers.length; index++) {
    const offer = offers[index]
    if (!offer || offer.kind !== "skill") continue
    if (!legalSkill(board, offer.card)) continue
    const n = skillById(offer.card).n
    if (best === null || n > bestN) {
      best = index
      bestN = n
    }
  }
  return best
}

function giveSkill(board: Fighter[], id: SkillId): void {
  const fighter = board.find((entry) => canHold(entry, id))
  if (!fighter) throw new Error(`no legal fighter for ${id}`)
  if (fighter.skills[0] === null) fighter.skills[0] = id
  else fighter.skills[1] = id
}

function copyBoard(board: Fighter[]): Fighter[] {
  return board.map((fighter) => ({
    instance: fighter.instance,
    card: fighter.card,
    gainedAttack: fighter.gainedAttack,
    health: fighter.health,
    skills: [fighter.skills[0], fighter.skills[1]],
  }))
}

export function buyRival(input: {
  wins: number
  gold: number
  board: Fighter[]
  nextInstance: number
  rngState: number
}): { gold: number; board: Fighter[]; nextInstance: number; rngState: number } {
  let gold = input.gold
  let nextInstance = input.nextInstance
  let rngState = input.rngState
  const board = copyBoard(input.board)
  const opened = drawShop(input.wins, rngState)
  rngState = opened.state
  let offers: (Offer | null)[] = opened.shop
  let rerolls = 0

  while (true) {
    let bought = false
    while (board.length < seatLimit(input.wins) && gold >= 3) {
      const slot = bestFighterSlot(offers)
      if (slot === null) break
      const offer = offers[slot]
      if (!offer || offer.kind !== "fighter") break
      const printed = fighterById(offer.card)
      offers[slot] = null
      gold = clampGold(gold - 3)
      board.push({
        instance: nextInstance,
        card: offer.card,
        gainedAttack: 0,
        health: printed.health,
        skills: [null, null],
      })
      nextInstance += 1
      bought = true
    }
    while (gold >= 3) {
      const slot = bestSkillSlot(offers, board)
      if (slot === null) break
      const offer = offers[slot]
      if (!offer || offer.kind !== "skill") break
      offers[slot] = null
      gold = clampGold(gold - 3)
      giveSkill(board, offer.card)
      bought = true
    }
    if (bought || gold < 5 || rerolls >= 3) break
    gold = clampGold(gold - 2)
    const redrawn = drawShop(input.wins, rngState)
    rngState = redrawn.state
    offers = redrawn.shop
    rerolls += 1
  }

  return { gold, board, nextInstance, rngState }
}
