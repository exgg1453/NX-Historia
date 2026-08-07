const WIDTH = 60;
const HEIGHT = 40;

function rect(x, y, width, height, fill) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"/>`;
}

function field(color) {
  return rect(0, 0, WIDTH, HEIGHT, color);
}

function hbands(colors) {
  const size = HEIGHT / colors.length;
  return colors.map((color, index) => rect(0, index * size, WIDTH, size + 0.05, color)).join("");
}

function vbands(colors) {
  const size = WIDTH / colors.length;
  return colors.map((color, index) => rect(index * size, 0, size + 0.05, HEIGHT, color)).join("");
}

function stripes(count, colors) {
  const size = HEIGHT / count;
  let output = "";
  for (let index = 0; index < count; index += 1) {
    output += rect(0, index * size, WIDTH, size + 0.05, colors[index % colors.length]);
  }
  return output;
}

function disc(cx, cy, r, fill) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
}

function ring(cx, cy, r, stroke, width) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${stroke}" stroke-width="${width}"/>`;
}

function crescent(cx, cy, r, fill, cover, shift) {
  return disc(cx, cy, r, fill) + disc(cx + shift, cy, r * 0.82, cover);
}

function star(cx, cy, r, fill, points = 5, rotation = -90) {
  const inner = points === 5 ? r * 0.382 : r * 0.5;
  const coordinates = [];
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? r : inner;
    const angle = ((rotation + (index * 180) / points) * Math.PI) / 180;
    coordinates.push(`${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`);
  }
  return `<polygon points="${coordinates.join(" ")}" fill="${fill}"/>`;
}

function poly(points, fill) {
  return `<polygon points="${points}" fill="${fill}"/>`;
}

function cross(fill, thickness, cx = WIDTH / 2, cy = HEIGHT / 2) {
  return rect(0, cy - thickness / 2, WIDTH, thickness, fill) + rect(cx - thickness / 2, 0, thickness, HEIGHT, fill);
}

function saltire(fill, thickness) {
  const bar = (angle) =>
    `<rect x="-8" y="${HEIGHT / 2 - thickness / 2}" width="${WIDTH + 16}" height="${thickness}" fill="${fill}" transform="rotate(${angle} ${WIDTH / 2} ${HEIGHT / 2})"/>`;
  return bar(33.69) + bar(-33.69);
}

let clipCounter = 0;

function nextClipId() {
  clipCounter += 1;
  return `nxFlagClip${clipCounter}`;
}

function clipped(content, clipId) {
  return `<g clip-path="url(#${clipId})">${content}</g>`;
}

function fleur(cx, cy, scale, fill) {
  return `<g transform="translate(${cx} ${cy}) scale(${scale})" fill="${fill}"><path d="M0 -7 C-2.4 -2.6 -4.6 -0.6 -4.6 1.8 C-4.6 3.8 -2.6 4.8 -0.9 3.1 L-0.9 5.2 L0.9 5.2 L0.9 3.1 C2.6 4.8 4.6 3.8 4.6 1.8 C4.6 -0.6 2.4 -2.6 0 -7 Z"/><rect x="-4.2" y="5.4" width="8.4" height="1.7"/></g>`;
}

function lion(cx, cy, scale, fill, winged = false) {
  const wing = winged
    ? '<path d="M-3 -2 C-7.4 -5.6 -8.6 -10.4 -6.2 -12.4 C-3.6 -10.4 -0.6 -6.6 0.4 -2.6 Z"/>'
    : "";
  return `<g transform="translate(${cx} ${cy}) scale(${scale})" fill="${fill}"><rect x="-7" y="-2" width="12" height="6" rx="2.5"/><circle cx="5.5" cy="-2.5" r="3.8"/><path d="M8 -3.4 L11.5 -2.4 L11.5 -0.6 L8 0.2 Z"/><path d="M3.6 -6 L5.4 -6.9 L5.2 -5 Z"/><rect x="-6" y="3" width="2.2" height="5"/><rect x="-2.6" y="3" width="2.2" height="5"/><rect x="1.4" y="3" width="2.2" height="5"/><rect x="4" y="3" width="2.2" height="5"/><path d="M-7 -1 C-11 -2 -11 -6 -8 -6.6 L-8 -4.8 C-9.6 -4.4 -9.4 -2.6 -7 -2.4 Z"/>${wing}</g>`;
}

