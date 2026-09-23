import { fighterById, skillById } from "../rules/cards"
import { combatAttack } from "../rules/fight"
import { canHoldSkill, FIGHTER_COST, REROLL_COST, seatLimit, SKILL_COST, SELL_VALUE } from "../rules/run"
import type { EffectKind, Fighter, FighterId, Offer, Run, SkillId } from "../rules/types"
import { skillLine } from "./copy"
import { fighterMark } from "./marks"

export type Selection = { kind: "offer"; slot: number } | { kind: "fighter"; index: number } | null

export type Playback = {
  lines: string[]
  activeInstance: number | null
  clash?: string
} | null

export type ClashBeat = "you" | "foe" | "you-hit" | "foe-hit" | "you-faint" | "foe-faint" | "still"

export type Display = {
  player: Fighter[]
  enemy: Fighter[]
  hearts: number
  wins: number
}

function esc(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")
}

function rarityClass(rarity: string): string {
  if (rarity === "uncommon") return "rarity-uncommon"
  if (rarity === "rare") return "rarity-rare"
  return "rarity-common"
}

function skillGlyph(effect: EffectKind): string {
  if (effect === "damage") {
    return `<svg class="skill-mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3 L19 13 L29 16 L19 19 L16 29 L13 19 L3 16 L13 13 Z" fill="#D9897B" stroke="#24312C" stroke-width="1.5" stroke-linejoin="round"/></svg>`
  }
  if (effect === "gain-attack") {
    return `<svg class="skill-mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4 L26 18 H20 V28 H12 V18 H6 Z" fill="#C4A15A" stroke="#24312C" stroke-width="1.5" stroke-linejoin="round"/></svg>`
  }
  return `<svg class="skill-mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 27 C8 20 4 16 4 11 A6 6 0 0 1 16 10 A6 6 0 0 1 28 11 C28 16 24 20 16 27 Z" fill="#D9897B" stroke="#24312C" stroke-width="1.5" stroke-linejoin="round"/></svg>`
}

function heartIcon(): string {
  return `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13 C4 10 2 8 2 5.5 A2.5 2.5 0 0 1 8 5 A2.5 2.5 0 0 1 14 5.5 C14 8 12 10 8 13 Z" fill="currentColor"/></svg>`
}

function swordIcon(): string {
  return `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9 1 L12 4 L6 10 L5 13 L2 14 L3 11 L4 10 L10 4 Z" fill="currentColor"/></svg>`
}

export function posLabel(index: number): string {
  return index === 0 ? "FRONT" : String(index + 1)
}

export function roundNumber(run: Run, playing: boolean): number {
  const fights = run.actions.filter((action) => action.type === "fight").length
  return playing ? Math.max(1, fights) : fights + 1
}

function cardFrame(input: {
  tag: "button" | "article" | "div"
  className: string
  attrs: string
  rarity: string
  art: string
  title: string
  line?: string
  chips?: string
  cost?: number
  attack?: number
  health?: number
  healthClass?: string
  amount?: number
  amountKind?: EffectKind
  pos?: string
}): string {
  const cost = input.cost === undefined ? "" : `<span class="cost" aria-label="Cost ${input.cost}">${input.cost}</span>`
  const pos = input.pos ? `<span class="pos">${esc(input.pos)}</span>` : ""
  const line = input.line ? `<p class="card-line">${esc(input.line)}</p>` : ""
  const chips = input.chips ?? ""
  let badges = ""
  if (input.attack !== undefined && input.health !== undefined) {
    badges = `<span class="badge badge-atk" aria-label="Attack ${input.attack}">${swordIcon()}<b>${input.attack}</b></span>
      <span class="badge badge-hp ${input.healthClass ?? ""}" aria-label="Health ${input.health}">${heartIcon()}<b>${input.health}</b></span>`
  } else if (input.amount !== undefined && input.amountKind) {
    badges = `<span class="badge badge-hp badge-n" aria-label="Amount ${input.amount}">${skillGlyph(input.amountKind)}<b>${input.amount}</b></span>`
  }
  const open = input.tag === "button" ? "<button type=\"button\"" : `<${input.tag}`
  const close = input.tag === "button" ? "</button>" : `</${input.tag}>`
  return `${open} class="card ${rarityClass(input.rarity)} ${input.className}" ${input.attrs}>
    ${cost}${pos}
    <div class="art">${input.art}</div>
    <h3 class="card-title">${esc(input.title)}</h3>
    ${line}${chips}${badges}
  ${close}`
}

