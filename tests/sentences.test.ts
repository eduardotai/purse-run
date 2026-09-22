import { expect, test } from "vitest"
import { eventSentence } from "../src/rules/sentences"

test("a skill sentence names the fighter, the skill, and the number", () => {
  expect(eventSentence({ type: "skill", instance: 4, skill: "jab", amount: 1, target: 9 })).toBe(
    "Fighter 4 jab: 1",
  )
  expect(eventSentence({ type: "strike", attacker: 1, defender: 2, amount: 6 })).toBe(
    "Fighter 1 hits Fighter 2 for 6",
  )
})
