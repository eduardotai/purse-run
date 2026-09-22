import "@fontsource/outfit/400.css"
import "@fontsource/outfit/600.css"
import "@fontsource/fraunces/600.css"
import { act, createRun } from "../rules/run"
import { replay } from "../rules/replay"
import { eventSentence } from "../rules/sentences"
import type { Action, FightEvent, RefuseReason, Run, RunResult } from "../rules/types"
import { playLog } from "./playback"
import "./styles.css"
import { renderTable, type Playback } from "./render"
import { clearCurrent, loadCurrent, loadResults, saveCurrent, saveResults } from "./storage"

const REFUSAL: Record<RefuseReason, string> = {
  "not-enough-gold": "Not enough gold",
  "no-open-seat": "No open seat",
  "skill-not-legal": "That skill does not fit",
  "empty-slot": "Empty slot",
  "wrong-card": "Wrong card",
  "bad-index": "That seat is not there",
}

function freshSeed(): string {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

function activeInstance(event: FightEvent): number | null {
  switch (event.type) {
    case "skill":
    case "faint":
      return event.instance
    case "strike":
      return event.attacker
    case "cap":
    case "end":
      return null
    default: {
      const unknown: never = event
      throw new Error(`unknown event ${JSON.stringify(unknown)}`)
    }
  }
}

function readNumber(node: Element, name: string): number {
  const raw = node.getAttribute(name)
  return raw === null ? Number.NaN : Number(raw)
}

const app = document.querySelector("#app")
if (app) boot(app)

function boot(root: Element): void {
  let run: Run = loadCurrent(localStorage) ?? startFresh()
  let confirming = false
  let playing = false
  let skipFlag = false
  let playback: Playback = null
  let frameHeld = false
  let toastTimer = 0

  function esc(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
  }

  function bind(scope: ParentNode): void {
    for (const node of scope.querySelectorAll("[data-action]")) {
      node.addEventListener("click", () => {
        void onClick(node)
      })
    }
  }

  function patchFrame(): void {
    if (!playback) return
    const stage = root.querySelector(".stage")
    if (!stage) return
    const lines = playback.lines.map((line) => `<p>${esc(line)}</p>`).join("")
    stage.innerHTML = `${lines}<button type="button" data-action="skip">Skip</button>`
    bind(stage)
    for (const seat of root.querySelectorAll(".seat.is-active")) seat.classList.remove("is-active")
    if (playback.activeInstance === null) return
    const seat = root.querySelector(`[data-instance="${playback.activeInstance}"]`)
    if (!(seat instanceof HTMLElement)) return
    seat.getBoundingClientRect()
    seat.classList.add("is-active")
  }

  function startFresh(): Run {
    clearCurrent(localStorage)
    const next = createRun(freshSeed())
    saveCurrent(next, localStorage)
    return next
  }

  function paint(): void {
    if (playback && frameHeld && root.querySelector(".stage")) {
      patchFrame()
      return
    }
    root.innerHTML = renderTable(run, playback)
    const table = root.querySelector(".table")
    if (confirming && table) {
      table.insertAdjacentHTML(
        "beforeend",
        `<div class="confirm"><p>End this run?</p><button type="button" data-action="abandon-yes">Yes</button><button type="button" data-action="abandon-no">Keep playing</button></div>`,
      )
    }
    bind(root)
    frameHeld = playback !== null
  }

  function toast(reason: RefuseReason): void {
    const table = root.querySelector(".table")
    if (!table) return
    table.setAttribute("data-toast", REFUSAL[reason])
    window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => table.removeAttribute("data-toast"), 1600)
  }

  function recordIfEnded(before: Run): void {
    if (before.phase !== "shop" || run.phase !== "result" || run.endReason === null) return
    const result: RunResult = {
      version: 1,
      id: crypto.randomUUID(),
      seed: run.seed,
      actions: run.actions,
      practice: true,
      opponent: "ai",
      mode: "pve",
      wins: run.wins,
      turns: run.actions.filter((action) => action.type === "fight").length,
      endReason: run.endReason,
      finalPlayer: run.player,
      finalEnemy: run.enemy,
      lastLog: run.lastLog,
    }
    const results = loadResults(localStorage)
    results.push(result)
    saveResults(results, localStorage)
  }

  function apply(action: Action): void {
    const before = run
    const result = act(run, action)
    if (!result.ok) {
      toast(result.reason)
      return
    }
    run = result.run
    recordIfEnded(before)
    saveCurrent(run, localStorage)
    paint()
  }

  async function watch(log: FightEvent[]): Promise<void> {
    playing = true
    skipFlag = false
    await playLog(
      log,
      (index) => {
        const event = log[index]
        if (!event) return
        playback = { lines: [eventSentence(event)], activeInstance: activeInstance(event) }
        paint()
      },
      () => skipFlag,
    )
    playback = null
    playing = false
    paint()
  }

  async function onClick(node: Element): Promise<void> {
    const name = node.getAttribute("data-action")
    if (!name) return
    if (name === "skip") {
      skipFlag = true
      return
    }
    if (playing) return
    if (name === "abandon") {
      confirming = true
      paint()
      return
    }
    if (name === "abandon-no") {
      confirming = false
      paint()
      return
    }
    if (name === "abandon-yes") {
      confirming = false
      apply({ type: "abandon" })
      return
    }
    if (name === "new-run") {
      run = startFresh()
      playback = null
      confirming = false
      paint()
      return
    }
    if (name === "replay") {
      replay(run.seed, run.actions)
      await watch(run.lastLog)
      return
    }
    if (name === "reroll") {
      apply({ type: "reroll" })
      return
    }
    if (name === "fight") {
      const before = run
      const result = act(run, { type: "fight" })
      if (!result.ok) {
        toast(result.reason)
        return
      }
      run = result.run
      recordIfEnded(before)
      saveCurrent(run, localStorage)
      await watch(run.lastLog)
      return
    }
    if (name === "buy-fighter") {
      apply({ type: "buy-fighter", slot: readNumber(node, "data-slot") })
      return
    }
    if (name === "buy-skill") {
      apply({ type: "buy-skill", slot: readNumber(node, "data-slot"), fighter: readNumber(node, "data-fighter") })
      return
    }
    if (name === "sell-fighter") {
      apply({ type: "sell-fighter", fighter: readNumber(node, "data-fighter") })
      return
    }
    if (name === "sell-skill") {
      apply({
        type: "sell-skill",
        fighter: readNumber(node, "data-fighter"),
        skillSlot: readNumber(node, "data-skill-slot"),
      })
      return
    }
    if (name === "reorder") {
      apply({ type: "reorder", from: readNumber(node, "data-from"), to: readNumber(node, "data-to") })
      return
    }
    if (name === "swap-skills") {
      apply({ type: "swap-skills", fighter: readNumber(node, "data-fighter") })
    }
  }

  paint()
}
