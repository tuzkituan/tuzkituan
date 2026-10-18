// Builds README.md and its SVG panels in the style of tuzkituan.dev.
// GitHub strips CSS from READMEs, so every styled block is an SVG with its
// fonts embedded (Google Fonts subsets of just the glyphs used), drawn once
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

const OUTLETS = [
  'How-To Geek',
  'MakeUseOf',
  'Yahoo Tech',
  'XDA Developers',
  'Pocket-lint',
  'Xataka Móvil',
  'Quantrimang',
  'Windows Central',
]

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

/* ---- Tokens (from the portfolio's src/index.css) ---- */

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const mix = (a, b, t) => {
  const [x, y] = [hex(a), hex(b)]
  return '#' + x.map((v, i) => Math.round(v * t + y[i] * (1 - t)).toString(16).padStart(2, '0')).join('')
}

const THEMES = {
  dark: {
    page: '#121316',
    sunken: '#060607',
    strong: '#ffffff',
    ink: '#f2f1ee',
    muted: 'rgba(242,241,238,.6)',
    faint: 'rgba(242,241,238,.38)',
    line: 'rgba(242,241,238,.15)',
    lineStrong: 'rgba(242,241,238,.4)',
    frame: 'rgba(242,241,238,.24)',
    // The home hero: a near-black band inked in white.
    band: '#050506',
    bandStrong: '#ffffff',
    bandMuted: 'rgba(255,255,255,.78)',
    bandFaint: 'rgba(255,255,255,.55)',
    bandLine: 'rgba(255,255,255,.14)',
    bandCell: 'rgba(255,255,255,.07)',
    accentInk: mix(ACCENT, '#ffffff', 0.35),
    appInk: (c) => mix(c, '#ffffff', 0.6),
    catRim: 'rgba(255,255,255,.3)',
  },
  light: {
    page: '#f2f1ee',
    sunken: '#e9e8e4',
    strong: '#000000',
    ink: '#101014',
    muted: 'rgba(16,16,20,.62)',
    faint: 'rgba(16,16,20,.42)',
    line: 'rgba(16,16,20,.16)',
    lineStrong: 'rgba(16,16,20,.4)',
    frame: 'rgba(16,16,20,.22)',
    band: '#e6e5e1',
    bandStrong: '#000000',
    bandMuted: 'rgba(16,16,20,.62)',
    bandFaint: 'rgba(16,16,20,.42)',
    bandLine: 'rgba(16,16,20,.13)',
    bandCell: 'rgba(36,61,166,.12)',
    accentInk: mix(ACCENT, '#000000', 0.78),
    appInk: (c) => mix(c, '#000000', 0.78),
    catRim: 'transparent',
  },
}

/* ---- Fonts ---- */

// The site's families (portfolio index.html), one instance each.
const FONTS = {
  wide: 'Archivo:wdth,wght@125,700', // wordmark
  display: 'Archivo:wdth,wght@118,620', // headings, numbers
  mono: 'Geist+Mono:wght@500', // labels
  monoBold: 'Geist+Mono:wght@700',
  sans: 'Figtree:wght@400', // body
  serif: 'Instrument+Serif:ital@1', // the italic key words
}
const MONO_LS = 0.15 // letter-spacing of the mono labels, in em

const glyphs = Object.fromEntries(Object.keys(FONTS).map((k) => [k, new Set()]))

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Text in one of the fonts: records its glyphs for the subset. */
function t(font, s) {
  for (const ch of s) glyphs[font].add(ch)
  return esc(s)
}

/** Text width estimates. Geist Mono advances 0.6em; Figtree averages about
    0.5em, so wrapping keeps a margin. */
const monoW = (s, size) => s.length * size * (0.6 + MONO_LS)
const sansW = (s, size) => s.length * size * 0.5