function skillChips(skills: [SkillId | null, SkillId | null]): string {
  const chips = skills
    .map((id, index) => {
      if (!id) return `<span class="chip is-open">${index === 0 ? "1st" : "2nd"}</span>`
      const skill = skillById(id)
      const order = index === 0 ? "1st " : "2nd "
      return `<span class="chip">${order}${esc(id)} ${skill.n}</span>`
    })
    .join("")
  return `<div class="chips">${chips}</div>`
}

function healthClass(current: number, printed: number): string {
  if (current < printed) return "health-low"
  if (current > printed) return "health-high"
  return ""
}

function boardCard(
  fighter: Fighter,
  index: number,
  side: "player" | "enemy",
  wins: number,
  active: number | null,
  interactive: boolean,
  take: { slot: number; id: string } | null,
): string {
  const printed = fighterById(fighter.card)
  const attack = combatAttack(fighter, wins, side)
  const attrs = [
    `data-seat="${fighter.card}"`,
    `data-instance="${fighter.instance}"`,
    `data-index="${index}"`,
  ]
  if (interactive) {
    attrs.push(`data-drag="board"`, `data-drop="seat"`)
    if (take && canHoldSkill(fighter, take.id)) {
      attrs.push(`data-action="buy-skill"`, `data-slot="${take.slot}"`, `data-fighter="${index}"`)
    } else {
      attrs.push(`data-action="select-fighter"`)
    }
  }
  const classes = [active === fighter.instance ? "is-active" : "", take && canHoldSkill(fighter, take.id) ? "can-take" : ""]
    .filter(Boolean)
    .join(" ")
  return cardFrame({
    tag: "article",
    className: classes,
    attrs: attrs.join(" "),
    rarity: printed.rarity,
    art: fighterMark(fighter.card),
    title: fighter.card,
    chips: skillChips(fighter.skills),
    attack,
    health: fighter.health,
    healthClass: healthClass(fighter.health, printed.health),
    pos: posLabel(index),
  })
}

function emptyCard(index: number): string {
  return `<article class="card is-empty" data-seat="empty"><span class="pos">${posLabel(index)}</span></article>`
}

export function matHtml(input: {
  fighters: Fighter[]
  side: "player" | "enemy"
  wins: number
  active: number | null
  limit: number
  interactive: boolean
  take: { slot: number; id: string } | null
  caption?: string
  gold?: number
}): string {
  const cells: string[] = []
  for (let index = input.limit - 1; index >= 0; index -= 1) {
    const fighter = input.fighters[index]
    cells.push(fighter ? boardCard(fighter, index, input.side, input.wins, input.active, input.interactive, input.take) : emptyCard(index))
  }
  const label = input.side === "player" ? "You" : "Rival"
  const gold = input.gold === undefined ? "" : `<span class="rival-gold" aria-label="Rival gold ${input.gold}">${input.gold}</span>`
  const caption = input.caption ? `<p class="mat-caption">${esc(input.caption)}</p>` : ""
  const drop = input.interactive ? ` data-drop="board"` : ""
  return `<section class="mat" data-side="${input.side === "player" ? "player" : "rival"}"${drop}>
    <header class="mat-head"><span>${label}</span>${gold}</header>
    ${caption}
    <div class="mat-row">${cells.join("")}</div>
  </section>`
}

