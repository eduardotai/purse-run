import { expect, test } from "vitest"
import { pointChange, publicRank } from "../src/rules/points"

test("approved point samples at K 24", () => {
  expect(pointChange(1000, 1200, 1, 5)).toBe(18)
  expect(pointChange(1000, 1200, 0, 5)).toBe(-6)
  expect(pointChange(1000, 800, 1, 5)).toBe(6)
  expect(pointChange(1000, 800, 0, 5)).toBe(-18)
  expect(pointChange(1000, 1000, 1, 5)).toBe(12)
  expect(pointChange(1000, 1000, 0, 5)).toBe(-12)
})

test("rank stays hidden until five games", () => {
  expect(publicRank(1000, 4)).toBeNull()
  expect(publicRank(1000, 5)).toBe("II")
  expect(publicRank(1500, 5)).toBe("V")
  expect(publicRank(899, 5)).toBe("I")
})
