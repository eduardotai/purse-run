import { skillById } from "../rules/cards"
import type { FightEvent, Fighter } from "../rules/types"

function cloneBoard(board: Fighter[]): Fighter[] {
  return board.map((fighter) => ({
    instance: fighter.instance,
    card: fighter.card,
    gainedAttack: fighter.gainedAttack,
    health: fighter.health,
    skills: [fighter.skills[0], fighter.skills[1]],
  }))
}

function find(boards: { player: Fighter[]; enemy: Fighter[] }, instance: number): Fighter | null {
  return (
    boards.player.find((fighter) => fighter.instance === instance) ??
    boards.enemy.find((fighter) => fighter.instance === instance) ??
    null
  )
}

function idsOf(event: Extract<FightEvent, { type: "skill" }>): number[] {
  if (event.target === null) return [event.instance]
  return Array.isArray(event.target) ? event.target : [event.target]
}

function apply(boards: { player: Fighter[]; enemy: Fighter[] }, event: FightEvent): void {
  if (event.type === "skill") {
    const skill = skillById(event.skill)
    for (const id of idsOf(event)) {
      const fighter = find(boards, id)
      if (!fighter) continue
      if (skill.effect === "gain-attack") fighter.gainedAttack += event.amount
      else if (skill.effect === "gain-health") fighter.health += event.amount
      else fighter.health -= event.amount
    }
    return
  }
  if (event.type === "strike") {
    const fighter = find(boards, event.defender)
    if (fighter) fighter.health -= event.amount
    return
  }
  if (event.type === "faint") {
    boards.player = boards.player.filter((fighter) => fighter.instance !== event.instance)
    boards.enemy = boards.enemy.filter((fighter) => fighter.instance !== event.instance)
  }
}

export function stepBoards(
  player: Fighter[],
  enemy: Fighter[],
  events: FightEvent[],
): { player: Fighter[]; enemy: Fighter[] } {
  const boards = { player: cloneBoard(player), enemy: cloneBoard(enemy) }
  for (const event of events) apply(boards, event)
  return boards
}