function offerCard(offer: Offer | null, slot: number, selected: boolean): string {
  if (!offer) return `<article class="card is-empty" data-offer="empty"></article>`
  if (offer.kind === "fighter") {
    const card = fighterById(offer.card)
    return cardFrame({
      tag: "button",
      className: selected ? "is-selected" : "",
      attrs: `data-action="select-offer" data-slot="${slot}" data-drag="shop-fighter" data-offer="${offer.card}"`,
      rarity: card.rarity,
      art: fighterMark(offer.card),
      title: offer.card,
      cost: FIGHTER_COST,
      attack: card.attack,
      health: card.health,
    })
  }
  const skill = skillById(offer.card)
  return cardFrame({
    tag: "button",
    className: selected ? "is-selected" : "",
    attrs: `data-action="select-offer" data-slot="${slot}" data-drag="shop-skill" data-offer="${esc(offer.card)}"`,
    rarity: skill.rarity,
    art: skillGlyph(skill.effect),
    title: offer.card,
    line: skillLine(skill),
    cost: SKILL_COST,
    amount: skill.n,
    amountKind: skill.effect,
  })
}

function holdReason(fighter: Fighter, id: string, gold: number): string {
  if (gold < SKILL_COST) return "Not enough gold"
  const [first, second] = fighter.skills
  if (first === id || second === id) return "Already has it"
  if (first !== null && second !== null) return "No open skill slot"
  return "Can take this"
}

function lifted(run: Run, selection: Selection): string {
  if (!selection || run.phase !== "shop") return ""
  if (selection.kind === "offer") {
    const offer = run.shop[selection.slot]
    if (!offer) return ""
    if (offer.kind === "fighter") {
      const card = fighterById(offer.card)
      const open = run.player.length < seatLimit(run.wins)
      const broke = run.gold < FIGHTER_COST
      const why = broke ? "Not enough gold." : open ? "Buy it onto the back of your line." : "No open seat."
      const disabled = broke || !open ? " disabled" : ""
      const face = cardFrame({
        tag: "div",
        className: "is-lifted",
        attrs: "",
        rarity: card.rarity,
        art: fighterMark(offer.card),
        title: offer.card,
        cost: FIGHTER_COST,
        attack: card.attack,
        health: card.health,
      })
      return `<div class="lifted">${face}<p>${why}</p><button type="button" data-action="buy-fighter" data-slot="${selection.slot}"${disabled}>Buy ${FIGHTER_COST}</button></div>`
    }
    const skill = skillById(offer.card)
    const notes =
      run.player.length === 0
        ? `<li>No fighter on the board.</li>`
        : run.player
            .map((fighter) => `<li>${esc(fighter.card)}: ${esc(holdReason(fighter, offer.card, run.gold))}</li>`)
            .join("")
    const face = cardFrame({
      tag: "div",
      className: "is-lifted",
      attrs: "",
      rarity: skill.rarity,
      art: skillGlyph(skill.effect),
      title: offer.card,
      line: skillLine(skill),
      cost: SKILL_COST,
      amount: skill.n,
      amountKind: skill.effect,
    })
    return `<div class="lifted">${face}<p>Click a highlighted fighter.</p><ul class="target-list">${notes}</ul></div>`
  }
  const fighter = run.player[selection.index]
  if (!fighter) return ""
  const printed = fighterById(fighter.card)
  const attack = combatAttack(fighter, run.wins, "player")
  const lines = fighter.skills
    .map((id) => (id ? `<p class="card-line">${esc(skillLine(skillById(id)))}</p>` : ""))
    .join("")
  const face = cardFrame({
    tag: "div",
    className: "is-lifted",
    attrs: "",
    rarity: printed.rarity,
    art: fighterMark(fighter.card),
    title: fighter.card,
    chips: skillChips(fighter.skills),
    attack,
    health: fighter.health,
    healthClass: healthClass(fighter.health, printed.health),
    pos: posLabel(selection.index),
  })
  const towardFront =
    selection.index > 0
      ? `<button type="button" data-action="reorder" data-from="${selection.index}" data-to="${selection.index - 1}">Toward front</button>`
      : ""
  const towardBack =
    selection.index < run.player.length - 1
      ? `<button type="button" data-action="reorder" data-from="${selection.index}" data-to="${selection.index + 1}">Toward back</button>`
      : ""
  const swap = fighter.skills.some((id) => id !== null)
    ? `<button type="button" data-action="swap-skills" data-fighter="${selection.index}">Swap order</button>`
    : ""
  return `<div class="lifted">${face}${lines}
    <div class="lifted-actions">
      <button type="button" data-action="sell-fighter" data-fighter="${selection.index}">Sell +${SELL_VALUE}</button>
      ${swap}${towardFront}${towardBack}
    </div>
  </div>`
}

