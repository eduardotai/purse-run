export type Rarity = "common" | "uncommon" | "rare"
export type FighterId = "c24" | "c42" | "c15" | "c33" | "u44" | "u35" | "r55" | "r46"
export type SkillId = string
export type Trigger = "start" | "on-attack" | "when-hurt" | "friend-ahead-attacks" | "faint"
export type TargetKind =
  | "self"
  | "friend-ahead"
  | "friend-behind"
  | "enemy-front"
  | "last-living-enemy"
  | "all-friends"
  | "all-enemies"
export type EffectKind = "damage" | "gain-attack" | "gain-health"

export type FighterDef = { id: FighterId; rarity: Rarity; attack: number; health: number }
export type SkillDef = {
  id: SkillId
  rarity: Rarity
  trigger: Trigger
  target: TargetKind
  effect: EffectKind
  n: number
}
export type Offer = { kind: "fighter"; card: FighterId } | { kind: "skill"; card: SkillId }
export type Fighter = {
  instance: number
  card: FighterId
  gainedAttack: number
  health: number
  skills: [SkillId | null, SkillId | null]
}
export type Action =
  | { type: "buy-fighter"; slot: number }
  | { type: "buy-skill"; slot: number; fighter: number }
  | { type: "sell-fighter"; fighter: number }
  | { type: "sell-skill"; fighter: number; skillSlot: number }
  | { type: "reorder"; from: number; to: number }
  | { type: "swap-skills"; fighter: number }
  | { type: "reroll" }
  | { type: "fight" }
  | { type: "abandon" }
export type FightEvent =
  | { type: "skill"; instance: number; skill: SkillId; amount: number; target: number | number[] | null }
  | { type: "strike"; attacker: number; defender: number; amount: number }
  | { type: "faint"; instance: number }
  | { type: "cap" }
  | { type: "end"; outcome: "win" | "loss" | "mutual" }
export type RefuseReason =
  | "not-enough-gold"
  | "no-open-seat"
  | "skill-not-legal"
  | "empty-slot"
  | "wrong-card"
  | "bad-index"
export type Run = {
  version: 1
  seed: string
  rngState: number
  wins: number
  hearts: number
  gold: number
  enemyGold: number
  player: Fighter[]
  enemy: Fighter[]
  shop: (Offer | null)[]
  phase: "shop" | "result"
  actions: Action[]
  lastLog: FightEvent[]
  endReason: null | "hearts" | "abandon"
  nextInstance: number
}
export type RunResult = {
  version: 1
  id: string
  seed: string
  actions: Action[]
  practice: true
  opponent: "ai"
  mode: "pve"
  wins: number
  turns: number
  endReason: "hearts" | "abandon"
  finalPlayer: Fighter[]
  finalEnemy: Fighter[]
  lastLog: FightEvent[]
}
export type ActionResult = { ok: true; run: Run } | { ok: false; reason: RefuseReason; run: Run }
