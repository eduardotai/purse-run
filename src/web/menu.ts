import { publicRank } from "../rules/points"
import type { Ribbon } from "../rules/rewards"
import type { Run, RunResult } from "../rules/types"
import type { Profile, PvpRecord } from "./storage"

function esc(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")
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

export function renderHome(profile: Profile, run: Run | null): string {
  const pve = run
    ? `<strong>${run.phase === "result" ? "PvE result" : "Resume PvE"}</strong><span>Hearts ${run.hearts} · Gold ${run.gold} · ${run.wins} wins</span>`
    : `<strong>PvE battle</strong><span>Start a practice run.</span>`
  return `<main class="home">
    <header class="header">
      <h1 id="title">Purse Run</h1>
      <span class="seed">${esc(profile.name)}</span>
    </header>
    <nav class="menu">
      <button type="button" class="choice" data-action="go-pve">${pve}</button>
      <button type="button" class="choice" data-action="go-pvp"><strong>PvP battle</strong><span>Fight a bot at a win count.</span></button>
      <button type="button" class="choice" data-action="go-stats"><strong>Statistics</strong><span>Runs, wins, and rank on this browser.</span></button>
      <button type="button" class="choice" data-action="go-board"><strong>Leaderboard</strong><span>Best local run and PvP points.</span></button>
      <button type="button" class="choice" data-action="go-profile"><strong>Profile</strong><span>Name and ribbons.</span></button>
    </nav>
  </main>`
}

function chip(label: string, value: string): string {
  return `<div class="stat"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`
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
    <div class="stats">
      ${chip("PvE runs", String(pve.length))}
      ${chip("Best wins", String(best))}
      ${chip("Average wins", mean.toFixed(1))}
      ${chip("Hearts ran out", String(hearts))}
      ${chip("Stepped away", String(left))}
      ${chip("PvP games", String(pvp.games))}
      ${chip("PvP points", String(pvp.points))}
      ${chip("PvP rank", rank ?? "Hidden until 5 games")}
    </div>`,
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
    `<div class="stats">
      ${chip("Points", String(pvp.points))}
      ${chip("Games", String(pvp.games))}
      ${chip("Rank", rank ?? "Hidden until 5 games")}
    </div>
    <p class="hint">Win 0 through 8 serves a bot rated 1000. Above 8, no opponent.</p>
    <div class="win-picks">
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((wins) => `<button type="button" data-action="pvp-fight" data-wins="${wins}">${wins}</button>`).join("")}
    </div>`,
  )
}
