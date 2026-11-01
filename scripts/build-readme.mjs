// Builds README.md and its SVG panels as terminal windows.
// GitHub strips CSS from READMEs, so every styled block is an SVG with its
// font embedded (a Google Fonts subset of just the glyphs used), drawn once
// per theme and swapped with <picture>.
//
// Run from the repo root: node scripts/build-readme.mjs

import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'

const OUT = 'assets/readme'
const SITE = 'https://tuzkituan.dev'
const ACCENT = '#243da6'

/* ---- Content (from the portfolio's src/data) ---- */

const PROFILE = {
  name: 'Tuan Nguyen',
  nickname: 'tuzkituan',
  role: 'Frontend & Mobile Developer',
  location: 'Ho Chi Minh City, Vietnam',
  bio: 'Frontend and mobile developer in Ho Chi Minh City, working in React, TypeScript and Flutter. I ship web apps and Android apps end to end, including METROV, an Android launcher with 50K+ downloads.',
}

const STATS = [
  { value: '5+', label: 'years of experience' },
  { value: '4.8', star: true, label: '1K+ reviews' },
  { value: '50K+', label: 'downloads' },
  { value: '23', label: 'languages' },
  { value: '10', label: 'press features' },
  { value: '6', label: 'apps and libraries' },
]

const PROJECTS = [
  {
    id: 'launcher',
    kicker: 'Launcher',
    name: 'METROV Launcher',
    accent: '#203BA8',
    icon: 'assets/apps/metrov-icon.png',
    tagline: 'A Metro-inspired Android home screen, rebuilt as live tiles.',
    tech: ['Flutter', 'Dart', 'Android'],
    href: `${SITE}/launcher`,
  },
  {
    id: 'dial',
    kicker: 'Dial',
    name: 'METROV Dial',
    accent: '#1579AA',
    tagline: 'A tile-styled phone dialer that feels flat and fast.',
    tech: ['Flutter', 'Dart', 'Android telephony'],
    href: `${SITE}/dial`,
  },
  {
    id: 'navbar',
    kicker: 'Navbar',
    name: 'METROV Navbar',
    accent: '#559614',
    icon: 'assets/apps/navbar-icon.png',
    tagline: 'A Metro-style navigation bar for Android: back, Start, search.',
    tech: ['Flutter', 'Kotlin', 'Android accessibility'],
    href: `${SITE}/navbar`,
  },
  {
    id: 'fimie',
    kicker: 'Photo Editor',
    name: 'FIMIE',
    accent: '#111111',
    icon: 'assets/apps/fimie-icon.png',
    tagline: 'Give your photos the analog film look.',
    tech: ['Flutter', 'Dart', 'Android'],
    href: `${SITE}/fimie`,
  },
  {
    id: 'nightcap',
    kicker: 'Sleep Timer',
    name: 'NightCap',
    accent: '#5C5FF0',
    icon: 'assets/apps/nightcap-icon.png',
    tagline:
      'A minimal, background-resilient sleep timer for Android media playback.',
    tech: ['Flutter', 'Dart', 'Android'],
    href: `${SITE}/nightcap`,
  },
  {
    id: 'zeni-ui',
    kicker: 'ZENI-UI',
    name: 'ZENI-UI',
    accent: '#0B7F75',
    tagline: 'A React + TypeScript component library.',
    tech: ['TypeScript', 'React', 'CSS'],
    href: 'https://github.com/tuzkituan/zeni-ui',
  },
]