function hearts(count: number): string {
  const dots = Array.from({ length: 5 }, (_, index) => `<span class="heart${index < count ? " full" : ""}"></span>`).join("")
  return `<div class="hearts" data-hearts="${count}" aria-label="Hearts ${count}">${dots}</div>`
}

function goldPips(gold: number): string {
  const pips = Array.from({ length: gold }, () => `<i class="pip"></i>`).join("")
  return `<div class="purse" data-gold="${gold}" aria-label="Gold ${gold}">${pips}<b>${gold}</b></div>`
}

export function clashMarkup(you: FighterId | null, foe: FighterId | null, beat: ClashBeat): string {
  const youClass = beat === "you" || beat === "you-hit" ? " charging" : beat === "foe-hit" ? " struck" : beat === "you-faint" ? " fading" : ""
  const foeClass = beat === "foe" || beat === "foe-hit" ? " charging" : beat === "you-hit" ? " struck" : beat === "foe-faint" ? " fading" : ""
  const spark = beat === "you-hit" || beat === "foe-hit" ? `<span class="hit-spark"></span>` : ""
  return `<div class="clash">
    <div class="clash-fighter foe${foeClass}">${foe ? fighterMark(foe) : ""}</div>
    ${spark}
    <div class="clash-fighter you${youClass}">${you ? fighterMark(you) : ""}</div>
  </div>`
}

function stage(run: Run, playback: Playback, selection: Selection, display: Display): string {
  if (playback) {
    const lines = playback.lines.map((line) => `<p>${esc(line)}</p>`).join("")
    return `<section class="stage">${playback.clash ?? ""}${lines}<button type="button" data-action="skip">Skip</button></section>`
  }
  if (run.phase === "result") {
    const reason = run.endReason === "abandon" ? "You stepped away" : "Hearts ran out"
    return `<section class="stage">
      <p class="result-wins">${run.wins} wins</p>
      <p>${reason}</p>
      <div class="result-actions">
        <button type="button" data-action="new-run">New run</button>
        <button type="button" data-action="replay">Watch again</button>
      </div>
    </section>`
  }
  const preview = lifted(run, selection)
  if (preview) return `<section class="stage">${preview}</section>`
  const foe = display.enemy[0]?.card ?? null
  const you = display.player[0]?.card ?? null
  return `<section class="stage arena">
    <div class="arena-side" data-side="rival">${foe ? fighterMark(foe) : `<div class="arena-empty">Open</div>`}</div>
    <span class="arena-gap">vs</span>
    <div class="arena-side" data-side="player">${you ? fighterMark(you) : `<div class="arena-empty">Open</div>`}</div>
  </section>`
}

