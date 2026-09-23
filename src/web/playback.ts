import type { FightEvent } from "../rules/types"

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function playLog(
  log: FightEvent[],
  onFrame: (index: number) => void,
  skip: () => boolean,
): Promise<void> {
  if (log.length === 0) return
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches
  for (let index = 0; index < log.length; index += 1) {
    if (skip()) {
      onFrame(log.length - 1)
      return
    }
    onFrame(index)
    await wait(reduced ? 0 : 700)
  }
}
