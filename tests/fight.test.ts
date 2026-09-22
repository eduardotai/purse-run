import { beforeEach, expect, test } from "vitest"
import { registerTestSkill } from "../src/rules/cards"
import { resolveFight } from "../src/rules/fight"
import type { Fighter } from "../src/rules/types"

function body(partial: Partial<Fighter> & Pick<Fighter, "instance" | "card" | "health">): Fighter {
  return { gainedAttack: 0, skills: [null, null], ...partial }
}

beforeEach(() => {
  registerTestSkill({
    id: "test-grow",
    rarity: "common",
    trigger: "on-attack",
    target: "self",
    effect: "gain-attack",
    n: 2,
  })
  registerTestSkill({
    id: "test-faint-heal",
    rarity: "common",
    trigger: "faint",
    target: "self",
    effect: "gain-health",
    n: 5,
  })
  registerTestSkill({
    id: "test-self-ping",
    rarity: "common",
    trigger: "when-hurt",
    target: "self",
    effect: "damage",
    n: 1,
  })
})

test("the canonical trade hits for 6 and 3, then the rival faints", () => {
  const result = resolveFight(
    [body({ instance: 1, card: "c42", health: 10, skills: ["test-grow", null] })],
    [body({ instance: 2, card: "c33", health: 5 })],
    0,
  )
  expect(result.player[0].gainedAttack).toBe(2)
  expect(result.enemy).toEqual([])
  expect(result.log.filter((e) => e.type === "strike")).toEqual([
    { type: "strike", attacker: 1, defender: 2, amount: 6 },
    { type: "strike", attacker: 2, defender: 1, amount: 3 },
  ])
})

test("Mend saves a fighter who lands on exactly 0", () => {
  const result = resolveFight(
    [body({ instance: 1, card: "c15", health: 2, skills: ["mend", null] })],
    [body({ instance: 2, card: "c24", health: 1 })],
    0,
  )
  expect(result.player[0].health).toBe(2)
  expect(result.enemy).toEqual([])
})

test("a Faint heal still removes the fighter", () => {
  const result = resolveFight(
    [body({ instance: 1, card: "c24", health: 1, skills: ["test-faint-heal", null] })],
    [body({ instance: 2, card: "c15", health: 30 })],
    0,
  )
  expect(result.player).toEqual([])
})

test("equal 3/3 fronts are a mutual result", () => {
  const result = resolveFight(
    [body({ instance: 1, card: "c33", health: 3 })],
    [body({ instance: 2, card: "c33", health: 3 })],
    0,
  )
  expect(result.outcome).toBe("mutual")
  expect(result.player).toEqual([])
  expect(result.enemy).toEqual([])
})

test("a self-damage When hurt reaches the cap and still ends mutual", () => {
  const result = resolveFight(
    [body({ instance: 1, card: "c15", health: 500, skills: ["test-self-ping", null] })],
    [body({ instance: 2, card: "c42", health: 20 })],
    0,
  )
  expect(result.log.some((e) => e.type === "cap")).toBe(true)
  expect(result.outcome).toBe("mutual")
})