const PRESS = [
  ['How-To Geek', 'This launcher turned my Pixel into a Nokia Lumia Windows Phone', 'https://www.howtogeek.com/this-launcher-turned-my-pixel-into-a-nokia-lumia-windows-phone/'],
  ['How-To Geek', 'This Android launcher turned my phone into the Windows 8 foldable Microsoft never made', 'https://www.howtogeek.com/this-android-launcher-turned-my-phone-into-the-windows-8-foldable-microsoft-never-made/'],
  ['Windows Central', 'METROV could be a hit if you loved the look of Windows Phone 8.1', 'https://www.windowscentral.com/hardware/windows-phone/metrov-windows-phone-launcher'],
  ['MakeUseOf', "I've used vanilla Android for a decade and I regret not installing this launcher sooner", 'https://www.makeuseof.com/vanilla-android-decade-i-regret-not-installing-launcher/'],
  ['Yahoo Tech', "The closest I've felt to using a Lumia again", 'https://tech.yahoo.com/apps/articles/closest-ive-felt-using-lumia-131307539.html'],
  ['MakeUseOf', 'These Android apps make my phone feel like a Windows Phone and I am obsessed', 'https://www.makeuseof.com/android-apps-make-phone-feel-like-windows-phone-am-obsessed/'],
  ['XDA Developers', "These 4 Android launchers prove Windows Phone's design never really died", 'https://www.xda-developers.com/these-android-launchers-recreate-windows-phone-design/'],
  ['Pocket-lint', '5 apps I use to transform my Android into a Windows Phone in 2026', 'https://www.pocket-lint.com/best-windows-style-launcher-apps-for-android/'],
  ['Xataka Móvil', 'Me cansé de cómo se ve mi móvil Android. Lo he solucionado viajando doce años atrás', 'https://www.xatakamovil.com/sistemas-operativos/escritorios-movil-se-han-vuelto-aburridos-he-tenido-que-viajar-doce-anos-atras-para-recuperar-pantalla-inicio-util'],
  ['Quantrimang', 'Tại sao nên cài đặt launcher METROV trên Vanilla Android?', 'https://quantrimang.com/cong-nghe/cai-dat-launcher-metrov-tren-vanilla-android-211955'],
]

const CONTACTS = [
  { label: 'GitHub', host: 'github.com', href: 'https://github.com/tuzkituan' },
  { label: 'LinkedIn', host: 'linkedin.com', href: 'https://www.linkedin.com/in/ngoctuanitpy/' },
  { label: 'Email', host: 'tuannguyenitpy@gmail.com', href: 'mailto:tuannguyenitpy@gmail.com' },
  { label: 'Google Play', host: 'play.google.com', href: 'https://play.google.com/store/apps/developer?id=tuzkituan' },
]
const PAYPAL = 'https://www.paypal.me/lewisnguyen2804'

/* ---- Tokens ---- */

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const mix = (a, b, t) => {
  const [x, y] = [hex(a), hex(b)]
  return '#' + x.map((v, i) => Math.round(v * t + y[i] * (1 - t)).toString(16).padStart(2, '0')).join('')
}

const THEMES = {
  dark: {
    page: '#0d1014',
    chrome: '#171a20',
    strong: '#ffffff',
    ink: '#d8dbe0',
    muted: 'rgba(216,219,224,.66)',
    faint: 'rgba(216,219,224,.42)',
    frame: 'rgba(255,255,255,.14)',
    green: '#7ee787',
    blue: '#79c0ff',
    yellow: '#e3b341',
    appInk: (c) => mix(c, '#ffffff', 0.6),
    catRim: 'rgba(255,255,255,.3)',
  },
  light: {
    page: '#fbfbf9',
    chrome: '#ecebe7',
    strong: '#000000',
    ink: '#24292f',
    muted: 'rgba(36,41,47,.68)',
    faint: 'rgba(36,41,47,.46)',
    frame: 'rgba(16,16,20,.18)',
    green: '#1a7f37',
    blue: mix(ACCENT, '#000000', 0.85),
    yellow: '#9a6700',
    appInk: (c) => mix(c, '#000000', 0.78),
    catRim: 'transparent',
  },
}

/* ---- Font ---- */

const FONTS = {
  mono: 'Geist+Mono:wght@400',
  monoBold: 'Geist+Mono:wght@700',
}

const glyphs = Object.fromEntries(Object.keys(FONTS).map((k) => [k, new Set()]))

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Text in one of the fonts: records its glyphs for the subset. */
function t(font, s) {
  for (const ch of s) glyphs[font].add(ch)
  return esc(s)
}

// Geist Mono advances 0.6em.
const monoW = (s, size) => [...s].length * size * 0.6

