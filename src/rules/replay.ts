import { act, createRun } from "./run"
import type { Action, Fighter, FightEvent, Run } from "./types"

export function replay(seed: string, actions: Action[]): Run {
  let run = createRun(seed)
  for (const action of actions) {
    const result = act(run, action)
    if (!result.ok) return run
    run = result.run
    if (action.type === "abandon") return run
  }
  return run
}

export function submissionMatches(seed: string, actions: Action[], wins: number, hearts: number): boolean {
  const run = replay(seed, actions)
  return run.wins === wins && run.hearts === hearts
}

export function sameBoard(left: Fighter[], right: Fighter[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function sameLog(left: FightEvent[], right: FightEvent[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}
