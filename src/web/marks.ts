import type { FighterId } from "../rules/types"

function svg(id: FighterId, inner: string): string {
  return `<svg class="mark" data-card="${id}" viewBox="0 0 64 64" aria-hidden="true">${inner}</svg>`
}

const shadow = `<ellipse cx="32" cy="58" rx="14" ry="3" fill="#CDBFAE"/>`

export function fighterMark(id: FighterId): string {
  switch (id) {
    case "c24":
      return svg(
        id,
        `${shadow}<rect x="16" y="18" width="32" height="30" rx="15" fill="#8FB3A6" stroke="#24312C" stroke-width="1.5"/>
        <ellipse cx="25" cy="30" rx="2.2" ry="2.6" fill="#24312C"/><ellipse cx="39" cy="30" rx="2.2" ry="2.6" fill="#24312C"/>
        <path d="M27 38 Q32 42 37 38" fill="none" stroke="#24312C" stroke-width="1.5" stroke-linecap="round"/>`,
      )
    case "c42":
      return svg(
        id,
        `${shadow}<polygon points="32,10 54,48 10,48" fill="#D09A74" stroke="#24312C" stroke-width="1.5" stroke-linejoin="round"/>
        <ellipse cx="26" cy="36" rx="1.8" ry="2.2" fill="#24312C"/><ellipse cx="38" cy="36" rx="1.8" ry="2.2" fill="#24312C"/>
        <path d="M28 42 L32 39 L36 42" fill="none" stroke="#5C3424" stroke-width="1.5" stroke-linecap="round"/>`,
      )
    case "c15":
      return svg(
        id,
        `${shadow}<ellipse cx="32" cy="34" rx="24" ry="14" fill="#9EC4BA" stroke="#24312C" stroke-width="1.5"/>
        <ellipse cx="22" cy="32" rx="2.4" ry="2.8" fill="#24312C"/><ellipse cx="42" cy="32" rx="2.4" ry="2.8" fill="#24312C"/>
        <path d="M26 40 Q32 43 38 40" fill="none" stroke="#24312C" stroke-width="1.5" stroke-linecap="round"/>`,
      )
    case "c33":
      return svg(
        id,
        `${shadow}<rect x="16" y="16" width="32" height="32" rx="6" fill="#C4A15A" stroke="#24312C" stroke-width="1.5"/>
        <ellipse cx="26" cy="30" rx="2" ry="2.4" fill="#24312C"/><ellipse cx="38" cy="30" rx="2" ry="2.4" fill="#24312C"/>
        <path d="M26 40 H38" fill="none" stroke="#24312C" stroke-width="1.5" stroke-linecap="round"/>`,
      )
    case "u44":
      return svg(
        id,
        `${shadow}<circle cx="32" cy="32" r="16" fill="none" stroke="#8FB3A6" stroke-width="2"/>
        <circle cx="32" cy="34" r="12" fill="#6E9C94" stroke="#24312C" stroke-width="1.5"/>
        <ellipse cx="27" cy="32" rx="1.8" ry="2.2" fill="#24312C"/><ellipse cx="37" cy="32" rx="1.8" ry="2.2" fill="#24312C"/>`,
      )
    case "u35":
      return svg(
        id,
        `${shadow}<path d="M20 44 L24 18 H40 L44 44 Z" fill="#7A4630" stroke="#24312C" stroke-width="1.5"/>
        <path d="M18 28 Q8 40 20 46" fill="none" stroke="#24312C" stroke-width="1.5"/>
        <ellipse cx="28" cy="30" rx="1.6" ry="2" fill="#FFFCF8"/><ellipse cx="36" cy="30" rx="1.6" ry="2" fill="#FFFCF8"/>`,
      )
    case "r55":
      return svg(
        id,
        `${shadow}<polygon points="32,8 36,16 44,16 32,22 36,8" fill="#E0B15A" stroke="#24312C" stroke-width="1.2"/>
        <rect x="18" y="22" width="28" height="26" rx="10" fill="#E0B15A" stroke="#24312C" stroke-width="1.5"/>
        <ellipse cx="27" cy="34" rx="2" ry="2.4" fill="#24312C"/><ellipse cx="37" cy="34" rx="2" ry="2.4" fill="#24312C"/>`,
      )
    case "r46":
      return svg(
        id,
        `${shadow}<path d="M32 12 L50 22 V36 Q50 50 32 54 Q14 50 14 36 V22 Z" fill="#D9897B" stroke="#24312C" stroke-width="1.5"/>
        <ellipse cx="26" cy="32" rx="2" ry="2.4" fill="#24312C"/><ellipse cx="38" cy="32" rx="2" ry="2.4" fill="#24312C"/>
        <path d="M27 42 Q32 46 37 42" fill="none" stroke="#24312C" stroke-width="1.5" stroke-linecap="round"/>`,
      )
    default: {
      const unknown: never = id
      throw new Error(`unknown mark ${unknown}`)
    }
  }
}
