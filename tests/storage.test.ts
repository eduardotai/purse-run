import { expect, test } from "vitest"
import { createRun } from "../src/rules/run"
import { loadCurrent, loadResults, saveCurrent, saveResults } from "../src/web/storage"

test("a broken current save is ignored and a broken results list is empty", () => {
  const memory = new Map<string, string>()
  const storage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
    removeItem: (key: string) => memory.delete(key),
  }
  saveCurrent(createRun("test"), storage)
  expect(loadCurrent(storage)?.seed).toBe("test")
  memory.set("purse-run.current", "{")
  expect(loadCurrent(storage)).toBeNull()
  memory.set("purse-run.results", "{")
  expect(loadResults(storage)).toEqual([])
  saveResults([], storage)
  expect(loadResults(storage)).toEqual([])
})
