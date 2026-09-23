import "@fontsource/outfit/400.css"
import "@fontsource/outfit/600.css"
import "@fontsource/fraunces/600.css"
import { act, createRun } from "../rules/run"
import { replay, submissionMatches } from "../rules/replay"
import { resolveFight } from "../rules/fight"
import { buyRival } from "../rules/rival"
import { hashSeed } from "../rules/rng"
import { applyPoints, pointChange } from "../rules/points"
import { serveOpponent } from "../rules/ghosts"
import { pickOpponent, type Seat } from "../rules/match"
import { syncRibbons } from "../rules/rewards"
import { eventSentence } from "../rules/sentences"
import type { Action, FightEvent, Fighter, RefuseReason, Run, RunResult } from "../rules/types"
import {
  renderBoard,
  renderHome,
  renderProfile,
  renderPvpHall,
  renderPvpMatch,
  renderStats,
  scoreOf,
} from "./menu"
import { playLog } from "./playback"
import "./styles.css"
import { renderTable, clashMarkup, type ClashBeat, type Playback } from "./render"
import {
  clearCurrent,
  loadCurrent,
  loadGhosts,
  loadProfile,
  loadPvp,
  loadResults,
  loadRibbons,
  saveCurrent,
  saveGhost,
  saveProfile,
  savePvp,
  saveResults,
  saveRibbons,
  type Profile,
  type PvpRecord,
} from "./storage"

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

type Screen = "menu" | "pve" | "pvp" | "stats" | "board" | "profile" | "pvp-match"
type PvpMatch = {
  player: Fighter[]
  enemy: Fighter[]
  wins: number
  scored: boolean
  outcome: "win" | "loss" | "mutual" | null
  delta: number | null
  foePoints: number
}

