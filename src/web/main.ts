import "@fontsource/fraunces/600.css"
import "@fontsource/outfit/400.css"
import "@fontsource/outfit/600.css"
import { buyRival } from "../rules/rival"
import { resolveFight } from "../rules/fight"
import { serveOpponent } from "../rules/ghosts"
import { pickOpponent, type Seat } from "../rules/match"
import { applyPoints, pointChange, scoreOf } from "../rules/points"
import { hashSeed } from "../rules/rng"
import { replay, submissionMatches } from "../rules/replay"
import { syncRibbons } from "../rules/rewards"
import { act, createRun } from "../rules/run"
import { eventSentence } from "../rules/sentences"
import type { Action, FightEvent, Fighter, RefuseReason, Run, RunResult } from "../rules/types"
import { renderBoard, renderHome, renderProfile, renderPvpHall, renderStats } from "./menu"
import { playLog } from "./playback"
import {
  clashMarkup,
  renderPvpTable,
  renderTable,
  type ClashBeat,
  type Display,
  type Playback,
  type Selection,
} from "./render"
import { stepBoards } from "./stepper"
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
import "./styles.css"

type Screen = "menu" | "pve" | "pvp" | "stats" | "board" | "profile" | "pvp-match"

type Snapshot = {
  player: Fighter[]
  enemy: Fighter[]
  hearts: number
  wins: number
}

type Match = {
  wins: number
  player: Fighter[]
  enemy: Fighter[]
  foePoints: number
  hint: string
  outcome: "win" | "loss" | "mutual" | null
  scored: boolean
  delta: number | null
}

const REFUSAL: Record<RefuseReason, string> = {
  "not-enough-gold": "Not enough gold",
  "no-open-seat": "No open seat",
  "skill-not-legal": "That skill does not fit",
  "empty-slot": "Empty slot",
  "wrong-card": "Wrong card",
  "bad-index": "That seat is not there",
}