function wrap(s, size, max) {
  const lines = []
  let line = ''
  for (const word of s.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (line && monoW(next, size) > max) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

async function fontFaces() {
  const faces = {}
  for (const [key, query] of Object.entries(FONTS)) {
    if (!glyphs[key].size) continue
    const text = encodeURIComponent([...glyphs[key]].sort().join(''))
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=${query}&text=${text}`, {
        headers: { 'User-Agent': UA },
      })
    ).text()
    const [, url, format] = css.match(/url\((.+?)\) format\('(\w+)'\)/) ?? []
    if (!url) throw new Error(`No font for ${key}: ${css.slice(0, 200)}`)
    const data = Buffer.from(await (await fetch(url)).arrayBuffer()).toString('base64')
    faces[key] = `@font-face{font-family:tz-${key};src:url(data:font/${format};base64,${data}) format('${format}')}`
  }
  return faces
}

/* ---- Drawing helpers ---- */

const dataUri = (path) => {
  const type = path.endsWith('.png') ? 'png' : 'webp'
  return `data:image/${type};base64,${readFileSync(path).toString('base64')}`
}

/** One line of text. */
const txt = (x, y, s, fill, { size = 15, bold = false, anchor = 'start', extra = '' } = {}) =>
  `<text x="${x}" y="${y}" class="${bold ? 'monoBold' : 'mono'}" font-size="${size}" fill="${fill}" text-anchor="${anchor}"${extra}>${t(bold ? 'monoBold' : 'mono', s)}</text>`

/** One line in several colors: [[text, fill, bold?], ...]. */
const spans = (x, y, parts, size = 15) =>
  `<text x="${x}" y="${y}" font-size="${size}">${parts
    .map(([s, fill, bold]) => `<tspan class="${bold ? 'monoBold' : 'mono'}" fill="${fill}">${t(bold ? 'monoBold' : 'mono', s)}</tspan>`)
    .join('')}</text>`

/** A north-east arrow, drawn so it doesn't depend on a glyph. */
const arrow = (x, y, stroke, s = 9) =>
  `<path d="M${x} ${y} l${s} -${s} M${x + s * 0.3} ${y - s} h${s * 0.7} v${s * 0.7}" fill="none" stroke="${stroke}" stroke-width="1.4"/>`

const STYLE = `
text{white-space:pre}
.mono{font-family:tz-mono,ui-monospace,monospace}
.monoBold{font-family:tz-monoBold,ui-monospace,monospace}
.show{animation:show .01s both}@keyframes show{from{opacity:0}}
.type{transform-box:fill-box;transform-origin:100% 50%;transform:scaleX(0)}@keyframes type{from{transform:scaleX(1)}}
.cursor{animation:blink 1.1s infinite}@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}`

/** An SVG panel, drawn in a w x h box and sized `shown` px wide: a <picture>
    with no width attribute shows it at that size (shrunk to fit if wider). */
function svg(w, h, body, extraStyle = '', shown = w) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="${shown}" height="${(h * shown) / w}" viewBox="0 0 ${w} ${h}">
<style>%%FONTS%%${STYLE}${extraStyle}</style>
${body}
</svg>
`
}

const R = 0 // window corner radius: square, like a tiling window manager

/** A terminal window: the title bar, then the body. */
function win(th, w, h, { bar = 36, title = '', right = '' }, inner) {
  return `
<defs><clipPath id="win"><rect width="${w}" height="${h}" rx="${R}"/></clipPath></defs>
<g clip-path="url(#win)"><rect width="${w}" height="${h}" fill="${th.page}"/><rect width="${w}" height="${bar}" fill="${th.chrome}"/><path d="M0 ${bar - 0.5}H${w}" stroke="${th.frame}"/></g>
${title ? txt(PAD, bar / 2 + 4, title, th.faint, { size: bar > 32 ? 12 : 11 }) : ''}
${right}
${inner}
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${R}" fill="none" stroke="${th.frame}"/>`
}

/** The shell prompt, as spans. */
const prompt = (th, path = '~') => [
  ['tuzkituan@hcmc', th.green, true],
  [':', th.ink],
  [path, th.blue, true],
  ['$ ', th.ink],
]

/** A prompt that appears at `at` seconds and types its command. Returns the
    markup and when the typing ends. */
function command(th, x, y, path, cmd, at, size = 15) {
  const p = prompt(th, path)
  const px = x + monoW(p.map(([s]) => s).join(''), size)
  const dur = +(cmd.length * 0.055).toFixed(2)
  const start = at + 0.3
  const cover = cmd
    ? `<rect x="${px}" y="${y - size}" width="${monoW(cmd, size) + 2}" height="${size * 1.45}" fill="${th.page}" class="type" style="animation:type ${dur}s steps(${cmd.length}) ${start}s both"/>`
    : ''
  return {
    svg: `<g class="show" style="animation-delay:${at}s">${spans(x, y, [...p, [cmd, th.strong]], size)}${cover}</g>`,
    end: start + dur + 0.25,
    x: px + monoW(cmd, size),
  }
}

/** Output that appears at `at` seconds. */
const later = (at, inner) => `<g class="show" style="animation-delay:${at.toFixed(2)}s">${inner}</g>`

/** A block cursor, blinking. */
const cursor = (th, x, y, size = 15) =>
  `<rect class="cursor" x="${x}" y="${y - size * 0.82}" width="${size * 0.6}" height="${size * 1.05}" fill="${th.ink}"/>`

/* ---- The ASCII wordmark ---- */

// figlet's ANSI Shadow font, one word each so they take separate colours.
const ART = {
  TUZKI: [
    '████████╗██╗   ██╗███████╗██╗  ██╗██╗',
    '╚══██╔══╝██║   ██║╚══███╔╝██║ ██╔╝██║',
    '   ██║   ██║   ██║  ███╔╝ █████╔╝ ██║',
    '   ██║   ██║   ██║ ███╔╝  ██╔═██╗ ██║',
    '   ██║   ╚██████╔╝███████╗██║  ██╗██║',
    '   ╚═╝    ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝',
  ],
  TUAN: [
    '████████╗██╗   ██╗ █████╗ ███╗   ██╗',
    '╚══██╔══╝██║   ██║██╔══██╗████╗  ██║',
    '   ██║   ██║   ██║███████║██╔██╗ ██║',
    '   ██║   ██║   ██║██╔══██║██║╚██╗██║',
    '   ██║   ╚██████╔╝██║  ██║██║ ╚████║',
    '   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝',
  ],
}

/** One box-drawing character in a w x h cell at (x, y), as path segments:
    the double lines run at a third and two thirds of the cell. */
function boxChar(ch, x, y, w, h) {
  const [x1, x2, y1, y2] = [x + w * 0.3, x + w * 0.7, y + h * 0.36, y + h * 0.64]
  const [r, b] = [x + w, y + h]
  const seg = {
    '═': [[x, y1, r, y1], [x, y2, r, y2]],
    '║': [[x1, y, x1, b], [x2, y, x2, b]],
    '╗': [[x, y1, x2, y1], [x2, y1, x2, b], [x, y2, x1, y2], [x1, y2, x1, b]],
    '╔': [[x1, y1, r, y1], [x1, y1, x1, b], [x2, y2, r, y2], [x2, y2, x2, b]],
    '╝': [[x2, y, x2, y2], [x, y2, x2, y2], [x1, y, x1, y1], [x, y1, x1, y1]],
    '╚': [[x1, y, x1, y2], [x1, y2, r, y2], [x2, y, x2, y1], [x2, y1, r, y1]],
  }[ch]
  return seg ? seg.map(([a, c, d, e]) => `M${a.toFixed(1)} ${c.toFixed(1)}L${d.toFixed(1)} ${e.toFixed(1)}`).join('') : ''
}

/** The words in ASCII art, each [word, fill], drawn cell by cell: the blocks
    solid, the box-drawing shadow as thin lines. No font has to carry them. */
function ascii(x, y, words, cw, ch) {
  let out = ''
  let ox = x
  for (const [word, fill] of words) {
    let blocks = ''
    let lines = ''
    ART[word].forEach((row, ry) =>
      [...row].forEach((c, rx) => {
        const [cx, cy] = [ox + rx * cw, y + ry * ch]
        if (c === '█') blocks += `M${cx.toFixed(1)} ${cy}h${cw}v${ch}h${-cw}z`
        else lines += boxChar(c, cx, cy, cw, ch)
      }),
    )
    out += `<path d="${blocks}" fill="${fill}" shape-rendering="crispEdges"/><path d="${lines}" fill="none" stroke="${fill}" stroke-opacity=".55" stroke-width="1"/>`
    ox += ([...ART[word][0]].length + 1) * cw
  }
  return out
}

/* ---- Panels ---- */

const W = 1000

/* The cards and contact tiles reflow by window width. A README can't use CSS,
   but a <picture> picks its image by media query, and an image without a width
   attribute shows at its own size. From 1280px up GitHub's profile README is
   846px wide, so the wide images are sized to fit two cards (four tiles) to a
   row exactly; below that the narrow images are oversized, so the README
   shrinks each to its full width, one to a row. */
const WIDE = 1280
const README_W = 846
const FULL = 1000 // a size wider than any narrow README, shrunk to fit
// The left and right inset of every panel. Panels all render at about the
// same scale (a 1000 wide panel at 100%, a 500 card at half), so one value
// lines their content up.
const PAD = 32

/** The site's mascot (portfolio Cat.tsx): tail swaying, blinking now and then. */
function cat(x, y, h, th) {
  const fur = '#15171d'
  const rim = th.catRim
  return `<svg x="${x}" y="${y}" width="${(h * 140) / 170}" height="${h}" viewBox="0 0 140 170" overflow="visible">
<g class="cat-tail"><path d="M96 160 C 128 154, 134 114, 121 94 C 114 83, 123 72, 134 79" fill="none" stroke="${rim}" stroke-width="11" stroke-linecap="round"/><path d="M96 160 C 128 154, 134 114, 121 94 C 114 83, 123 72, 134 79" fill="none" stroke="${fur}" stroke-width="9" stroke-linecap="round"/></g>
<path d="M40 169 C 30 138, 40 100, 58 86 L 82 86 C 100 100, 110 138, 100 169 Z" fill="${fur}" stroke="${rim}"/>
<path d="M60 169 V 140 M80 169 V 140" stroke="#3b4252" stroke-width="1.2" stroke-linecap="round"/>
<path d="M38 52 L 43 8 L 66 34 Z M102 52 L 97 8 L 74 34 Z" fill="${fur}" stroke="${rim}" stroke-linejoin="round"/>
<path d="M45 40 L 47 18 L 58 32 Z M95 40 L 93 18 L 82 32 Z" fill="#56639a"/>
<ellipse cx="70" cy="60" rx="37" ry="31" fill="${fur}" stroke="${rim}"/>
<g class="cat-eyes"><circle cx="55" cy="58" r="11.5" fill="#d6ecea"/><circle cx="85" cy="58" r="11.5" fill="#d6ecea"/><circle cx="55" cy="58" r="4.2" fill="${fur}"/><circle cx="85" cy="58" r="4.2" fill="${fur}"/></g>
<ellipse cx="70" cy="71" rx="2.4" ry="1.6" fill="#4a3036"/>
<path d="M64 76 Q 67 79 70 76 Q 73 79 76 76" fill="none" stroke="#3b4252" stroke-width="1.2" stroke-linecap="round"/>
<path d="M46 70 L 22 66 M46 74 L 23 76 M94 70 L 118 66 M94 74 L 117 76" stroke="#8b93a5" stroke-width=".8" stroke-linecap="round"/>
</svg>`
}

const CAT_STYLE = `
.cat-tail{transform-box:view-box;transform-origin:96px 160px;animation:tail 3.2s ease-in-out infinite alternate}
@keyframes tail{from{transform:rotate(-7deg)}to{transform:rotate(6deg)}}
.cat-eyes{transform-box:fill-box;transform-origin:50% 50%;animation:cat-blink 5s infinite}
@keyframes cat-blink{0%,94%,100%{transform:scaleY(1)}97%{transform:scaleY(.1)}}`

/** Hero: a shell session typing whoami, the bio and the numbers. */
function hero(th) {
  const LH = 26
  let y = 36 + 42
  let at = 0.2
  let body = ''

  // $ whoami
  let c = command(th, PAD, y, '~', 'whoami', at)
  body += c.svg
  at = c.end
  y += 20
  body += later(at, ascii(PAD, y, [['TUZKI', th.strong], ['TUAN', th.blue]], 7, 14))
  y += 14 * 6 + 32
  body += later(
    at,
    spans(PAD, y, [
      [PROFILE.name, th.strong, true],
      [` (${PROFILE.nickname})`, th.faint],
      [` · ${PROFILE.role} · ${PROFILE.location}`, th.muted],
    ]),
  )
  at += 0.5

  // $ cat about.md
  y += LH * 2
  c = command(th, PAD, y, '~', 'cat about.md', at)
  body += c.svg
  at = c.end
  y += LH + 4
  let out = spans(PAD, y, [['# ', th.faint, true], ['Tile-first apps. ', th.strong, true], ['Clean web UIs.', th.blue, true]])
  for (const line of wrap(PROFILE.bio, 15, W - 2 * PAD)) {
    y += LH
    out += txt(PAD, y, line, th.muted)
  }
  body += later(at, out)
  at += 0.5

  // $ stats
  y += LH * 2
  c = command(th, PAD, y, '~', 'stats', at)
  body += c.svg
  at = c.end
  y += LH + 4
  out = STATS.map((s, i) => {
    const x = PAD + (i % 3) * 312
    const sy = y + Math.floor(i / 3) * LH
    return spans(x, sy, [[(s.star ? `${s.value}/5` : s.value).padEnd(6), th.yellow, true], [s.label, th.muted]])
  }).join('')
  body += later(at, out)
  y += LH
  at += 0.5

  // the idle prompt
  y += LH * 2
  c = command(th, PAD, y, '~', '', at)
  body += c.svg + later(at, cursor(th, c.x, y))

  const H = y + 34
  const inner = body + cat(W - PAD - 104 * (140 / 170), H - 112, 104, th)
  return svg(W, H, win(th, W, H, { title: `${PROFILE.nickname}@hcmc: ~ (zsh)` }, inner), CAT_STYLE)
}

/** A plain bordered box, the panel's background inside. */
const box = (th, w, h) =>
  `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" fill="${th.page}" stroke="${th.frame}"/>`

/** A section opener: one command, then the heading, on the page itself. */
function section(th, path, cmd, title) {
  // Static: the page behind is GitHub's, so there's no colour to type over.
  const line = spans(PAD, 30, [...prompt(th, path), [cmd, th.strong]])
  const out = spans(PAD, 84, title.map(([s, hi]) => [s, hi ? th.blue : th.strong, true]), 36)
  return svg(W, 108, line + out)
}

/** A project in the lineup: the icon beside the name and tagline. */
const CW = 500
// Half the gap between the two cards of a row, as a transparent gutter on
// each card's inner side. The images sit with no space between them: a space
// is a fixed few pixels, which on a phone pushes the second card to a new line.
const GUTTER = 13
// The gap below each card, as a gutter: the cards share one line-wrapped paragraph.
const CARD_ROW = 20
const TX = PAD + 76 // the text column, right of the icon
const CH = 120
function card(th, p, i, size) {
  const cut = p.name.lastIndexOf(' ')
  const name =
    cut < 0
      ? [[p.name, th.strong, true]]
      : [[p.name.slice(0, cut + 1), th.strong, true], [p.name.slice(cut + 1), th.appInk(p.accent), true]]
  const IY = (CH - 56) / 2
  const icon = p.icon
    ? `<image href="${dataUri(p.icon)}" x="${PAD}" y="${IY}" width="56" height="56"/>`
    : txt(PAD + 28, IY + 38, p.name[0], '#fff', { size: 28, bold: true, anchor: 'middle' })
  const tag = wrap(p.tagline, 13, CW - TX - PAD)
    .map((line, k) => txt(TX, 70 + k * 20, line, th.muted, { size: 13 }))
    .join('')
  const body = `${box(th, CW, CH)}
<rect x="${PAD}" y="${IY}" width="56" height="56" fill="${p.accent}"/>
${icon}
${spans(TX, 48, name, 20)}
${tag}`
  if (size === 'narrow') return svg(CW, CH + CARD_ROW, body, '', FULL)
  const dx = i % 2 ? GUTTER : 0
  return svg(CW + GUTTER, CH + CARD_ROW, `<g transform="translate(${dx} 0)">${body}</g>`, '', README_W / 2)
}

/** A contact tile: the name, and the host under it. */
const TW = 250
const TH = 96
// The gap between tiles, as gutters: tile i takes i/4 of a gap on its left
// and (3 - i)/4 on its right, so all four stay the same width.
const TILE_GAP = 28
const TILE_ROW = 16
function tile(th, c, i, size) {
  const host = c.host.length > 18 ? 'mail' : c.host
  if (size === 'narrow') {
    // One wide, short tile to a row, so four don't fill a screen.
    const [w, h] = [500, 72]
    const body = `${box(th, w, h)}${txt(PAD, 44, c.label, th.strong, { size: 20, bold: true })}${txt(w - PAD, 43, host, th.faint, { size: 12, anchor: 'end' })}`
    return svg(w, h + TILE_ROW, body, '', FULL)
  }
  const body = `${box(th, TW, TH)}${txt(PAD, 44, c.label, th.strong, { size: 20, bold: true })}${txt(PAD, 68, host, th.faint, { size: 12 })}`
  return svg(TW + (TILE_GAP * 3) / 4, TH, `<g transform="translate(${(TILE_GAP * i) / 4} 0)">${body}</g>`, '', README_W / 4)
}

/** The coffee line at the very bottom. */
function coffee(th) {
  const H = 48
  const cta = 'Buy me one on PayPal'
  const body = `
${spans(PAD, 30, [...prompt(th), ['sudo make coffee', th.strong]])}
${txt(W - PAD - 22, 30, cta, th.blue, { bold: true, size: 14, anchor: 'end' })}
${arrow(W - PAD - 12, 30, th.blue, 8)}`
  return svg(W, H, body)
}

/* ---- Build ---- */

const panels = {}
for (const [mode, th] of Object.entries(THEMES)) {
  panels[`hero-${mode}`] = hero(th)
  panels[`projects-${mode}`] = section(th, '~/projects', 'ls', [['The '], ['lineup', true], ['.']])
  for (const size of ['wide', 'narrow']) {
    PROJECTS.forEach((p, i) => (panels[`card-${p.id}-${size}-${mode}`] = card(th, p, i, size)))
    CONTACTS.forEach((c, i) => (panels[`contact-${i + 1}-${size}-${mode}`] = tile(th, c, i, size)))
  }
  panels[`press-${mode}`] = section(th, '~/press', 'grep -l METROV *', [['As seen '], ['on', true], ['.']])
  panels[`contact-${mode}`] = section(th, '~', 'cat .contacts', [["Let's "], ['talk', true], ['.']])
  panels[`coffee-${mode}`] = coffee(th)
}

const faces = await fontFaces()
// raw.githubusercontent.com caches each file for 5 minutes per edge, and
// GitHub's raw redirect drops query strings, so every panel is written under
// its content hash: a changed panel is a new file at a new URL.
const file = {}
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
for (const [name, body] of Object.entries(panels)) {
  const used = Object.keys(FONTS).filter((k) => body.includes(`class="${k}"`))
  const out = body.replace('%%FONTS%%', used.map((k) => faces[k]).join(''))
  file[name] = `${OUT}/${name}.${createHash('sha1').update(out).digest('hex').slice(0, 8)}.svg`
  writeFileSync(file[name], out)
}
const src = (name) => file[name]

/** A themed image: the dark panel under GitHub's dark theme, light otherwise. */
// One line: a line break inside an inline <a> splits the HTML in Markdown.
const pic = (name, alt, width) =>
  `<picture><source media="(prefers-color-scheme: dark)" srcset="${src(`${name}-dark`)}"><img src="${src(`${name}-light`)}" width="${width}" alt="${esc(alt)}"></picture>`
const link = (href, inner) => `<a href="${href}">${inner}</a>`

/** A card or tile: the wide image two (four) to a row on a wide window, the
    narrow one full width otherwise, each in the viewer's theme. */
const reflow = (name, alt) =>
  `<picture><source media="(min-width: ${WIDE}px) and (prefers-color-scheme: dark)" srcset="${src(`${name}-wide-dark`)}"><source media="(min-width: ${WIDE}px)" srcset="${src(`${name}-wide-light`)}"><source media="(prefers-color-scheme: dark)" srcset="${src(`${name}-narrow-dark`)}"><img src="${src(`${name}-narrow-light`)}" alt="${esc(alt)}"></picture>`

// One paragraph each, with no space between the images, so they wrap by width.
const cards = `<p>${PROJECTS.map((p) => link(p.href, reflow(`card-${p.id}`, `${p.name}: ${p.tagline}`))).join('')}</p>`
const tiles = `<p>${CONTACTS.map((c, i) => link(c.href, reflow(`contact-${i + 1}`, `${c.label}: ${c.host}`))).join('')}</p>`

const readme = `<!-- Generated by scripts/build-readme.mjs. Edit the script, then run: node scripts/build-readme.mjs -->

${link(SITE, pic('hero', `${PROFILE.name} (${PROFILE.nickname}): ${PROFILE.role}, ${PROFILE.location}. Tile-first apps. Clean web UIs.`, '100%'))}

${link(`${SITE}/#projects`, pic('projects', 'Projects: the lineup', '100%'))}

${cards}

${link(`${SITE}/#press`, pic('press', 'Press: as seen on', '100%'))}

${PRESS.map(([outlet, title, href]) => `- **${outlet}** · [${title}](${href})`).join('\n')}

${link(`${SITE}/#contact`, pic('contact', "Contact: let's talk", '100%'))}

${tiles}

${link(PAYPAL, pic('coffee', 'Buy me a coffee on PayPal', '100%'))}
`
writeFileSync('README.md', readme)
console.log(`Wrote README.md and ${Object.keys(panels).length} panels to ${OUT}/`)
