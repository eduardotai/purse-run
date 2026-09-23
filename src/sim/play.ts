import { act, createRun } from "../rules/run"
import { bestFighterSlot, bestSkillBuy, seatLimit, type ShopMode } from "../rules/rival"
import type { Action, Fighter, Run } from "../rules/types"

function autoShop(run: Run, mode: ShopMode): Run {
  let current = run
  let rerolls = 0
  while (true) {
    let bought = false
    const phases = mode === "skills-first" ? (["skill", "fighter"] as const) : (["fighter", "skill"] as const)
    for (const phase of phases) {
      while (true) {
        const action: Action | null =
          phase === "fighter"
            ? (() => {
                if (current.player.length >= seatLimit(current.wins)) return null
                const slot = bestFighterSlot(current.shop, current.gold)
                return slot === null ? null : { type: "buy-fighter", slot }
              })()
            : (() => {
                const pick = bestSkillBuy(current.shop, current.player, current.gold)
                return pick ? { type: "buy-skill", slot: pick.slot, fighter: pick.fighter } : null
              })()
        if (!action) break
        const result = act(current, action)
        if (!result.ok) break
        current = result.run
        bought = true
      }
    }
    if (!bought && current.gold >= 5 && rerolls < 3) {
      const result = act(current, { type: "reroll" })
      if (!result.ok) break
      current = result.run
      rerolls += 1
      continue
    }
    break
  }
  return current
}

export function playRun(
  seed: string,
  mode: "mirror" | "skill-first",
): { wins: number; capped: boolean; atSix: Fighter[] | null } {
  let run = createRun(seed)
  let capped = false
  let atSix: Fighter[] | null = null
  const policy: ShopMode = mode === "mirror" ? "fighters-first" : "skills-first"
  let guard = 0
  while (run.phase === "shop") {
    guard += 1
    if (guard > 160) throw new Error(`run ${seed} ${mode} did not end`)
    run = autoShop(run, policy)
    const beforeWins = run.wins
    const result = act(run, { type: "fight" })
    if (!result.ok) throw new Error(`fight refused for ${seed}`)
    run = result.run
    if (run.lastLog.some((event) => event.type === "cap")) capped = true
    if (atSix === null && beforeWins < 6 && run.wins >= 6) atSix = structuredClone(run.player)
  }
  return { wins: run.wins, capped, atSix }
}
