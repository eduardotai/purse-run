import { expect, test } from "vitest"
import { FIGHTERS } from "../src/rules/cards"
import { fighterMark } from "../src/web/marks"

test("each fighter is a faced character, not a single block", () => {
  const marks = FIGHTERS.map((fighter) => fighterMark(fighter.id))
  expect(new Set(marks).size).toBe(FIGHTERS.length)
  for (const mark of marks) {
    expect(mark).toContain('class="mark"')
    expect(mark).toContain('class="body"')
    expect(mark).toContain('class="eye"')
    expect(mark).toContain("linearGradient")
    const stops = mark.match(/stop-color="[^"]+"/g) ?? []
    expect(new Set(stops).size).toBeGreaterThan(1)
  }
})
