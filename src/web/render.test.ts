import { describe, expect, it } from "vitest"
import { skillById } from "../rules/cards"
import { resolveFight } from "../rules/fight"
import { act, FIGHTER_COST, REROLL_COST, createRun } from "../rules/run"
import type { Run } from "../rules/types"
import { skillLine } from "./copy"
import { renderTable } from "./render"
import { stepBoards } from "./stepper"

function buyFighters(run: Run): Run {
  let next = run
  for (let slot = 0; slot < next.shop.length; slot += 1) {
    if (next.shop[slot]?.kind !== "fighter") continue
    const result = act(next, { type: "buy-fighter", slot })
    if (result.ok) next = result.run
  }
  return next
}

describe("battle table", () => {
  it("puts cost, health, reroll, gold, and front on the table", () => {
    const run = createRun("visual")
    const html = renderTable(run, null, null)
    const skill = run.shop.find((offer) => offer?.kind === "skill")
    expect(skill?.kind).toBe("skill")
    if (skill?.kind !== "skill") return
    const player = html.split('<section class="mat" data-side="player"')[1] ?? ""
    const labels = [...player.matchAll(/<span class="pos">([^<]+)<\/span>/g)].map((match) => match[1])
    expect(labels.at(-1)).toBe("FRONT")
    expect(html).toContain("The rightmost fighter hits first.")
    expect(html).toContain(`aria-label="Cost ${FIGHTER_COST}"`)
    expect(html).toContain("badge-hp")
    expect(html).toContain(skillLine(skillById(skill.card)))
    expect(html).toContain(`aria-label="Amount ${skillById(skill.card).n}"`)
    expect(html).toContain("Reroll")
    expect(html).toContain(`class="coin">${REROLL_COST}</span>`)
    expect(html).toContain(`data-gold="${run.gold}"`)
    expect(html.match(/class="pip"/g)?.length).toBe(run.gold)
    expect(html).toContain("Round 1")
    expect(html).toContain(">Fight<")
  })

  it("keeps the reroll price readable when gold is short", () => {
    const run = createRun("visual")
    run.gold = 1
    const html = renderTable(run, null, null)
    expect(html).toContain("disabled")
    expect(html).toContain(`class="coin">${REROLL_COST}</span>`)
  })

  it("lifts a shop fighter with buy", () => {
    const run = createRun("visual")
    const slot = run.shop.findIndex((offer) => offer?.kind === "fighter")
    const html = renderTable(run, null, { kind: "offer", slot })
    expect(html).toContain(`Buy ${FIGHTER_COST}`)
    expect(html).toContain("is-lifted")
  })

  it("shows the health from the beat that just landed", () => {
    const run = buyFighters(createRun("visual"))
    const resolved = resolveFight(run.player, run.enemy, run.wins)
    const strikeAt = resolved.log.findIndex((event) => event.type === "strike")
    const strike = resolved.log[strikeAt]
    expect(strike?.type).toBe("strike")
    if (strike?.type !== "strike") return
    const before = stepBoards(run.player, run.enemy, resolved.log.slice(0, strikeAt))
    const after = stepBoards(run.player, run.enemy, resolved.log.slice(0, strikeAt + 1))
    const earlier = [...before.player, ...before.enemy].find((fighter) => fighter.instance === strike.defender)
    const later = [...after.player, ...after.enemy].find((fighter) => fighter.instance === strike.defender)
    expect(later).toBeTruthy()
    expect(earlier?.health).not.toBe(later?.health)
    const html = renderTable(
      run,
      { lines: ["hit"], activeInstance: strike.defender },
      null,
      { player: after.player, enemy: after.enemy, hearts: run.hearts, wins: run.wins },
    )
    expect(html).toContain(`aria-label="Health ${Math.max(0, later?.health ?? 0)}"`)
    expect(html).toContain(`data-hearts="${run.hearts}"`)
  })

  it("prints zero when a hit would drop health below zero", () => {
    const run = createRun("visual")
    const enemy = run.enemy[0]
    expect(enemy).toBeTruthy()
    if (!enemy) return
    enemy.health = -2
    const html = renderTable(run, null, null)
    expect(html).toContain('aria-label="Health 0"')
    expect(html).not.toContain('aria-label="Health -2"')
  })
})
