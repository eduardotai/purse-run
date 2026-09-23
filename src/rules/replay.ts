import { act, createRun } from "./run"
import type { Action, Run } from "./types"

export function replay(seed: string, actions: Action[]): Run {
  let run = createRun(seed)
  for (const action of actions) run = act(run, action).run
  return run
}

export function submissionMatches(seed: string, actions: Action[], wins: number, hearts: number): boolean {
  const again = replay(seed, actions)
  return again.wins === wins && again.hearts === hearts
}
