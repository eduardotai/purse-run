import type { FighterId } from "../rules/types"

function svg(id: FighterId, inner: string): string {
  return `<svg class="mark" data-card="${id}" viewBox="0 0 64 64" aria-hidden="true">${inner}</svg>`
}

function shade(id: FighterId, light: string, mid: string, dark: string): string {
  return `<defs>
    <linearGradient id="g-${id}" x1="18%" y1="0%" x2="82%" y2="100%">
      <stop offset="0%" stop-color="${light}"/>
      <stop offset="48%" stop-color="${mid}"/>
      <stop offset="100%" stop-color="${dark}"/>
    </linearGradient>
    <radialGradient id="s-${id}" cx="34%" cy="28%" r="58%">
      <stop offset="0%" stop-color="#FFFCF8" stop-opacity="0.9"/>
      <stop offset="70%" stop-color="#FFFCF8" stop-opacity="0"/>
    </radialGradient>
  </defs>`
}

const shadow = `<ellipse class="shadow" cx="32" cy="60" rx="14" ry="3" fill="#CDBFAE"/>`

function legs(light: string, dark: string): string {
  return `<g class="leg leg-a"><rect x="20" y="46" width="7" height="12" rx="3.5" fill="${light}" stroke="#24312C" stroke-width="1.5"/><rect x="21" y="50" width="3" height="7" rx="1.5" fill="${dark}"/></g>
    <g class="leg leg-b"><rect x="37" y="46" width="7" height="12" rx="3.5" fill="${dark}" stroke="#24312C" stroke-width="1.5"/><rect x="38" y="50" width="3" height="7" rx="1.5" fill="${light}"/></g>`
}

function arms(light: string, dark: string, y: number): string {
  return `<g class="arm arm-a"><rect x="6" y="${y}" width="8" height="6" rx="3" fill="${light}" stroke="#24312C" stroke-width="1.5"/></g>
    <g class="arm arm-b"><rect x="50" y="${y}" width="8" height="6" rx="3" fill="${dark}" stroke="#24312C" stroke-width="1.5"/></g>`
}

