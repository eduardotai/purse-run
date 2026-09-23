import { describe, expect, it } from "vitest"
import { playRun } from "./play"

describe("balance gate", () => {
  it("keeps mirror wins in band and skill-first cards under the caps", () => {
    let mirrorTotal = 0
    let reached = 0
    const counts = new Map<string, number>()
    for (let index = 0; index < 2000; index += 1) {
      const seed = `sim-${index}`
      const mirror = playRun(seed, "mirror")
      const skillFirst = playRun(seed, "skill-first")
      expect(mirror.capped, seed).toBe(false)
      expect(skillFirst.capped, seed).toBe(false)
      mirrorTotal += mirror.wins
      if (!skillFirst.atSix) continue
      reached += 1
      const present = new Set<string>()
      for (const fighter of skillFirst.atSix) {
        present.add(fighter.card)
        for (const skill of fighter.skills) {
          if (skill) present.add(skill)
        }
      }
      for (const card of present) counts.set(card, (counts.get(card) ?? 0) + 1)
    }
    const mean = mirrorTotal / 2000
    expect(mean).toBeGreaterThanOrEqual(3)
    expect(mean).toBeLessThanOrEqual(9)
    expect(reached).toBeGreaterThanOrEqual(50)
    const cheer = counts.get("cheer") ?? 0
    const spark = counts.get("spark") ?? 0
    expect(cheer / reached).toBeLessThanOrEqual(0.6)
    expect(spark / reached).toBeLessThanOrEqual(0.6)
    for (const [card, count] of counts) {
      expect(count / reached, card).toBeLessThanOrEqual(0.75)
    }
  }, 120000)
})
