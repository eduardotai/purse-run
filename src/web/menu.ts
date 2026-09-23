import { fighterMark } from "./marks"
import { publicRank } from "../rules/points"
import type { Ribbon } from "../rules/rewards"
import type { Fighter, RunResult } from "../rules/types"
import type { Profile, PvpRecord } from "./storage"

function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function shell(title: string, body: string): string {
  return `<main class="home">
    <header class="header">
      <h1 id="title">${title}</h1>
      <button type="button" data-action="go-menu">Menu</button>
    </header>
    <section class="panel">${body}</section>
  </main>`
}

export function renderHome(profile: Profile, resume: boolean): string {
  const pve = resume ? "Resume PvE" : "PvE battle"
  return `<main class="home">
    <header class="header">
      <h1 id="title">Purse Run</h1>
      <span class="seed">${esc(profile.name)}</span>
    </header>
    <nav class="menu">
      <button type="button" data-action="go-pve">${pve}</button>
      <button type="button" data-action="go-pvp">PvP battle</button>
      <button type="button" data-action="go-stats">Statistics</button>
      <button type="button" data-action="go-board">Leaderboard</button>
      <button type="button" data-action="go-profile">Profile</button>
    </nav>
  </main>`
}

export function renderStats(profile: Profile, results: RunResult[], pvp: PvpRecord): string {
  const pve = results.filter((result) => result.mode === "pve")
  const best = pve.reduce((top, result) => Math.max(top, result.wins), 0)
  const mean = pve.length === 0 ? 0 : pve.reduce((sum, result) => sum + result.wins, 0) / pve.length
  const hearts = pve.filter((result) => result.endReason === "hearts").length
  const left = pve.filter((result) => result.endReason === "abandon").length
  const rank = publicRank(pvp.points, pvp.games)
  return shell(
    "Statistics",
    `<p class="panel-name">${esc(profile.name)}</p>
    <dl class="facts">
      <div><dt>PvE runs</dt><dd>${pve.length}</dd></div>
      <div><dt>Best wins</dt><dd>${best}</dd></div>
      <div><dt>Average wins</dt><dd>${mean.toFixed(1)}</dd></div>
      <div><dt>Hearts ran out</dt><dd>${hearts}</dd></div>
      <div><dt>Stepped away</dt><dd>${left}</dd></div>
      <div><dt>PvP games</dt><dd>${pvp.games}</dd></div>
      <div><dt>PvP points</dt><dd>${pvp.points}</dd></div>
      <div><dt>PvP rank</dt><dd>${rank ?? "Hidden until 5 games"}</dd></div>
    </dl>`,
  )
}

export function renderBoard(profile: Profile, results: RunResult[], pvp: PvpRecord): string {
  let best: RunResult | null = null
  for (const result of results) {
    if (result.mode !== "pve") continue
    if (!best || result.wins > best.wins) best = result
  }
  const pveRow = best
    ? `<li><span>1</span><span>${esc(profile.name)}</span><span>${best.wins} wins</span></li>`
    : `<li class="empty-row">No finished PvE run yet.</li>`
  const rank = publicRank(pvp.points, pvp.games)
  const pvpRow =
    rank === null
      ? `<li class="empty-row">No public PvP rank until 5 games. ${pvp.games} finished.</li>`
      : `<li><span>${rank}</span><span>${esc(profile.name)}</span><span>${pvp.points}</span></li>`
  return shell(
    "Leaderboard",
    `<h2>PvE</h2>
    <p class="hint">Best run on this browser. Nothing is posted.</p>
    <ol class="board-list">${pveRow}</ol>
    <h2>PvP</h2>
    <p class="hint">Sorted by points. Hidden until 5 games.</p>
    <ol class="board-list">${pvpRow}</ol>`,
  )
}

export function renderProfile(profile: Profile, ribbons: Ribbon[]): string {
  const list =
    ribbons.length === 0
      ? `<li class="empty-row">No ribbon yet. Finish a PvE run.</li>`
      : ribbons
          .map((ribbon) => `<li><span>${esc(ribbon.runId.slice(0, 8))}</span><span>${ribbon.wins} wins</span></li>`)
          .join("")
  return shell(
    "Profile",
    `<label class="name-field">Name
      <input id="profile-name" maxlength="24" value="${esc(profile.name)}" />
    </label>
    <button type="button" data-action="save-profile">Save</button>
    <p class="hint">This name stays in this browser. A ribbon is granted from a finished run. It does not return fighters or gold.</p>
    <h2>Ribbons</h2>
    <ol class="board-list">${list}</ol>`,
  )
}

export function renderPvpHall(pvp: PvpRecord): string {
  const rank = publicRank(pvp.points, pvp.games)
  return shell(
    "PvP",
    `<dl class="facts">
      <div><dt>Points</dt><dd>${pvp.points}</dd></div>
      <div><dt>Games</dt><dd>${pvp.games}</dd></div>
      <div><dt>Rank</dt><dd>${rank ?? "Hidden until 5 games"}</dd></div>
    </dl>
    <p class="hint">Pick the win count. A labeled bot rated 1000 is served from 0 through 8. Above 8, no opponent is served.</p>
    <div class="win-picks">
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((wins) => `<button type="button" data-action="pvp-fight" data-wins="${wins}">Win ${wins}</button>`).join("")}
    </div>`,
  )
}

function line(fighters: Fighter[], side: "player" | "enemy"): string {
  if (fighters.length === 0) return `<p class="empty-row">No one stood.</p>`
  return fighters
    .map(
      (fighter) =>
        `<article class="seat" data-side="${side}" data-instance="${fighter.instance}">${fighterMark(fighter.card)}</article>`,
    )
    .join("")
}

export function renderPvpMatch(input: {
  player: Fighter[]
  enemy: Fighter[]
  scored: boolean
  line: string | null
  clash?: string | null
  delta: number | null
  outcome: string | null
}): string {
  const sentence = input.line ? `<p>${esc(input.line)}</p>` : ""
  const controls = input.scored
    ? `<p>${esc(input.outcome ?? "mutual")}</p><p>${input.delta === null ? "" : `Points ${input.delta > 0 ? "+" : ""}${input.delta}`}</p><button type="button" data-action="go-pvp">Back</button>`
    : input.line
      ? `<button type="button" data-action="skip">Skip</button>`
      : `<button type="button" data-action="pvp-strike">Fight</button><button type="button" data-action="pvp-leave">Leave</button>`
  return `<main class="home">
    <header class="header">
      <h1 id="title">PvP</h1>
      <span class="hint">Labeled bot · 1000</span>
    </header>
    <section class="panel pvp-lines">
      <div class="board" data-side="rival">${line(input.enemy, "enemy")}</div>
      <div class="stage">${input.clash ?? ""}${sentence}${controls}</div>
      <div class="board" data-side="player">${line(input.player, "player")}</div>
    </section>
  </main>`
}

export function scoreOf(outcome: "win" | "loss" | "mutual"): 0 | 0.5 | 1 {
  if (outcome === "win") return 1
  if (outcome === "loss") return 0
  return 0.5
}
