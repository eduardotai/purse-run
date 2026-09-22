import { act, createRun } from "./run"
import type { Action, Run } from "./types"

export function replay(seed: string, actions: Action[]): Run {
  let run = createRun(seed)
  for (const action of actions) run = act(run, action).run
  return run
}
