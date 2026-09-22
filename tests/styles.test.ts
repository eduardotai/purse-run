import { readFileSync } from "node:fs"
import { expect, test } from "vitest"

test("the page uses the light chill palette", () => {
  const css = readFileSync("src/web/styles.css", "utf8")
  expect(css).toContain("--paper: #F4EFE6")
  expect(css).toContain("--player: #6E9C94")
  expect(css).toContain("--rival: #D09A74")
  expect(css).toContain("prefers-reduced-motion")
})
