import {
  THEMES, BODY, NEEDS_NOW, EMOTIONS, DEEP_NEEDS, MODES, SCHEMAS, CATEGORIES, TOOLS, DEFAULT_CARD,
  PROGRAM, MINIMAL, HARD_MORNING, CRISIS_LINES, CRISIS_VERIFIED, CANNABIS_MOTIVES, WITHDRAWAL,
} from './content.js';

/* ═════════════ Almacenamiento local (solo en este dispositivo) ═════════════ */

const KEY = 'baseSegura.v1';
const DEFAULTS = () => ({
  version: 2,
  createdAt: Date.now(),
  settings: { shortcutEnabled: false, shortcutName: 'Sesión hecha', cannabisUnit: 'porciones', lastExport: null, lastWeekly: null },
  ai: { apiKey: '', model: 'claude-opus-5-5', consent: false, about: '', shareCheckin: true, sharePatterns: true, shareSchemas: true },
  sessions: [],  // {date, ts, type: completa|minima|dificil|hoyno, ...}
  diary: [],     // {id, ts, kind: checkin|herramienta|calma|charla|registro|sos, ...}
  chats: [],     // {id, ts, context, messages: [{role, text}], closed, takeaway}
  schemaMarks: {},
  cannabis: { logs: [], plan: null },
  card: null,
  safety: {},
  weekly: [],
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS();
    const d = JSON.parse(raw), base = DEFAULTS();
    const out = { ...base, ...d, settings: { ...base.settings, ...d.settings }, ai: { ...base.ai, ...d.ai }, cannabis: { ...base.cannabis, ...d.cannabis } };
    if (out.card && out.card.reality !== undefined) { // tarjeta de la versión 0.1
      out.card = { feeling: out.card.feeling, pattern: out.card.schema, truth: out.card.reality, action: out.card.behavior };
    }
    out.version = 2;
    return out;
  } catch { return DEFAULTS(); }
}
let db = load();
const save = () => localStorage.setItem(KEY, JSON.stringify(db));

/* ═════════════ Utilidades ═════════════ */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fmtTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fmtDay = (ts) => new Date(ts).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtDT = (ts) => `${fmtDay(ts)} · ${fmtTime(new Date(ts))}`;
const toolById = (id) => TOOLS.find((t) => t.id === id);
const themeName = (id) => THEMES.find((t) => t.id === id)?.name || id;

let timers = [];
const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
const every = (fn, ms) => { const t = setInterval(fn, ms); timers.push(t); return t; };
const clearTimers = () => { timers.forEach((t) => { clearTimeout(t); clearInterval(t); }); timers = []; };

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('Copiado'); }
  catch { toast('No se pudo copiar; mantén presionado el texto para copiarlo.'); }
}

function chips(name, options, selected, { multi = false } = {}) {
  const sel = multi ? (selected || []) : [selected];
  return `<div class="chips" data-chips="${name}" data-multi="${multi}">${options.map((o) => {
    const v = typeof o === 'string' ? o : o.id, l = typeof o === 'string' ? o : o.name;
    return `<button type="button" class="chip" data-value="${esc(v)}" aria-pressed="${sel.includes(v)}">${esc(l)}</button>`;
  }).join('')}</div>`;
}
function bindChips(root, onChange) {
  $$('[data-chips]', root).forEach((group) => {
    if (group.dataset.bound) return; group.dataset.bound = '1';
    group.addEventListener('click', (e) => {
      const b = e.target.closest('.chip'); if (!b) return;
      const multi = group.dataset.multi === 'true';
      if (multi) b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
      else $$('.chip', group).forEach((c) => c.setAttribute('aria-pressed', c === b));
      const vals = $$('.chip[aria-pressed=true]', group).map((c) => c.dataset.value);
      onChange?.(group.dataset.chips, multi ? vals : vals[0]);
    });
  });
}
const chipVal = (root, name) => {
  const g = $(`[data-chips="${name}"]`, root); if (!g) return undefined;
  const v = $$('.chip[aria-pressed=true]', g).map((c) => c.dataset.value);
  return g.dataset.multi === 'true' ? v : v[0];
};
function range(name, value = 5, lo = '0 = nada', hi = '10 = máximo') {
  return `<div class="range-value" id="rv-${name}">${value}</div>
    <input type="range" min="0" max="10" step="1" value="${value}" name="${name}" aria-label="Escala de 0 a 10"
      oninput="document.getElementById('rv-${name}').textContent=this.value">
    <div class="btn-row small muted"><span>${lo}</span><span style="text-align:right">${hi}</span></div>`;
}
const rangeVal = (root, name) => +$(`input[name="${name}"]`, root)?.value;

/* Respiración guiada. pattern: lista de fases {label, ms, cls} */
const PATTERNS = {
  breath: [{ label: 'Inhala…', ms: 4000, cls: 'in' }, { label: 'Exhala despacio…', ms: 6000, cls: 'out' }],
  sigh: [{ label: 'Inhala…', ms: 2500, cls: 'in' }, { label: 'Un poco más…', ms: 1000, cls: 'in' }, { label: 'Suelta todo, largo…', ms: 6500, cls: 'out' }],
};
function breathing(el, seconds, kind = 'breath', onDone) {
  el.innerHTML = `<div class="breath"><div class="circle"><div><div class="b-label">Prepárate</div><div class="small muted b-left"></div></div></div></div>`;
  const c = $('.circle', el), label = $('.b-label', el), left = $('.b-left', el);
  const end = Date.now() + seconds * 1000, phases = PATTERNS[kind] || PATTERNS.breath;
  const tick = () => { const s = Math.max(0, Math.ceil((end - Date.now()) / 1000)); left.textContent = `${Math.floor(s / 60)}:${pad(s % 60)}`; };
  const run = (i) => {
    if (Date.now() >= end && i === 0) { label.textContent = 'Listo'; c.className = 'circle'; onDone?.(); return; }
    const p = phases[i]; c.style.transitionDuration = `${p.ms}ms`; c.className = `circle ${p.cls}`; label.textContent = p.label;
    later(() => run((i + 1) % phases.length), p.ms);
  };
  tick(); every(tick, 500); later(() => run(0), 800);
}
function timer(el, seconds) {
  el.innerHTML = `<div class="card soft center"><div class="range-value" id="tm">${Math.floor(seconds / 60)}:00</div><button class="btn primary" id="tm-go">Empezar</button></div>`;
  $('#tm-go', el).onclick = (e) => {
    e.target.remove(); const end = Date.now() + seconds * 1000;
    const tick = () => { const s = Math.max(0, Math.ceil((end - Date.now()) / 1000)); const t = $('#tm', el); if (t) t.textContent = s ? `${Math.floor(s / 60)}:${pad(s % 60)}` : 'Listo'; };
    tick(); every(tick, 500);
  };
}

/* Gráfica de barras de una sola serie, con lectura al tocar y tabla accesible. */
function barChart(items, { max = 10, target = null, unit = '' } = {}) {
  const W = 340, H = 150, padL = 22, padB = 22, padT = 8;
  const n = items.length, slot = (W - padL) / n, bw = Math.max(6, slot - 4);
  const y = (v) => H - padB - (v / max) * (H - padB - padT);
  const grid = [0, max / 2, max].map((g) => `<line class="grid" x1="${padL}" x2="${W}" y1="${y(g)}" y2="${y(g)}"/><text x="0" y="${y(g) + 4}">${+g.toFixed(1)}</text>`).join('');
  const bars = items.map((it, i) => {
    const x = padL + i * slot + (slot - bw) / 2;
    const h = it.value == null ? 0 : Math.max(0, H - padB - y(it.value));
    const bar = it.value == null || h === 0 ? '' : `<path class="bar" d="M${x},${H - padB} v${-Math.max(0, h - 4)} q0,-4 4,-4 h${bw - 8} q4,0 4,4 v${Math.max(0, h - 4)} z"/>`;
    return `<g data-i="${i}">${bar}<rect x="${padL + i * slot}" y="0" width="${slot}" height="${H}" fill="transparent"/>
      ${i % Math.ceil(n / 7) === 0 ? `<text x="${x + bw / 2}" y="${H - 6}" text-anchor="middle">${esc(it.short)}</text>` : ''}</g>`;
  }).join('');
  const tline = target != null ? `<line class="target" x1="${padL}" x2="${W}" y1="${y(target)}" y2="${y(target)}"/>` : '';
  const id = 'c' + uid();
  setTimeout(() => {
    const svg = document.getElementById(id); if (!svg) return;
    const out = svg.nextElementSibling;
    svg.addEventListener('click', (e) => {
      const g = e.target.closest('g[data-i]'); if (!g) return;
      $$('.bar', svg).forEach((b) => b.classList.remove('sel')); $('.bar', g)?.classList.add('sel');
      const it = items[+g.dataset.i];
      out.textContent = `${it.label}: ${it.value == null ? 'sin registro' : it.value + unit}`;
    });
  });
  return `<svg id="${id}" class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfica de barras">${grid}${tline}${bars}</svg>
    <div class="chart-readout">Toca una barra para ver el valor.</div>
    <details><summary class="small">Ver como tabla</summary><table class="small">${items.map((it) => `<tr><td>${esc(it.label)}</td><td>${it.value == null ? '—' : esc(it.value + unit)}</td></tr>`).join('')}</table></details>`;
}
const hbars = (list) => { const m = Math.max(1, ...list.map(([, v]) => v)); return list.map(([k, v]) => `<div class="hbar"><span>${esc(k)}</span><div class="track"><div class="fill" style="width:${(v / m) * 100}%"></div></div><span>${typeof v === 'number' ? +v.toFixed(1) : v}</span></div>`).join(''); };

/* ═════════════ Lógica ═════════════ */

const sessionToday = () => db.sessions.find((s) => s.date === dayKey());
const practiced = (s) => s.type !== 'hoyno';
const practicedThisMonth = () => { const m = dayKey().slice(0, 7); return new Set(db.sessions.filter((s) => practiced(s) && s.date.startsWith(m)).map((s) => s.date)).size; };
const programIndex = () => db.sessions.filter((s) => s.type === 'completa').length;
const aiReady = () => db.ai.consent && db.ai.apiKey;
const MOODS = [
  { e: '😣', label: 'Desbordado', act: 9 }, { e: '😟', label: 'Inquieto', act: 7 }, { e: '😐', label: 'Regular', act: 5 },
  { e: '🙂', label: 'Bien', act: 3 }, { e: '😌', label: 'En calma', act: 1 },
];
function weekDots() {
  const today = dayKey();
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i - 6), k = dayKey(d);
    const sess = db.sessions.some((s) => s.date === k && practiced(s));
    const any = sess || db.diary.some((e) => dayKey(new Date(e.ts)) === k);
    const wd = d.toLocaleDateString('es-MX', { weekday: 'narrow' }).toUpperCase();
    return `<div class="d ${k === today ? 'today' : ''}"><div class="dot ${sess ? 'on' : any ? 'part' : ''}">${sess ? '✦' : any ? '•' : ''}</div>${wd}</div>`;
  }).join('');
}

