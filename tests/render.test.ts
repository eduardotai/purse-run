import { expect, test } from "vitest"
import { createRun } from "../src/rules/run"
import { renderTable } from "../src/web/render"

test("the shop render shows gold, hearts, wins, the seed, and four offers", () => {
  const html = renderTable(createRun("test"), null)
  expect(html).toContain("Purse Run")
  expect(html).toContain(">10<")
  expect(html).toContain('data-hearts="5"')
  expect(html).toContain('data-wins="0"')
  expect(html).toContain("test")
  expect(html.match(/data-offer=/g)).toHaveLength(4)
  expect(html).toContain('data-side="rival"')
  expect(html).toContain('data-side="player"')
})
