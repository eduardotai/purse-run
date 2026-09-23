import { expect, test } from "vitest"
import { act, createRun } from "../src/rules/run"
import { replay, submissionMatches } from "../src/rules/replay"

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

test("a posted score is accepted only when the replay matches", () => {
  let live = createRun("posted")
  live = act(live, { type: "abandon" }).run
  expect(submissionMatches(live.seed, live.actions, live.wins, live.hearts)).toBe(true)
  expect(submissionMatches(live.seed, live.actions, live.wins + 3, live.hearts)).toBe(false)
})