function maxIntensityByDay(days) {
  const map = {};
  const add = (k, v) => { if (v == null || isNaN(v)) return; map[k] = Math.max(map[k] ?? 0, +v); };
  db.sessions.forEach((s) => add(s.date, s.intensity));
  db.diary.forEach((e) => { const k = dayKey(new Date(e.ts)); add(k, e.intensity); add(k, e.intensityBefore); add(k, e.activation); });
  return Array.from({ length: days }, (_, i) => {
    const d = addDays(new Date(), i - days + 1), k = dayKey(d);
    return { key: k, label: fmtDay(d), short: String(d.getDate()), value: map[k] ?? null };
  });
}
/* Intensidad de 8 o más en 3 de los últimos 5 días: se ofrece el plan de seguridad. */
const worsening = () => maxIntensityByDay(5).filter((d) => d.value != null && d.value >= 8).length >= 3;
function hardMorning() {
  const since = addDays(new Date(new Date().setHours(0, 0, 0, 0)), -1).getTime();
  const hard = db.diary.some((e) => e.ts >= since && [e.intensity, e.intensityBefore, e.activation].some((v) => (v ?? 0) >= 8));
  const y = db.sessions.find((s) => s.date === dayKey(addDays(new Date(), -1)));
  return hard || (y && (y.intensity ?? 0) >= 8);
}
const weeklyDue = () => db.sessions.filter(practiced).length >= 3 && (!db.settings.lastWeekly || Date.now() - db.settings.lastWeekly > 7 * 864e5);

/* Lo que te funciona: promedio de "¿te ayudó?" por herramienta. */
function toolEffect() {
  const acc = {};
  db.diary.filter((e) => e.kind === 'herramienta' && e.rating != null).forEach((e) => { (acc[e.toolId] ||= []).push(e.rating); });
  return Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, { avg: v.reduce((a, b) => a + b, 0) / v.length, n: v.length }]));
}

/* Recomendación de herramientas según el check-in. */
function recommend({ themes = [], activation = 5, need } = {}, n = 3, { excludeBody = false } = {}) {
  const eff = toolEffect();
  return TOOLS.map((t) => {
    let s = 0;
    s += t.themes.filter((x) => themes.includes(x)).length * 3;
    if (need && t.needs.includes(need)) s += 3;
    if (activation >= 7) s += t.body ? 5 : -2;
    if (activation <= 3 && t.cat === 'entender') s += 1;
    if (t.minAct && activation < t.minAct) s -= 4;
    if (eff[t.id]) s += (eff[t.id].avg - 5) / 2;
    if (excludeBody && t.body) s -= 20;
    return { t, s };
  }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, n).map((x) => x.t);
}

function runStopAlarms() {
  if (!db.settings.shortcutEnabled) return;
  const name = encodeURIComponent(db.settings.shortcutName || 'Sesión hecha');
  setTimeout(() => { window.location.href = `shortcuts://run-shortcut?name=${name}`; }, 700); // sobrevive al cambio de pantalla
}
function saveSession(data) {
  db.sessions = db.sessions.filter((s) => s.date !== dayKey());
  db.sessions.push({ date: dayKey(), ts: Date.now(), ...data });
  save(); runStopAlarms();
}
const getCard = () => db.card || DEFAULT_CARD;