export function renderTable(run: Run, playback: Playback, selection: Selection, display?: Display): string {
  const shown: Display = display ?? {
    player: run.player,
    enemy: run.enemy,
    hearts: run.hearts,
    wins: run.wins,
  }
  const playing = playback !== null
  const round = roundNumber(run, playing)
  const shopping = run.phase === "shop" && !playing
  const selectedOffer = selection?.kind === "offer" ? run.shop[selection.slot] : undefined
  const take =
    selection?.kind === "offer" && selectedOffer?.kind === "skill"
      ? { slot: selection.slot, id: selectedOffer.card }
      : null
  const active = playback?.activeInstance ?? null
  const shop =
    shopping
      ? `<section class="shop">${run.shop.map((offer, slot) => offerCard(offer, slot, selection?.kind === "offer" && selection.slot === slot)).join("")}</section>
        <div class="dock">
          <button type="button" class="reroll" data-action="reroll"${run.gold < REROLL_COST ? " disabled" : ""}>
            <span class="backs" aria-hidden="true"></span>
            <span>Reroll</span>
            <span class="coin">${REROLL_COST}</span>
          </button>
          ${goldPips(run.gold)}
          <button type="button" class="fight" data-action="fight"><span>Fight</span><small>Round ${round}</small></button>
        </div>`
      : ""
  const reading = shopping && selection !== null
  return `<div class="table${shopping ? " is-shop" : ""}${reading ? " is-reading" : ""}">
    <header class="header">
      <h1 id="title">Purse Run</h1>
      <button type="button" data-action="go-menu">Menu</button>
      ${hearts(shown.hearts)}
      <span class="wins" data-wins="${shown.wins}">${shown.wins} wins</span>
      <span class="round">Round ${round}</span>
      <code class="seed">${esc(run.seed)}</code>
      ${shopping ? `<button type="button" class="abandon" data-action="abandon">Abandon</button>` : ""}
    </header>
    ${matHtml({
      fighters: shown.enemy,
      side: "enemy",
      wins: shown.wins,
      active,
      limit: Math.max(seatLimit(shown.wins), shown.enemy.length),
      interactive: false,
      take: null,
      gold: playing ? undefined : run.enemyGold,
    })}
    ${stage(run, playback, selection, shown)}
    ${matHtml({
      fighters: shown.player,
      side: "player",
      wins: shown.wins,
      active,
      limit: Math.max(seatLimit(shown.wins), shown.player.length),
      interactive: shopping,
      take: shopping ? take : null,
      caption: "The rightmost fighter hits first.",
    })}
    ${shop}
  </div>`
}

export function renderPvpTable(input: {
  player: Fighter[]
  enemy: Fighter[]
  wins: number
  active: number | null
  clash: string
  line: string | null
  scored: boolean
  outcome: string | null
  delta: number | null
  playing: boolean
  hint: string
}): string {
  const stage = input.scored
    ? `<section class="stage">
        <p class="result-wins">${esc(input.outcome ?? "mutual")}</p>
        <p>${input.delta === null ? "" : `Points ${input.delta > 0 ? "+" : ""}${input.delta}`}</p>
        <button type="button" data-action="go-pvp">Back</button>
      </section>`
    : `<section class="stage">${input.clash}${input.line ? `<p>${esc(input.line)}</p>` : ""}${
        input.playing ? `<button type="button" data-action="skip">Skip</button>` : ""
      }</section>`
  const dock = input.scored
    ? ""
    : input.playing
      ? ""
      : `<div class="dock">
          <button type="button" class="abandon" data-action="pvp-leave">Leave</button>
          <div class="purse" data-gold="0"></div>
          <button type="button" class="fight" data-action="pvp-strike"><span>Fight</span><small>Win ${input.wins}</small></button>
        </div>`
  return `<div class="table${dock ? " is-dock" : ""}">
    <header class="header">
      <h1 id="title">PvP</h1>
      <button type="button" data-action="go-menu">Menu</button>
      <span class="hint">${esc(input.hint)}</span>
    </header>
    ${matHtml({
      fighters: input.enemy,
      side: "enemy",
      wins: input.wins,
      active: input.active,
      limit: Math.max(input.enemy.length, 1),
      interactive: false,
      take: null,
    })}
    ${stage}
    ${matHtml({
      fighters: input.player,
      side: "player",
      wins: input.wins,
      active: input.active,
      limit: Math.max(input.player.length, 1),
      interactive: false,
      take: null,
      caption: "The rightmost fighter hits first.",
    })}
    ${dock}
  </div>`
}
