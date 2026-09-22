import { fighterById, skillById } from "./cards"
import type { EffectKind, FightEvent, Fighter, SkillDef, SkillId, Trigger } from "./types"

type Side = "player" | "enemy"
type Located = { side: Side; index: number; fighter: Fighter }

const CAP = 100

function cloneBoard(board: Fighter[]): Fighter[] {
  return board.map((fighter) => ({
    instance: fighter.instance,
    card: fighter.card,
    gainedAttack: fighter.gainedAttack,
    health: fighter.health,
    skills: [fighter.skills[0], fighter.skills[1]],
  }))
}

export function combatAttack(fighter: Fighter, wins: number, side: "player" | "enemy"): number {
  const bonus = side === "enemy" ? Math.floor(wins / 2) : 0
  return fighterById(fighter.card).attack + fighter.gainedAttack + bonus
}

export function resolveFight(
  playerBoard: Fighter[],
  enemyBoard: Fighter[],
  wins: number,
): { player: Fighter[]; enemy: Fighter[]; log: FightEvent[]; outcome: "win" | "loss" | "mutual" } {
  const player = cloneBoard(playerBoard)
  const enemy = cloneBoard(enemyBoard)
  const log: FightEvent[] = []
  const fainting = new Set<number>()
  let fires = 0
  let capped = false

  function boardOf(side: Side): Fighter[] {
    return side === "player" ? player : enemy
  }

  function locate(instance: number): Located | null {
    const playerIndex = player.findIndex((fighter) => fighter.instance === instance)
    if (playerIndex >= 0) return { side: "player", index: playerIndex, fighter: player[playerIndex] }
    const enemyIndex = enemy.findIndex((fighter) => fighter.instance === instance)
    if (enemyIndex >= 0) return { side: "enemy", index: enemyIndex, fighter: enemy[enemyIndex] }
    return null
  }

  function living(board: Fighter[]): boolean {
    return board.some((fighter) => fighter.health > 0)
  }

  function targetIds(loc: Located, skill: SkillDef): number[] {
    const friends = boardOf(loc.side)
    const foes = boardOf(loc.side === "player" ? "enemy" : "player")
    switch (skill.target) {
      case "self":
        return [loc.fighter.instance]
      case "friend-ahead": {
        const ahead = friends[loc.index - 1]
        return ahead ? [ahead.instance] : []
      }
      case "friend-behind": {
        const behind = friends[loc.index + 1]
        return behind ? [behind.instance] : []
      }
      case "enemy-front":
        return foes[0] ? [foes[0].instance] : []
      case "last-living-enemy": {
        const last = foes[foes.length - 1]
        return last ? [last.instance] : []
      }
      case "all-friends":
        return friends.map((fighter) => fighter.instance)
      case "all-enemies":
        return foes.map((fighter) => fighter.instance)
      default: {
        const unknown: never = skill.target
        throw new Error(`unknown target ${unknown}`)
      }
    }
  }

  function eventTarget(skill: SkillDef, caster: number, targets: number[]): number | number[] | null {
    const gain = skill.effect === "gain-attack" || skill.effect === "gain-health"
    if (gain && targets.length === 1 && targets[0] === caster) return null
    if (targets.length === 1) return targets[0]
    return targets.slice()
  }

  function applyNumbers(effect: EffectKind, amount: number, targets: number[]): void {
    for (const id of targets) {
      const loc = locate(id)
      if (!loc) continue
      if (effect === "gain-attack") loc.fighter.gainedAttack += amount
      else if (effect === "gain-health") loc.fighter.health += amount
      else loc.fighter.health -= amount
    }
  }

  function cast(instance: number, skillId: SkillId): void {
    if (capped) return
    const loc = locate(instance)
    if (!loc) return
    const skill = skillById(skillId)
    const targets = targetIds(loc, skill)
    if (targets.length === 0) return
    fires += 1
    log.push({
      type: "skill",
      instance,
      skill: skillId,
      amount: skill.n,
      target: eventTarget(skill, instance, targets),
    })
    if (fires === CAP) {
      log.push({ type: "cap" })
      capped = true
      applyNumbers(skill.effect, skill.n, targets)
      return
    }
    if (skill.effect === "damage") {
      for (const id of targets) {
        if (capped) return
        if (!locate(id)) continue
        applyDamage(id, skill.n)
      }
      return
    }
    applyNumbers(skill.effect, skill.n, targets)
  }

  function runSkills(instance: number, trigger: Trigger): void {
    for (let slot = 0; slot < 2; slot += 1) {
      if (capped) return
      const loc = locate(instance)
      if (!loc) return
      const skillId = loc.fighter.skills[slot]
      if (!skillId) continue
      if (skillById(skillId).trigger !== trigger) continue
      cast(instance, skillId)
    }
  }

  function faint(instance: number): void {
    if (capped || fainting.has(instance)) return
    const loc = locate(instance)
    if (!loc) return
    fainting.add(instance)
    runSkills(instance, "faint")
    fainting.delete(instance)
    if (capped) return
    const still = locate(instance)
    if (!still) return
    boardOf(still.side).splice(still.index, 1)
    log.push({ type: "faint", instance })
  }

  function applyDamage(instance: number, amount: number): void {
    const loc = locate(instance)
    if (!loc || amount <= 0) return
    loc.fighter.health -= amount
    if (capped) return
    runSkills(instance, "when-hurt")
    if (capped) return
    const after = locate(instance)
    if (after && after.fighter.health <= 0) faint(instance)
  }

  function sweep(board: Fighter[]): void {
    let index = 0
    while (!capped && index < board.length) {
      const fighter = board[index]
      if (fighter.health > 0) {
        index += 1
        continue
      }
      const instance = fighter.instance
      faint(instance)
      if (capped) return
      if (board[index]?.instance === instance) index += 1
    }
  }

  function runStarts(board: Fighter[]): void {
    let index = 0
    while (!capped && index < board.length) {
      const instance = board[index].instance
      runSkills(instance, "start")
      if (capped) return
      if (board[index]?.instance === instance) index += 1
    }
  }

  runStarts(player)
  if (!capped) runStarts(enemy)

  while (!capped && living(player) && living(enemy)) {
    if (player[0].health <= 0 || enemy[0].health <= 0) {
      sweep(player)
      sweep(enemy)
      continue
    }

    const playerId = player[0].instance
    const enemyId = enemy[0].instance
    const playerBehind = player[1]?.instance
    const enemyBehind = enemy[1]?.instance

    runSkills(playerId, "on-attack")
    if (capped) break
    if (playerBehind !== undefined && locate(playerBehind)) runSkills(playerBehind, "friend-ahead-attacks")
    if (capped) break
    if (locate(enemyId)) {
      runSkills(enemyId, "on-attack")
      if (capped) break
      if (enemyBehind !== undefined && locate(enemyBehind)) runSkills(enemyBehind, "friend-ahead-attacks")
    }
    if (capped) break

    const playerLoc = locate(playerId)
    const enemyLoc = locate(enemyId)
    if (!playerLoc || !enemyLoc || playerLoc.fighter.health <= 0 || enemyLoc.fighter.health <= 0) continue

    const playerHit = combatAttack(playerLoc.fighter, wins, "player")
    const enemyHit = combatAttack(enemyLoc.fighter, wins, "enemy")
    log.push({ type: "strike", attacker: playerId, defender: enemyId, amount: playerHit })
    log.push({ type: "strike", attacker: enemyId, defender: playerId, amount: enemyHit })
    // Both strike numbers land before either of those hits runs When hurt.
    playerLoc.fighter.health -= enemyHit
    enemyLoc.fighter.health -= playerHit

    if (enemyHit > 0 && locate(playerId)) runSkills(playerId, "when-hurt")
    if (capped) break
    if (playerHit > 0 && locate(enemyId)) runSkills(enemyId, "when-hurt")
    if (capped) break
    sweep(player)
    if (capped) break
    sweep(enemy)
  }

  const playerAlive = living(player)
  const enemyAlive = living(enemy)
  const outcome = capped ? "mutual" : playerAlive && !enemyAlive ? "win" : enemyAlive && !playerAlive ? "loss" : "mutual"
  log.push({ type: "end", outcome })
  return { player, enemy, log, outcome }
}
