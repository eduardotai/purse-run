import { expect, test } from "vitest"
import { serveOpponent } from "../src/rules/ghosts"

test("a labeled bot is served for wins 0 through 8", () => {
  for (let wins = 0; wins <= 8; wins += 1) {
    const ghost = serveOpponent(wins)
    expect(ghost?.rating).toBe(1000)
    expect(ghost?.label).toBe(`Bot ${wins}`)
    expect(ghost?.board.length).toBeGreaterThan(0)
  }
  expect(serveOpponent(9)).toBeNull()
  expect(serveOpponent(-1)).toBeNull()
})

test("the same win count serves the same bot", () => {
  const first = serveOpponent(3)
  const second = serveOpponent(3)
  expect(second?.board).toEqual(first?.board)
})