function castle(cx, cy, scale, fill) {
  return `<g transform="translate(${cx} ${cy}) scale(${scale})" fill="${fill}"><rect x="-6" y="-2" width="12" height="8"/><rect x="-6" y="-6" width="3" height="4"/><rect x="-1.5" y="-7" width="3" height="5"/><rect x="3" y="-6" width="3" height="4"/></g>`;
}

function shield(cx, cy, width, height, fill, stroke) {
  const half = width / 2;
  return `<path d="M${cx - half} ${cy - height / 2} L${cx + half} ${cy - height / 2} L${cx + half} ${cy + height / 6} Q${cx + half} ${cy + height / 2} ${cx} ${cy + height / 2} Q${cx - half} ${cy + height / 2} ${cx - half} ${cy + height / 6} Z" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="0.5"` : ""}/>`;
}

function crown(cx, cy, width, fill) {
  const half = width / 2;
  return `<path d="M${cx - half} ${cy} L${cx - half} ${cy - 2} L${cx - half / 2} ${cy - 0.6} L${cx} ${cy - 3} L${cx + half / 2} ${cy - 0.6} L${cx + half} ${cy - 2} L${cx + half} ${cy} Z" fill="${fill}"/>`;
}

function eagle(cx, cy, scale, fill) {
  return `<g transform="translate(${cx} ${cy}) scale(${scale})" fill="${fill}"><circle cx="0" cy="-5.4" r="1.7"/><path d="M1.4 -4.6 L2.6 -6 L4 -4.8 Z"/><path d="M0 -3.6 L9.5 -5 L4.4 0.6 L0 1.8 Z"/><path d="M0 -3.6 L-9.5 -5 L-4.4 0.6 L0 1.8 Z"/><path d="M-2.4 1.4 L2.4 1.4 L0 6.4 Z"/></g>`;
}

function hammerAndSickle(cx, cy, scale, fill) {
  return `<g transform="translate(${cx} ${cy}) scale(${scale})" fill="${fill}"><path d="M-8.6 4.6 A9 9 0 0 1 4.4 -7.4 L5.6 -5.2 A6.4 6.4 0 0 0 -6.2 3.4 Z"/><path d="M-9.6 3.2 L-6 5.2 L-7.6 8 L-11.2 6 Z"/><path d="M-6.4 7.2 L-4.4 4.8 L6 -3.8 L8 -1.4 Z"/><path d="M4.2 -6.6 L9.6 -2.2 L7.4 0.6 L2 -3.8 Z"/></g>`;
}

function trigram(x, y, angle) {
  return `<g transform="rotate(${angle} 30 20)" fill="#0B0B0B"><rect x="${x}" y="${y}" width="9" height="1.6"/><rect x="${x}" y="${y + 2.6}" width="9" height="1.6"/><rect x="${x}" y="${y + 5.2}" width="9" height="1.6"/></g>`;
}

function taegeuk() {
  return `<g transform="rotate(-33 30 20)"><path d="M22 20 A8 8 0 0 1 38 20 Z" fill="#CD2E3A"/><path d="M22 20 A8 8 0 0 0 38 20 Z" fill="#0047A0"/><circle cx="26" cy="20" r="4" fill="#CD2E3A"/><circle cx="34" cy="20" r="4" fill="#0047A0"/></g>`;
}

const FLAGS = {
  tr: () => field("#E30A17") + crescent(23, 20, 9, "#FFFFFF", "#E30A17", 3) + star(35, 20, 4.4, "#FFFFFF", 5, -18),
  "ottoman-early": () =>
    field("#B01B1B") + crescent(25, 20, 10.5, "#FFFFFF", "#B01B1B", 3.6) + star(39, 20, 5.2, "#E8B923", 8, -90),
  ottoman: () => field("#C8102E") + crescent(24, 20, 9.5, "#FFFFFF", "#C8102E", 3.2) + star(37, 20, 4.2, "#FFFFFF", 5, -18),
  "de-imperial": () => hbands(["#101010", "#FFFFFF", "#C8102E"]),
  de: () => hbands(["#101010", "#DD0000", "#FFCE00"]),
  gb: (clipId) =>
    field("#012169") +
    clipped(saltire("#FFFFFF", 9) + saltire("#C8102E", 4), clipId) +
    cross("#FFFFFF", 12) +
    cross("#C8102E", 6),
  fr: () => vbands(["#0055A4", "#FFFFFF", "#EF4135"]),
  "fr-royal": () =>
    field("#2B4B9B") + fleur(20, 12, 1, "#F2C230") + fleur(40, 12, 1, "#F2C230") + fleur(30, 28, 1, "#F2C230"),
  ussr: () => field("#CC0000") + star(15, 7, 4.2, "#F5C518") + hammerAndSickle(15, 20, 1.0, "#F5C518"),
  ru: () => hbands(["#FFFFFF", "#0039A6", "#D52B1E"]),
  muscovy: () =>
    field("#A82231") +
    rect(28.6, 7, 2.8, 26, "#E3C05B") +
    rect(23, 12, 14, 2.4, "#E3C05B") +
    rect(20, 18, 20, 2.8, "#E3C05B") +
    poly("23,28 37,25 37,27.4 23,30.4", "#E3C05B"),
  it: () => vbands(["#009246", "#FFFFFF", "#CE2B37"]),
  venice: () =>
    field("#9E1B1B") +
    `<rect x="1.6" y="1.6" width="${WIDTH - 3.2}" height="${HEIGHT - 3.2}" fill="none" stroke="#E3B23C" stroke-width="2.4"/>` +
    lion(29, 22, 1.5, "#E3B23C", true),
  byzantium: () =>
    field("#E8B923") +
    cross("#B22222", 7) +
    `<g font-family="Georgia, serif" font-size="10" font-weight="700" fill="#B22222" text-anchor="middle"><text x="14" y="14">B</text><text x="46" y="14">B</text><text x="14" y="34">B</text><text x="46" y="34">B</text></g>`,
  "hu-arpad": () => stripes(8, ["#C8102E", "#FFFFFF"]),
  mamluk: () => field("#E0A81C") + crescent(30, 20, 10, "#FFFFFF", "#E0A81C", 3.4),
  akkoyunlu: () => field("#1D6F6A") + crescent(24, 20, 9, "#FFFFFF", "#1D6F6A", 3) + disc(38, 20, 3.4, "#FFFFFF"),
  pl: () => hbands(["#FFFFFF", "#DC143C"]),
  castile: () =>
    rect(0, 0, 30, 20, "#B01B2E") +
    rect(30, 0, 30, 20, "#F4F1EC") +
    rect(0, 20, 30, 20, "#F4F1EC") +
    rect(30, 20, 30, 20, "#B01B2E") +
    castle(15, 10, 0.9, "#E3B23C") +
    castle(45, 30, 0.9, "#E3B23C") +
    lion(44, 10, 0.72, "#7B3F8C") +
    lion(14, 30, 0.72, "#7B3F8C"),
  es: () =>
    rect(0, 0, WIDTH, 10, "#AA151B") +
    rect(0, 10, WIDTH, 20, "#F1BF00") +
    rect(0, 30, WIDTH, 10, "#AA151B") +
    rect(14.6, 12.6, 2, 14.8, "#AA151B") +
    rect(25.4, 12.6, 2, 14.8, "#AA151B") +
    shield(21, 20.4, 9, 12.4, "#F1BF00", "#5B3A1E") +
    rect(16.5, 14.2, 4.5, 6.2, "#AA151B") +
    rect(21, 20.4, 4.5, 5.6, "#AA151B") +
    crown(21, 14.2, 6, "#C8A02E"),
  us: () => {
    let output = stripes(13, ["#B22234", "#FFFFFF"]);
    output += rect(0, 0, 24, 21.5, "#3C3B6E");
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 5; column += 1) {
        output += star(3.5 + column * 4.4, 3.5 + row * 4.9, 1.7, "#FFFFFF");
      }
    }
    return output;
  },
  jp: () => field("#FFFFFF") + disc(30, 20, 11, "#BC002D"),
  cn: () =>
    field("#DE2910") +
    star(13, 12, 5.4, "#FFDE00") +
    star(24, 5, 2.1, "#FFDE00") +
    star(28.5, 10, 2.1, "#FFDE00") +
    star(28.5, 16, 2.1, "#FFDE00") +
    star(24, 21, 2.1, "#FFDE00"),
  "cn-roc": () =>
    field("#FE0000") + rect(0, 0, 30, 20, "#000095") + star(15, 10, 7, "#FFFFFF", 12, -90) + disc(15, 10, 2.6, "#FFFFFF"),
  kr: () =>
    field("#FFFFFF") +
    taegeuk() +
    trigram(6, 5, 0) +
    trigram(45, 5, 0) +
    trigram(6, 29, 0) +
    trigram(45, 29, 0),
  kp: () =>
    rect(0, 0, WIDTH, 7, "#024FA2") +
    rect(0, 7, WIDTH, 2.5, "#FFFFFF") +
    rect(0, 9.5, WIDTH, 21, "#ED1C27") +
    rect(0, 30.5, WIDTH, 2.5, "#FFFFFF") +
    rect(0, 33, WIDTH, 7, "#024FA2") +
    disc(20, 20, 7, "#FFFFFF") +
    star(20, 20, 5.2, "#ED1C27"),
  in: () =>
    hbands(["#FF9933", "#FFFFFF", "#138808"]) +
    ring(30, 20, 5, "#000080", 1.1) +
    `<g stroke="#000080" stroke-width="0.5">${Array.from({ length: 12 })
      .map((value, index) => {
        const angle = (index * 30 * Math.PI) / 180;
        return `<line x1="${(30 + 1 * Math.cos(angle)).toFixed(2)}" y1="${(20 + 1 * Math.sin(angle)).toFixed(2)}" x2="${(30 + 4.6 * Math.cos(angle)).toFixed(2)}" y2="${(20 + 4.6 * Math.sin(angle)).toFixed(2)}"/>`;
      })
      .join("")}</g>`,
  ir: () =>
    hbands(["#239F40", "#FFFFFF", "#DA0000"]) +
    `<g fill="#DA0000"><path d="M30 14.6 C31.4 17.2 31.4 19.4 30 21.4 C28.6 19.4 28.6 17.2 30 14.6 Z"/><path d="M26.4 17.6 C27.8 18.6 28.2 20 27.8 21.4 C26.4 20.6 25.8 19.2 26.4 17.6 Z"/><path d="M33.6 17.6 C34.2 19.2 33.6 20.6 32.2 21.4 C31.8 20 32.2 18.6 33.6 17.6 Z"/><rect x="29.2" y="21" width="1.6" height="3.4"/></g>`,
  il: () =>
    field("#FFFFFF") +
    rect(0, 6, WIDTH, 3.6, "#0038B8") +
    rect(0, 30.4, WIDTH, 3.6, "#0038B8") +
    poly("30,12 36,22.5 24,22.5", "none") +
    `<path d="M30 12 L36 22.5 L24 22.5 Z" fill="none" stroke="#0038B8" stroke-width="1.5"/>` +
    `<path d="M30 28 L24 17.5 L36 17.5 Z" fill="none" stroke="#0038B8" stroke-width="1.5"/>`,
  sa: () =>
    field("#006C35") +
    `<text x="30" y="19.6" fill="#FFFFFF" font-size="7" text-anchor="middle" textLength="42" lengthAdjust="spacingAndGlyphs" font-family="'Noto Naskh Arabic','Amiri','Scheherazade New','Segoe UI','Arial',serif" direction="rtl">لا إله إلا الله محمد رسول الله</text>` +
    `<g fill="#FFFFFF"><path d="M18 27 L42 26.2 L48 28 L42 29.8 L18 28.6 Z"/><rect x="14.6" y="24.4" width="2.4" height="6.8"/><rect x="10.4" y="26.6" width="4.6" height="2.6" rx="1.1"/></g>`,
  br: () =>
    field("#009C3B") +
    poly("30,4 56,20 30,36 4,20", "#FFDF00") +
    disc(30, 20, 9.2, "#002776") +
    `<path d="M21.5 17.5 A11 11 0 0 0 38.5 22.5" fill="none" stroke="#FFFFFF" stroke-width="2.6"/>` +
    star(26, 16, 1, "#FFFFFF") +
    star(33, 24, 1, "#FFFFFF") +
    star(30, 14, 1.1, "#FFFFFF"),
  eg: () => hbands(["#CE1126", "#FFFFFF", "#000000"]) + eagle(30, 20, 0.8, "#C09300"),
  pk: () =>
    field("#01411C") +
    rect(0, 0, 15, HEIGHT, "#FFFFFF") +
    `<g transform="rotate(-40 37 20)">${crescent(37, 20, 8.4, "#FFFFFF", "#01411C", 3.1)}${star(45.6, 20, 3.4, "#FFFFFF", 5, -18)}</g>`,
  ua: () => hbands(["#0057B7", "#FFD700"]),
  gr: () =>
    stripes(9, ["#0D5EAF", "#FFFFFF"]) +
    rect(0, 0, 22.2, 22.2, "#0D5EAF") +
    rect(0, 8.6, 22.2, 5, "#FFFFFF") +
    rect(8.6, 0, 5, 22.2, "#FFFFFF"),
  bg: () => hbands(["#FFFFFF", "#00966E", "#D62612"]),
  rs: () => hbands(["#C6363C", "#0C4076", "#FFFFFF"]),
  "at-hu": () =>
    rect(0, 0, WIDTH, 6.7, "#ED2939") +
    rect(0, 6.7, WIDTH, 6.6, "#FFFFFF") +
    rect(0, 13.3, WIDTH, 6.7, "#ED2939") +
    rect(0, 20, WIDTH, 6.7, "#CE2939") +
    rect(0, 26.7, WIDTH, 6.6, "#FFFFFF") +
    rect(0, 33.3, WIDTH, 6.7, "#477050") +
    shield(19, 20, 9, 12, "#ED2939", "#2A2A2A") +
    rect(14.5, 18, 9, 4, "#FFFFFF") +
    crown(19, 14.4, 6, "#E3C05B") +
    shield(31, 20, 9, 12, "#ED2939", "#2A2A2A") +
    rect(26.5, 14.6, 9, 1.7, "#FFFFFF") +
    rect(26.5, 18, 9, 1.7, "#FFFFFF") +
    `<path d="M26.5 25.4 Q31 21.4 35.5 25.4 L35.5 26 Q31 22.4 26.5 26 Z" fill="#477050"/>` +
    rect(30.4, 20.4, 1.2, 5, "#FFFFFF") +
    rect(28.8, 21.6, 4.4, 1.2, "#FFFFFF") +
    crown(31, 14.4, 6, "#E3C05B"),
};

const FLAG_ALIASES = {
  ottoman: "tr",
};

let fileFlags = {};

export async function loadFlagFiles(url = "data/flags.json") {
  try {
    const response = await fetch(url);
    if (response.ok) {
      const payload = await response.json();
      if (Array.isArray(payload)) {
        fileFlags = {};
        payload.forEach((flagId) => {
          fileFlags[flagId] = `${flagId}.svg`;
        });
      } else {
        fileFlags = payload;
      }
    }
  } catch (error) {
    fileFlags = {};
  }
  return fileFlags;
}

export function hasFlagFile(flagId) {
  return Boolean(fileFlags[flagId]);
}

const FALLBACK = (color) => field(color || "#8a8f86") + rect(0, HEIGHT - 6, WIDTH, 6, "rgba(0,0,0,0.18)");

export function flagMarkup(flagId, fallbackColor, className = "flag") {
  const fileName = flagId ? fileFlags[flagId] || fileFlags[FLAG_ALIASES[flagId]] : null;
  if (fileName) {
    return `<img class="${className}" src="assets/flags/${fileName}" alt="" loading="lazy" decoding="async">`;
  }
  const builder = FLAGS[flagId];
  const clipId = nextClipId();
  const body = builder ? builder(clipId) : FALLBACK(fallbackColor);
  return `<svg class="${className}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-hidden="true" preserveAspectRatio="none"><defs><clipPath id="${clipId}"><rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}"/></clipPath></defs>${body}<rect x="0.4" y="0.4" width="${WIDTH - 0.8}" height="${HEIGHT - 0.8}" fill="none" stroke="rgba(22,35,46,0.35)" stroke-width="0.8"/></svg>`;
}

export function hasFlag(flagId) {
  return Boolean(FLAGS[flagId]);
}
