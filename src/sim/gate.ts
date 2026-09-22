import { fighterById, skillById } from "../rules/cards"
import { act, createRun, seatLimit } from "../rules/run"
import type { Action, Fighter, Offer, Run, SkillId } from "../rules/types"

const SEEDS = 2000
const TURN_LIMIT = 200

type Policy = "mirror" | "skill-first"
type ShopStep = (run: Run) => { run: Run; bought: boolean }

function apply(run: Run, action: Action): Run {
  const result = act(run, action)
  if (!result.ok) throw new Error(`${action.type} refused: ${result.reason}`)
  return result.run
}

function canHold(fighter: Fighter, id: SkillId): boolean {
  const [first, second] = fighter.skills
  return (first === null || second === null) && first !== id && second !== id
}

function bestFighterSlot(offers: readonly (Offer | null)[]): number | null {
  let best: number | null = null
  let bestScore = -1
  for (let index = 0; index < offers.length; index += 1) {
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

function bestSkillSlot(offers: readonly (Offer | null)[], board: readonly Fighter[]): number | null {
  let best: number | null = null
  let bestN = -1
  for (let index = 0; index < offers.length; index += 1) {
    const offer = offers[index]
    if (!offer || offer.kind !== "skill") continue
    if (!board.some((fighter) => canHold(fighter, offer.card))) continue
    const n = skillById(offer.card).n
    if (best === null || n > bestN) {
      best = index
      bestN = n
    }
  }
  return best
}

function holder(board: readonly Fighter[], id: SkillId): number | null {
  const index = board.findIndex((fighter) => canHold(fighter, id))
  return index >= 0 ? index : null
}

function buyFighters(run: Run): { run: Run; bought: boolean } {
  let bought = false
  while (run.player.length < seatLimit(run.wins) && run.gold >= 3) {
    const slot = bestFighterSlot(run.shop)
    if (slot === null) break
    run = apply(run, { type: "buy-fighter", slot })
    bought = true
  }
  return { run, bought }
}

function buySkills(run: Run): { run: Run; bought: boolean } {
  let bought = false
  while (run.gold >= 3) {
    const slot = bestSkillSlot(run.shop, run.player)
    if (slot === null) break
    const offer = run.shop[slot]
    if (!offer || offer.kind !== "skill") break
    const fighter = holder(run.player, offer.card)
    if (fighter === null) break
    run = apply(run, { type: "buy-skill", slot, fighter })
    bought = true
  }
  return { run, bought }
}

function shopTurn(run: Run, policy: Policy): Run {
  const first: ShopStep = policy === "skill-first" ? buySkills : buyFighters
  const second: ShopStep = policy === "skill-first" ? buyFighters : buySkills
  let rerolls = 0
  while (true) {
    const led = first(run)
    run = led.run
    const followed = second(run)
    run = followed.run
    if (led.bought || followed.bought || run.gold < 5 || rerolls >= 3) return run
    run = apply(run, { type: "reroll" })
    rerolls += 1
  }
}

function presence(board: readonly Fighter[]): string[] {
  const seen = new Set<string>()
  const ids: string[] = []
  for (const fighter of board) {
    if (!seen.has(fighter.card)) {
      seen.add(fighter.card)
      ids.push(fighter.card)
    }
    for (const skill of fighter.skills) {
      if (skill !== null && !seen.has(skill)) {
        seen.add(skill)
        ids.push(skill)
      }
    }
  }
  return ids
}

function hasCap(run: Run): boolean {
  return run.lastLog.some((event) => event.type === "cap")
}

type Played = { run: Run; capped: boolean; present: string[] | null; turns: number; open: boolean }

function play(seed: string, policy: Policy): Played {
  let run = createRun(seed)
  let capped = false
  let present: string[] | null = null
  let turns = 0
  while (run.phase === "shop") {
    turns += 1
    if (turns > TURN_LIMIT) return { run, capped, present, turns, open: true }
    run = shopTurn(run, policy)
    if (run.hearts <= 0 || run.phase !== "shop") break
    const winsBefore = run.wins
    run = apply(run, { type: "fight" })
    if (hasCap(run)) capped = true
    if (policy === "skill-first" && present === null && winsBefore < 6 && run.wins >= 6) present = presence(run.player)
  }
  if (run.phase !== "result") throw new Error(`${policy} ${seed} stopped in ${run.phase}`)
  return { run, capped, present, turns, open: false }
}

export function playPolicy(seed: string, policy: Policy): Run {
  return play(seed, policy).run
}

function rateText(count: number, samples: number): string {
  return (count / samples).toFixed(2)
}

export function evaluateGate(): { ok: true } | { ok: false; reason: string } {
  let mirrorWins = 0
  let samples = 0
  let capped = false
  let mirrorOpen = 0
  let skillOpen = 0
  const counts = new Map<string, number>()

  for (let index = 0; index < SEEDS; index += 1) {
    const seed = `sim-${index}`
    const mirror = play(seed, "mirror")
    mirrorWins += mirror.run.wins
    if (mirror.open) mirrorOpen += 1
    if (mirror.capped) capped = true
    const skilled = play(seed, "skill-first")
    if (skilled.open) skillOpen += 1
    if (skilled.capped) capped = true
    if (skilled.present) {
      samples += 1
      for (const id of skilled.present) counts.set(id, (counts.get(id) ?? 0) + 1)
    }
  }

  const cheer = counts.get("cheer") ?? 0
  const spark = counts.get("spark") ?? 0
  if (mirrorOpen > 0 || skillOpen > 0) return { ok: false, reason: "open" }
  if (capped) return { ok: false, reason: "cap" }
  if (mirrorWins < 3 * SEEDS || mirrorWins > 9 * SEEDS) {
    return { ok: false, reason: `mirror mean ${(mirrorWins / SEEDS).toFixed(1)}` }
  }
  if (samples < 50) return { ok: false, reason: `samples ${samples}` }
  if (cheer * 5 > samples * 3) return { ok: false, reason: `cheer ${rateText(cheer, samples)}` }
  if (spark * 5 > samples * 3) return { ok: false, reason: `spark ${rateText(spark, samples)}` }
  let worstId: string | null = null
  let worstCount = -1
  for (const [id, count] of counts) {
    if (count * 4 <= samples * 3) continue
    if (worstId === null || count > worstCount || (count === worstCount && id < worstId)) {
      worstId = id
      worstCount = count
    }
  }
  if (worstId !== null) return { ok: false, reason: `${worstId} ${rateText(worstCount, samples)}` }
  return { ok: true }
}
