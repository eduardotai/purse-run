import { describe, expect, it } from "vitest"
import { addTestSkill } from "./cards"
import { combatAttack, resolveFight } from "./fight"
import { act, createRun } from "./run"
import type { Fighter } from "./types"

addTestSkill({
  id: "test-press",
  rarity: "common",
  trigger: "on-attack",
  target: "self",
  effect: "gain-attack",
  n: 2,
})

addTestSkill({
  id: "test-cling",
  rarity: "common",
  trigger: "faint",
  target: "self",
  effect: "gain-health",
  n: 1,
})

addTestSkill({
  id: "test-echo",
  rarity: "common",
  trigger: "when-hurt",
  target: "self",
  effect: "damage",
  n: 1,
})

function unit(card: Fighter["card"], health: number, skill: Fighter["skills"][0] = null): Fighter {
  return {
    instance: 0,
    card,
    gainedAttack: 0,
    health,
    skills: [skill, null],
  }
}

describe("fight", () => {
  it("raises attack before the trade and faints the rival", () => {
    const player = unit("c24", 10, "test-press")
    player.instance = 1
    player.gainedAttack = 2
    const enemy = unit("c24", 5)
    enemy.instance = 2
    enemy.gainedAttack = 1
    const resolved = resolveFight([player], [enemy], 0)
    expect(combatAttack(resolved.player[0]!, 0, "player")).toBe(6)
    expect(resolved.enemy).toHaveLength(0)
    expect(resolved.log).toContainEqual({ type: "strike", attacker: 1, defender: 2, amount: 6 })
    expect(resolved.log).toContainEqual({ type: "strike", attacker: 2, defender: 1, amount: 3 })
    expect(resolved.log.at(-1)).toEqual({ type: "end", outcome: "win" })
  })

  it("lets mend save a fighter who landed on 0", () => {
    const player = unit("c15", 2, "mend")
    player.instance = 1
    const enemy = unit("c24", 20)
    enemy.instance = 2
    const resolved = resolveFight([player], [enemy], 0)
    expect(resolved.player[0]?.health).toBe(2)
  })

  it("removes a fighter whose faint skill gained health", () => {
    const player = unit("c24", 1, "test-cling")
    player.instance = 1
    const enemy = unit("c15", 10)
    enemy.instance = 2
    const resolved = resolveFight([player], [enemy], 0)
    expect(resolved.player.some((fighter) => fighter.instance === 1)).toBe(false)
  })

  it("calls a mutual wipe and costs 1 heart", () => {
    const run = createRun("mutual")
    run.player = [{ instance: 1, card: "c33", gainedAttack: 2, health: 3, skills: [null, null] }]
    run.enemy = [{ instance: 2, card: "c33", gainedAttack: 2, health: 3, skills: [null, null] }]
    const result = act(run, { type: "fight" })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.run.lastLog.at(-1)).toEqual({ type: "end", outcome: "mutual" })
    expect(result.run.hearts).toBe(4)
  })

  it("stops at the skill cap while a fighter is still alive", () => {
    const player = unit("c15", 500, "test-echo")
    player.instance = 1
    const enemy = unit("c15", 500)
    enemy.instance = 2
    const resolved = resolveFight([player], [enemy], 0)
    expect(resolved.log.some((event) => event.type === "cap")).toBe(true)
    expect(resolved.outcome).toBe("mutual")
    expect(resolved.player.some((fighter) => fighter.health > 0) || resolved.enemy.some((fighter) => fighter.health > 0)).toBe(
      true,
    )
  })
})
