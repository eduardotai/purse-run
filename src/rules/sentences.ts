import type { FightEvent } from "./types"

export function eventSentence(event: FightEvent): string {
  switch (event.type) {
    case "skill":
      return `Fighter ${event.instance} ${event.skill}: ${event.amount}`
    case "strike":
      return `Fighter ${event.attacker} hits Fighter ${event.defender} for ${event.amount}`
    case "faint":
      return `Fighter ${event.instance} leaves`
    case "cap":
      return "Fight stopped at 100 skills"
    case "end":
      return event.outcome
  }
}
