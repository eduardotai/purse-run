import { describe, expect, test } from "vitest"
import { FIGHTERS, SKILLS, fighterById, skillById } from "../src/rules/cards"

describe("roster rails", () => {
  test("fighter sums and skill numbers match the bands", () => {
    for (const fighter of FIGHTERS) {
      const sum = fighter.attack + fighter.health
      expect(sum).toBe(fighter.rarity === "common" ? 6 : fighter.rarity === "uncommon" ? 8 : 10)
    }
    expect(FIGHTERS.map((f) => f.id)).toEqual(["c24", "c42", "c15", "c33", "u44", "u35", "r55", "r46"])
    for (const skill of SKILLS) {
      const n = skill.rarity === "common" ? 1 : skill.rarity === "uncommon" ? 2 : 3
      expect(skill.n).toBe(n)
      const whole = skill.target === "all-friends" || skill.target === "all-enemies"
      if (whole) {
        expect(skill.rarity).toBe("common")
        expect(["start", "on-attack"]).toContain(skill.trigger)
      }
      if (skill.trigger === "faint" || skill.trigger === "when-hurt") {
        expect(whole).toBe(false)
      }
    }
    expect(skillById("mend").n).toBe(2)
    expect(fighterById("c42")).toMatchObject({ attack: 4, health: 2 })
  })
})
