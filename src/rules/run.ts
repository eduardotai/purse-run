import { fighterById } from "./cards"
import { resolveFight } from "./fight"
import { buyRival } from "./rival"
import { hashSeed } from "./rng"
import { drawShop } from "./shop"
import type { Action, ActionResult, Fighter, RefuseReason, Run } from "./types"

const FIGHTER_COST = 3
const SKILL_COST = 3
const REROLL_COST = 2
const SELL_VALUE = 1
const INCOME = 10

export function seatLimit(wins: number): number {
  if (wins <= 1) return 3
  if (wins <= 3) return 4
  return 5
}

function clampGold(gold: number): number {
  return Math.min(15, Math.max(0, gold))
}

function inRange(index: number, length: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < length
}

function skillFits(fighter: Fighter, id: string): boolean {
  const [first, second] = fighter.skills
  return (first === null || second === null) && first !== id && second !== id
}

function refuse(run: Run, reason: RefuseReason): ActionResult {
  return { ok: false, reason, run }
}

function draft(run: Run, action: Action): Run {
  const next = structuredClone(run)
  next.actions.push(structuredClone(action))
  return next
}

function startTurn(run: Run): void {
  run.gold = clampGold(run.gold + INCOME)
  run.enemyGold = clampGold(run.enemyGold + INCOME)
  const rival = buyRival({
    wins: run.wins,
    gold: run.enemyGold,
    board: run.enemy,
    nextInstance: run.nextInstance,
    rngState: run.rngState,
  })
  run.enemyGold = clampGold(rival.gold)
  run.enemy = rival.board
  run.nextInstance = rival.nextInstance
  run.rngState = rival.rngState
  const drawn = drawShop(run.wins, run.rngState)
  run.rngState = drawn.state
  run.shop = drawn.shop
}

export function createRun(seed: string): Run {
  const run: Run = {
    version: 1,
    seed,
    rngState: hashSeed(seed),
    wins: 0,
    hearts: 5,
    gold: 0,
    enemyGold: 0,
    player: [],
    enemy: [],
    shop: [null, null, null, null],
    phase: "shop",
    actions: [],
    lastLog: [],
    endReason: null,
    nextInstance: 1,
  }
  startTurn(run)
  return run
}

export function act(run: Run, action: Action): ActionResult {
  if (run.phase !== "shop") return refuse(run, "bad-index")
  switch (action.type) {
    case "buy-fighter":
      return buyFighter(run, action)
    case "buy-skill":
      return buySkill(run, action)
    case "sell-fighter":
      return sellFighter(run, action)
    case "sell-skill":
      return sellSkill(run, action)
    case "reorder":
      return reorder(run, action)
    case "swap-skills":
      return swapSkills(run, action)
    case "reroll":
      return reroll(run, action)
    case "fight":
      return fight(run, action)
    case "abandon":
      return abandon(run, action)
    default: {
      const unknown: never = action
      throw new Error(`unknown action ${JSON.stringify(unknown)}`)
    }
  }
}

function buyFighter(run: Run, action: Extract<Action, { type: "buy-fighter" }>): ActionResult {
  if (!inRange(action.slot, run.shop.length)) return refuse(run, "bad-index")
  const offer = run.shop[action.slot]
  if (!offer) return refuse(run, "empty-slot")
  if (offer.kind !== "fighter") return refuse(run, "wrong-card")
  if (run.gold < FIGHTER_COST) return refuse(run, "not-enough-gold")
  if (run.player.length >= seatLimit(run.wins)) return refuse(run, "no-open-seat")
  const next = draft(run, action)
  const printed = fighterById(offer.card)
  next.gold = clampGold(next.gold - FIGHTER_COST)
  next.shop[action.slot] = null
  next.player.push({
    instance: next.nextInstance,
    card: offer.card,
    gainedAttack: 0,
    health: printed.health,
    skills: [null, null],
  })
  next.nextInstance += 1
  return { ok: true, run: next }
}

