import { fighterById, skillById } from "../rules/cards"
import { combatAttack } from "../rules/fight"
import { seatLimit } from "../rules/run"
import type { Fighter, Offer, Run } from "../rules/types"
import { fighterMark } from "./marks"

export type Playback = { lines: string[]; activeInstance: number | null } | null

function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function rarityClass(rarity: string): string {
  if (rarity === "uncommon") return "rarity-uncommon"
  if (rarity === "rare") return "rarity-rare"
  return "rarity-common"
}

function hearts(count: number): string {
  const dots = Array.from({ length: 5 }, (_, index) => {
    const full = index < count ? " full" : ""
    return `<span class="heart${full}"></span>`
  }).join("")
  return `<div class="hearts" data-hearts="${count}">${dots}</div>`
}

function seat(run: Run, fighter: Fighter, index: number, side: "player" | "enemy", active: number | null): string {
  const printed = fighterById(fighter.card)
  const attack = combatAttack(fighter, run.wins, side === "player" ? "player" : "enemy")
  const healthClass =
    fighter.health < printed.health ? "health-low" : fighter.health > printed.health ? "health-high" : ""
  const bonus = side === "enemy" ? Math.floor(run.wins / 2) : 0
  const caption = bonus > 0 ? `<span class="caption">includes +${bonus}</span>` : ""
  const skills = fighter.skills.filter((skill) => skill !== null).join(" ")
  const activeClass = active === fighter.instance ? " is-active" : ""
  const actions =
    side === "player" && run.phase === "shop"
      ? `<div class="actions">
          ${index > 0 ? `<button type="button" data-action="reorder" data-from="${index}" data-to="${index - 1}">Move left</button>` : ""}
          ${index < run.player.length - 1 ? `<button type="button" data-action="reorder" data-from="${index}" data-to="${index + 1}">Move right</button>` : ""}
          ${fighter.skills.some((skill) => skill !== null) ? `<button type="button" data-action="swap-skills" data-fighter="${index}">Swap skills</button>` : ""}
          <button type="button" data-action="sell-fighter" data-fighter="${index}">Sell</button>
          ${fighter.skills
            .map((skill, skillSlot) =>
              skill
                ? `<button type="button" data-action="sell-skill" data-fighter="${index}" data-skill-slot="${skillSlot}">Sell ${esc(skill)}</button>`
                : "",
            )
            .join("")}
        </div>`
      : ""
  return `<article class="seat ${rarityClass(printed.rarity)}${activeClass}" data-seat="${fighter.card}" data-instance="${fighter.instance}">
    <div class="portrait">${fighterMark(fighter.card)}</div>
    <div class="seat-copy">
      <span class="stats"><span>${attack}</span><span class="${healthClass}">${fighter.health}</span></span>
      ${caption}
      <span class="skill-line">${esc(skills)}</span>
      ${actions}
    </div>
  </article>`
}

function emptySeat(): string {
  return `<article class="seat" data-seat="empty"></article>`
}

function board(run: Run, side: "player" | "enemy", active: number | null): string {
  const fighters = side === "player" ? run.player : run.enemy
  const seats = fighters.map((fighter, index) => seat(run, fighter, index, side, active))
  const blanks = Array.from({ length: Math.max(0, seatLimit(run.wins) - fighters.length) }, () => emptySeat())
  const label = side === "player" ? "You" : "Rival"
  const extra = side === "enemy" ? `<span class="rival-gold">${run.enemyGold}</span>` : ""
  return `<section class="board" data-side="${side === "player" ? "player" : "rival"}">
    <span class="side-label">${label}</span>
    ${extra}
    ${seats.join("")}
    ${blanks.join("")}
  </section>`
}

