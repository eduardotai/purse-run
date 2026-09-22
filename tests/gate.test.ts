import { expect, test } from "vitest"
import { evaluateGate } from "../src/sim/gate"

test("the roster passes the balance gate", () => {
  const gate = evaluateGate()
  expect(gate).toEqual({ ok: true })
}, 120000)
