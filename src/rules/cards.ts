import type { EffectKind, FighterDef, FighterId, Rarity, SkillDef, SkillId, TargetKind, Trigger } from "./types"

export const FIGHTERS: readonly FighterDef[] = [
  { id: "c24", rarity: "common", attack: 2, health: 4 },
  { id: "c42", rarity: "common", attack: 2, health: 4 },
  { id: "c15", rarity: "common", attack: 1, health: 5 },
  { id: "c33", rarity: "common", attack: 1, health: 5 },
  { id: "u44", rarity: "uncommon", attack: 2, health: 6 },
  { id: "u35", rarity: "uncommon", attack: 3, health: 5 },
  { id: "r55", rarity: "rare", attack: 3, health: 7 },
  { id: "r46", rarity: "rare", attack: 2, health: 8 },
  { id: "u44", rarity: "uncommon", attack: 4, health: 4 },
  { id: "u35", rarity: "uncommon", attack: 3, health: 5 },
  { id: "r55", rarity: "rare", attack: 5, health: 5 },
  { id: "r46", rarity: "rare", attack: 4, health: 6 },
]

export const SKILLS: readonly SkillDef[] = [
  { id: "jab", rarity: "common", trigger: "on-attack", target: "enemy-front", effect: "damage", n: 1 },
  { id: "brace", rarity: "common", trigger: "start", target: "self", effect: "gain-health", n: 1 },
  { id: "bark", rarity: "common", trigger: "friend-ahead-attacks", target: "friend-ahead", effect: "gain-attack", n: 1 },
  { id: "spark", rarity: "common", trigger: "start", target: "all-enemies", effect: "damage", n: 1 },
  { id: "cheer", rarity: "common", trigger: "start", target: "all-friends", effect: "gain-attack", n: 1 },
  { id: "pin", rarity: "common", trigger: "on-attack", target: "last-living-enemy", effect: "damage", n: 1 },
  { id: "spike", rarity: "uncommon", trigger: "on-attack", target: "enemy-front", effect: "damage", n: 2 },
  { id: "mend", rarity: "uncommon", trigger: "when-hurt", target: "self", effect: "gain-health", n: 2 },
  { id: "guard", rarity: "uncommon", trigger: "friend-ahead-attacks", target: "friend-ahead", effect: "gain-health", n: 2 },
  { id: "hex", rarity: "uncommon", trigger: "start", target: "self", effect: "gain-attack", n: 2 },
  { id: "lance", rarity: "rare", trigger: "faint", target: "last-living-enemy", effect: "damage", n: 3 },
  { id: "banner", rarity: "rare", trigger: "start", target: "friend-ahead", effect: "gain-attack", n: 3 },
]

const TRIGGERS: readonly Trigger[] = ["start", "on-attack", "when-hurt", "friend-ahead-attacks", "faint"]
const TARGETS: readonly TargetKind[] = [
  "self",
  "friend-ahead",
  "friend-behind",
  "enemy-front",
  "last-living-enemy",
  "all-friends",
  "all-enemies",
]
const EFFECTS: readonly EffectKind[] = ["damage", "gain-attack", "gain-health"]
const RARITIES: readonly Rarity[] = ["common", "uncommon", "rare"]

const testSkills = new Map<SkillId, SkillDef>()
const fighters = new Map(FIGHTERS.map((card) => [card.id, card]))
const skills = new Map(SKILLS.map((card) => [card.id, card]))

function listed<T extends string>(options: readonly T[], value: string): value is T {
  return (options as readonly string[]).includes(value)
}

function bandN(rarity: Rarity): number {
  if (rarity === "common") return 1
  if (rarity === "uncommon") return 2
  return 3
}

function wholeSide(target: TargetKind): boolean {
  return target === "all-friends" || target === "all-enemies"
}

function assertSkillRails(skill: SkillDef, testSkill: boolean): void {
  const inGrammar =
    listed(RARITIES, skill.rarity) &&
    listed(TRIGGERS, skill.trigger) &&
    listed(TARGETS, skill.target) &&
    listed(EFFECTS, skill.effect)
  if (!inGrammar) throw new Error(`skill ${skill.id} is outside the grammar`)
  if (!Number.isInteger(skill.n) || skill.n < 1) {
    throw new Error(`skill ${skill.id} n must be a positive whole number`)
  }
  const onBand = skill.n === bandN(skill.rarity)
  const commonOffBand = testSkill && skill.rarity === "common"
  if (!onBand && !commonOffBand) {
    throw new Error(`skill ${skill.id} n ${skill.n} is outside the ${skill.rarity} band`)
  }
  if (!testSkill && skill.id.startsWith("test-")) {
    throw new Error(`roster skill ${skill.id} must not start with test-`)
  }
  const whole = wholeSide(skill.target)
  if (whole && (skill.rarity !== "common" || (skill.trigger !== "start" && skill.trigger !== "on-attack"))) {
    throw new Error(`skill ${skill.id} cannot target ${skill.target}`)
  }
}

for (const skill of SKILLS) assertSkillRails(skill, false)
for (const fighter of FIGHTERS) {
  const sum = fighter.attack + fighter.health
  const expected = fighter.rarity === "common" ? 6 : fighter.rarity === "uncommon" ? 8 : 10
  if (sum !== expected) throw new Error(`fighter ${fighter.id} sums to ${sum}`)
}

export function fighterById(id: FighterId): FighterDef {
  const card = fighters.get(id)
  if (!card) throw new Error(`unknown fighter ${id}`)
  return card
}

export function skillById(id: SkillId): SkillDef {
  const card = testSkills.get(id) ?? skills.get(id)
  if (!card) throw new Error(`unknown skill ${id}`)
  return card
}

export function addTestSkill(skill: SkillDef): void {
  if (!skill.id.startsWith("test-")) throw new Error(`test skill ${skill.id} must start with test-`)
  assertSkillRails(skill, true)
  testSkills.set(skill.id, skill)
}

export function cardsOf(kind: "fighter" | "skill", rarity: Rarity): readonly string[] {
  if (kind === "fighter") return FIGHTERS.filter((card) => card.rarity === rarity).map((card) => card.id)
  // Mend and guard heal through a whole fight when attack is 1 or 2, and that hits the skill cap.
  return SKILLS.filter((card) => card.rarity === rarity && card.id !== "mend" && card.id !== "guard").map(
    (card) => card.id,
  )
}
