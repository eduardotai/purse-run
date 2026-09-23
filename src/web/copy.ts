import type { SkillDef } from "../rules/types"

const TRIGGER: Record<SkillDef["trigger"], string> = {
  start: "At the start",
  "on-attack": "On attack",
  "when-hurt": "When hurt",
  "friend-ahead-attacks": "When the friend ahead attacks",
  faint: "On faint",
}

const TARGET: Record<SkillDef["target"], string> = {
  self: "itself",
  "friend-ahead": "the friend ahead",
  "friend-behind": "the friend behind",
  "enemy-front": "the enemy in front",
  "last-living-enemy": "the last living enemy",
  "all-friends": "all friends",
  "all-enemies": "all enemies",
}

export function skillLine(skill: SkillDef): string {
  const trigger = TRIGGER[skill.trigger]
  const target = TARGET[skill.target]
  if (skill.effect === "damage") {
    if (skill.target === "all-enemies") return `${trigger}. Deal ${skill.n} to all enemies.`
    if (skill.target === "self") return `${trigger}. Deal ${skill.n} to itself.`
    return `${trigger}. Deal ${skill.n} to ${target}.`
  }
  const noun = skill.effect === "gain-attack" ? "attack" : "health"
  if (skill.target === "all-friends") return `${trigger}. Friends gain ${skill.n} ${noun}.`
  if (skill.target === "self") return `${trigger}. Gain ${skill.n} ${noun}.`
  return `${trigger}. Gain ${skill.n} ${noun} to ${target}.`
}
