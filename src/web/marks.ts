import type { FighterId } from "../rules/types"

function svg(id: FighterId, inner: string): string {
  return `<svg class="mark" data-card="${id}" viewBox="0 0 64 64" aria-hidden="true">${inner}</svg>`
}

const shadow = `<ellipse class="shadow" cx="32" cy="60" rx="14" ry="3" fill="#E6DDD0"/>`

function legs(color: string): string {
  return `<g class="leg leg-a"><rect x="20" y="46" width="7" height="12" rx="3.5" fill="${color}" stroke="#24312C" stroke-width="1.5"/></g>
    <g class="leg leg-b"><rect x="37" y="46" width="7" height="12" rx="3.5" fill="${color}" stroke="#24312C" stroke-width="1.5"/></g>`
}

function arms(color: string, y: number): string {
  return `<g class="arm arm-a"><rect x="6" y="${y}" width="8" height="6" rx="3" fill="${color}" stroke="#24312C" stroke-width="1.5"/></g>
    <g class="arm arm-b"><rect x="50" y="${y}" width="8" height="6" rx="3" fill="${color}" stroke="#24312C" stroke-width="1.5"/></g>`
}

export function fighterMark(id: FighterId): string {
  switch (id) {
    case "c24":
      return svg(
        id,
        `${shadow}<g class="body">${legs("#6E9C94")}${arms("#B7D2CB", 30)}
          <rect x="14" y="16" width="36" height="32" rx="16" fill="#E7F2EF" stroke="#24312C" stroke-width="1.5"/>
          <ellipse class="eye" cx="25" cy="30" rx="2.3" ry="2.7" fill="#24312C"/>
          <ellipse class="eye" cx="39" cy="30" rx="2.3" ry="2.7" fill="#24312C"/>
          <path d="M27 38 Q32 42 37 38" fill="none" stroke="#24312C" stroke-width="1.5" stroke-linecap="round"/>
        </g>`,
      )
    case "c42":
      return svg(
        id,
        `${shadow}<g class="body">${legs("#C4896A")}
          <polygon points="32,8 54,46 10,46" fill="#F6E4D8" stroke="#24312C" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M22 28 L28 32" fill="none" stroke="#24312C" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M42 28 L36 32" fill="none" stroke="#24312C" stroke-width="1.5" stroke-linecap="round"/>
          <ellipse class="eye" cx="26" cy="34" rx="1.8" ry="2.2" fill="#24312C"/>
          <ellipse class="eye" cx="38" cy="34" rx="1.8" ry="2.2" fill="#24312C"/>
          <path d="M28 40 L32 37 L36 40" fill="none" stroke="#24312C" stroke-width="1.5" stroke-linecap="round"/>
        </g>`,
      )
    case "c15":
      return svg(
        id,
        `${shadow}<g class="body">
          <g class="leg leg-a"><ellipse cx="16" cy="52" rx="6" ry="4" fill="#6E9C94" stroke="#24312C" stroke-width="1.5"/></g>
          <g class="leg leg-b"><ellipse cx="48" cy="52" rx="6" ry="4" fill="#6E9C94" stroke="#24312C" stroke-width="1.5"/></g>
          <ellipse cx="32" cy="36" rx="24" ry="14" fill="#E7F2EF" stroke="#24312C" stroke-width="1.5"/>
          <ellipse class="eye" cx="24" cy="34" rx="3" ry="3.4" fill="#24312C"/>
          <ellipse class="eye" cx="40" cy="34" rx="3" ry="3.4" fill="#24312C"/>
          <circle cx="25" cy="33" r="1" fill="#FFFCF8"/>
          <circle cx="41" cy="33" r="1" fill="#FFFCF8"/>
          <path d="M28 42 Q32 44 36 42" fill="none" stroke="#24312C" stroke-width="1.5" stroke-linecap="round"/>
        </g>`,
      )
    case "c33":
      return svg(
        id,
        `${shadow}<g class="body">${legs("#C9B8A4")}${arms("#E7C7BE", 32)}
          <circle cx="32" cy="30" r="16" fill="#F4EFE6" stroke="#24312C" stroke-width="1.5"/>
          <circle cx="20" cy="34" r="3.5" fill="#E7C7BE"/>
          <circle cx="44" cy="34" r="3.5" fill="#E7C7BE"/>
          <ellipse class="eye" cx="26" cy="28" rx="2.1" ry="2.5" fill="#24312C"/>
          <ellipse class="eye" cx="38" cy="28" rx="2.1" ry="2.5" fill="#24312C"/>
          <path d="M26 36 Q32 41 38 36" fill="none" stroke="#24312C" stroke-width="1.5" stroke-linecap="round"/>
        </g>`,
      )
    case "u44":
      return svg(
        id,
        `${shadow}<ellipse class="ring" cx="32" cy="30" rx="22" ry="22" fill="none" stroke="#8FB3A6" stroke-width="2.5"/>
        <g class="body">${legs("#6E9C94")}
          <circle cx="32" cy="32" r="13" fill="#E7F2EF" stroke="#24312C" stroke-width="1.5"/>
          <ellipse class="eye" cx="27" cy="31" rx="1.8" ry="2.2" fill="#24312C"/>
          <ellipse class="eye" cx="37" cy="31" rx="1.8" ry="2.2" fill="#24312C"/>
          <path d="M29 37 Q32 39 35 37" fill="none" stroke="#24312C" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="32" cy="16" r="2.5" fill="#8FB3A6" stroke="#24312C" stroke-width="1.5"/>
        </g>`,
      )
    case "u35":
      return svg(
        id,
        `${shadow}<g class="body">
          <path class="cape" d="M18 24 L6 46 L20 40 Z" fill="#8FB3A6" stroke="#24312C" stroke-width="1.5" stroke-linejoin="round"/>
          <g class="leg leg-a"><rect x="28" y="46" width="7" height="12" rx="3.5" fill="#6E9C94" stroke="#24312C" stroke-width="1.5"/></g>
          <g class="leg leg-b"><rect x="40" y="46" width="7" height="12" rx="3.5" fill="#6E9C94" stroke="#24312C" stroke-width="1.5"/></g>
          <polygon points="46,12 58,44 26,44" fill="#E7F2EF" stroke="#24312C" stroke-width="1.5" stroke-linejoin="round"/>
          <ellipse class="eye" cx="42" cy="28" rx="1.8" ry="2.2" fill="#24312C"/>
          <ellipse class="eye" cx="50" cy="26" rx="1.8" ry="2.2" fill="#24312C"/>
          <path d="M40 36 L48 34" fill="none" stroke="#24312C" stroke-width="1.5" stroke-linecap="round"/>
        </g>`,
      )
    case "r55":
      return svg(
        id,
        `${shadow}<g class="body">${legs("#C4A15A")}${arms("#E0B15A", 34)}
          <polygon class="crown" points="20,20 25,8 32,16 39,6 44,20" fill="#E0B15A" stroke="#24312C" stroke-width="1.5" stroke-linejoin="round"/>
          <circle cx="32" cy="34" r="14" fill="#F8E7C2" stroke="#24312C" stroke-width="1.5"/>
          <ellipse class="eye" cx="27" cy="33" rx="2" ry="2.4" fill="#24312C"/>
          <ellipse class="eye" cx="37" cy="33" rx="2" ry="2.4" fill="#24312C"/>
          <path d="M27 40 Q32 44 37 40" fill="none" stroke="#24312C" stroke-width="1.5" stroke-linecap="round"/>
        </g>`,
      )
    case "r46":
      return svg(
        id,
        `${shadow}<g class="body">${legs("#C4A15A")}
          <path d="M32 10 L50 20 V36 C50 48 32 58 32 58 C32 58 14 48 14 36 V20 Z" fill="#F8E7C2" stroke="#24312C" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M20 30 H44" fill="none" stroke="#E0B15A" stroke-width="3" stroke-linecap="round"/>
          <ellipse class="eye" cx="26" cy="28" rx="1.8" ry="2.1" fill="#24312C"/>
          <ellipse class="eye" cx="38" cy="28" rx="1.8" ry="2.1" fill="#24312C"/>
          <path d="M24 38 H40" fill="none" stroke="#24312C" stroke-width="1.5" stroke-linecap="round"/>
          <rect x="28" y="6" width="8" height="6" rx="1" fill="#E0B15A" stroke="#24312C" stroke-width="1.5"/>
        </g>`,
      )
    default: {
      const unknown: never = id
      throw new Error(`unknown mark ${unknown}`)
    }
  }
}
