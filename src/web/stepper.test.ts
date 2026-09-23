import { describe, expect, it } from "vitest"
import { resolveFight } from "../rules/fight"
import { createRun } from "../rules/run"
import { stepBoards } from "./stepper"

describe("fight stepper", () => {
  it("matches the resolved boards after the log", () => {
    for (const seed of ["alpha", "beta", "sim-3", "purse"]) {
      const run = createRun(seed)
      const resolved = resolveFight(run.player, run.enemy, run.wins)
      const stepped = stepBoards(run.player, run.enemy, resolved.log)
      expect(stepped.player).toEqual(resolved.player)
      expect(stepped.enemy).toEqual(resolved.enemy)
    }
  })
})