function freshSeed(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

function sideOf(snapshot: Snapshot, instance: number): "you" | "foe" | null {
  if (snapshot.player.some((fighter) => fighter.instance === instance)) return "you"
  if (snapshot.enemy.some((fighter) => fighter.instance === instance)) return "foe"
  return null
}

function beatFor(event: FightEvent | undefined, snapshot: Snapshot): ClashBeat {
  if (!event) return "still"
  if (event.type === "strike") return sideOf(snapshot, event.attacker) === "you" ? "you-hit" : "foe-hit"
  if (event.type === "faint") return sideOf(snapshot, event.instance) === "foe" ? "foe-faint" : "you-faint"
  if (event.type === "skill") return sideOf(snapshot, event.instance) === "foe" ? "foe" : "you"
  return "still"
}

function activeInstance(event: FightEvent | undefined): number | null {
  if (!event) return null
  if (event.type === "skill" || event.type === "faint") return event.instance
  if (event.type === "strike") return event.defender
  return null
}

function boot(root: HTMLElement): void {
  const storage = localStorage
  let screen: Screen = "menu"
  let run = loadCurrent(storage)
  let profile = loadProfile(storage)
  if (!profile.id) {
    profile = { ...profile, id: crypto.randomUUID() }
    saveProfile(profile, storage)
  }
  let pvp: PvpRecord = loadPvp(storage)
  let confirming = false
  let playing = false
  let skipFlag = false
  let playback: Playback = null
  let selection: Selection = null
  let display: Display | undefined
  let toast = ""
  let toastTimer: ReturnType<typeof setTimeout> | undefined
  let swallowClick = false
  let match: Match | null = null

  function grantRibbons(): void {
    saveRibbons(syncRibbons(loadResults(storage), loadRibbons(storage)), storage)
  }

  function paint(): void {
    if (screen === "menu") root.innerHTML = renderHome(profile, run)
    else if (screen === "stats") root.innerHTML = renderStats(profile, loadResults(storage), pvp)
    else if (screen === "board") root.innerHTML = renderBoard(profile, loadResults(storage), pvp)
    else if (screen === "profile") {
      grantRibbons()
      root.innerHTML = renderProfile(profile, loadRibbons(storage))
    } else if (screen === "pvp") root.innerHTML = renderPvpHall(pvp)
    else if (screen === "pvp-match" && match) {
      const player = display?.player ?? match.player
      const enemy = display?.enemy ?? match.enemy
      root.innerHTML = renderPvpTable({
        player,
        enemy,
        wins: match.wins,
        active: playback?.activeInstance ?? null,
        clash: playback?.clash ?? clashMarkup(player[0]?.card ?? null, enemy[0]?.card ?? null, "still"),
        line: playback?.lines[0] ?? null,
        scored: match.scored,
        outcome: match.outcome,
        delta: match.delta,
        playing,
        hint: match.hint,
      })
    } else if (screen === "pve" && run) {
      root.innerHTML = renderTable(run, playback, selection, display)
      if (toast) root.querySelector(".table")?.setAttribute("data-toast", toast)
      if (confirming) root.insertAdjacentHTML("beforeend", confirmHtml())
    }
  }

  function showToast(message: string): void {
    toast = message
    paint()
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      toast = ""
      if (screen === "pve") paint()
    }, 1600)
  }

  function rememberGhost(): void {
    if (!run || run.phase !== "shop" || run.player.length === 0 || !profile.id) return
    saveGhost({ id: profile.id, wins: run.wins, board: run.player }, storage)
  }

  function recordIfEnded(before: Run): void {
    if (!run || before.phase !== "shop" || run.phase !== "result" || !run.endReason) return
    if (!submissionMatches(run.seed, run.actions, run.wins, run.hearts)) return
    const results = loadResults(storage)
    const entry: RunResult = {
      version: 1,
      id: crypto.randomUUID(),
      seed: run.seed,
      actions: structuredClone(run.actions),
      practice: true,
      opponent: "ai",
      mode: "pve",
      wins: run.wins,
      turns: run.actions.filter((action) => action.type === "fight").length,
      endReason: run.endReason,
      finalPlayer: structuredClone(run.player),
      finalEnemy: structuredClone(run.enemy),
      lastLog: structuredClone(run.lastLog),
    }
    results.push(entry)
    saveResults(results, storage)
    grantRibbons()
  }

  function apply(action: Action): void {
    if (!run || playing || run.phase !== "shop") return
    const before = run
    const result = act(run, action)
    if (!result.ok) {
      showToast(REFUSAL[result.reason])
      return
    }
    run = result.run
    selection = null
    saveCurrent(run, storage)
    rememberGhost()
    recordIfEnded(before)
    paint()
  }

  function showFrame(snapshot: Snapshot, log: FightEvent[], index: number, hearts: number, wins: number): void {
    const event = log[index]
    const ended = event?.type === "end"
    const stepped = stepBoards(snapshot.player, snapshot.enemy, log.slice(0, index + 1))
    const boards = ended ? resolveFight(snapshot.player, snapshot.enemy, snapshot.wins) : stepped
    display = {
      player: boards.player,
      enemy: boards.enemy,
      hearts: ended ? hearts : snapshot.hearts,
      wins: ended ? wins : snapshot.wins,
    }
    playback = {
      lines: event ? [eventSentence(event)] : [],
      activeInstance: activeInstance(event),
      clash: clashMarkup(display.player[0]?.card ?? null, display.enemy[0]?.card ?? null, beatFor(event, snapshot)),
    }
    paint()
  }

  async function watchFight(before: Run, after: Run): Promise<void> {
    playing = true
    skipFlag = false
    selection = null
    confirming = false
    const snapshot: Snapshot = {
      player: structuredClone(before.player),
      enemy: structuredClone(before.enemy),
      hearts: before.hearts,
      wins: before.wins,
    }
    await playLog(
      after.lastLog,
      (index) => showFrame(snapshot, after.lastLog, index, after.hearts, after.wins),
      () => skipFlag,
    )
    playback = null
    display = undefined
    playing = false
    if (screen === "pve") paint()
  }

  function startFresh(): void {
    clearCurrent(storage)
    run = createRun(freshSeed())
    saveCurrent(run, storage)
    selection = null
    confirming = false
    playback = null
    display = undefined
    screen = "pve"
    paint()
  }

  function makeMatch(wins: number): Match | null {
    const served = serveOpponent(wins)
    if (!served) return null
    const pool: Seat[] = loadGhosts(storage).map((ghost) => ({
      id: ghost.id,
      points: pvp.points,
      games: pvp.games,
      wins: ghost.wins,
      board: ghost.board,
      bot: false,
    }))
    pool.push({
      id: "bot",
      points: served.rating,
      games: 5,
      wins: served.wins,
      board: served.board,
      bot: true,
    })
    const foe = pickOpponent(wins, profile.id, pvp.points, pool)
    if (!foe) return null
    const built = buyRival({
      wins,
      gold: 10,
      board: [],
      nextInstance: 1,
      rngState: hashSeed(freshSeed()),
    })
    const enemy = foe.board.map((fighter, index) => ({ ...fighter, instance: 1000 + index }))
    return {
      wins,
      player: built.board,
      enemy,
      foePoints: foe.points,
      hint: foe.bot ? `${served.label} · ${served.rating}` : `${foe.id.slice(0, 8)} · ${foe.points}`,
      outcome: null,
      scored: false,
      delta: null,
    }
  }

  function scoreOutcome(): void {
    if (!match || match.scored || !match.outcome) return
    const delta = pointChange(pvp.points, match.foePoints, scoreOf(match.outcome), pvp.games)
    pvp = { version: 1, points: applyPoints(pvp.points, delta), games: pvp.games + 1 }
    savePvp(pvp, storage)
    match.delta = delta
    match.scored = true
    playback = null
    display = undefined
    playing = false
    paint()
  }

  function scoreLoss(): void {
    if (!match || match.scored) return
    match.outcome = "loss"
    scoreOutcome()
  }

  async function strike(): Promise<void> {
    if (!match || playing || match.scored) return
    const snapshot: Snapshot = {
      player: structuredClone(match.player),
      enemy: structuredClone(match.enemy),
      hearts: 0,
      wins: match.wins,
    }
    const resolved = resolveFight(snapshot.player, snapshot.enemy, match.wins)
    match.outcome = resolved.outcome
    playing = true
    skipFlag = false
    await playLog(
      resolved.log,
      (index) => showFrame(snapshot, resolved.log, index, 0, match?.wins ?? snapshot.wins),
      () => skipFlag,
    )
    if (!match) return
    match.player = resolved.player
    match.enemy = resolved.enemy
    playback = null
    display = undefined
    playing = false
    scoreOutcome()
  }

  function saveName(): void {
    const input = root.querySelector("#profile-name")
    const name = input instanceof HTMLInputElement ? input.value.trim().slice(0, 24) : ""
    const next: Profile = { ...profile, name: name || "You" }
    profile = next
    saveProfile(profile, storage)
    paint()
  }

  function watchAgain(): void {
    if (!run || playing) return
    let fightAt = -1
    run.actions.forEach((action, index) => {
      if (action.type === "fight") fightAt = index
    })
    if (fightAt < 0) return
    const before = replay(run.seed, run.actions.slice(0, fightAt))
    const after = replay(run.seed, run.actions.slice(0, fightAt + 1))
    void watchFight(before, after)
  }

  function onClick(control: Element): void {
    const action = control.getAttribute("data-action")
    if (playing && action !== "skip") return
    const slot = Number(control.getAttribute("data-slot"))
    const fighter = Number(control.getAttribute("data-fighter"))
    const index = Number(control.getAttribute("data-index"))
    if (action === "go-menu") {
      if (screen === "pvp-match" && match && !match.scored) scoreLoss()
      screen = "menu"
      selection = null
      confirming = false
      playback = null
      display = undefined
      paint()
      return
    }
    if (action === "go-pve") {
      if (run) {
        screen = "pve"
        paint()
      } else startFresh()
      return
    }
    if (action === "go-pvp") {
      screen = "pvp"
      paint()
      return
    }
    if (action === "go-stats") {
      screen = "stats"
      paint()
      return
    }
    if (action === "go-board") {
      screen = "board"
      paint()
      return
    }
    if (action === "go-profile") {
      screen = "profile"
      paint()
      return
    }
    if (action === "save-profile") {
      saveName()
      return
    }
    if (action === "new-run") {
      startFresh()
      return
    }
    if (action === "replay") {
      watchAgain()
      return
    }
    if (action === "pvp-fight") {
      match = makeMatch(Number(control.getAttribute("data-wins")))
      if (!match) return
      screen = "pvp-match"
      playback = null
      display = undefined
      paint()
      return
    }
    if (action === "pvp-leave") {
      scoreLoss()
      return
    }
    if (action === "pvp-strike") {
      void strike()
      return
    }
    if (action === "skip") {
      skipFlag = true
      return
    }
    if (action === "abandon") {
      confirming = true
      paint()
      return
    }
    if (action === "abandon-no") {
      confirming = false
      paint()
      return
    }
    if (action === "abandon-yes") {
      confirming = false
      apply({ type: "abandon" })
      return
    }
    if (action === "select-offer") {
      selection = { kind: "offer", slot }
      paint()
      return
    }
    if (action === "select-fighter") {
      selection = { kind: "fighter", index }
      paint()
      return
    }
    if (action === "buy-fighter") apply({ type: "buy-fighter", slot })
    else if (action === "buy-skill") apply({ type: "buy-skill", slot, fighter })
    else if (action === "sell-fighter") apply({ type: "sell-fighter", fighter })
    else if (action === "reorder") {
      apply({
        type: "reorder",
        from: Number(control.getAttribute("data-from")),
        to: Number(control.getAttribute("data-to")),
      })
    } else if (action === "swap-skills") apply({ type: "swap-skills", fighter })
    else if (action === "reroll") apply({ type: "reroll" })
    else if (action === "fight" && run) {
      const before = run
      const result = act(run, { type: "fight" })
      if (!result.ok) {
        showToast(REFUSAL[result.reason])
        return
      }
      run = result.run
      saveCurrent(run, storage)
      rememberGhost()
      recordIfEnded(before)
      void watchFight(before, run)
    }
  }

  function performDrop(kind: string, source: Element, under: Element | null): void {
    if (!under) return
    if (kind === "shop-fighter") {
      const zone = under.closest("[data-drop='board'], [data-drop='seat']")
      if (!zone) return
      apply({ type: "buy-fighter", slot: Number(source.getAttribute("data-slot")) })
      return
    }
    if (kind === "shop-skill") {
      const seat = under.closest("[data-drop='seat']")
      if (!seat) return
      apply({
        type: "buy-skill",
        slot: Number(source.getAttribute("data-slot")),
        fighter: Number(seat.getAttribute("data-index")),
      })
      return
    }
    if (kind === "board") {
      const seat = under.closest("[data-drop='seat']")
      if (!seat) return
      const from = Number(source.getAttribute("data-index"))
      const to = Number(seat.getAttribute("data-index"))
      if (from !== to) apply({ type: "reorder", from, to })
    }
  }

  root.addEventListener("click", (event) => {
    if (swallowClick) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
    const target = event.target
    if (!(target instanceof Element)) return
    const control = target.closest("[data-action]")
    if (control && root.contains(control)) {
      onClick(control)
      return
    }
    if (screen !== "pve" || !selection) return
    if (target.closest(".card, button, a, input")) return
    selection = null
    paint()
  })

  root.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || playing) return
    const target = event.target
    if (!(target instanceof Element)) return
    const source = target.closest("[data-drag]")
    if (!source || !root.contains(source)) return
    const kind = source.getAttribute("data-drag")
    if (!kind) return
    if (kind === "board" && target.closest("button")) return
    const startX = event.clientX
    const startY = event.clientY
    let moved = false
    let ghost: HTMLElement | null = null
    const move = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) < 8) return
      if (!moved) ev.preventDefault()
      moved = true
      if (!ghost) {
        ghost = document.createElement("div")
        ghost.className = "drag-ghost"
        ghost.textContent = source.querySelector(".card-title")?.textContent ?? ""
        document.body.append(ghost)
        source.classList.add("is-lifting")
      }
      ghost.style.left = `${ev.clientX}px`
      ghost.style.top = `${ev.clientY}px`
      root.querySelectorAll(".drop-hot").forEach((node) => node.classList.remove("drop-hot"))
      const under = document.elementFromPoint(ev.clientX, ev.clientY)
      under?.closest("[data-drop]")?.classList.add("drop-hot")
    }
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      ghost?.remove()
      source.classList.remove("is-lifting")
      root.querySelectorAll(".drop-hot").forEach((node) => node.classList.remove("drop-hot"))
      if (!moved) return
      swallowClick = true
      window.setTimeout(() => {
        swallowClick = false
      }, 40)
      performDrop(kind, source, document.elementFromPoint(ev.clientX, ev.clientY))
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  })

  paint()
}

function confirmHtml(): string {
  return `<div class="confirm"><div class="confirm-card"><p>End this run?</p><button type="button" data-action="abandon-yes">Yes</button><button type="button" data-action="abandon-no">No</button></div></div>`
}

const app = document.querySelector("#app")
if (app instanceof HTMLElement) boot(app)
