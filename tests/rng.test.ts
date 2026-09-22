import { expect, test } from "vitest"
import { hashSeed, nextUnit, rollD6, rollIndex } from "../src/rules/rng"

test("FNV-1a and mulberry32 match the known test vector", () => {
  expect(hashSeed("test")).toBe(2949673445)
  const first = nextUnit(2949673445)
  expect(first.unit).toBeCloseTo(0.7171058997046202, 12)
  expect(rollD6(2949673445).face).toBe(5)
  const second = nextUnit(first.state)
  expect(second.unit).toBeCloseTo(0.3465085106436163, 12)
  expect(rollIndex(first.state, 4).index).toBe(1)
})