export function fighterMark(id: FighterId): string {
  switch (id) {
    case "c24":
      return svg(
        id,
        `${shade(id, "#F7FFFC", "#A9CFC6", "#3E6B62")}${shadow}<g class="body">${legs("#7EAEA4", "#355E56")}${arms("#D7EBE6", "#5E8F86", 30)}
          <rect x="14" y="16" width="36" height="32" rx="16" fill="url(#g-${id})" stroke="#24312C" stroke-width="1.5"/>
          <ellipse cx="32" cy="38" rx="12" ry="7" fill="#6E9C94" opacity="0.55"/>
          <ellipse class="shine" cx="26" cy="24" rx="8" ry="5" fill="url(#s-${id})"/>
          <ellipse cx="22" cy="34" rx="2.2" ry="1.4" fill="#E7B7AE"/>
          <ellipse cx="42" cy="34" rx="2.2" ry="1.4" fill="#E7B7AE"/>
          <ellipse class="eye" cx="25" cy="30" rx="2.3" ry="2.7" fill="#24312C"/>
          <ellipse class="eye" cx="39" cy="30" rx="2.3" ry="2.7" fill="#24312C"/>
          <circle cx="25.6" cy="29.2" r="0.7" fill="#FFFCF8"/>
          <path d="M27 38 Q32 42 37 38" fill="none" stroke="#24312C" stroke-width="1.5" stroke-linecap="round"/>
        </g>`,
      )
    case "c42":
      return svg(
        id,
        `${shade(id, "#FDE7D8", "#D09A74", "#7A4630")}${shadow}<g class="body">${legs("#E0B089", "#8C5340")}
          <polygon points="32,8 54,46 10,46" fill="url(#g-${id})" stroke="#24312C" stroke-width="1.5" stroke-linejoin="round"/>
          <polygon points="32,14 42,40 22,40" fill="#F6C7A4" opacity="0.45"/>
          <ellipse class="shine" cx="28" cy="22" rx="6" ry="4" fill="url(#s-${id})"/>
          <path d="M22 28 L28 32" fill="none" stroke="#5C3424" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M42 28 L36 32" fill="none" stroke="#5C3424" stroke-width="1.5" stroke-linecap="round"/>
          <ellipse class="eye" cx="26" cy="34" rx="1.8" ry="2.2" fill="#24312C"/>
          <ellipse class="eye" cx="38" cy="34" rx="1.8" ry="2.2" fill="#24312C"/>
          <path d="M28 40 L32 37 L36 40" fill="none" stroke="#5C3424" stroke-width="1.5" stroke-linecap="round"/>
        </g>`,
      )
    case "c15":
      return svg(
        id,
        `${shade(id, "#F4FBFA", "#9EC4BA", "#4C756C")}${shadow}<g class="body">
          <g class="leg leg-a"><ellipse cx="16" cy="52" rx="6" ry="4" fill="#3E6B62" stroke="#24312C" stroke-width="1.5"/></g>
          <g class="leg leg-b"><ellipse cx="48" cy="52" rx="6" ry="4" fill="#8FB3A6" stroke="#24312C" stroke-width="1.5"/></g>
          <ellipse cx="32" cy="36" rx="24" ry="14" fill="url(#g-${id})" stroke="#24312C" stroke-width="1.5"/>
          <ellipse cx="32" cy="42" rx="16" ry="6" fill="#5E8A80" opacity="0.45"/>
          <ellipse class="shine" cx="24" cy="30" rx="8" ry="4" fill="url(#s-${id})"/>
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
        `${shade(id, "#FFF9F2", "#E4D3C0", "#B08968")}${shadow}<g class="body">${legs("#D7C2AE", "#8C6A52")}${arms("#F3D2C8", "#C4897C", 32)}
          <circle cx="32" cy="30" r="16" fill="url(#g-${id})" stroke="#24312C" stroke-width="1.5"/>
          <ellipse cx="32" cy="36" rx="9" ry="6" fill="#C9A88A" opacity="0.4"/>
          <ellipse class="shine" cx="26" cy="24" rx="6" ry="4" fill="url(#s-${id})"/>
          <circle cx="20" cy="34" r="3.5" fill="#E7A99A"/>
          <circle cx="44" cy="34" r="3.5" fill="#E7A99A"/>
          <ellipse class="eye" cx="26" cy="28" rx="2.1" ry="2.5" fill="#24312C"/>
          <ellipse class="eye" cx="38" cy="28" rx="2.1" ry="2.5" fill="#24312C"/>
          <path d="M26 36 Q32 41 38 36" fill="none" stroke="#24312C" stroke-width="1.5" stroke-linecap="round"/>
        </g>`,
      )
    case "u44":
      return svg(
        id,
        `${shade(id, "#F3FFFB", "#8FB3A6", "#2F6A5C")}${shadow}
        <ellipse class="ring" cx="32" cy="30" rx="22" ry="22" fill="none" stroke="#C4A15A" stroke-width="2"/>
        <ellipse class="ring" cx="32" cy="30" rx="19" ry="19" fill="none" stroke="#5E8F86" stroke-width="1.5"/>
        <g class="body">${legs("#7EAEA4", "#2C564C")}
          <circle cx="32" cy="32" r="13" fill="url(#g-${id})" stroke="#24312C" stroke-width="1.5"/>
          <ellipse cx="32" cy="38" rx="7" ry="4" fill="#3E6B62" opacity="0.35"/>
          <ellipse class="shine" cx="28" cy="27" rx="5" ry="3" fill="url(#s-${id})"/>
          <ellipse class="eye" cx="27" cy="31" rx="1.8" ry="2.2" fill="#24312C"/>
          <ellipse class="eye" cx="37" cy="31" rx="1.8" ry="2.2" fill="#24312C"/>
          <path d="M29 37 Q32 39 35 37" fill="none" stroke="#24312C" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="32" cy="16" r="2.8" fill="#E0B15A" stroke="#24312C" stroke-width="1.5"/>
          <circle cx="31.2" cy="15.2" r="0.8" fill="#FFFCF8"/>
        </g>`,
      )
    case "u35":
      return svg(
        id,
        `${shade(id, "#E7F6F2", "#6E9C94", "#2A4E46")}${shadow}<g class="body">
          <path class="cape" d="M18 24 L6 46 L20 40 Z" fill="#3E6B62" stroke="#24312C" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M16 26 L10 42 L18 38 Z" fill="#8FB3A6"/>
          <g class="leg leg-a"><rect x="28" y="46" width="7" height="12" rx="3.5" fill="#D09A74" stroke="#24312C" stroke-width="1.5"/></g>
          <g class="leg leg-b"><rect x="40" y="46" width="7" height="12" rx="3.5" fill="#8C5340" stroke="#24312C" stroke-width="1.5"/></g>
          <polygon points="46,12 58,44 26,44" fill="url(#g-${id})" stroke="#24312C" stroke-width="1.5" stroke-linejoin="round"/>
          <polygon points="46,18 52,40 36,40" fill="#C9E4DC" opacity="0.55"/>
          <ellipse class="eye" cx="42" cy="28" rx="1.8" ry="2.2" fill="#24312C"/>
          <ellipse class="eye" cx="50" cy="26" rx="1.8" ry="2.2" fill="#24312C"/>
          <circle cx="50.6" cy="25.4" r="0.6" fill="#FFFCF8"/>
          <path d="M40 36 L48 34" fill="none" stroke="#24312C" stroke-width="1.5" stroke-linecap="round"/>
        </g>`,
      )
    case "r55":
      return svg(
        id,
        `${shade(id, "#FFF6DE", "#E0B15A", "#8C6420")}${shadow}<g class="body">${legs("#E8C98A", "#8C6420")}${arms("#F3D48A", "#A67C32", 34)}
          <polygon class="crown" points="20,20 25,8 32,16 39,6 44,20" fill="url(#g-${id})" stroke="#24312C" stroke-width="1.5" stroke-linejoin="round"/>
          <polygon points="26,16 32,12 36,16" fill="#FFFCF8" opacity="0.7"/>
          <circle cx="32" cy="34" r="14" fill="#F8E7C2" stroke="#24312C" stroke-width="1.5"/>
          <ellipse cx="32" cy="40" rx="8" ry="5" fill="#C4A15A" opacity="0.45"/>
          <ellipse class="shine" cx="27" cy="28" rx="5" ry="3" fill="url(#s-${id})"/>
          <ellipse class="eye" cx="27" cy="33" rx="2" ry="2.4" fill="#24312C"/>
          <ellipse class="eye" cx="37" cy="33" rx="2" ry="2.4" fill="#24312C"/>
          <path d="M27 40 Q32 44 37 40" fill="none" stroke="#24312C" stroke-width="1.5" stroke-linecap="round"/>
        </g>`,
      )
    case "r46":
      return svg(
        id,
        `${shade(id, "#FFF8E8", "#E7D3A1", "#8C6E3A")}${shadow}<g class="body">${legs("#C4A15A", "#6E5424")}
          <path d="M32 10 L50 20 V36 C50 48 32 58 32 58 C32 58 14 48 14 36 V20 Z" fill="url(#g-${id})" stroke="#24312C" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M32 16 L44 24 V36 C44 44 32 52 32 52 C32 52 20 44 20 36 V24 Z" fill="#F8E7C2" opacity="0.85"/>
          <path d="M32 22 L40 28 V36 C40 42 32 48 32 48 C32 48 24 42 24 36 V28 Z" fill="#C4A15A" opacity="0.55"/>
          <path d="M20 30 H44" fill="none" stroke="#8C6420" stroke-width="3" stroke-linecap="round"/>
          <ellipse class="eye" cx="26" cy="28" rx="1.8" ry="2.1" fill="#24312C"/>
          <ellipse class="eye" cx="38" cy="28" rx="1.8" ry="2.1" fill="#24312C"/>
          <path d="M24 38 H40" fill="none" stroke="#24312C" stroke-width="1.5" stroke-linecap="round"/>
          <rect x="28" y="6" width="8" height="6" rx="1" fill="#E0B15A" stroke="#24312C" stroke-width="1.5"/>
          <rect x="30" y="7" width="3" height="2" fill="#FFFCF8"/>
        </g>`,
      )
    default: {
      const unknown: never = id
      throw new Error(`unknown mark ${unknown}`)
    }
  }
}