function buySkill(run: Run, action: Extract<Action, { type: "buy-skill" }>): ActionResult {
  if (!inRange(action.slot, run.shop.length)) return refuse(run, "bad-index")
  if (!inRange(action.fighter, run.player.length)) return refuse(run, "bad-index")
  const offer = run.shop[action.slot]
  if (!offer) return refuse(run, "empty-slot")
  if (offer.kind !== "skill") return refuse(run, "wrong-card")
  if (run.gold < SKILL_COST) return refuse(run, "not-enough-gold")
  const fighter = run.player[action.fighter]
  if (!fighter || !skillFits(fighter, offer.card)) return refuse(run, "skill-not-legal")
  const next = draft(run, action)
  const target = next.player[action.fighter]
  if (!target) return refuse(run, "bad-index")
  next.gold = clampGold(next.gold - SKILL_COST)
  next.shop[action.slot] = null
  if (target.skills[0] === null) target.skills[0] = offer.card
  else target.skills[1] = offer.card
  return { ok: true, run: next }
}

function sellFighter(run: Run, action: Extract<Action, { type: "sell-fighter" }>): ActionResult {
  if (!inRange(action.fighter, run.player.length)) return refuse(run, "bad-index")
  const next = draft(run, action)
  next.player.splice(action.fighter, 1)
  next.gold = clampGold(next.gold + SELL_VALUE)
  return { ok: true, run: next }
}

function sellSkill(run: Run, action: Extract<Action, { type: "sell-skill" }>): ActionResult {
  if (!inRange(action.fighter, run.player.length)) return refuse(run, "bad-index")
  if (action.skillSlot !== 0 && action.skillSlot !== 1) return refuse(run, "bad-index")
  const fighter = run.player[action.fighter]
  if (!fighter || fighter.skills[action.skillSlot] === null) return refuse(run, "bad-index")
  const next = draft(run, action)
  const target = next.player[action.fighter]
  if (!target) return refuse(run, "bad-index")
  target.skills[action.skillSlot] = null
  next.gold = clampGold(next.gold + SELL_VALUE)
  return { ok: true, run: next }
}

function reorder(run: Run, action: Extract<Action, { type: "reorder" }>): ActionResult {
  if (!inRange(action.from, run.player.length) || !inRange(action.to, run.player.length)) {
    return refuse(run, "bad-index")
  }
  const next = draft(run, action)
  const [moved] = next.player.splice(action.from, 1)
  if (!moved) return refuse(run, "bad-index")
  next.player.splice(action.to, 0, moved)
  return { ok: true, run: next }
}

function swapSkills(run: Run, action: Extract<Action, { type: "swap-skills" }>): ActionResult {
  if (!inRange(action.fighter, run.player.length)) return refuse(run, "bad-index")
  const next = draft(run, action)
  const fighter = next.player[action.fighter]
  if (!fighter) return refuse(run, "bad-index")
  const [first, second] = fighter.skills
  fighter.skills = [second, first]
  return { ok: true, run: next }
}

function reroll(run: Run, action: Extract<Action, { type: "reroll" }>): ActionResult {
  if (run.gold < REROLL_COST) return refuse(run, "not-enough-gold")
  const next = draft(run, action)
  next.gold = clampGold(next.gold - REROLL_COST)
  const drawn = drawShop(next.wins, next.rngState)
  next.rngState = drawn.state
  next.shop = drawn.shop
  return { ok: true, run: next }
}

function fight(run: Run, action: Extract<Action, { type: "fight" }>): ActionResult {
  const next = draft(run, action)
  // Rival attack uses the win count from before this outcome.
  const resolved = resolveFight(next.player, next.enemy, next.wins)
  next.player = resolved.player
  next.enemy = resolved.enemy
  next.lastLog = resolved.log
  if (resolved.outcome === "win") next.wins += 1
  else if (resolved.outcome === "loss") {
    const standing = resolved.enemy.filter((fighter) => fighter.health > 0).length
    next.hearts = Math.max(0, next.hearts - standing)
  } else next.hearts = Math.max(0, next.hearts - 1)
  if (next.hearts === 0) {
    next.phase = "result"
    next.endReason = "hearts"
  } else startTurn(next)
  return { ok: true, run: next }
}

function abandon(run: Run, action: Extract<Action, { type: "abandon" }>): ActionResult {
  const next = draft(run, action)
  next.phase = "result"
  next.endReason = "abandon"
  return { ok: true, run: next }
}