/* Contexto que se envía a la IA (solo resúmenes, nunca el diario completo). */
function aiContext(checkin) {
  const lines = [`Fecha y hora: ${new Date().toLocaleString('es-MX')}`];
  if (db.ai.about.trim()) lines.push(`Lo que la persona quiere que sepas de ella (escrito por ella): ${db.ai.about.trim()}`);
  if (db.ai.shareSchemas) {
    const marked = SCHEMAS.filter((s) => db.schemaMarks[s.id] && db.schemaMarks[s.id] !== 'No').map((s) => `${s.name} (${db.schemaMarks[s.id]})`);
    if (marked.length) lines.push(`Esquemas que siente que le suenan (autoevaluación, no diagnóstico): ${marked.join(', ')}`);
  }
  if (checkin && db.ai.shareCheckin) {
    lines.push(`Check-in de ahora: está pasando: ${checkin.themes.map(themeName).join(', ') || 'no lo sabe'}; activación del cuerpo ${checkin.activation}/10${checkin.body?.length ? ` (${checkin.body.join(', ')})` : ''}; necesita: ${NEEDS_NOW.find((x) => x.id === checkin.need)?.name || 'no lo dijo'}${checkin.note ? `; en sus palabras: "${checkin.note}"` : ''}.`);
  }
  if (db.ai.sharePatterns) {
    const since = Date.now() - 14 * 864e5, th = {};
    db.diary.filter((e) => e.ts >= since && e.themes).forEach((e) => e.themes.forEach((t) => { th[t] = (th[t] || 0) + 1; }));
    const top = Object.entries(th).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${themeName(k)} (${v})`);
    if (top.length) lines.push(`Temas más frecuentes en 14 días: ${top.join(', ')}`);
    const eff = Object.entries(toolEffect()).sort((a, b) => b[1].avg - a[1].avg).slice(0, 4).map(([k, v]) => `${toolById(k)?.title} (${v.avg.toFixed(1)}/10)`);
    if (eff.length) lines.push(`Herramientas que más le han ayudado: ${eff.join(', ')}`);
    const learn = [...db.sessions].reverse().find((s) => s.learning)?.learning;
    if (learn) lines.push(`Último aprendizaje anotado: "${learn}"`);
    lines.push(`Días que practicó este mes: ${practicedThisMonth()}`);
  }
  return lines.join('\n');
}

let aiMod = null;
const loadAI = async () => (aiMod ||= await import('./ai.js'));

/* ═════════════ Router ═════════════ */

const routes = {};
const route = (path, fn) => { routes[path] = fn; };
const params = () => new URLSearchParams(location.hash.split('?')[1] || '');

function render() {
  clearTimers();
  const full = location.hash.replace(/^#/, '') || '/';
  const path = full.split('?')[0];
  const main = $('#view'); main.innerHTML = '';
  if (path.startsWith('/h/')) toolView(main, decodeURIComponent(path.slice(3)));
  else (routes[path] || routes['/'])(main);
  main.classList.remove('enter'); void main.offsetWidth; main.classList.add('enter');
  const tab = path === '/' ? 'inicio' : path.startsWith('/h/') ? 'herramientas' : path.slice(1).split('/')[0];
  $$('.tabbar a').forEach((a) => { if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', render);
const helpLink = `<p class="small"><a href="#/ayuda">¿Piensas en hacerte daño o sientes que no puedes más? Ayuda ahora →</a></p>`;

/* ═════════════ Inicio ═════════════ */
route('/', (el) => {
  const h = new Date().getHours();
  const hello = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  const s = sessionToday();
  const standalone = window.navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  const hasData = db.sessions.length + db.diary.length > 0;
  const exportOld = hasData && (!db.settings.lastExport || Date.now() - db.settings.lastExport > 14 * 864e5);
  el.innerHTML = `
    <div class="greet"><div class="orb" aria-hidden="true">${h < 12 ? '🌅' : h < 19 ? '☀️' : '🌙'}</div>
      <div><p class="eyebrow">${new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p><h1>${hello}</h1></div></div>
    ${worsening() ? `<div class="card sos"><h3>Estos días han sido muy intensos</h3>
      <p>Varios días con intensidad de 8 o más. No tienes que cargarlo solo: revisa tu plan de seguridad y considera hablar con alguien.</p>
      <a class="btn sos" href="#/plan">Abrir mi plan de seguridad</a><a class="btn" href="#/ayuda">Líneas de ayuda</a></div>` : ''}
    <a class="hero" href="#/checkin"><strong>¿Cómo estás ahora?</strong><span>Responde 3 preguntas y te sugiero qué puede ayudarte</span><span class="go">Empezar check-in →</span></a>
    <div class="card"><h3>En una palabra, ¿cómo llegas?</h3>
      <div class="moods">${MOODS.map((m) => `<button type="button" class="mood" data-act="${m.act}" aria-label="${m.label}">${m.e}<small>${m.label}</small></button>`).join('')}</div></div>
    <div class="card ${s ? 'soft' : ''}">
      ${s ? (practiced(s)
        ? `<h3>Sesión de hoy: hecha ✓</h3><p class="muted mt0">${s.type === 'minima' ? 'Versión mínima. Cuenta igual.' : s.type === 'dificil' ? 'Sesión de mañana difícil. Cuenta igual.' : 'Bien hecho por darte este tiempo.'}</p>${s.action ? `<p class="small mt0"><b>Para hoy:</b> ${esc(s.action)}</p>` : ''}`
        : `<h3>Hoy elegiste descansar</h3><p class="muted mt0">Está bien. Mañana es otro día.</p>`)
      : `<h3>Tu sesión de hoy</h3><p class="muted">${hardMorning() ? 'Ayer fue un día intenso: hoy hay una versión corta y amable.' : '10–15 minutos, o 2 si hoy cuesta más.'}</p><a class="btn primary" href="#/sesion">Empezar</a>`}
    </div>
    <a class="sos-hero" href="#/calma"><strong>Necesito calmarme ya</strong><span>Cuerpo, tu tarjeta y un siguiente paso. Funciona sin internet.</span><span class="go">Calma ahora →</span></a>
    <div class="tiles">
      <a class="tile" href="#/charla" style="--c:var(--accent-soft)"><span class="ico">💬</span><b>Charla</b><span class="small">${aiReady() ? 'Habla con el acompañante' : 'Activa el acompañante con IA'}</span></a>
      <a class="tile" href="#/herramientas" style="--c:#DDF0E7"><span class="ico">🧰</span><b>Herramientas</b><span class="small">29 técnicas para calmar y entender</span></a>
      <a class="tile" href="#/diario-nuevo" style="--c:#FDE8D7"><span class="ico">✍️</span><b>Escribir</b><span class="small">Registra lo que pasó</span></a>
      <a class="tile" href="#/patrones" style="--c:#FBE2EA"><span class="ico">📈</span><b>Lo que te funciona</b><span class="small">Tus patrones</span></a>
    </div>
    <div class="card"><h3>Tu semana</h3><p class="small muted mt0">Cada punto es un día en que te diste un momento. Si un día faltas, no se pierde nada.</p>
      <div class="week">${weekDots()}</div></div>
    <div class="stat">
      <div><div class="num">${practicedThisMonth()}</div><div class="lbl">días practicados este mes</div></div>
      <div><div class="num">${db.diary.filter((e) => Date.now() - e.ts < 7 * 864e5).length}</div><div class="lbl">registros esta semana</div></div>
    </div>
    ${weeklyDue() ? `<div class="card" id="weekly"><h3>Chequeo semanal</h3>
      <p>Esta semana, ¿las alarmas y la app se sintieron como <b>apoyo</b> o como <b>exigencia</b>?</p>
      ${range('weekly', 3, '0 = apoyo', '10 = exigencia')}<button class="btn primary" id="save-weekly">Guardar</button></div>` : ''}
    ${!standalone ? `<div class="card warn"><h3>Instálala en tu pantalla de inicio</h3>
      <p class="small mt0">En Safari: toca <b>Compartir</b> → <b>Agregar a la pantalla de inicio</b>. Así funciona sin internet y como una app.</p></div>` : ''}
    ${exportOld ? `<div class="card"><h3>Haz una copia de tus datos</h3><p class="small muted">Todo vive solo en este iPhone. Una copia cifrada te protege si borras la app.</p><a class="btn" href="#/datos">Exportar copia cifrada</a></div>` : ''}
    <p class="small muted center" style="margin-top:24px">Base Segura acompaña tu bienestar emocional; no sustituye la psicoterapia.</p>${helpLink}`;
  $$('.mood', el).forEach((b) => b.addEventListener('click', () => {
    ci = { step: 0, themes: [], activation: +b.dataset.act, body: [], need: null, note: '' };
    location.hash = '#/checkin';
  }));
  $('#save-weekly', el)?.addEventListener('click', () => {
    const score = rangeVal(el, 'weekly');
    db.weekly.push({ ts: Date.now(), score }); db.settings.lastWeekly = Date.now(); save();
    $('#weekly', el).innerHTML = score >= 6
      ? `<h3>Gracias por decirlo</h3><p>Si se siente como exigencia, baja el número de alarmas en Atajos o cámbiales el texto por algo más amable. La constancia también es poder elegir.</p>`
      : `<h3>Gracias</h3><p class="muted">Sigamos así.</p>`;
  });
});

/* ═════════════ Check-in guiado ═════════════ */
let ci = null;
route('/checkin', (el) => {
  if (!ci) ci = { step: 0, themes: [], activation: 5, body: [], need: null, note: '' };
  const bar = `<div class="progress">${[0, 1, 2, 3].map((i) => `<span class="${i <= ci.step ? 'on' : ''}"></span>`).join('')}</div>`;
  const nav = (next = 'Seguir') => `<div class="btn-row"><button class="btn ghost" id="back">Atrás</button><button class="btn primary" id="next">${next}</button></div>`;
  if (ci.step === 0) {
    el.innerHTML = `${bar}<h1>¿Qué está pasando?</h1><p class="muted">Elige todo lo que aplique. No tiene que ser exacto.</p>
      ${chips('themes', THEMES, ci.themes, { multi: true })}
      <label for="note">Si quieres, cuéntalo en una frase</label><textarea id="note" placeholder="Ej.: me fue mal en el trabajo y llegué a casa irritable">${esc(ci.note)}</textarea>${nav()}`;
  } else if (ci.step === 1) {
    el.innerHTML = `${bar}<h1>¿Cómo está tu cuerpo?</h1><p class="muted">¿Qué tan activado o alterado te sientes ahora?</p>
      ${range('act', ci.activation, '0 = en calma', '10 = desbordado')}
      <label>¿Notas algo de esto?</label>${chips('body', BODY, ci.body, { multi: true })}${nav()}`;
  } else if (ci.step === 2) {
    el.innerHTML = `${bar}<h1>¿Qué necesitas ahora?</h1>${chips('need', NEEDS_NOW, ci.need)}${nav('Ver sugerencias')}`;
  } else {
    if (!ci.saved) {
      ci.id = uid();
      db.diary.push({ id: ci.id, ts: Date.now(), kind: 'checkin', themes: ci.themes, activation: ci.activation, body: ci.body, need: ci.need, note: ci.note.trim() });
      save(); ci.saved = true;
    }
    const recs = recommend(ci, 3);
    const body = ci.activation >= 7;
    el.innerHTML = `${bar}<h1>Esto puede ayudarte</h1>
      <div class="card soft"><p class="mt0">${ci.themes.length ? `Hoy: ${esc(ci.themes.map(themeName).join(', ').toLowerCase())}.` : 'No está claro qué pasa, y eso también está bien.'} Activación ${ci.activation}/10.
      ${body ? '<br><b>Tu cuerpo está muy activado: empieza por calmarlo.</b> Con la alarma tan alta cuesta pensar con claridad.' : ''}</p></div>
      ${recs.map((t, i) => `<a class="tool-row ${i === 0 ? 'first' : ''}" data-cat="${t.cat}" href="#/h/${t.id}?ci=${ci.id}"><div><b>${esc(t.title)}</b><div class="small muted">${esc(CATEGORIES[t.cat])} · ${t.mins} min · ${esc(t.from)}</div></div></a>`).join('')}
      <a class="btn primary" href="#/charla?ci=${ci.id}">${aiReady() ? 'Hablar de esto con el acompañante' : 'Hablar de esto con la IA (activar)'}</a>
      <a class="btn" href="#/herramientas">Ver todas las herramientas</a>
      <button class="btn ghost" id="again">Hacer otro check-in</button>${helpLink}`;
    $('#again', el).onclick = () => { ci = null; render(); };
    return;
  }
  bindChips(el);
  const grab = () => {
    if (ci.step === 0) { ci.themes = chipVal(el, 'themes'); ci.note = $('#note', el).value; }
    if (ci.step === 1) { ci.activation = rangeVal(el, 'act'); ci.body = chipVal(el, 'body'); }
    if (ci.step === 2) ci.need = chipVal(el, 'need');
  };
  $('#back', el).onclick = () => { grab(); if (ci.step === 0) { ci = null; location.hash = '#/'; return; } ci.step--; render(); };
  $('#next', el).onclick = () => { grab(); ci.step++; render(); };
});
const checkinById = (id) => db.diary.find((e) => e.id === id && e.kind === 'checkin');

/* ═════════════ Herramientas ═════════════ */
route('/herramientas', (el) => {
  const eff = toolEffect();
  el.innerHTML = `<h1>Herramientas</h1><p class="muted">De la terapia cognitivo-conductual, la terapia de esquemas, DBT, ACT, la compasión y el mindfulness. Después de usarlas, dime si te ayudaron: así la app aprende qué te funciona.</p>
    ${Object.entries(CATEGORIES).map(([c, name]) => `<div class="cat-head"><h2>${esc(name)}</h2></div>${TOOLS.filter((t) => t.cat === c).map((t) => `
      <a class="tool-row" data-cat="${t.cat}" href="#/h/${t.id}"><div><b>${esc(t.title)}</b><div class="small muted">${t.mins} min · ${esc(t.from)}${eff[t.id] ? ` · te ayudó ${eff[t.id].avg.toFixed(1)}/10` : ''}</div></div></a>`).join('')}`).join('')}
    <h2>Para entenderte más</h2><a class="tool-row" data-cat="esquemas" href="#/esquemas"><div><b>Esquemas: patrones que vienen de lejos</b><div class="small muted">Psicoeducación de la terapia de esquemas</div></div></a>`;
});

/* Cuerpo de una herramienta, reutilizable dentro de la sesión. Devuelve una función que lee las respuestas. */
function toolBody(container, t, prev = {}) {
  const parts = [`<p class="muted">${esc(t.why)}</p>`];
  if (t.steps) parts.push(`<ol class="steps">${t.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>`);
  if (t.widget) parts.push('<div id="widget"></div>');
  if (t.modes) parts.push(`<label>¿Qué parte de ti está al mando?</label>${chips('mode', MODES, prev.mode)}<div id="mode-info"></div>`);
  if (t.deepNeeds) parts.push(`<label>¿Qué necesitas?</label>${chips('dneed', DEEP_NEEDS, prev.dneed)}`);
  if (t.schemas) parts.push(`<details><summary>Ver los esquemas frecuentes</summary>${SCHEMAS.map((s) => `<p class="small"><b>${esc(s.name)}:</b> ${esc(s.feel)} <i>${esc(s.thought)}</i></p>`).join('')}</details>`);
  if (t.pauseMsg) parts.push(`<label>¿Cuánto tiempo?</label>${chips('min', ['20', '30', '45', '60'], prev.min || '20')}<div class="card soft"><p class="mt0" id="pmsg"></p></div><button class="btn" id="pcopy">Copiar mensaje</button>`);
  if (t.request) parts.push(`<label for="r1">Cuando pasó…</label><input type="text" id="r1" value="${esc(prev.r1)}" placeholder="cancelaste los planes sin avisar">
    <label for="r2">me sentí…</label><input type="text" id="r2" value="${esc(prev.r2)}" placeholder="frustrado y poco importante">
    <label>Lo que necesito es…</label>${chips('rneed', DEEP_NEEDS, prev.rneed)}
    <label for="r4">¿Podrías…?</label><input type="text" id="r4" value="${esc(prev.r4)}" placeholder="avisarme con tiempo la próxima vez">
    <div class="card soft"><p class="mt0" id="req"></p></div><button class="btn" id="rcopy">Copiar pedido</button>`);
  if (t.draft) parts.push(`<textarea id="draft" style="min-height:180px" placeholder="Esto no se envía. Este espacio no tiene botón de enviar a propósito.">${esc(prev.draft)}</textarea>
    <label><input type="checkbox" id="keep"> Guardar lo que escribí en mi diario</label>`);
  (t.fields || []).forEach((f, i) => parts.push(`<label for="f${i}">${esc(f)}</label><textarea id="f${i}">${esc(prev['f' + i])}</textarea>`));
  container.innerHTML = parts.join('');
  if (t.widget === 'timer') timer($('#widget', container), t.seconds);
  else if (t.widget) breathing($('#widget', container), t.seconds, t.widget);
  const pmsg = () => { const m = +(chipVal(container, 'min') || 20); const until = new Date(Date.now() + m * 60000); const txt = `Necesito ${m} minutos para calmarme. No me voy: vuelvo a las ${fmtTime(until)} para seguir hablando.`; const p = $('#pmsg', container); if (p) p.textContent = txt; return txt; };
  const req = () => { const t2 = `Cuando ${$('#r1', container).value || '…'}, me sentí ${$('#r2', container).value || '…'}. Lo que necesito es ${(chipVal(container, 'rneed') || '…').toLowerCase()}. ¿Podrías ${$('#r4', container).value || '…'}?`; $('#req', container).textContent = t2; return t2; };
  const modeInfo = () => { const m = MODES.find((x) => x.id === chipVal(container, 'mode')); const d = $('#mode-info', container); if (d) d.innerHTML = m ? `<div class="card soft"><p class="small muted mt0">${esc(m.hint)}</p><p class="mt0"><b>Adulto sano:</b> ${esc(m.answer)}</p></div>` : ''; };
  bindChips(container, () => { if (t.pauseMsg) pmsg(); if (t.request) req(); if (t.modes) modeInfo(); });
  if (t.pauseMsg) { pmsg(); $('#pcopy', container).onclick = () => copy(pmsg()); }
  if (t.request) { req(); $$('input[type=text]', container).forEach((i) => i.addEventListener('input', req)); $('#rcopy', container).onclick = () => copy(req()); }
  if (t.modes) modeInfo();
  return () => {
    const a = {};
    (t.fields || []).forEach((_, i) => { const v = $('#f' + i, container)?.value.trim(); if (v) a['f' + i] = v; });
    if (t.modes) a.mode = chipVal(container, 'mode');
    if (t.deepNeeds) a.dneed = chipVal(container, 'dneed');
    if (t.request) Object.assign(a, { r1: $('#r1', container).value, r2: $('#r2', container).value, r4: $('#r4', container).value, rneed: chipVal(container, 'rneed'), request: req() });
    if (t.draft && $('#keep', container).checked) a.draft = $('#draft', container).value;
    return a;
  };
}

function toolView(el, id) {
  const t = toolById(id); if (!t) { location.hash = '#/herramientas'; return; }
  const ciId = params().get('ci');
  el.innerHTML = `<div class="tool-head" data-cat="${t.cat}"><p class="eyebrow">${esc(CATEGORIES[t.cat])} · ${t.mins} min · ${esc(t.from)}</p><h1>${esc(t.title)}</h1></div>
    <div id="tb"></div>
    <div class="card"><label class="mt0">¿Te ayudó? (0 a 10)</label>${range('rating', 5, '0 = nada', '10 = mucho')}
      <button class="btn primary" id="done">Guardar y terminar</button></div>
    <a class="btn" href="#/charla${ciId ? `?ci=${ciId}` : ''}">Hablar de esto con el acompañante</a>${helpLink}`;
  const read = toolBody($('#tb', el), t);
  $('#done', el).onclick = () => {
    const answers = read();
    db.diary.push({ id: uid(), ts: Date.now(), kind: 'herramienta', toolId: t.id, rating: rangeVal(el, 'rating'), answers, checkinId: ciId || undefined, mode: answers.mode, need: answers.dneed || answers.rneed });
    save(); toast('Guardado. Gracias por cuidarte.');
    location.hash = ciId ? '#/checkin' : '#/herramientas';
  };
}

/* ═════════════ Calma ahora (SOS). Sin internet y sin IA. ═════════════ */
let sos = null;
route('/calma', (el) => {
  if (!sos) sos = { step: 0, themes: [], d: {} };
  const N = 4;
  const bar = `<div class="progress">${Array.from({ length: N }, (_, i) => `<span class="${i <= sos.step ? 'on' : ''}"></span>`).join('')}</div>`;
  const nav = (next = 'Seguir') => `<div class="btn-row"><button class="btn ghost" id="back">Atrás</button><button class="btn primary" id="next">${next}</button></div>`;
  const card = getCard();
  if (sos.step === 0) {
    el.innerHTML = `${bar}<p class="eyebrow">Paso 1 de ${N}</p><h1>Primero, el cuerpo</h1>
      <p>No tienes que resolver nada ahora. Solo respira conmigo dos minutos.</p><div id="br"></div>
      <details><summary>Otras opciones rápidas</summary>
        <a class="tool-row" data-cat="cuerpo" href="#/h/agua-fria"><div><b>Agua fría en la cara</b><div class="small muted">Baja la intensidad en segundos</div></div></a>
        <a class="tool-row" data-cat="cuerpo" href="#/h/movimiento"><div><b>Mover el cuerpo 5 minutos</b></div></a>
        <a class="tool-row" data-cat="cuerpo" href="#/h/grounding"><div><b>5-4-3-2-1: volver al presente</b></div></a></details>
      ${nav()}${helpLink}`;
    breathing($('#br', el), 120);
  } else if (sos.step === 1) {
    el.innerHTML = `${bar}<p class="eyebrow">Paso 2 de ${N}</p><h1>¿Qué está pasando?</h1>
      ${chips('themes', THEMES, sos.themes, { multi: true })}
      <label>¿Qué tan intenso es ahora? (0 a 10)</label>${range('before', sos.d.before ?? 7)}${nav()}`;
  } else if (sos.step === 2) {
    el.innerHTML = `${bar}<p class="eyebrow">Paso 3 de ${N}</p><h1>Tu tarjeta</h1>
      <div class="card soft">
        <p class="mt0"><b>Lo que siento:</b> ${esc(card.feeling)}</p>
        <p><b>Lo que me suele pasar:</b> ${esc(card.pattern)}</p>
        <p><b>Lo que sé que es verdad:</b> ${esc(card.truth)}</p>
        <p class="mt0"><b>Lo que voy a hacer:</b> ${esc(card.action)}</p></div>
      ${db.card ? '' : '<p class="small muted">Es una tarjeta de ejemplo. Escribe la tuya en calma desde Más → Mi tarjeta.</p>'}${nav()}`;
  } else {
    const recs = recommend({ themes: sos.themes, activation: 5 }, 3, { excludeBody: true });
    el.innerHTML = `${bar}<p class="eyebrow">Paso 4 de ${N}</p><h1>¿Y ahora?</h1><p class="muted">Elige un solo paso. El resto puede esperar.</p>
      ${recs.map((t) => `<a class="tool-row" data-cat="${t.cat}" href="#/h/${t.id}"><div><b>${esc(t.title)}</b><div class="small muted">${t.mins} min · ${esc(t.from)}</div></div></a>`).join('')}
      <a class="tool-row" data-cat="charla" href="#/charla"><div><b>Hablarlo con el acompañante (IA)</b></div></a>
      <a class="tool-row" data-cat="vinculos" href="#/h/contacto"><div><b>Escribirle a alguien de confianza</b></div></a>
      <label>¿Qué tan intenso es ahora? (0 a 10)</label>${range('after', Math.max(0, (sos.d.before ?? 7) - 2))}
      <button class="btn primary" id="fin">Guardar cómo estoy</button>${helpLink}`;
    $('#fin', el).onclick = () => {
      db.diary.push({ id: uid(), ts: Date.now(), kind: 'calma', themes: sos.themes, intensityBefore: sos.d.before, intensity: rangeVal(el, 'after') });
      save(); sos = null; toast('Guardado. Atravesaste la ola.'); location.hash = '#/';
    };
    bindChips(el); return;
  }
  bindChips(el);
  const grab = () => { if (sos.step === 1) { sos.themes = chipVal(el, 'themes'); sos.d.before = rangeVal(el, 'before'); } };
  $('#back', el).onclick = () => { grab(); if (sos.step === 0) { sos = null; location.hash = '#/'; return; } sos.step--; render(); };
  $('#next', el).onclick = () => { grab(); sos.step++; render(); };
});

/* ═════════════ Charla con el acompañante (IA) ═════════════ */
function renderMarkers(text) {
  let crisis = false;
  let h = esc(text).replace(/\[\[crisis\]\]/g, () => { crisis = true; return ''; });
  h = h.replace(/\[\[herramienta:([a-z0-9-]+)\]\]/g, (_, id) => { const t = toolById(id); return t ? `<a class="inline-tool" href="#/h/${id}">${esc(t.title)}</a>` : ''; });
  h = h.replace(/\[\[plan\]\]/g, '<a class="inline-tool" href="#/plan">Mi plan de seguridad</a>')
    .replace(/\[\[ayuda\]\]/g, '<a class="inline-tool" href="#/ayuda">Líneas de ayuda</a>')
    .replace(/\n/g, '<br>');
  return (crisis ? crisisCard() : '') + h;
}
const crisisCard = () => `<div class="card sos"><p class="mt0"><b>Si estás en peligro, llama ahora.</b></p>
  <a class="btn sos" href="tel:911">911</a><a class="btn sos" href="tel:8009112000">Línea de la Vida · 800 911 2000</a>
  <a class="btn" href="tel:5555335533">Consejo Ciudadano · 55 5533 5533</a></div>`;

let streaming = false;
route('/charla', (el) => {
  if (!aiReady()) {
    el.innerHTML = `<h1>Acompañante con IA</h1>
      <p>Un acompañante que te escucha, te hace preguntas y te sugiere herramientas según lo que vives, con base en psicología (TCC, esquemas, DBT, ACT, compasión).</p>
      <div class="card warn"><p class="mt0 small">Para usarlo necesitas activar una clave de Claude (Anthropic) y aceptar que tus mensajes se envíen a ese servicio. Todo lo demás de la app funciona sin IA.</p></div>
      <a class="btn primary" href="#/ia">Configurar el acompañante</a>`;
    return;
  }
  const ciId = params().get('ci');
  let chat = db.chats.find((c) => !c.closed);
  if (ciId && chat && chat.checkinId !== ciId && chat.messages.length) { chat.closed = true; chat = null; }
  if (!chat) { chat = { id: uid(), ts: Date.now(), checkinId: ciId || undefined, context: aiContext(ciId ? checkinById(ciId) : null), messages: [] }; db.chats.push(chat); save(); }
  const userTurns = chat.messages.filter((m) => m.role === 'user').length;
  el.innerHTML = `<h1>Acompañante</h1>
    <p class="small muted">Soy una IA, no un terapeuta. Puedo ayudarte a pensar, calmarte y elegir herramientas.</p>
    <div id="msgs">${chat.messages.length ? '' : `<div class="bubble ai">Hola. ¿Qué te está pasando? Cuéntamelo como te salga; vamos paso a paso.</div>`}
      ${chat.messages.map((m) => `<div class="bubble ${m.role === 'user' ? 'me' : 'ai'}">${m.role === 'user' ? esc(m.text).replace(/\n/g, '<br>') : renderMarkers(m.text)}</div>`).join('')}</div>
    ${userTurns >= 20 ? '<div class="card soft small">Llevamos un buen rato. ¿Qué te llevas de esta charla? Cerrar aquí y practicar algo también es avanzar.</div>' : ''}
    <div class="composer"><textarea id="inp" placeholder="Escribe aquí…" rows="2">${ciId && !chat.messages.length ? 'Acabo de hacer un check-in y quiero hablar de lo que me pasa.' : ''}</textarea>
      <button class="btn primary" id="send" ${streaming ? 'disabled' : ''}>Enviar</button></div>
    <details class="mt0"><summary class="small">Terminar la charla</summary>
      <label for="take">¿Qué te llevas de esta charla?</label><textarea id="take"></textarea>
      <button class="btn" id="close">Guardar en mi diario y cerrar</button></details>
    <p class="small muted">Lo que escribes aquí se envía a Anthropic para generar la respuesta. <a href="#/ia">Ajustes</a></p>`;
  const msgs = $('#msgs', el);
  setTimeout(() => window.scrollTo(0, document.body.scrollHeight));
  $('#close', el).onclick = () => {
    const take = $('#take', el).value.trim();
    chat.closed = true; chat.takeaway = take;
    if (take || chat.messages.length) db.diary.push({ id: uid(), ts: Date.now(), kind: 'charla', takeaway: take, turns: chat.messages.length });
    save(); toast('Charla guardada'); location.hash = '#/';
  };
  $('#send', el).onclick = async () => {
    const inp = $('#inp', el), text = inp.value.trim(); if (streaming) return; if (!text) { inp.focus(); toast('Escribe algo primero'); return; }
    const { chat: send, looksLikeCrisis, describeError } = await loadAI();
    chat.messages.push({ role: 'user', text }); save(); inp.value = '';
    msgs.insertAdjacentHTML('beforeend', `<div class="bubble me">${esc(text).replace(/\n/g, '<br>')}</div>`);
    if (looksLikeCrisis(text)) msgs.insertAdjacentHTML('beforeend', `<div class="bubble ai">Lo que escribes me importa. Antes de seguir: si estás en peligro o piensas en hacerte daño, no estás solo.${crisisCard()}</div>`);
    const bubble = document.createElement('div'); bubble.className = 'bubble ai'; bubble.innerHTML = '<span class="muted">Pensando…</span>';
    msgs.appendChild(bubble); window.scrollTo(0, document.body.scrollHeight);
    const apiMessages = chat.messages.map((m, i) => i === 0
      ? { role: 'user', content: [{ type: 'text', text: `[Contexto de la app, no lo repitas textualmente]\n${chat.context}` }, { type: 'text', text: m.text }] }
      : { role: m.role, content: m.text });
    streaming = true; $('#send', el).disabled = true;
    try {
      const res = await send({ apiKey: db.ai.apiKey, model: db.ai.model, messages: apiMessages,
        onText: (t) => { bubble.innerHTML = renderMarkers(t); } });
      chat.messages.push({ role: 'assistant', text: res.text }); save();
      bubble.innerHTML = renderMarkers(res.text);
    } catch (e) {
      chat.messages.pop(); save();
      bubble.innerHTML = `<span class="muted">${esc(describeError(e))}</span>`;
    } finally {
      streaming = false; const b = $('#send'); if (b) b.disabled = false;
    }
  };
});

route('/ia', (el) => {
  const a = db.ai;
  el.innerHTML = `<h1>Acompañante con IA</h1>
    <p>Usa Claude, de Anthropic, con instrucciones de psicología y reglas de seguridad escritas para esta app.</p>
    <div class="card warn small"><b>Antes de activarlo:</b>
      <ul><li>Tus mensajes de la charla y un <b>resumen</b> de tu contexto (lo que elijas abajo) se envían a Anthropic para generar las respuestas. Tu diario completo nunca se envía.</li>
      <li>Según la política de su API, Anthropic no entrena con estos datos y los borra en unos 30 días (más tiempo si un sistema de seguridad marca un mensaje).</li>
      <li>Cuesta dinero: se paga por uso en tu cuenta de Anthropic (aprox. unos centavos de dólar por mensaje con Opus; menos con Sonnet).</li>
      <li>Es una IA: puede equivocarse. No es terapia ni atención de crisis.</li></ul></div>
    <h2>1. Tu clave de API</h2>
    <p class="small">En <b>console.anthropic.com</b>: crea una cuenta, agrega saldo en <b>Billing</b> y crea una clave en <b>API Keys</b>. Pégala aquí. Se guarda solo en este iPhone.</p>
    <input type="password" id="key" value="${esc(a.apiKey)}" placeholder="sk-ant-…" autocomplete="off">
    <label for="model">Modelo</label><select id="model"></select>
    <h2>2. Lo que el acompañante sabe de ti</h2>
    <label for="about">Lo que quiero que sepa de mí (opcional)</label>
    <textarea id="about" placeholder="Ej.: trabajo con un miedo al abandono que viene de la infancia; me activo en discusiones; quiero aprender a calmarme.">${esc(a.about)}</textarea>
    <label><input type="checkbox" id="sc" ${a.shareCheckin ? 'checked' : ''}> Compartir mi check-in del momento</label>
    <label><input type="checkbox" id="sp" ${a.sharePatterns ? 'checked' : ''}> Compartir un resumen de mis patrones (temas frecuentes, qué me ayuda)</label>
    <label><input type="checkbox" id="ss" ${a.shareSchemas ? 'checked' : ''}> Compartir los esquemas que marqué</label>
    <h2>3. Consentimiento</h2>
    <label><input type="checkbox" id="ok" ${a.consent ? 'checked' : ''}> Entiendo lo anterior y acepto enviar estos datos a Anthropic</label>
    <button class="btn primary" id="save">Guardar</button><button class="btn" id="test">Probar conexión</button>
    <button class="btn ghost" id="off">Desactivar y borrar la clave</button>`;
  loadAI().then(({ MODELS }) => { $('#model', el).innerHTML = MODELS.map((m) => `<option value="${m.id}" ${m.id === a.model ? 'selected' : ''}>${esc(m.name)}</option>`).join(''); });
  const store = () => Object.assign(a, { apiKey: $('#key', el).value.trim(), model: $('#model', el).value || a.model, about: $('#about', el).value,
    shareCheckin: $('#sc', el).checked, sharePatterns: $('#sp', el).checked, shareSchemas: $('#ss', el).checked, consent: $('#ok', el).checked });
  $('#save', el).onclick = () => { store(); save(); toast(aiReady() ? 'Acompañante activado' : 'Guardado (falta la clave o el consentimiento)'); };
  $('#test', el).onclick = async () => {
    store(); save(); if (!aiReady()) return toast('Falta la clave o el consentimiento');
    const { chat: send, describeError } = await loadAI();
    toast('Probando…');
    try { await send({ apiKey: a.apiKey, model: a.model, messages: [{ role: 'user', content: 'Prueba de conexión: responde solo "Listo".' }] }); toast('Conexión correcta ✓'); }
    catch (e) { toast(describeError(e)); }
  };
  $('#off', el).onclick = () => { if (!confirm('¿Desactivar el acompañante y borrar la clave de este iPhone?')) return; Object.assign(a, { apiKey: '', consent: false }); save(); render(); };
});

/* ═════════════ Sesión matutina ═════════════ */
let flow = null;
route('/sesion', (el) => {
  const done = sessionToday();
  if (done && !flow) {
    el.innerHTML = `<h1>Sesión de hoy</h1>
      <div class="card soft"><h3>${practiced(done) ? 'Ya hiciste tu sesión hoy ✓' : 'Hoy elegiste descansar'}</h3>
      ${done.action ? `<p><b>Acción del día:</b> ${esc(done.action)}</p>` : ''}${done.learning ? `<p class="muted">Aprendizaje: ${esc(done.learning)}</p>` : ''}</div>
      <button class="btn" id="redo">Hacer otra vez (reemplaza la de hoy)</button>
      ${db.settings.shortcutEnabled ? '<button class="btn ghost" id="stop">Apagar alarmas pendientes</button>' : ''}`;
    $('#redo', el).onclick = () => { flow = { kind: null }; render(); };
    $('#stop', el)?.addEventListener('click', runStopAlarms);
    return;
  }
  if (!flow || !flow.kind) return sessionChooser(el);
  if (flow.kind === 'minima') return sessionMinimal(el);
  if (flow.kind === 'dificil') return sessionHard(el);
  return sessionFull(el);
});

function sessionChooser(el) {
  const hard = hardMorning(), idx = programIndex(), p = PROGRAM[idx % PROGRAM.length], round = Math.floor(idx / PROGRAM.length) + 1;
  el.innerHTML = `<h1>Sesión de hoy</h1>
    ${hard ? `<div class="card soft"><h3>${HARD_MORNING.title}</h3><p>${HARD_MORNING.intro}</p><button class="btn primary" data-k="dificil">Sesión corta y amable (3 min)</button></div>` : ''}
    <div class="card">
      <p class="eyebrow">Día ${idx % PROGRAM.length + 1} de ${PROGRAM.length} · ${esc(p.week)}${round > 1 ? ` · vuelta ${round}` : ''}</p>
      <h3>${esc(p.title)}</h3>
      <button class="btn ${hard ? '' : 'primary'}" data-k="completa">Sesión completa (10–15 min)</button>
      ${aiReady() ? '<button class="btn" data-k="ia">Sesión adaptada a mis días (IA)</button>' : ''}
      <button class="btn" data-k="minima">${MINIMAL.title}</button>
      <button class="btn ghost" data-k="hoyno">Hoy no, y está bien</button>
    </div>
    <p class="small muted">Cualquier opción, incluso «hoy no», cuenta como respuesta y apaga las alarmas.</p>`;
  $$('[data-k]', el).forEach((b) => b.onclick = async () => {
    const k = b.dataset.k;
    if (k === 'hoyno') { saveSession({ type: 'hoyno' }); flow = null; toast('Anotado. Descansar también es cuidarte.'); location.hash = '#/'; return; }
    if (k === 'ia') {
      b.disabled = true; b.textContent = 'Preparando tu sesión…';
      const { personalizeSession, describeError } = await loadAI();
      try {
        const o = await personalizeSession({ apiKey: db.ai.apiKey, model: db.ai.model, context: aiContext(null), programDay: p });
        if (!o) throw new Error('vacío');
        flow = { kind: 'completa', step: 0, idx, data: {}, custom: { ...p, title: p.title, question: o.pregunta, tool: o.herramienta, action: o.accion, conexion: o.conexion } };
        render();
      } catch (e) { toast(e.message === 'vacío' ? 'No se pudo adaptar; usa la sesión completa.' : describeError(e)); b.disabled = false; b.textContent = 'Sesión adaptada a mis días (IA)'; }
      return;
    }
    flow = { kind: k, step: 0, idx, data: {} }; render();
  });
}

const closingFields = (prefill = {}) => `<label>¿Qué emoción predomina ahora?</label>${chips('emotion', EMOTIONS, prefill.emotion)}
  <label>Intensidad (0 a 10)</label>${range('intensity', prefill.intensity ?? 5)}`;

function sessionFull(el) {
  const p = flow.custom || PROGRAM[flow.idx % PROGRAM.length], t = toolById(p.tool);
  const last = [...db.sessions].reverse().find((s) => s.learning);
  const steps = 4, d = flow.data;
  const bar = `<div class="progress">${Array.from({ length: steps }, (_, i) => `<span class="${i <= flow.step ? 'on' : ''}"></span>`).join('')}</div>`;
  const head = `<p class="eyebrow">Día ${flow.idx % PROGRAM.length + 1} · ${esc(p.title)}${flow.custom ? ' · adaptada' : ''}</p>${bar}`;
  const nav = (next = 'Seguir') => `<div class="btn-row"><button class="btn ghost" id="back">Atrás</button><button class="btn primary" id="next">${next}</button></div>`;
  let read = null;
  if (flow.step === 0) {
    const conn = p.conexion || (last ? `La última vez anotaste: «${last.learning}»` : '');
    el.innerHTML = `${head}<h1>Conectar</h1>
      ${conn ? `<div class="card soft"><p class="mt0">${esc(conn)}</p></div>` : '<p class="muted">Responde con sinceridad, sin buscar la respuesta perfecta.</p>'}
      <h2>Pregunta de hoy</h2><p>${esc(p.question)}</p><textarea id="answer" placeholder="Escribe lo que surja…">${esc(d.answer)}</textarea>${nav()}`;
  } else if (flow.step === 1) {
    el.innerHTML = `${head}<h1>${esc(t.title)}</h1><div id="tb"></div>
      <p class="small muted">Si aparece angustia intensa, detente, mira a tu alrededor y nombra 5 cosas que ves.</p>${nav()}`;
    read = toolBody($('#tb', el), t, d.tool || {});
  } else if (flow.step === 2) {
    el.innerHTML = `${head}<h1>Acción del día</h1><div class="card soft"><p class="mt0">${esc(p.action)}</p></div>
      <p class="muted small">Pequeña y concreta. No tiene que salir perfecta.</p>${nav()}`;
  } else {
    el.innerHTML = `${head}<h1>Cierre</h1>${closingFields(d)}
      <label for="learning">¿Qué aprendiste o descubriste hoy?</label><textarea id="learning">${esc(d.learning)}</textarea>
      <label>¿Te ayudó la herramienta de hoy? (0 a 10)</label>${range('trate', d.toolRating ?? 5, '0 = nada', '10 = mucho')}
      ${nav('Terminar sesión')}`;
    bindChips(el);
  }
  const grab = () => {
    if ($('#answer', el)) d.answer = $('#answer', el).value;
    if (read) d.tool = read();
    if ($('#learning', el)) { d.learning = $('#learning', el).value; d.emotion = chipVal(el, 'emotion'); d.intensity = rangeVal(el, 'intensity'); d.toolRating = rangeVal(el, 'trate'); }
  };
  $('#back', el).onclick = () => { grab(); if (flow.step === 0) flow = { kind: null }; else flow.step--; render(); };
  $('#next', el).onclick = () => {
    grab();
    if (flow.step < steps - 1) { flow.step++; render(); return; }
    db.diary.push({ id: uid(), ts: Date.now(), kind: 'herramienta', toolId: t.id, rating: d.toolRating, answers: d.tool, fromSession: true });
    saveSession({ type: 'completa', programIndex: flow.idx, title: p.title, action: p.action, answer: d.answer, emotion: d.emotion, intensity: d.intensity, learning: d.learning, adapted: !!flow.custom });
    flow = null; sessionDone(el);
  };
}
function sessionMinimal(el) {
  el.innerHTML = `<p class="eyebrow">${MINIMAL.title}</p><h1>Un minuto para ti</h1><div id="br"></div>
    <div class="card soft"><p class="mt0">${MINIMAL.phrase}</p></div>${closingFields()}
    <button class="btn primary" id="fin">Listo</button><button class="btn ghost" id="back">Atrás</button>`;
  breathing($('#br', el), 60); bindChips(el);
  $('#back', el).onclick = () => { flow = { kind: null }; render(); };
  $('#fin', el).onclick = () => { saveSession({ type: 'minima', action: 'Una respiración consciente cuando lo necesites.', emotion: chipVal(el, 'emotion'), intensity: rangeVal(el, 'intensity') }); flow = null; sessionDone(el); };
}
function sessionHard(el) {
  el.innerHTML = `<p class="eyebrow">${HARD_MORNING.title}</p><h1>Despacio</h1><p>${HARD_MORNING.intro}</p>
    <ol class="steps">${HARD_MORNING.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol><div id="br"></div>
    <label for="gesture">Mi gesto de cuidado de hoy</label><input type="text" id="gesture" placeholder="Ej.: desayunar tranquilo, caminar 10 minutos">
    ${closingFields()}<button class="btn primary" id="fin">Listo</button><button class="btn ghost" id="back">Atrás</button>`;
  breathing($('#br', el), 60); bindChips(el);
  $('#back', el).onclick = () => { flow = { kind: null }; render(); };
  $('#fin', el).onclick = () => { saveSession({ type: 'dificil', action: $('#gesture', el).value || 'Un gesto de cuidado', emotion: chipVal(el, 'emotion'), intensity: rangeVal(el, 'intensity') }); flow = null; sessionDone(el); };
}
function sessionDone(el) {
  const s = sessionToday();
  el.innerHTML = `<h1>Sesión hecha ✓</h1>
    <div class="card soft"><p class="mt0">Te diste este tiempo. Eso es el adulto sano en acción.</p>${s?.action ? `<p class="mt0"><b>Para hoy:</b> ${esc(s.action)}</p>` : ''}</div>
    ${worsening() || (s?.intensity ?? 0) >= 9 ? `<div class="card sos"><p class="mt0">La intensidad está alta. Si lo necesitas, tu plan de seguridad y las líneas de ayuda están aquí.</p><a class="btn sos" href="#/plan">Mi plan de seguridad</a></div>` : ''}
    ${db.settings.shortcutEnabled ? '<p class="small muted">Apagando las alarmas pendientes con Atajos…</p>' : ''}
    <a class="btn primary" href="#/">Volver al inicio</a>`;
}

/* ═════════════ Diario y patrones ═════════════ */
function entryHTML(e) {
  const kinds = { checkin: 'Check-in', herramienta: 'Herramienta', calma: 'Calma ahora', charla: 'Charla con el acompañante', registro: 'Registro', sos: 'Pausa guiada' };
  const lines = [];
  if (e.kind === 'checkin') {
    lines.push(`<b>${esc((e.themes || []).map(themeName).join(', ') || 'Sin tema')}</b>`);
    lines.push(`<div class="small">Activación ${e.activation}/10${e.need ? ' · necesitaba ' + esc(NEEDS_NOW.find((x) => x.id === e.need)?.name.toLowerCase()) : ''}</div>`);
    if (e.note) lines.push(`<div class="small muted">«${esc(e.note)}»</div>`);
  } else if (e.kind === 'herramienta') {
    lines.push(`<b>${esc(toolById(e.toolId)?.title || e.toolId)}</b>${e.rating != null ? ` <span class="small">· te ayudó ${e.rating}/10</span>` : ''}`);
    const a = e.answers || {}; const t = toolById(e.toolId);
    const texts = Object.entries(a).filter(([k, v]) => /^f\d+$/.test(k) && v).map(([k, v]) => `<div class="small"><span class="muted">${esc(t?.fields?.[+k.slice(1)] || '')}</span> ${esc(v)}</div>`);
    if (a.request) texts.push(`<div class="small">Pedido: ${esc(a.request)}</div>`);
    if (a.draft) texts.push(`<details><summary class="small">Lo que escribí</summary><p class="small">${esc(a.draft)}</p></details>`);
    lines.push(...texts);
  } else if (e.kind === 'calma' || e.kind === 'sos') {
    lines.push(`<b>${esc((e.themes || []).map(themeName).join(', ') || e.situation || 'Momento difícil')}</b>`);
    if (e.intensityBefore != null) lines.push(`<div class="small">Intensidad ${e.intensityBefore} → ${e.intensity}</div>`);
    if (e.request) lines.push(`<div class="small">Pedido: ${esc(e.request)}</div>`);
  } else if (e.kind === 'charla') {
    lines.push(`<b>${e.takeaway ? esc(e.takeaway) : 'Charla sin aprendizaje anotado'}</b>`);
  } else {
    lines.push(`<b>${esc(e.situation || '')}</b>`);
    const m = MODES.find((x) => x.id === e.mode);
    lines.push(`<div class="small">${[(e.themes || []).map(themeName).join(', '), m?.name, e.emotion, e.intensity != null ? `intensidad ${e.intensity}` : ''].filter(Boolean).map(esc).join(' · ')}</div>`);
    if (e.need) lines.push(`<div class="small muted">Necesidad: ${esc(e.need)}</div>`);
    if (e.response) lines.push(`<div class="small">Adulto sano: ${esc(e.response)}</div>`);
  }
  return `<div class="entry"><div class="meta">${fmtDT(e.ts)} · ${kinds[e.kind] || ''}</div>${lines.join('')}<button class="btn link small" data-del="${e.id}">Borrar</button></div>`;
}
route('/diario', (el) => {
  const list = [...db.diary].sort((a, b) => b.ts - a.ts);
  el.innerHTML = `<h1>Diario</h1><p class="muted">Todo lo que registras: check-ins, herramientas, momentos de calma y charlas.</p>
    <a class="btn primary" href="#/diario-nuevo">Escribir un registro</a><a class="btn" href="#/patrones">Ver mis patrones</a>
    <div class="card">${list.length ? list.map(entryHTML).join('') : '<p class="muted mt0">Todavía no hay registros.</p>'}</div>`;
  $$('[data-del]', el).forEach((b) => b.onclick = () => { if (!confirm('¿Borrar este registro?')) return; db.diary = db.diary.filter((e) => e.id !== b.dataset.del); save(); render(); });
});
route('/diario-nuevo', (el) => {
  el.innerHTML = `<h1>Nuevo registro</h1>
    <label for="sit">¿Qué pasó? (como lo vería una cámara)</label><textarea id="sit"></textarea>
    <label>¿De qué se trata?</label>${chips('themes', THEMES, [], { multi: true })}
    <label>¿Qué parte de ti apareció?</label>${chips('mode', MODES)}
    <label>Emoción principal</label>${chips('emotion', EMOTIONS)}
    <label>Intensidad (0 a 10)</label>${range('intensity', 5)}
    <label>¿Qué necesitabas?</label>${chips('need', DEEP_NEEDS)}
    <label for="resp">¿Qué respondería o haría tu adulto sano?</label><textarea id="resp"></textarea>
    <button class="btn primary" id="save">Guardar</button><a class="btn ghost" href="#/diario">Cancelar</a>`;
  bindChips(el);
  $('#save', el).onclick = () => {
    db.diary.push({ id: uid(), ts: Date.now(), kind: 'registro', situation: $('#sit', el).value.trim(), themes: chipVal(el, 'themes'), mode: chipVal(el, 'mode'),
      emotion: chipVal(el, 'emotion'), intensity: rangeVal(el, 'intensity'), need: chipVal(el, 'need'), response: $('#resp', el).value.trim() });
    save(); toast('Guardado'); location.hash = worsening() ? '#/' : '#/diario';
  };
});
route('/patrones', (el) => {
  const since = Date.now() - 30 * 864e5, recent = db.diary.filter((e) => e.ts >= since);
  const count = (fn) => { const o = {}; recent.forEach((e) => [].concat(fn(e) || []).forEach((k) => { if (k) o[k] = (o[k] || 0) + 1; })); return Object.entries(o).sort((a, b) => b[1] - a[1]); };
  const themes = count((e) => e.themes).map(([k, v]) => [themeName(k), v]).slice(0, 6);
  const modes = count((e) => e.mode).map(([k, v]) => [MODES.find((m) => m.id === k)?.name || k, v]);
  const eff = Object.entries(toolEffect()).sort((a, b) => b[1].avg - a[1].avg).map(([k, v]) => [`${toolById(k)?.title || k} (${v.n})`, v.avg]);
  const calm = recent.filter((e) => (e.kind === 'calma' || e.kind === 'sos') && e.intensityBefore != null);
  const drop = calm.length ? calm.reduce((a, e) => a + (e.intensityBefore - e.intensity), 0) / calm.length : null;
  el.innerHTML = `<h1>Patrones</h1><p class="muted">Para entenderte, no para juzgarte. El progreso se ve en la intensidad, la duración y cómo respondes.</p>
    <div class="stat"><div><div class="num">${practicedThisMonth()}</div><div class="lbl">días practicados este mes</div></div>
      <div><div class="num">${drop == null ? '—' : (drop > 0 ? '−' : '') + Math.abs(drop).toFixed(1)}</div><div class="lbl">puntos que baja la intensidad al usar «Calma ahora»</div></div></div>
    <h2>Intensidad más alta por día</h2><p class="small muted">Últimos 14 días, de 0 a 10.</p><div class="card">${barChart(maxIntensityByDay(14), { max: 10 })}</div>
    <h2>Lo que te funciona</h2><div class="card">${eff.length ? hbars(eff) + '<p class="small muted">Promedio de «¿te ayudó?», de 0 a 10 (entre paréntesis, cuántas veces).</p>' : '<p class="muted mt0">Usa herramientas y califícalas para ver cuáles te ayudan más.</p>'}</div>
    ${themes.length ? `<h2>Lo que más te pasa (30 días)</h2><div class="card">${hbars(themes)}</div>` : ''}
    ${modes.length ? `<h2>Partes que aparecen</h2><div class="card">${hbars(modes)}</div>` : ''}
    ${db.weekly.length ? `<h2>Chequeo semanal de las alarmas</h2><div class="card">${db.weekly.slice(-6).map((w) => `<div class="entry"><span class="meta">${fmtDay(w.ts)}</span> · ${w.score}/10 ${w.score >= 6 ? '(más exigencia que apoyo)' : '(apoyo)'}</div>`).join('')}</div>` : ''}`;
});

/* ═════════════ Esquemas ═════════════ */
route('/esquemas', (el) => {
  el.innerHTML = `<h1>Esquemas</h1>
    <p>Los esquemas son patrones de emoción y pensamiento que se forman, a menudo en la infancia, cuando una necesidad importante no se cubrió. En la adultez se activan y hacen que reaccionemos con más fuerza de lo que la situación pide.</p>
    <div class="card warn small"><p class="mt0">Esto es una guía para conocerte, no un diagnóstico. El cuestionario oficial (YSQ) se usa con un profesional.</p></div>
    ${SCHEMAS.map((s) => `<div class="card"><h3>${esc(s.name)}</h3><p class="small mt0">${esc(s.feel)}</p><p class="small"><i>${esc(s.thought)}</i></p>
      <p class="small"><b>Adulto sano:</b> ${esc(s.adult)}</p><p class="small muted mt0">¿Te suena?</p>${chips('s-' + s.id, ['Mucho', 'Algo', 'No'], db.schemaMarks[s.id])}</div>`).join('')}`;
  bindChips(el, (name, v) => { db.schemaMarks[name.slice(2)] = v; save(); });
});

/* ═════════════ Cannabis ═════════════ */
route('/cannabis', (el) => {
  const c = db.cannabis, unit = db.settings.cannabisUnit;
  const totalOn = (k) => c.logs.filter((l) => dayKey(new Date(l.ts)) === k).reduce((a, l) => a + l.amount, 0);
  const days = Array.from({ length: 14 }, (_, i) => { const d = addDays(new Date(), i - 13), k = dayKey(d); return { label: fmtDay(d), short: String(d.getDate()), value: c.logs.length ? totalOn(k) : null }; });
  const plan = c.plan;
  const target = plan ? Math.max(0, Math.round(plan.baseline * Math.pow(1 - plan.pct / 100, Math.floor((Date.now() - plan.start) / (7 * 864e5))) * 2) / 2) : null;
  const motives = {}; c.logs.filter((l) => Date.now() - l.ts < 30 * 864e5).forEach((l) => { motives[l.motive] = (motives[l.motive] || 0) + 1; });
  const mList = Object.entries(motives).sort((a, b) => b[1] - a[1]);
  const avg7 = Math.round((Array.from({ length: 7 }, (_, i) => totalOn(dayKey(addDays(new Date(), -i - 1)))).reduce((a, b) => a + b, 0) / 7) * 2) / 2;
  el.innerHTML = `<h1>Cannabis</h1><p class="muted">Sin juicios. Anotar te ayuda a ver para qué lo usas y cómo se relaciona con tu ánimo.</p>
    <div class="stat"><div><div class="num">${totalOn(dayKey())}</div><div class="lbl">${esc(unit)} hoy</div></div><div><div class="num">${target ?? '—'}</div><div class="lbl">meta diaria de esta semana</div></div></div>
    <div class="card"><h3>Anotar un consumo</h3>
      <label for="amt">Cantidad (${esc(unit)})</label><input type="number" id="amt" min="0" step="0.5" value="1" inputmode="decimal">
      <label>¿Para qué, sobre todo?</label>${chips('motive', CANNABIS_MOTIVES)}
      <label>Malestar justo antes (0 a 10)</label>${range('distress', 5)}
      <button class="btn primary" id="log">Anotar</button>
      <a class="btn" href="#/h/demorar">Tengo ganas: demorar 15 minutos</a></div>
    <h2>Últimos 14 días</h2><div class="card">${barChart(days, { max: Math.max(4, ...days.map((d) => d.value || 0), target || 0), target, unit: ' ' + unit })}
      ${target != null ? '<p class="small muted">La línea punteada es tu meta diaria de esta semana.</p>' : ''}</div>
    ${mList.length ? `<h2>Motivos (30 días)</h2><div class="card">${hbars(mList)}
      <p class="small muted">Usarlo para no sentir o después de un conflicto es el motivo que más se asocia con problemas. En terapia de esquemas se parece al «protector»: calma ahora, pero la emoción queda sin atender.</p></div>` : ''}
    <h2>Plan gradual</h2>
    ${plan ? `<div class="card"><p class="mt0">Línea base: <b>${plan.baseline} ${esc(unit)}/día</b> · bajar <b>${plan.pct}%</b> cada semana.</p><p>Meta de esta semana: <b>${target} ${esc(unit)}/día</b>.</p><button class="btn ghost" id="reset">Cambiar plan</button></div>`
      : `<div class="card"><p class="mt0">Bajar poco a poco suele hacer más llevadera la abstinencia (no hay estudios que lo comparen con dejarlo de golpe; elige lo que te resulte posible).</p>
        <label for="base">Línea base (${esc(unit)} por día)</label><input type="number" id="base" min="0" step="0.5" value="${avg7 || 2}" inputmode="decimal">
        <p class="small muted">${c.logs.length ? `Tu promedio de los últimos 7 días es ${avg7}.` : 'Anota unos días para conocer tu promedio real.'}</p>
        <label>Reducir cada semana</label>${chips('pct', ['10', '20', '25'], '20')}<button class="btn primary" id="plan">Empezar plan</button></div>`}
    <h2>Qué esperar si reduces o dejas</h2>
    <div class="card">${WITHDRAWAL.map(([t, d]) => `<div class="entry"><b>${t}</b><div class="small">${d}</div></div>`).join('')}
      <p class="small muted">Cerca de la mitad de quienes consumen a diario tienen síntomas al dejarlo. Son incómodos pero pasan. Si el consumo es alto o los síntomas son fuertes, busca apoyo: Centros de Integración Juvenil (55 5212 1212, por confirmar) o Línea de la Vida 800 911 2000.</p></div>
    <label for="unit">Unidad que usas</label><input type="text" id="unit" value="${esc(unit)}"><button class="btn ghost" id="saveunit">Guardar unidad</button>`;
  bindChips(el);
  $('#log', el).onclick = () => {
    const amount = parseFloat($('#amt', el).value); if (!(amount >= 0)) return toast('Escribe una cantidad');
    c.logs.push({ id: uid(), ts: Date.now(), amount, motive: chipVal(el, 'motive') || 'Sin especificar', distress: rangeVal(el, 'distress') });
    save(); toast('Anotado'); render();
  };
  $('#plan', el)?.addEventListener('click', () => { c.plan = { baseline: parseFloat($('#base', el).value) || 0, pct: +(chipVal(el, 'pct') || 20), start: Date.now() }; save(); render(); });
  $('#reset', el)?.addEventListener('click', () => { if (confirm('¿Cambiar tu plan?')) { c.plan = null; save(); render(); } });
  $('#saveunit', el).onclick = () => { db.settings.cannabisUnit = $('#unit', el).value.trim() || 'porciones'; save(); render(); };
});

/* ═════════════ Tarjeta, plan de seguridad, ayuda ═════════════ */
route('/tarjeta', (el) => {
  const c = db.card || {};
  const f = (k, label) => `<label for="${k}">${label}</label><textarea id="${k}" placeholder="${esc(DEFAULT_CARD[k])}">${esc(c[k])}</textarea>`;
  el.innerHTML = `<h1>Mi tarjeta</h1><p class="muted">Escríbela en calma, con tus palabras, para leerla en los momentos difíciles. Aparece en «Calma ahora».</p>
    ${f('feeling', '1. Lo que siento cuando estoy mal')}${f('pattern', '2. Lo que me suele pasar (mi patrón o esquema)')}
    ${f('truth', '3. Lo que sé que es verdad, aunque ahora no lo sienta')}${f('action', '4. Lo que voy a hacer')}
    <button class="btn primary" id="save">Guardar mi tarjeta</button>`;
  $('#save', el).onclick = () => { const v = {}; Object.keys(DEFAULT_CARD).forEach((k) => { v[k] = $('#' + k, el).value.trim() || DEFAULT_CARD[k]; }); db.card = v; save(); toast('Tarjeta guardada'); };
});
const SAFETY = [
  ['warning', '1. Mis señales de alarma', 'Pensamientos, emociones o situaciones que me avisan que estoy entrando en crisis'],
  ['coping', '2. Lo que puedo hacer solo para calmarme', 'Respirar, caminar, ducharme, música…'],
  ['distract', '3. Personas y lugares que me distraen', 'Un amigo, un café, un parque…'],
  ['people', '4. Personas a las que puedo pedir ayuda', 'Nombre y teléfono'],
  ['pros', '5. Profesionales o servicios', 'Mi médico, un psicólogo, las líneas de ayuda'],
  ['environment', '6. Hacer mi entorno más seguro', 'Alejar lo que podría usar para hacerme daño'],
  ['reasons', '7. Mis razones para vivir', 'Lo que me importa'],
];
route('/plan', (el) => {
  el.innerHTML = `<h1>Mi plan de seguridad</h1>
    <p class="muted">Se escribe en un momento tranquilo y se usa en uno difícil. Si estás en peligro ahora, llama al <a href="tel:911">911</a> o a la <a href="tel:8009112000">Línea de la Vida 800 911 2000</a>.</p>
    ${SAFETY.map(([k, l, ph]) => `<label for="${k}">${l}</label><textarea id="${k}" placeholder="${esc(ph)}">${esc(db.safety[k])}</textarea>`).join('')}
    <button class="btn primary" id="save">Guardar plan</button><a class="btn" href="#/ayuda">Líneas de ayuda</a>`;
  $('#save', el).onclick = () => { SAFETY.forEach(([k]) => { db.safety[k] = $('#' + k, el).value.trim(); }); save(); toast('Plan guardado'); };
});
route('/ayuda', (el) => {
  el.innerHTML = `<h1>Ayuda ahora</h1>
    <div class="card sos"><p class="mt0"><b>Si estás en peligro o piensas en hacerte daño, llama ahora.</b> No tienes que estar seguro de que «es suficientemente grave».</p></div>
    ${CRISIS_LINES.map((l) => `<a class="btn ${l.tel === '911' || l.tel === '8009112000' ? 'sos' : ''}" href="tel:${l.tel}">${esc(l.name)} · ${esc(l.number)}</a><p class="small muted center">${esc(l.note)}</p>`).join('')}
    <a class="btn" href="https://wa.me/525555335533">WhatsApp Consejo Ciudadano</a>
    <p class="small muted">${CRISIS_VERIFIED}</p><a class="btn primary" href="#/plan">Abrir mi plan de seguridad</a>`;
});

/* ═════════════ Más, alarmas, datos, acerca ═════════════ */
route('/mas', (el) => {
  el.innerHTML = `<h1>Más</h1>
    <div class="card">
      <a class="row-link" href="#/sesion"><span class="ico">🌅</span><span class="lbl">Sesión de hoy</span></a><a class="row-link" href="#/diario"><span class="ico">📔</span><span class="lbl">Diario</span></a>
      <a class="row-link" href="#/patrones"><span class="ico">📈</span><span class="lbl">Mis patrones</span></a><a class="row-link" href="#/esquemas"><span class="ico">🧩</span><span class="lbl">Esquemas</span></a>
      <a class="row-link" href="#/tarjeta"><span class="ico">🪪</span><span class="lbl">Mi tarjeta</span></a><a class="row-link" href="#/cannabis"><span class="ico">🌿</span><span class="lbl">Cannabis: registro y plan</span></a>
      <a class="row-link" href="#/plan"><span class="ico">🛟</span><span class="lbl">Mi plan de seguridad</span></a><a class="row-link" href="#/ayuda"><span class="ico">📞</span><span class="lbl">Líneas de ayuda</span></a></div>
    <div class="card">
      <a class="row-link" href="#/ia"><span class="ico">💬</span><span class="lbl">Acompañante con IA</span></a><a class="row-link" href="#/alarmas"><span class="ico">⏰</span><span class="lbl">Alarmas de la mañana (Atajos)</span></a>
      <a class="row-link" href="#/datos"><span class="ico">🔒</span><span class="lbl">Mis datos: copia, importar, borrar</span></a><a class="row-link" href="#/acerca"><span class="ico">ℹ️</span><span class="lbl">Acerca de y buscar terapeuta</span></a></div>`;
});
route('/alarmas', (el) => {
  const s = db.settings;
  el.innerHTML = `<h1>Alarmas de la mañana</h1>
    <p class="muted">Una app web no puede hacer sonar alarmas en el iPhone. Por eso usamos la app <b>Atajos</b> y el <b>Reloj</b>. Esta configuración está <b>por probar</b> en iOS 26: si un paso no aparece igual, lo ajustamos.</p>
    <div class="card">
      <label><input type="checkbox" id="en" ${s.shortcutEnabled ? 'checked' : ''}> Al responder la sesión, apagar las alarmas pendientes</label>
      <label for="sn">Nombre del atajo que apaga las alarmas</label><input type="text" id="sn" value="${esc(s.shortcutName)}">
      <button class="btn primary" id="save">Guardar</button><button class="btn" id="test">Probar el atajo ahora</button></div>
    <h2>Paso 1. Crea 3 alarmas en el Reloj</h2>
    <ol class="steps"><li>Abre <b>Reloj → Alarmas</b> y crea tres alarmas (la hora no importa, la cambia el atajo).</li>
      <li>Ponles de etiqueta <span class="mono">Sesión 1</span>, <span class="mono">Sesión 2</span> y <span class="mono">Sesión 3</span>, y déjalas apagadas.</li></ol>
    <h2>Paso 2. Atajo «Empezar sesión»</h2>
    <ol class="steps"><li>En <b>Atajos</b>, crea un atajo nuevo llamado <span class="mono">Empezar sesión</span>.</li>
      <li>Agrega <b>Ajustar fecha</b>: fecha actual + 5 minutos. Después, la acción de Reloj para <b>cambiar la hora</b> de «Sesión 1» a ese resultado y <b>activarla</b>.</li>
      <li>Repite para «Sesión 2» (+10 minutos) y «Sesión 3» (+20 minutos).</li>
      <li>Agrega <b>Abrir URL</b> con la dirección de esta app.</li></ol>
    <p class="small muted">Si tu iOS no deja cambiar la hora de una alarma existente, usa <b>Crear alarma</b> con la misma etiqueta; el atajo del paso 4 las apaga igual.</p>
    <h2>Paso 3. Automatización: que empiece sola</h2>
    <ol class="steps"><li><b>Atajos → Automatización → Nueva</b> → <b>Alarma</b> → «Cuando se detiene» tu alarma de despertar → <b>Ejecutar inmediatamente</b> → ejecutar <span class="mono">Empezar sesión</span>.</li>
      <li>Para los días sin alarma: otra automatización a una hora de respaldo (por ejemplo <b>8:15</b>).</li></ol>
    <h2>Paso 4. Atajo «${esc(s.shortcutName)}»</h2>
    <ol class="steps"><li>Crea un atajo llamado exactamente <span class="mono">${esc(s.shortcutName)}</span>.</li>
      <li><b>Obtener todas las alarmas</b> → filtra las de etiqueta que contenga «Sesión» → <b>Desactivar alarma</b> para cada una.</li>
      <li>Activa la casilla de arriba. Al terminar tu sesión (o elegir «hoy no»), la app abrirá Atajos un instante para apagarlas.</li></ol>
    <div class="card warn"><p class="mt0 small">Las alarmas son para recordarte, no para exigirte. Empieza con 3. Si el chequeo semanal dice que se sienten como exigencia, quita una o cambia su texto por algo amable: «Tu sesión te espera, aunque sean 2 minutos».</p></div>`;
  $('#save', el).onclick = () => { s.shortcutEnabled = $('#en', el).checked; s.shortcutName = $('#sn', el).value.trim() || 'Sesión hecha'; save(); toast('Guardado'); render(); };
  $('#test', el).onclick = () => { window.location.href = `shortcuts://run-shortcut?name=${encodeURIComponent($('#sn', el).value.trim() || 'Sesión hecha')}`; };
});

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function deriveKey(pass, salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function encryptExport(pass) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pass, salt);
  const copyDb = { ...db, ai: { ...db.ai, apiKey: '' } }; // la clave de API no viaja en la copia
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(copyDb)));
  return JSON.stringify({ app: 'base-segura', v: 2, salt: b64(salt), iv: b64(iv), data: b64(data) });
}
async function decryptImport(text, pass) {
  const o = JSON.parse(text);
  const key = await deriveKey(pass, unb64(o.salt));
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(o.iv) }, key, unb64(o.data));
  return JSON.parse(new TextDecoder().decode(plain));
}
route('/datos', (el) => {
  el.innerHTML = `<h1>Mis datos</h1>
    <p class="muted">Todo lo que escribes se guarda <b>solo en este iPhone</b>. Solo se envía algo a internet si activas el acompañante con IA, y solo lo de la charla. Si borras la app o los datos de Safari, se pierde: por eso conviene una copia cifrada.</p>
    <div class="card"><h3>Copia cifrada</h3>
      <label for="p1">Contraseña de la copia</label><input type="password" id="p1" autocomplete="new-password">
      <p class="small muted">Sin esta contraseña nadie puede leer la copia, ni tú. Guárdala en un lugar seguro. La clave de la IA no se incluye.</p>
      <button class="btn primary" id="exp">Exportar copia</button><p class="small muted">Última copia: ${db.settings.lastExport ? fmtDT(db.settings.lastExport) : 'nunca'}</p></div>
    <div class="card"><h3>Importar una copia</h3>
      <input type="file" id="file" accept=".json,application/json"><label for="p2">Contraseña</label><input type="password" id="p2" autocomplete="current-password">
      <button class="btn" id="imp">Importar (reemplaza lo actual)</button></div>
    <div class="card sos"><h3>Borrar todo</h3><p class="small">Elimina todos tus registros de este iPhone. No se puede deshacer.</p><button class="btn sos" id="del">Borrar todos mis datos</button></div>`;
  $('#exp', el).onclick = async () => {
    const pass = $('#p1', el).value; if (pass.length < 6) return toast('Usa una contraseña de al menos 6 caracteres');
    const name = `base-segura-${dayKey()}.json`, file = new File([await encryptExport(pass)], name, { type: 'application/json' });
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'Copia de Base Segura' });
      else { const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; a.click(); }
      db.settings.lastExport = Date.now(); save(); toast('Copia lista');
    } catch (e) { if (e.name !== 'AbortError') toast('No se pudo exportar'); }
  };
  $('#imp', el).onclick = async () => {
    const f = $('#file', el).files[0]; if (!f) return toast('Elige un archivo');
    try {
      const data = await decryptImport(await f.text(), $('#p2', el).value);
      if (!confirm('Esto reemplaza tus datos actuales. ¿Seguir?')) return;
      const key = db.ai.apiKey; localStorage.setItem(KEY, JSON.stringify(data)); db = load(); db.ai.apiKey = key; save();
      toast('Copia importada'); location.hash = '#/';
    } catch { toast('Contraseña incorrecta o archivo no válido'); }
  };
  $('#del', el).onclick = () => {
    if (!confirm('¿Borrar todos tus datos de este iPhone?') || !confirm('Última confirmación: no se puede deshacer.')) return;
    localStorage.removeItem(KEY); db = DEFAULTS(); toast('Datos borrados'); location.hash = '#/';
  };
});
route('/acerca', (el) => {
  el.innerHTML = `<h1>Acerca de Base Segura</h1>
    <p>Una app personal para la ansiedad y los problemas emocionales del día a día. Reúne herramientas de la terapia cognitivo-conductual, la terapia de esquemas, DBT, ACT, la terapia centrada en la compasión y el mindfulness, y aprende cuáles te funcionan a ti.</p>
    <div class="card warn"><p class="mt0"><b>No sustituye la psicoterapia.</b> Los ejercicios son de autoayuda. Si aparece angustia intensa, detente, vuelve al presente y busca apoyo profesional.</p></div>
    <h2>Buscar un terapeuta en México</h2>
    <p>Terapia de esquemas: programas aprobados por la sociedad internacional (ISST) en México: IMTE (soyimte.com), Esquema México (esquemamexico.com), terapiaesquemas.com y ADE México (alianzaesquemas.org). Pregunta allí por terapeutas formados.</p>
    <p>Verifica la cédula profesional gratis en <a href="https://cedulaprofesional.sep.gob.mx">cedulaprofesional.sep.gob.mx</a>.</p>
    <p>Opción gratuita: Programa de Atención Psicológica a Distancia de la UNAM, <a href="tel:5550250855">55 5025 0855</a> (lunes a viernes, 8 a 18 h).</p>
    <h2>Privacidad</h2>
    <p class="small">Sin cuentas, sin rastreadores y sin servidores propios. Tus datos viven solo en tu iPhone. Si activas el acompañante, los mensajes de la charla se envían a Anthropic con tu clave.</p>
    <p class="small muted">Versión demo 0.3</p>`;
});

/* ═════════════ Arranque ═════════════ */
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
render();
