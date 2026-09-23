import { expect, test } from "vitest"
import { pickOpponent, type Seat } from "../src/rules/match"
import type { Fighter } from "../src/rules/types"

function seat(partial: Partial<Seat> & Pick<Seat, "id" | "points" | "games" | "bot">): Seat {
  const board: Fighter[] = [
    { instance: 1, card: "c24", gainedAttack: 0, health: 4, skills: [null, null] },
  ]
  return { wins: 2, board, ...partial }
}

test("matchmaking walks 50, then 100, then 200, then placement, then a bot", () => {
  const near = seat({ id: "near", points: 1040, games: 6, bot: false })
  const far = seat({ id: "far", points: 1180, games: 6, bot: false })
  const wide = seat({ id: "wide", points: 1190, games: 8, bot: false })
  const placement = seat({ id: "new", points: 1000, games: 2, bot: false })
  const bot = seat({ id: "bot-2", points: 1000, games: 99, bot: true })
  expect(pickOpponent(2, "me", 1000, [far, near, bot])?.id).toBe("near")
  expect(pickOpponent(2, "me", 1000, [far, wide, bot])?.id).toBe("far")
  expect(pickOpponent(2, "me", 1000, [wide, bot])?.id).toBe("wide")
  expect(pickOpponent(2, "me", 1000, [placement, bot])?.id).toBe("new")
  expect(pickOpponent(2, "me", 1000, [bot])?.id).toBe("bot-2")
  expect(pickOpponent(2, "me", 1000, [seat({ id: "me", points: 1000, games: 9, bot: false })])).toBeNull()
})

test("above win 8 a bot is not served when no human was found", () => {
  const bot = seat({ id: "bot-9", points: 1000, games: 99, wins: 9, bot: true })
  const human = seat({ id: "human", points: 1000, games: 6, wins: 9, bot: false })
  expect(pickOpponent(9, "me", 1000, [bot])).toBeNull()
  expect(pickOpponent(9, "me", 1000, [bot, human])?.id).toBe("human")
})
