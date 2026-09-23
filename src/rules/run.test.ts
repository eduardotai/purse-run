import { describe, expect, it } from "vitest"
import { drawShop } from "./shop"
import { hashSeed } from "./rng"
import { replay, sameBoard, sameLog, submissionMatches } from "./replay"
import { act, createRun, seatLimit } from "./run"

describe("shop and run", () => {
  it("spends 2 gold and refills four slots on reroll", () => {
    const run = createRun("reroll")
    run.gold = 2
    const result = act(run, { type: "reroll" })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.run.gold).toBe(0)
    expect(result.run.shop).toHaveLength(4)
    expect(result.run.shop.every((offer) => offer !== null)).toBe(true)
  })

  it("clamps income at 15 and a sale at 15", () => {
    const income = createRun("income")
    income.gold = 12
    income.player = [{ instance: 9, card: "c42", gainedAttack: 0, health: 2, skills: [null, null] }]
    income.enemy = []
    const fought = act(income, { type: "fight" })
    expect(fought.ok).toBe(true)
    if (!fought.ok) return
    expect(fought.run.gold).toBe(15)

    const sale = createRun("sale")
    sale.gold = 15
    sale.player = [{ instance: 9, card: "c42", gainedAttack: 0, health: 2, skills: [null, null] }]
    const sold = act(sale, { type: "sell-fighter", fighter: 0 })
    expect(sold.ok).toBe(true)
    if (!sold.ok) return
    expect(sold.run.gold).toBe(15)
    expect(sold.run.player).toHaveLength(0)
  })

  it("opens 4 seats after 2 wins and 5 after 4", () => {
    expect(seatLimit(2)).toBe(4)
    expect(seatLimit(4)).toBe(5)
    expect(seatLimit(0)).toBe(3)
    expect(seatLimit(1)).toBe(3)
    expect(seatLimit(3)).toBe(4)
    expect(seatLimit(6)).toBe(5)
  })

  it("leaves a refused buy untouched", () => {
    const run = createRun("refuse")
    const skill = run.shop.findIndex((offer) => offer?.kind === "skill")
    expect(skill).toBeGreaterThanOrEqual(0)
    const result = act(run, { type: "buy-fighter", slot: skill })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("wrong-card")
    expect(result.run).toBe(run)
    expect(result.run.gold).toBe(run.gold)
    expect(result.run.rngState).toBe(run.rngState)
    expect(result.run.actions).toHaveLength(0)
    expect(result.run.player).toEqual(run.player)
  })

  it("keeps damaged health into the next shop", () => {
    const run = createRun("hurt")
    run.player = [{ instance: 1, card: "c24", gainedAttack: 0, health: 4, skills: [null, null] }]
    run.enemy = [{ instance: 2, card: "c15", gainedAttack: 0, health: 2, skills: [null, null] }]
    const result = act(run, { type: "fight" })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.run.phase).toBe("shop")
    expect(result.run.player[0]?.health).toBe(3)
  })

  it("buys the three turn-1 fighters, leaves the skill, and does not reroll", () => {
    for (const seed of ["a", "sim-0", "hello", "0", "purse", "seed-seed"]) {
      const run = createRun(seed)
      let state = hashSeed(seed)
      const rivalDraw = drawShop(0, state)
      state = rivalDraw.state
      const playerDraw = drawShop(0, state)
      expect(run.enemy).toHaveLength(3)
      expect(run.enemyGold).toBe(1)
      expect(run.gold).toBe(10)
      expect(run.enemy.every((fighter) => fighter.skills[0] === null && fighter.skills[1] === null)).toBe(true)
      expect(run.enemy.map((fighter) => fighter.card)).toEqual(
        rivalDraw.shop.filter((offer) => offer?.kind === "fighter").map((offer) => offer?.card),
      )
      expect(run.shop).toEqual(playerDraw.shop)
      expect(run.rngState).toBe(playerDraw.state)
    }
  })

  it("replays the same seed and actions", () => {
    let run = createRun("replay-me")
    const fighter = run.shop.findIndex((offer) => offer?.kind === "fighter")
    const bought = act(run, { type: "buy-fighter", slot: fighter })
    expect(bought.ok).toBe(true)
    if (!bought.ok) return
    run = bought.run
    const fought = act(run, { type: "fight" })
    expect(fought.ok).toBe(true)
    if (!fought.ok) return
    run = fought.run
    const again = replay(run.seed, run.actions)
    expect(again.wins).toBe(run.wins)
    expect(again.hearts).toBe(run.hearts)
    expect(sameBoard(again.player, run.player)).toBe(true)
    expect(sameBoard(again.enemy, run.enemy)).toBe(true)
    expect(sameLog(again.lastLog, run.lastLog)).toBe(true)
    expect(submissionMatches(run.seed, run.actions, run.wins, run.hearts)).toBe(true)
  })
})