function skillGlyph(effect: string): string {
  if (effect === "damage") {
    return `<svg class="skill-mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3 L19 13 L29 16 L19 19 L16 29 L13 19 L3 16 L13 13 Z" fill="#D9897B" stroke="#24312C" stroke-width="1.5" stroke-linejoin="round"/></svg>`
  }
  if (effect === "gain-attack") {
    return `<svg class="skill-mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4 L26 18 H20 V28 H12 V18 H6 Z" fill="#C4A15A" stroke="#24312C" stroke-width="1.5" stroke-linejoin="round"/></svg>`
  }
  return `<svg class="skill-mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 27 C8 20 4 16 4 11 A6 6 0 0 1 16 10 A6 6 0 0 1 28 11 C28 16 24 20 16 27 Z" fill="#D9897B" stroke="#24312C" stroke-width="1.5" stroke-linejoin="round"/></svg>`
}

function offerCard(run: Run, offer: Offer | null, slot: number): string {
  if (!offer) return `<button type="button" class="offer" data-offer="empty" disabled></button>`
  if (offer.kind === "fighter") {
    const card = fighterById(offer.card)
    return `<button type="button" class="offer ${rarityClass(card.rarity)}" data-offer="${offer.card}" data-action="buy-fighter" data-slot="${slot}">
      ${fighterMark(offer.card)}
      <span class="stats"><span>${card.attack}</span><span>${card.health}</span></span>
    </button>`
  }
  const skill = skillById(offer.card)
  const targets =
    run.player.length === 0
      ? `<button type="button" data-action="buy-skill" data-slot="${slot}" data-fighter="0">Buy</button>`
      : run.player
          .map(
            (fighter, index) =>
              `<button type="button" data-action="buy-skill" data-slot="${slot}" data-fighter="${index}">To ${fighter.instance}</button>`,
          )
          .join("")
  return `<div class="offer ${rarityClass(skill.rarity)}" data-offer="${esc(offer.card)}">
    ${skillGlyph(skill.effect)}
    <strong>${esc(skill.id)}</strong>
    <span class="skill-line">${esc(skill.trigger)} · ${esc(skill.target)} · ${esc(skill.effect)} ${skill.n}</span>
    ${run.phase === "shop" ? `<div class="actions">${targets}</div>` : ""}
  </div>`
}

function frontMark(fighters: Run["player"]): string {
  const front = fighters[0]
  if (!front) return `<div class="arena-empty">Open</div>`
  return fighterMark(front.card)
}

function stage(run: Run, playback: Playback): string {
  if (playback) {
    const lines = playback.lines.map((line) => `<p>${esc(line)}</p>`).join("")
    return `<section class="stage">${lines}<button type="button" data-action="skip">Skip</button></section>`
  }
  if (run.phase === "result") {
    const reason = run.endReason === "abandon" ? "You stepped away" : "Hearts ran out"
    return `<section class="stage">
      <p>${run.wins} wins</p>
      <p>${reason}</p>
      <div class="result-actions">
        <button type="button" data-action="new-run">New run</button>
        <button type="button" data-action="replay">Watch again</button>
      </div>
    </section>`
  }
  return `<section class="stage arena">
    <div class="arena-side" data-side="rival">${frontMark(run.enemy)}</div>
    <span class="arena-gap">vs</span>
    <div class="arena-side" data-side="player">${frontMark(run.player)}</div>
  </section>`
}

export function renderTable(run: Run, playback: Playback): string {
  const offers = run.shop.map((offer, slot) => offerCard(run, offer, slot)).join("")
  const shopActions =
    run.phase === "shop"
      ? `<div class="shop-actions">
          <button type="button" data-action="reroll">Reroll 2</button>
          <button type="button" data-action="fight">Fight</button>
          <button type="button" data-action="abandon">Abandon</button>
        </div>`
      : ""
  const active = playback?.activeInstance ?? null
  return `<div class="table">
    <header class="header">
      <h1 id="title">Purse Run</h1>
      ${hearts(run.hearts)}
      <span class="purse">${run.gold}</span>
      <span class="wins" data-wins="${run.wins}">${run.wins} wins</span>
      <code class="seed">${esc(run.seed)}</code>
    </header>
    ${board(run, "enemy", active)}
    ${stage(run, playback)}
    ${board(run, "player", active)}
    <section class="shop">${offers}${shopActions}</section>
  </div>`
}
