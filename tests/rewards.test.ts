import { expect, test } from "vitest"
import { ribbonFrom, syncRibbons } from "../src/rules/rewards"
import type { RunResult } from "../src/rules/types"

function result(id: string, wins: number): RunResult {
  return {
    version: 1,
    id,
    seed: "s",
    actions: [],
    practice: true,
    opponent: "ai",
    mode: "pve",
    wins,
    turns: 1,
    endReason: "hearts",
    finalPlayer: [],
    finalEnemy: [],
    lastLog: [],
  }
}

test("a ribbon is granted from the result and does not rewrite it", () => {
  const finished = result("run-a", 4)
  const before = structuredClone(finished)
  const ribbon = ribbonFrom(finished)
  expect(ribbon).toEqual({ version: 1, runId: "run-a", wins: 4 })
  expect(finished).toEqual(before)
})

test("the same run is granted once", () => {
  const runs = [result("run-a", 2), result("run-b", 5)]
  const once = syncRibbons(runs, [])
  const twice = syncRibbons(runs, once)
  expect(twice).toEqual(once)
  expect(twice.map((ribbon) => ribbon.runId)).toEqual(["run-a", "run-b"])
})
