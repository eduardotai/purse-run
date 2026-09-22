import { expect, test } from "vitest"
import { drawShop } from "../src/rules/shop"
import { hashSeed } from "../src/rules/rng"

test("seed test at zero wins draws c15, c42, c42, brace", () => {
  const drawn = drawShop(0, hashSeed("test"))
  expect(drawn.shop).toEqual([
    { kind: "fighter", card: "c15" },
    { kind: "fighter", card: "c42" },
    { kind: "fighter", card: "c42" },
    { kind: "skill", card: "brace" },
  ])
  expect(drawn.state).toBe(1686002105)
})
