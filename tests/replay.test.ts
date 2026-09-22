import { expect, test } from "vitest"
import { act, createRun } from "../src/rules/run"
import { replay } from "../src/rules/replay"

test("the same seed and actions reproduce the boards and the last log", () => {
  let live = createRun("replay-me")
  live = act(live, { type: "buy-fighter", slot: 0 }).run
  live = act(live, { type: "reroll" }).run
  live = act(live, { type: "fight" }).run
  const again = replay(live.seed, live.actions)
  expect(again.wins).toBe(live.wins)
  expect(again.hearts).toBe(live.hearts)
  expect(again.player).toEqual(live.player)
  expect(again.enemy).toEqual(live.enemy)
  expect(again.lastLog).toEqual(live.lastLog)
})
