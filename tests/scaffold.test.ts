import { readFileSync } from "node:fs"
import { expect, test } from "vitest"

test("the page title is Purse Run", () => {
  const html = readFileSync("index.html", "utf8")
  expect(html).toContain("<title>Purse Run</title>")
})
