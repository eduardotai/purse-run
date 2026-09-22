import { expect, test } from "vitest"
import { hashSeed } from "../src/rules/rng"
import { buyRival } from "../src/rules/rival"

test("turn 1 buys the three fighters, leaves the skill, and stops at 1 gold", () => {
  const bought = buyRival({
    wins: 0,
    gold: 10,
    board: [],
    nextInstance: 1,
    rngState: hashSeed("test"),
  })
  expect(bought.board.map((f) => f.card)).toEqual(["c15", "c42", "c42"])
  expect(bought.board.map((f) => f.instance)).toEqual([1, 2, 3])
  expect(bought.gold).toBe(1)
  expect(bought.nextInstance).toBe(4)
  expect(bought.rngState).toBe(1686002105)
})