function wrap(s, size, max) {
  const lines = []
  let line = ''
  for (const word of s.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (line && sansW(next, size) > max) {
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

/** A mono label (uppercased like .ed-mono). */
const mono = (x, y, s, fill, { size = 13, anchor = 'start', bold = false } = {}) =>
  `<text x="${x}" y="${y}" class="${bold ? 'monoBold' : 'mono'}" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${t(bold ? 'monoBold' : 'mono', s.toUpperCase())}</text>`

/** The site's north-east arrow, drawn so it doesn't depend on a glyph. */
const arrow = (x, y, stroke, s = 9) =>
  `<path d="M${x} ${y} l${s} -${s} M${x + s * 0.3} ${y - s} h${s * 0.7} v${s * 0.7}" fill="none" stroke="${stroke}" stroke-width="1.4"/>`

/** A heading: display words with the key words in the serif italic. */
function heading(x, y, parts, size, fill) {
  const spans = parts
    .map(([s, italic]) =>
      italic
        ? `<tspan class="serif" font-size="${size * 1.08}">${t('serif', s)}</tspan>`
        : `<tspan class="display">${t('display', s)}</tspan>`,
    )
    .join('')
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" letter-spacing="${-size * 0.03}">${spans}</text>`
}

const STYLE = `
.mono{font-family:tz-mono,ui-monospace,monospace;letter-spacing:${MONO_LS}em}
.monoBold{font-family:tz-monoBold,ui-monospace,monospace;letter-spacing:${MONO_LS}em}
.sans{font-family:tz-sans,system-ui,sans-serif}
.display{font-family:tz-display,system-ui,sans-serif}
.wide{font-family:tz-wide,system-ui,sans-serif}
.serif{font-family:tz-serif,Georgia,serif;letter-spacing:-.01em}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}`

/** The panel's edge, drawn last so it sits over any fill. */
const outline = (w, h, th) =>
  `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" fill="none" stroke="${th.frame}"/>`

function svg(w, h, body, extraStyle = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<style>%%FONTS%%${STYLE}${extraStyle}</style>
${body}
</svg>
`
}

/* ---- Panels ---- */

const W = 1000
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
.cat-eyes{transform-box:fill-box;transform-origin:50% 50%;animation:blink 5s infinite}
@keyframes blink{0%,94%,100%{transform:scaleY(1)}97%{transform:scaleY(.1)}}`

/** Hero: the overview strip, the running grid, the wordmark, the headline
    beside the bio, then the press ticker and the numbers. */
function hero(th) {
  const STRIP = 44
  const BODY = 520
  const TICK = 40
  const top = STRIP + BODY
  const statsTop = top + TICK
  const CELL_H = 92
  const H = statsTop + CELL_H * 2

  // Grid: one cell larger than the band, sliding a cell every 6s.
  const G = 96
  let grid = ''
  for (let x = -G; x <= W + G; x += G) grid += `M${x} ${-G}V${BODY + G}`
  for (let y = -G; y <= BODY + G; y += G) grid += `M${-G} ${y}H${W + G}`
  const cells = [
    [1, 0, 0],
    [7, 1, -6],
    [3, 3, -12],
    [9, 2, -18],
    [5, 4, -3],
    [0, 3, -15],
  ]
    .map(
      ([cx, cy, d]) =>
        `<rect x="${cx * G + 0.5}" y="${cy * G + 0.5}" width="${G - 1}" height="${G - 1}" fill="${th.bandCell}" class="cell" style="animation-delay:${d}s"/>`,
    )
    .join('')

  // Ticker: two identical halves, sliding one half's width.
  const TS = 12
  let half = ''
  let hx = 0
  for (let r = 0; r < 2; r++)
    for (const o of OUTLETS) {
      half += mono(hx + 24, 25, o, th.bandFaint, { size: TS })
      hx += 24 + monoW(o, TS) + 24
      half += `<rect x="${hx - 3}" y="17" width="6" height="6" fill="${th.accentInk}"/>`
    }
  const ticker = `<g class="ticker">${half}<g transform="translate(${hx} 0)">${half}</g></g>`

  const stats = STATS.map((s, i) => {
    const x = (i % 3) * (W / 3)
    const y = statsTop + Math.floor(i / 3) * CELL_H
    const star = s.star
      ? `<path transform="translate(${x + PAD + s.value.length * 23} ${y + 28}) scale(1.6)" d="M10 0l2.9 6.6 7.1.6-5.4 4.7 1.6 7L10 15.3 3.8 19l1.6-7L0 7.2l7.1-.6z" fill="${th.accentInk}"/>`
      : ''
    return `<text x="${x + PAD}" y="${y + 56}" class="display" font-size="40" letter-spacing="-1.4" fill="${th.accentInk}">${t('display', s.value)}</text>${star}${mono(x + PAD, y + 78, s.label, th.faint, { size: 12 })}`
  }).join('')
  const statLines = `<path d="M0 ${statsTop}H${W}M0 ${statsTop + CELL_H}H${W}M${W / 3} ${statsTop}V${H}M${(2 * W) / 3} ${statsTop}V${H}" stroke="${th.frame}"/>`

  const bio = wrap(PROFILE.bio, 16, 380)
    .map((l, i) => `<tspan x="560" dy="${i ? 26 : 0}">${t('sans', l)}</tspan>`)
    .join('')

  const body = `
<rect width="${W}" height="${top + TICK}" fill="${th.band}"/>
<rect y="${statsTop}" width="${W}" height="${H - statsTop}" fill="${th.page}"/>
<text x="${PAD}" y="27" class="mono" font-size="13"><tspan fill="${th.bandFaint}">${t('mono', '01 /')}</tspan><tspan fill="${th.bandStrong}">${t('mono', ' OVERVIEW')}</tspan></text>
${mono(W - PAD, 27, `${PROFILE.role} · ${PROFILE.location}`, th.bandFaint, { size: 12, anchor: 'end' })}
<path d="M0 ${STRIP - 0.5}H${W}" stroke="${th.frame}"/>
<svg y="${STRIP}" width="${W}" height="${BODY}" viewBox="0 0 ${W} ${BODY}">
  <defs><radialGradient id="fade" cx="50%" cy="50%" r="60%"><stop offset="40%" stop-color="#fff"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <mask id="m"><rect width="${W}" height="${BODY}" fill="url(#fade)"/></mask></defs>
  <g mask="url(#m)"><g class="run">${cells}<path d="${grid}" stroke="${th.bandLine}" stroke-opacity=".55"/></g></g>
  ${mono(PAD, 64, `Hi, I'm ${PROFILE.name}`, th.bandFaint)}
  <text x="${PAD}" y="196" class="wide" font-size="122" textLength="${W - 2 * PAD}" lengthAdjust="spacingAndGlyphs" fill="${th.bandStrong}">${t('wide', 'TUZKI')}<tspan fill="${th.accentInk}">${t('wide', 'TUAN')}</tspan></text>
  <path d="M${PAD} 240H${W - PAD}" stroke="${th.bandLine}"/>
  ${heading(PAD, 308, [['Tile-first apps.']], 46, th.bandStrong)}
  ${heading(PAD, 366, [['Clean web UIs.', true]], 46, th.bandStrong)}
  <text y="292" class="sans" font-size="16" fill="${th.bandMuted}">${bio}</text>
  <rect x="560.5" y="430.5" width="190" height="38" fill="none" stroke="${th.bandStrong}"/>
  ${mono(578, 454, 'tuzkituan.dev', th.bandStrong, { size: 12 })}
  ${arrow(728, 454, th.bandStrong, 8)}
  ${cat(866, BODY - 108, 104, th)}
</svg>
<path d="M0 ${top + 0.5}H${W}M0 ${statsTop + 0.5}H${W}" stroke="${th.frame}"/>
<svg y="${top}" width="${W}" height="${TICK}" viewBox="0 0 ${W} ${TICK}">${ticker}</svg>
${statLines}
${stats}
${outline(W, H, th)}`

  const style = `${CAT_STYLE}
.run{animation:run 6s linear infinite}@keyframes run{to{transform:translate(${G}px,${G}px)}}
.cell{opacity:0;animation:cell 24s ease-in-out infinite}@keyframes cell{0%,23%,100%{opacity:0}5%,18%{opacity:1}}
.ticker{animation:tick ${Math.round(hx / 25)}s linear infinite}@keyframes tick{to{transform:translateX(-${hx}px)}}`
  return svg(W, H, body, style)
}

/** A section opener: the numbered strip, then the heading and intro. */
function section(th, index, label, meta, title, intro) {
  const lines = intro ? wrap(intro, 18, 640) : []
  const H = 44 + 60 + 52 + (lines.length ? 24 + lines.length * 28 : 0) + 36
  const introText = lines
    .map((l, i) => `<tspan x="${PAD}" dy="${i ? 28 : 0}">${t('sans', l)}</tspan>`)
    .join('')
  const body = `
<rect width="${W}" height="${H}" fill="${th.page}"/>
<path d="M0 43.5H${W}" stroke="${th.frame}"/>
<text x="${PAD}" y="27" class="mono" font-size="13"><tspan fill="${th.faint}">${t('mono', `${String(index).padStart(2, '0')} /`)}</tspan><tspan fill="${th.strong}">${t('mono', ` ${label.toUpperCase()}`)}</tspan></text>
${mono(W - PAD, 27, meta, th.faint, { size: 12, anchor: 'end' })}
${heading(PAD, 44 + 60 + 40, title, 56, th.strong)}
${lines.length ? `<text y="${44 + 60 + 52 + 34}" class="sans" font-size="18" fill="${th.muted}">${introText}</text>` : ''}
${outline(W, H, th)}`
  return svg(W, H, body)
}

/** A project in the lineup, compact: the numbered accent chip and kicker
    on the strip, then the icon beside the name, tagline and chips. */
const CW = 500
// Half the gap between the two cards of a row: a transparent gutter on each
// card's inner side, since Markdown puts only a space between two images.
const GUTTER = 11
const TX = PAD + 76 // the text column, right of the icon
const CH = 212
function card(th, p, i) {
  const n = String(i + 1).padStart(2, '0')
  const cut = p.name.lastIndexOf(' ')
  const name =
    cut < 0
      ? t('display', p.name)
      : `${t('display', p.name.slice(0, cut + 1))}<tspan fill="${th.appInk(p.accent)}">${t('display', p.name.slice(cut + 1))}</tspan>`
  const icon = p.icon
    ? `<image href="${dataUri(p.icon)}" x="${PAD}" y="64" width="56" height="56"/>`
    : `<text x="${PAD + 28}" y="106" class="wide" font-size="28" fill="#fff" text-anchor="middle">${t('wide', p.name[0])}</text>`
  const lines = wrap(p.tagline, 14, CW - TX - PAD + 30)
  const tag = lines
    .map((l, k) => `<tspan x="${TX}" dy="${k ? 22 : 0}">${t('sans', l)}</tspan>`)
    .join('')
  let tx = TX
  const chipY = CH - 28 - 19 // pinned, so the tags line up across a row
  const chips = p.tech
    .map((s) => {
      const w = monoW(s, 10) + 12
      const out = `<rect x="${tx + 0.5}" y="${chipY + 0.5}" width="${w}" height="19" fill="none" stroke="${th.lineStrong}"/>${mono(tx + 6, chipY + 14, s, th.muted, { size: 10 })}`
      tx += w + 6
      return out
    })
    .join('')
  const body = `
<rect width="${CW}" height="${CH}" fill="${th.page}"/>
<rect x="${PAD}" y="13" width="${monoW(n, 12) + 10}" height="19" fill="${p.accent}"/>
${mono(PAD + 5, 27, n, '#fff', { size: 12, bold: true })}
${mono(CW - PAD - 20, 27, p.kicker, th.faint, { size: 12, anchor: 'end' })}
${arrow(CW - PAD - 9, 28, th.muted, 9)}
<path d="M0 44.5H${CW}" stroke="${th.frame}"/>
<rect x="${PAD}" y="64" width="56" height="56" fill="${p.accent}"/>
${icon}
<text x="${TX}" y="88" class="display" font-size="24" letter-spacing="-.8" fill="${th.strong}">${name}</text>
<text y="114" class="sans" font-size="14" fill="${th.muted}">${tag}</text>
${chips}
${outline(CW, CH, th)}`
  const dx = i % 2 ? GUTTER : 0
  return svg(CW + GUTTER, CH, `<g transform="translate(${dx} 0)">${body}</g>`)
}

/** A contact tile: the numbered host up top, the name large below. */
const TW = 250
const TH = 150
function tile(th, c, i) {
  const host = c.host.length > 18 ? 'email' : c.host
  const body = `
<rect width="${TW}" height="${TH}" fill="${th.page}"/>
${mono(PAD, 32, `${String(i + 1).padStart(2, '0')} · ${host}`, th.faint, { size: 10 })}
${arrow(TW - PAD - 9, 34, th.muted, 9)}
<text x="${PAD}" y="${TH - 28}" class="display" font-size="24" letter-spacing="-1" fill="${th.strong}">${t('display', c.label)}</text>
${outline(TW, TH, th)}`
  return svg(TW, TH, body)
}

/** The coffee strip at the very bottom. */
function coffee(th) {
  const H = 72
  const cta = 'Buy me one on PayPal'
  const body = `
<rect width="${W}" height="${H}" fill="${th.band}"/>
${mono(PAD, 41, 'Fueled by coffee · it keeps the apps shipping', th.bandFaint, { size: 12 })}
${mono(W - PAD - 22, 41, cta, th.bandStrong, { size: 12, anchor: 'end' })}
${arrow(W - PAD - 12, 41, th.bandStrong, 8)}
${outline(W, H, th)}`
  return svg(W, H, body)
}

/* ---- Build ---- */

const panels = {}
for (const [mode, th] of Object.entries(THEMES)) {
  panels[`hero-${mode}`] = hero(th)
  panels[`projects-${mode}`] = section(
    th,
    2,
    'Projects',
    'Pick one to explore',
    [['The '], ['lineup', true], ['.']],
    'Android apps in the Metro style, a React component library, and the work around them.',
  )
  PROJECTS.forEach((p, i) => (panels[`card-${p.id}-${mode}`] = card(th, p, i)))
  panels[`press-${mode}`] = section(th, 3, 'Press', `${PRESS.length} articles`, [['As seen '], ['on', true], ['.']])
  panels[`contact-${mode}`] = section(th, 4, 'Contact', 'Email, GitHub, LinkedIn', [["Let's "], ['talk', true], ['.']])
  CONTACTS.forEach((c, i) => (panels[`contact-${i + 1}-${mode}`] = tile(th, c, i)))
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

const rows = []
for (let i = 0; i < PROJECTS.length; i += 2)
  rows.push(
    `<p>\n${PROJECTS.slice(i, i + 2)
      .map((p) => link(p.href, pic(`card-${p.id}`, `${p.name}: ${p.tagline}`, '49.7%')))
      .join('\n')}\n</p>`,
  )

const readme = `<!-- Generated by scripts/build-readme.mjs. Edit the script, then run: node scripts/build-readme.mjs -->

${link(SITE, pic('hero', `${PROFILE.name} (${PROFILE.nickname}): ${PROFILE.role}, ${PROFILE.location}. Tile-first apps. Clean web UIs.`, '100%'))}

${link(`${SITE}/#projects`, pic('projects', 'Projects: the lineup', '100%'))}

${rows.join('\n\n')}

${link(`${SITE}/#press`, pic('press', 'Press: as seen on', '100%'))}

${PRESS.map(([outlet, title, href]) => `- **${outlet}** · [${title}](${href})`).join('\n')}

${link(`${SITE}/#contact`, pic('contact', "Contact: let's talk", '100%'))}

<p>
${CONTACTS.map((c, i) => link(c.href, pic(`contact-${i + 1}`, `${c.label}: ${c.host}`, '24.6%'))).join('\n')}
</p>

${link(PAYPAL, pic('coffee', 'Buy me a coffee on PayPal', '100%'))}
`
writeFileSync('README.md', readme)
console.log(`Wrote README.md and ${Object.keys(panels).length} panels to ${OUT}/`)
