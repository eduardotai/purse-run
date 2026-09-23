import { describe, expect, it } from "vitest"
import { applyPoints, pointChange, publicRank } from "./points"
import { hashSeed } from "./rng"

describe("points", () => {
  it("matches the approved K=24 samples", () => {
    expect(pointChange(1000, 1200, 1, 5)).toBe(18)
    expect(pointChange(1000, 1200, 0, 5)).toBe(-6)
    expect(pointChange(1000, 800, 1, 5)).toBe(6)
    expect(pointChange(1000, 800, 0, 5)).toBe(-18)
    expect(pointChange(1000, 1000, 1, 5)).toBe(12)
    expect(pointChange(1000, 1000, 0, 5)).toBe(-12)
  })

  it("hides rank until 5 games and clamps points at 0", () => {
    expect(publicRank(1000, 4)).toBeNull()
    expect(publicRank(899, 5)).toBe("I")
    expect(publicRank(900, 5)).toBe("II")
    expect(publicRank(1100, 5)).toBe("III")
    expect(publicRank(1300, 5)).toBe("IV")
    expect(publicRank(1500, 5)).toBe("V")
    expect(applyPoints(3, -10)).toBe(0)
  })

  it("hashes a with FNV-1a 32", () => {
    expect(hashSeed("a")).toBe(0xe40c292c)
  })
})
