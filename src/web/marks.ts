import type { FighterId } from "../rules/types"

function svg(inner: string): string {
  return `<svg viewBox="0 0 64 64" aria-hidden="true">${inner}</svg>`
}

export function fighterMark(id: FighterId): string {
  switch (id) {
    case "c24":
      return svg(`<rect x="8" y="16" width="48" height="32" rx="8" fill="#E7F2EF"/>`)
    case "c42":
      return svg(`<polygon points="32,8 56,56 8,56" fill="#F6E4D8"/>`)
    case "c15":
      return svg(`<ellipse cx="32" cy="36" rx="24" ry="16" fill="#E7F2EF"/>`)
    case "c33":
      return svg(`<circle cx="32" cy="32" r="18" fill="#F4EFE6"/>`)
    case "u44":
      return svg(
        `<circle cx="32" cy="32" r="16" fill="#E7F2EF"/><circle cx="32" cy="32" r="22" fill="none" stroke="#8FB3A6" stroke-width="1.5"/>`,
      )
    case "u35":
      return svg(
        `<rect x="10" y="20" width="44" height="28" rx="8" fill="#E7F2EF"/><line x1="14" y1="34" x2="50" y2="34" stroke="var(--ink)" stroke-width="1.5"/>`,
      )
    case "r55":
      return svg(
        `<polygon points="32,6 38,26 58,26 42,38 48,58 32,46 16,58 22,38 6,26 26,26" fill="#F8E7C2"/>`,
      )
    case "r46":
      return svg(`<path d="M32 8 L52 18 V34 C52 48 32 58 32 58 C32 58 12 48 12 34 V18 Z" fill="#F8E7C2"/>`)
    default: {
      const unknown: never = id
      throw new Error(`unknown mark ${unknown}`)
    }
  }
}