function boot(root: Element): void {
  let run: Run | null = loadCurrent(localStorage)
  let screen: Screen = "menu"
  let profile: Profile = loadProfile(localStorage)
  if (profile.id.length === 0) {
    profile = { ...profile, id: crypto.randomUUID() }
    saveProfile(profile, localStorage)
  }
  let pvp: PvpRecord = loadPvp(localStorage)
  let match: PvpMatch | null = null
  let confirming = false
  let playing = false
  let skipFlag = false
  let playback: Playback = null
  let cast: { player: Fighter[]; enemy: Fighter[] } | null = null
  let frameHeld = false
  let toastTimer = 0
  let swallowClick = false

  function esc(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
  }

  function bind(scope: ParentNode): void {
    for (const node of scope.querySelectorAll("[data-action]")) {
      node.addEventListener("click", (event) => {
        if (swallowClick) {
          event.preventDefault()
          event.stopPropagation()
          return
        }
        void onClick(node)
      })
    }
    for (const node of scope.querySelectorAll("[data-drag]")) {
      if (!(node instanceof HTMLElement)) continue
      node.addEventListener("pointerdown", (event) => startDrag(event, node))
    }
  }

  function dropAt(x: number, y: number): HTMLElement | null {
    const hit = document.elementFromPoint(x, y)
    if (!(hit instanceof Element)) return null
    const drop = hit.closest("[data-drop]")
    return drop instanceof HTMLElement ? drop : null
  }

  function clearHot(): void {
    for (const node of document.querySelectorAll(".drop-hot")) node.classList.remove("drop-hot")
  }

  function startDrag(event: PointerEvent, source: HTMLElement): void {
    if (playing || event.button !== 0) return
    const pressed = event.target
    if (pressed instanceof Element && pressed.closest("button") && source.dataset.drag === "board") return
    const origin = source.getBoundingClientRect()
    const startX = event.clientX
    const startY = event.clientY
    let ghost: HTMLElement | null = null
    let moved = false
    const move = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) < 8) return
      if (!moved) {
        moved = true
        source.classList.add("is-lifting")
        const clone = source.cloneNode(true)
        if (!(clone instanceof HTMLElement)) return
        ghost = clone
        ghost.classList.add("drag-ghost")
        ghost.style.width = `${origin.width}px`
        ghost.style.height = `${origin.height}px`
        document.body.appendChild(ghost)
      }
      if (!ghost) return
      ghost.style.left = `${ev.clientX - origin.width / 2}px`
      ghost.style.top = `${ev.clientY - origin.height / 2}px`
      clearHot()
      dropAt(ev.clientX, ev.clientY)?.classList.add("drop-hot")
    }
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      clearHot()
      source.classList.remove("is-lifting")
      if (!moved || !ghost) return
      swallowClick = true
      const drop = dropAt(ev.clientX, ev.clientY)
      const held = ghost
      const finish = () => {
        held.remove()
        if (drop) performDrop(source, drop)
        setTimeout(() => {
          swallowClick = false
        }, 40)
      }
      const back = drop ? drop.getBoundingClientRect() : origin
      held.style.transition = "left 160ms ease, top 160ms ease, transform 160ms ease, opacity 160ms ease"
      held.style.left = `${back.left}px`
      held.style.top = `${back.top}px`
      held.style.transform = drop ? "scale(0.94)" : "rotate(0deg) scale(1)"
      if (!drop) held.style.opacity = "0.15"
      setTimeout(finish, 160)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  function performDrop(source: HTMLElement, drop: HTMLElement): void {
    const kind = source.dataset.drag
    if (kind === "shop-fighter") {
      apply({ type: "buy-fighter", slot: Number(source.dataset.slot) })
      return
    }
    if (kind === "shop-skill") {
      const seat = drop.closest("[data-drop='seat']")
      if (!(seat instanceof HTMLElement)) return
      apply({ type: "buy-skill", slot: Number(source.dataset.slot), fighter: Number(seat.dataset.index) })
      return
    }
    if (kind !== "board") return
    const seat = drop.closest("[data-drop='seat']")
    if (!(seat instanceof HTMLElement)) return
    const from = Number(source.dataset.index)
    const to = Number(seat.dataset.index)
    if (!Number.isInteger(from) || !Number.isInteger(to) || from === to) return
    apply({ type: "reorder", from, to })
  }

  function patchFrame(): void {
    if (!playback) return
    const stage = root.querySelector(".stage")
    if (!stage) return
    const lines = playback.lines.map((line) => `<p>${esc(line)}</p>`).join("")
    stage.innerHTML = `${playback.clash ?? ""}${lines}<button type="button" data-action="skip">Skip</button>`
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

  function view(): string {
    if (screen === "pve" && run) return renderTable(run, playback)
    if (screen === "stats") return renderStats(profile, loadResults(localStorage), pvp)
    if (screen === "board") return renderBoard(profile, loadResults(localStorage), pvp)
    if (screen === "profile") return renderProfile(profile, loadRibbons(localStorage))
    if (screen === "pvp") return renderPvpHall(pvp)
    if (screen === "pvp-match" && match) {
      return renderPvpMatch({
        player: match.player,
        enemy: match.enemy,
        scored: match.scored,
        line: playback?.lines[0] ?? null,
        clash: playback?.clash ?? null,
        delta: match.delta,
        outcome: match.outcome,
      })
    }
    return renderHome(profile, run !== null)
  }

  function paint(): void {
    if (screen === "pve" && playback && frameHeld && root.querySelector(".stage")) {
      patchFrame()
      return
    }
    root.innerHTML = view()
    const table = root.querySelector(".table")
    if (confirming && table) {
      table.insertAdjacentHTML(
        "beforeend",
        `<div class="confirm"><p>End this run?</p><button type="button" data-action="abandon-yes">Yes</button><button type="button" data-action="abandon-no">Keep playing</button></div>`,
      )
    }
    bind(root)
    frameHeld = screen === "pve" && playback !== null
  }

  function makeMatch(wins: number): PvpMatch | null {
    const pool: Seat[] = loadGhosts(localStorage).map((ghost) => ({
      id: ghost.id,
      points: pvp.points,
      games: pvp.games,
      wins: ghost.wins,
      board: ghost.board,
      bot: false,
    }))
    const bot = serveOpponent(wins)
    if (bot) {
      pool.push({
        id: bot.label,
        points: bot.rating,
        games: 99,
        wins: bot.wins,
        board: bot.board,
        bot: true,
      })
    }
    const served = pickOpponent(wins, profile.id, pvp.points, pool)
    if (!served) return null
    const you = buyRival({
      wins,
      gold: 10,
      board: [],
      nextInstance: served.board.length + 1,
      rngState: hashSeed(freshSeed()),
    })
    return {
      player: you.board,
      enemy: served.board,
      wins,
      scored: false,
      outcome: null,
      delta: null,
      foePoints: served.points,
    }
  }

  function rememberGhost(): void {
    if (!run || run.phase !== "shop" || run.player.length === 0 || profile.id.length === 0) return
    saveGhost({ id: profile.id, wins: run.wins, board: run.player }, localStorage)
  }

  function grantRibbons(): void {
    const results = loadResults(localStorage)
    saveRibbons(syncRibbons(results, loadRibbons(localStorage)), localStorage)
  }

  function scoreOutcome(outcome: "win" | "loss" | "mutual"): void {
    if (!match || match.scored) return
    const delta = pointChange(pvp.points, match.foePoints, scoreOf(outcome), pvp.games)
    pvp = { version: 1, points: applyPoints(pvp.points, delta), games: pvp.games + 1 }
    savePvp(pvp, localStorage)
    match = { ...match, scored: true, outcome, delta }
    playback = null
    frameHeld = false
    paint()
  }

  function toast(reason: RefuseReason): void {
    const table = root.querySelector(".table")
    if (!table) return
    table.setAttribute("data-toast", REFUSAL[reason])
    window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => table.removeAttribute("data-toast"), 1600)
  }

  function recordIfEnded(before: Run): void {
    if (!run) return
    if (before.phase !== "shop" || run.phase !== "result" || run.endReason === null) return
    if (!submissionMatches(run.seed, run.actions, run.wins, run.hearts)) return
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
    grantRibbons()
  }

  function apply(action: Action): void {
    if (!run) return
    const before = run
    const result = act(run, action)
    if (!result.ok) {
      toast(result.reason)
      return
    }
    run = result.run
    recordIfEnded(before)
    saveCurrent(run, localStorage)
    rememberGhost()
    paint()
  }

  function findCast(instance: number): { side: "player" | "enemy"; card: Fighter["card"] } | null {
    const you = cast?.player.find((fighter) => fighter.instance === instance)
    if (you) return { side: "player", card: you.card }
    const foe = cast?.enemy.find((fighter) => fighter.instance === instance)
    if (foe) return { side: "enemy", card: foe.card }
    return null
  }

  function clashFor(event: FightEvent): string {
    const youFront = cast?.player[0]?.card ?? null
    const foeFront = cast?.enemy[0]?.card ?? null
    if (event.type === "strike") {
      const attacker = findCast(event.attacker)
      const defender = findCast(event.defender)
      const you = attacker?.side === "player" ? attacker.card : defender?.side === "player" ? defender.card : youFront
      const foe = attacker?.side === "enemy" ? attacker.card : defender?.side === "enemy" ? defender.card : foeFront
      const beat: ClashBeat = attacker?.side === "player" ? "you-hit" : "foe-hit"
      return clashMarkup(you, foe, beat)
    }
    if (event.type === "skill") {
      const actor = findCast(event.instance)
      if (actor?.side === "player") return clashMarkup(actor.card, foeFront, "you")
      if (actor?.side === "enemy") return clashMarkup(youFront, actor.card, "foe")
    }
    if (event.type === "faint") {
      const actor = findCast(event.instance)
      if (actor?.side === "player") return clashMarkup(actor.card, foeFront, "you-faint")
      if (actor?.side === "enemy") return clashMarkup(youFront, actor.card, "foe-faint")
    }
    return clashMarkup(youFront, foeFront, "still")
  }

  async function watch(log: FightEvent[]): Promise<void> {
    playing = true
    skipFlag = false
    await playLog(
      log,
      (index) => {
        const event = log[index]
        if (!event) return
        playback = {
          lines: [eventSentence(event)],
          activeInstance: activeInstance(event),
          clash: clashFor(event),
        }
        paint()
      },
      () => skipFlag,
    )
    playback = null
    playing = false
    if (screen !== "pvp-match") paint()
  }

  async function onClick(node: Element): Promise<void> {
    const name = node.getAttribute("data-action")
    if (!name) return
    if (name === "skip") {
      skipFlag = true
      return
    }
    if (playing) return
    if (name === "go-menu") {
      if (screen === "pvp-match" && match && !match.scored) scoreOutcome("loss")
      screen = "menu"
      confirming = false
      playback = null
      frameHeld = false
      paint()
      return
    }
    if (name === "go-pve") {
      if (!run) run = startFresh()
      screen = "pve"
      paint()
      return
    }
    if (name === "go-pvp") {
      screen = "pvp"
      match = null
      paint()
      return
    }
    if (name === "go-stats") {
      screen = "stats"
      paint()
      return
    }
    if (name === "go-board") {
      screen = "board"
      paint()
      return
    }
    if (name === "go-profile") {
      grantRibbons()
      screen = "profile"
      paint()
      return
    }
    if (name === "save-profile") {
      const input = root.querySelector("#profile-name")
      const typed = input instanceof HTMLInputElement ? input.value : profile.name
      profile = { version: 1, id: profile.id, name: typed.trim().slice(0, 24) || "You" }
      saveProfile(profile, localStorage)
      paint()
      return
    }
    if (name === "pvp-fight") {
      const next = makeMatch(readNumber(node, "data-wins"))
      if (!next) return
      match = next
      screen = "pvp-match"
      paint()
      return
    }
    if (name === "pvp-leave") {
      scoreOutcome("loss")
      return
    }
    if (name === "pvp-strike") {
      if (!match || match.scored) return
      const entering = match
      cast = { player: structuredClone(entering.player), enemy: structuredClone(entering.enemy) }
      const resolved = resolveFight(entering.player, entering.enemy, entering.wins)
      match = { ...entering, outcome: resolved.outcome }
      await watch(resolved.log)
      if (match && !match.scored && match.outcome) {
        const outcome = match.outcome
        match = { ...match, player: resolved.player, enemy: resolved.enemy }
        scoreOutcome(outcome)
      }
      return
    }
    if (screen !== "pve" || !run) return
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
      cast = { player: structuredClone(run.player), enemy: structuredClone(run.enemy) }
      replay(run.seed, run.actions)
      await watch(run.lastLog)
      return
    }
    if (name === "reroll") {
      apply({ type: "reroll" })
      return
    }
    if (name === "fight") {
      cast = { player: structuredClone(run.player), enemy: structuredClone(run.enemy) }
      const before = run
      const result = act(run, { type: "fight" })
      if (!result.ok) {
        toast(result.reason)
        return
      }
      run = result.run
      recordIfEnded(before)
      saveCurrent(run, localStorage)
      rememberGhost()
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
