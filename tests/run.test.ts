import { expect, test } from "vitest"
import { act, createRun, seatLimit } from "../src/rules/run"
import type { Fighter, Run } from "../src/rules/types"

test("seed test opens with the rival's three fighters and the player's second draw", () => {
  const run = createRun("test")
  expect(run.enemy.map((f) => f.card)).toEqual(["c15", "c42", "c42"])
  expect(run.enemyGold).toBe(1)
  expect(run.gold).toBe(10)
  expect(run.hearts).toBe(5)
  expect(run.shop.map((offer) => (offer?.kind === "fighter" ? offer.card : offer?.card))).toEqual([
    "c33",
    "c24",
    "c15",
    "spark",
  ])
})

test("a refused buy touches nothing", () => {
  const run = createRun("test")
  const before = structuredClone(run)
  const result = act(run, { type: "buy-fighter", slot: 3 })
  expect(result.ok).toBe(false)
  if (!result.ok) expect(result.reason).toBe("wrong-card")
  expect(result.run.gold).toBe(before.gold)
  expect(result.run.actions).toEqual([])
  expect(result.run.rngState).toBe(before.rngState)
})

test("reroll from 2 gold spends 2 and refills four slots", () => {
  const run = createRun("test")
  run.gold = 2
  const result = act(run, { type: "reroll" })
  expect(result.ok).toBe(true)
  expect(result.run.gold).toBe(0)
  expect(result.run.shop.every((slot) => slot !== null)).toBe(true)
})

test("income and a sale both stop at 15", () => {
  const run = createRun("test")
  run.gold = 12
  run.wins = 0
  run.player = [unit(1, "c24", 4)]
  run.shop = [{ kind: "skill", card: "jab" }, null, null, null]
  const bought = act(run, { type: "buy-skill", slot: 0, fighter: 0 })
  bought.run.gold = 15
  const sold = act(bought.run, { type: "sell-skill", fighter: 0, skillSlot: 0 })
  expect(sold.run.gold).toBe(15)
})

test("seat limits are 3, then 4, then 5", () => {
  expect(seatLimit(0)).toBe(3)
  expect(seatLimit(1)).toBe(3)
  expect(seatLimit(2)).toBe(4)
  expect(seatLimit(3)).toBe(4)
  expect(seatLimit(4)).toBe(5)
})

test("a win from 1 win opens a fourth seat on the next buy", () => {
  let run = woundedWin()
  run = act(run, { type: "fight" }).run
  expect(run.wins).toBe(2)
  expect(run.player[0].health).toBe(6)
  run.shop = [{ kind: "fighter", card: "c24" }, null, null, null]
  run.gold = 9
  run.player = [unit(1, "c24", 7), unit(2, "c24", 4), unit(3, "c24", 4)]
  const fourth = act(run, { type: "buy-fighter", slot: 0 })
  expect(fourth.ok).toBe(true)
  expect(fourth.run.player).toHaveLength(4)
  fourth.run.shop = [{ kind: "fighter", card: "c24" }, null, null, null]
  fourth.run.gold = 3
  const fifth = act(fourth.run, { type: "buy-fighter", slot: 0 })
  expect(fifth.ok).toBe(false)
  if (!fifth.ok) expect(fifth.reason).toBe("no-open-seat")
})

function unit(instance: number, card: Fighter["card"], health: number): Fighter {
  return { instance, card, health, gainedAttack: 0, skills: [null, null] }
}

function woundedWin(): Run {
  const run = createRun("seats")
  run.wins = 1
  run.gold = 0
  run.player = [unit(1, "r55", 10)]
  run.enemy = [unit(2, "c42", 1)]
  run.player[0].gainedAttack = 0
  return run
}
