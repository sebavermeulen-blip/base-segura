import {
  MODES, NEEDS, EMOTIONS, DEFAULT_CARD, PROGRAM, MINIMAL, HARD_MORNING,
  CRISIS_LINES, CRISIS_VERIFIED, CANNABIS_MOTIVES, WITHDRAWAL,
} from './content.js';

/* ───────────── Almacenamiento local (solo en este dispositivo) ───────────── */

const KEY = 'baseSegura.v1';
const DEFAULTS = () => ({
  version: 1,
  createdAt: Date.now(),
  settings: { shortcutEnabled: false, shortcutName: 'Sesión hecha', cannabisUnit: 'porciones', lastExport: null, lastWeekly: null },
  sessions: [],   // {date, type: completa|minima|dificil|hoyno, programIndex, answer, notes, emotion, intensity, learning, schemaActivated, ts}
  diary: [],      // {id, ts, kind: registro|sos, situation, discussion, mode, emotion, intensity, intensityBefore, need, response, request, draft}
  cannabis: { logs: [], plan: null }, // logs: {id, ts, amount, motive, distress}; plan: {baseline, pct, start}
  card: null,
  safety: {},
  weekly: [],     // {ts, score}
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS();
    const d = JSON.parse(raw);
    const base = DEFAULTS();
    return { ...base, ...d, settings: { ...base.settings, ...d.settings }, cannabis: { ...base.cannabis, ...d.cannabis } };
  } catch { return DEFAULTS(); }
}
let db = load();
function save() { localStorage.setItem(KEY, JSON.stringify(db)); }

/* ───────────── Utilidades ───────────── */

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

let timers = [];
const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
const every = (fn, ms) => { const t = setInterval(fn, ms); timers.push(t); return t; };
function clearTimers() { timers.forEach((t) => { clearTimeout(t); clearInterval(t); }); timers = []; }

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
    const v = typeof o === 'string' ? o : o.id; const l = typeof o === 'string' ? o : o.name;
    return `<button type="button" class="chip" data-value="${esc(v)}" aria-pressed="${sel.includes(v)}">${esc(l)}</button>`;
  }).join('')}</div>`;
}
function bindChips(root, onChange) {
  $$('[data-chips]', root).forEach((group) => {
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
const chipVal = (root, name) => { const g = $(`[data-chips="${name}"]`, root); if (!g) return undefined; const v = $$('.chip[aria-pressed=true]', g).map((c) => c.dataset.value); return g.dataset.multi === 'true' ? v : v[0]; };

function range(name, value = 5, lo = '0 = nada', hi = '10 = máximo') {
  return `<div class="range-value" id="rv-${name}">${value}</div>
    <input type="range" min="0" max="10" step="1" value="${value}" name="${name}" aria-label="Intensidad de 0 a 10"
      oninput="document.getElementById('rv-${name}').textContent=this.value">
    <div class="btn-row small muted"><span>${lo}</span><span style="text-align:right">${hi}</span></div>`;
}

/* Respiración: inhalar 4 s, exhalar 6 s (≈6 respiraciones por minuto). */
function breathing(el, seconds, onDone) {
  el.innerHTML = `<div class="breath"><div class="circle"><div><div class="b-label">Prepárate</div><div class="small muted b-left"></div></div></div></div>`;
  const c = $('.circle', el), label = $('.b-label', el), left = $('.b-left', el);
  const end = Date.now() + seconds * 1000;
  const tick = () => { const s = Math.max(0, Math.ceil((end - Date.now()) / 1000)); left.textContent = `${Math.floor(s / 60)}:${pad(s % 60)}`; };
  const cycle = () => {
    if (Date.now() >= end) { label.textContent = 'Listo'; c.className = 'circle'; onDone?.(); return; }
    c.className = 'circle in'; label.textContent = 'Inhala…';
    later(() => { c.className = 'circle out'; label.textContent = 'Exhala despacio…'; later(cycle, 6000); }, 4000);
  };
  tick(); every(tick, 500); later(cycle, 800);
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
    const bar = it.value == null ? '' : `<path class="bar" d="M${x},${H - padB} v${-Math.max(0, h - 4)} q0,-4 4,-4 h${bw - 8} q4,0 4,4 v${Math.max(0, h - 4)} z"/>`;
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
      $$('.bar', svg).forEach((b) => b.classList.remove('sel'));
      $('.bar', g)?.classList.add('sel');
      const it = items[+g.dataset.i];
      out.textContent = `${it.label}: ${it.value == null ? 'sin registro' : it.value + unit}`;
    });
  });
  return `<svg id="${id}" class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfica de barras">${grid}${tline}${bars}</svg>
    <div class="chart-readout">Toca una barra para ver el valor.</div>
    <details><summary class="small">Ver como tabla</summary><table class="small">${items.map((it) => `<tr><td>${esc(it.label)}</td><td>${it.value == null ? '—' : esc(it.value + unit)}</td></tr>`).join('')}</table></details>`;
}

/* ───────────── Lógica de dominio ───────────── */

const sessionToday = () => db.sessions.find((s) => s.date === dayKey());
const practiced = (s) => s.type !== 'hoyno';
function practicedThisMonth() {
  const m = dayKey().slice(0, 7);
  return new Set(db.sessions.filter((s) => practiced(s) && s.date.startsWith(m)).map((s) => s.date)).size;
}
const programIndex = () => db.sessions.filter((s) => s.type === 'completa').length;

function maxIntensityByDay(days) {
  const map = {};
  const add = (k, v) => { if (v == null || isNaN(v)) return; map[k] = Math.max(map[k] ?? 0, +v); };
  db.sessions.forEach((s) => add(s.date, s.intensity));
  db.diary.forEach((e) => { add(dayKey(new Date(e.ts)), e.intensity); add(dayKey(new Date(e.ts)), e.intensityBefore); });
  return Array.from({ length: days }, (_, i) => {
    const d = addDays(new Date(), i - days + 1), k = dayKey(d);
    return { key: k, label: fmtDay(d), short: String(d.getDate()), value: map[k] ?? null };
  });
}
/* Si la intensidad llega a 8 o más en 3 de los últimos 5 días, se ofrece el plan de seguridad. */
const worsening = () => maxIntensityByDay(5).filter((d) => d.value != null && d.value >= 8).length >= 3;

function hardMorning() {
  const since = addDays(new Date(new Date().setHours(0, 0, 0, 0)), -1).getTime();
  const diaryHard = db.diary.some((e) => e.ts >= since && (e.discussion || (e.intensity ?? 0) >= 8 || (e.intensityBefore ?? 0) >= 8));
  const y = db.sessions.find((s) => s.date === dayKey(addDays(new Date(), -1)));
  return diaryHard || (y && (y.intensity ?? 0) >= 8);
}

const weeklyDue = () => db.sessions.filter(practiced).length >= 3 &&
  (!db.settings.lastWeekly || Date.now() - db.settings.lastWeekly > 7 * 864e5);

function runStopAlarms() {
  if (!db.settings.shortcutEnabled) return;
  const name = encodeURIComponent(db.settings.shortcutName || 'Sesión hecha');
  // setTimeout sin registrar: debe sobrevivir al cambio de pantalla.
  setTimeout(() => { window.location.href = `shortcuts://run-shortcut?name=${name}`; }, 700);
}

function saveSession(data) {
  db.sessions = db.sessions.filter((s) => s.date !== dayKey());
  db.sessions.push({ date: dayKey(), ts: Date.now(), ...data });
  save();
  runStopAlarms();
}

const getCard = () => db.card || DEFAULT_CARD;

/* ───────────── Vistas ───────────── */

const routes = {};
const route = (path, fn) => { routes[path] = fn; };

function render() {
  clearTimers();
  const path = (location.hash.replace(/^#/, '') || '/').split('?')[0];
  const view = routes[path] || routes['/'];
  const main = $('#view');
  main.innerHTML = '';
  view(main);
  const tab = path === '/' ? 'inicio' : path.slice(1).split('/')[0];
  $$('.tabbar a').forEach((a) => {
    if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', render);

const helpLink = `<p class="small"><a href="#/ayuda">¿Piensas en hacerte daño o sientes que no puedes más? Ayuda ahora →</a></p>`;

/* Inicio */
route('/', (el) => {
  const h = new Date().getHours();
  const hello = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  const s = sessionToday();
  const standalone = window.navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  const hasData = db.sessions.length + db.diary.length > 0;
  const exportOld = hasData && (!db.settings.lastExport || Date.now() - db.settings.lastExport > 14 * 864e5);

  el.innerHTML = `
    <p class="eyebrow">${new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
    <h1>${hello}</h1>
    ${worsening() ? `<div class="card sos"><h3>Estos días han sido muy intensos</h3>
      <p>Varios días seguidos con intensidad de 8 o más. No tienes que cargarlo solo: revisa tu plan de seguridad y considera hablar con alguien.</p>
      <a class="btn sos" href="#/plan">Abrir mi plan de seguridad</a><a class="btn" href="#/ayuda">Líneas de ayuda</a></div>` : ''}
    <div class="card ${s ? 'soft' : ''}">
      ${s ? (practiced(s)
        ? `<h3>Sesión de hoy: hecha ✓</h3><p class="muted">${s.type === 'minima' ? 'Versión mínima. Cuenta igual.' : s.type === 'dificil' ? 'Sesión de mañana difícil. Cuenta igual.' : 'Bien hecho por darte este tiempo.'}</p>
           <p class="small muted">Acción del día: ${esc(s.action || '—')}</p>`
        : `<h3>Hoy elegiste descansar</h3><p class="muted">Está bien. Mañana es otro día.</p>`)
      : `<h3>Tu sesión de hoy</h3><p class="muted">${hardMorning() ? 'Ayer fue un día intenso: hoy hay una versión corta y amable.' : '10–15 minutos, o 2 si hoy cuesta más.'}</p>
         <a class="btn primary" href="#/sesion">Empezar</a>`}
    </div>
    <a class="sos-hero" href="#/sos"><strong>Estoy en una discusión</strong><span>Pausa guiada: cuerpo, modo, tu tarjeta y qué pedir</span></a>
    <div class="stat">
      <div><div class="num">${practicedThisMonth()}</div><div class="lbl">días practicados este mes</div></div>
      <div><div class="num">${db.diary.filter((e) => Date.now() - e.ts < 7 * 864e5).length}</div><div class="lbl">registros en el diario esta semana</div></div>
    </div>
    ${weeklyDue() ? `<div class="card" id="weekly"><h3>Chequeo semanal</h3>
      <p>Esta semana, ¿las alarmas y la app se sintieron como <b>apoyo</b> o como <b>exigencia</b>?</p>
      ${range('weekly', 3, '0 = apoyo', '10 = exigencia')}
      <button class="btn primary" id="save-weekly">Guardar</button></div>` : ''}
    ${!standalone ? `<div class="card warn"><h3>Instálala en tu pantalla de inicio</h3>
      <p class="small">En Safari: toca <b>Compartir</b> → <b>Agregar a la pantalla de inicio</b>. Así funciona sin internet y como una app.</p></div>` : ''}
    ${exportOld ? `<div class="card"><h3>Haz una copia de tus datos</h3><p class="small muted">Todo vive solo en este iPhone. Una copia cifrada te protege si borras la app.</p>
      <a class="btn" href="#/datos">Exportar copia cifrada</a></div>` : ''}
    <p class="small muted center" style="margin-top:24px">Base Segura acompaña tu trabajo emocional; no sustituye la psicoterapia.</p>
    ${helpLink}`;

  $('#save-weekly', el)?.addEventListener('click', () => {
    const score = +$('input[name=weekly]', el).value;
    db.weekly.push({ ts: Date.now(), score }); db.settings.lastWeekly = Date.now(); save();
    $('#weekly', el).innerHTML = score >= 6
      ? `<h3>Gracias por decirlo</h3><p>Si se siente como exigencia, baja el número de alarmas en Atajos o cámbiales el texto a algo más amable. La constancia también es poder elegir.</p>`
      : `<h3>Gracias</h3><p class="muted">Sigamos así.</p>`;
  });
});

/* Sesión matutina */
let flow = null;
route('/sesion', (el) => {
  const done = sessionToday();
  if (done && !flow) {
    el.innerHTML = `<h1>Sesión de hoy</h1>
      <div class="card soft"><h3>${practiced(done) ? 'Ya hiciste tu sesión hoy ✓' : 'Hoy elegiste descansar'}</h3>
      ${done.action ? `<p><b>Acción del día:</b> ${esc(done.action)}</p>` : ''}
      ${done.learning ? `<p class="muted">Aprendizaje: ${esc(done.learning)}</p>` : ''}</div>
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
  const hard = hardMorning();
  const idx = programIndex(), p = PROGRAM[idx % PROGRAM.length], round = Math.floor(idx / PROGRAM.length) + 1;
  el.innerHTML = `<h1>Sesión de hoy</h1>
    ${hard ? `<div class="card soft"><h3>${HARD_MORNING.title}</h3><p>${HARD_MORNING.intro}</p>
      <button class="btn primary" data-k="dificil">Sesión corta y amable (3 min)</button></div>` : ''}
    <div class="card">
      <p class="eyebrow">Día ${idx % PROGRAM.length + 1} de ${PROGRAM.length}${round > 1 ? ` · vuelta ${round}` : ''}</p>
      <h3>${esc(p.title)}</h3>
      <button class="btn ${hard ? '' : 'primary'}" data-k="completa">Sesión completa (10–15 min)</button>
      <button class="btn" data-k="minima">${MINIMAL.title}</button>
      <button class="btn ghost" data-k="hoyno">Hoy no, y está bien</button>
    </div>
    <p class="small muted">Cualquier opción, incluso «hoy no», cuenta como respuesta y apaga las alarmas.</p>`;
  $$('[data-k]', el).forEach((b) => b.onclick = () => {
    const k = b.dataset.k;
    if (k === 'hoyno') { saveSession({ type: 'hoyno' }); flow = null; toast('Anotado. Descansar también es cuidarte.'); location.hash = '#/'; return; }
    flow = { kind: k, step: 0, idx, data: {} }; render();
  });
}

function closingFields(prefill = {}) {
  return `<label>¿Qué emoción predomina ahora?</label>${chips('emotion', EMOTIONS, prefill.emotion)}
    <label>Intensidad (0 a 10)</label>${range('intensity', prefill.intensity ?? 5)}`;
}

function sessionFull(el) {
  const p = PROGRAM[flow.idx % PROGRAM.length];
  const last = [...db.sessions].reverse().find((s) => s.learning);
  const steps = 4;
  const bar = `<div class="progress">${Array.from({ length: steps }, (_, i) => `<span class="${i <= flow.step ? 'on' : ''}"></span>`).join('')}</div>`;
  const head = `<p class="eyebrow">Día ${flow.idx % PROGRAM.length + 1} · ${esc(p.title)}</p>${bar}`;
  const nav = (next = 'Seguir') => `<div class="btn-row"><button class="btn ghost" id="back">Atrás</button><button class="btn primary" id="next">${next}</button></div>`;
  const d = flow.data;

  if (flow.step === 0) {
    el.innerHTML = `${head}<h1>Conectar</h1>
      ${last ? `<div class="card soft"><p class="small muted mt0">La última vez aprendiste:</p><p class="mt0">«${esc(last.learning)}»</p></div>` : `<p class="muted">Primera sesión. Responde con sinceridad, sin buscar la respuesta perfecta.</p>`}
      <h2>Pregunta de hoy</h2><p>${esc(p.question)}</p>
      <textarea id="answer" placeholder="Escribe lo que surja…">${esc(d.answer)}</textarea>${nav()}`;
  } else if (flow.step === 1) {
    el.innerHTML = `${head}<h1>Ejercicio</h1>
      <ol class="steps">${p.exercise.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      <label for="notes">Tus notas (opcional)</label><textarea id="notes">${esc(d.notes)}</textarea>
      <p class="small muted">Si aparece angustia intensa, detén el ejercicio, mira a tu alrededor y nombra 5 cosas que ves.</p>${nav()}`;
  } else if (flow.step === 2) {
    el.innerHTML = `${head}<h1>Acción del día</h1>
      <div class="card soft"><p class="mt0">${esc(p.action)}</p></div>
      <p class="muted small">Pequeña y concreta. No tiene que salir perfecta.</p>${nav()}`;
  } else {
    el.innerHTML = `${head}<h1>Cierre</h1>${closingFields(d)}
      <label for="learning">¿Qué aprendiste o descubriste hoy?</label><textarea id="learning">${esc(d.learning)}</textarea>
      <label>¿Se activó ayer tu esquema de abandono?</label>${chips('schema', ['Sí', 'Un poco', 'No', 'No sé'], d.schemaActivated)}
      ${nav('Terminar sesión')}`;
    bindChips(el);
  }
  const grab = () => {
    if ($('#answer', el)) d.answer = $('#answer', el).value;
    if ($('#notes', el)) d.notes = $('#notes', el).value;
    if ($('#learning', el)) { d.learning = $('#learning', el).value; d.emotion = chipVal(el, 'emotion'); d.intensity = +$('input[name=intensity]', el).value; d.schemaActivated = chipVal(el, 'schema'); }
  };
  $('#back', el).onclick = () => { grab(); if (flow.step === 0) flow = { kind: null }; else flow.step--; render(); };
  $('#next', el).onclick = () => {
    grab();
    if (flow.step < steps - 1) { flow.step++; render(); return; }
    saveSession({ type: 'completa', programIndex: flow.idx, action: p.action, ...d });
    flow = null; sessionDone(el);
  };
}

function sessionMinimal(el) {
  el.innerHTML = `<p class="eyebrow">${MINIMAL.title}</p><h1>Un minuto para ti</h1>
    <div id="br"></div><div class="card soft"><p class="mt0">${MINIMAL.phrase}</p></div>
    ${closingFields()}<button class="btn primary" id="fin">Listo</button><button class="btn ghost" id="back">Atrás</button>`;
  breathing($('#br', el), 60); bindChips(el);
  $('#back', el).onclick = () => { flow = { kind: null }; render(); };
  $('#fin', el).onclick = () => {
    saveSession({ type: 'minima', action: 'Una respiración consciente cuando lo necesites.', emotion: chipVal(el, 'emotion'), intensity: +$('input[name=intensity]', el).value });
    flow = null; sessionDone(el);
  };
}

function sessionHard(el) {
  el.innerHTML = `<p class="eyebrow">${HARD_MORNING.title}</p><h1>Despacio</h1><p>${HARD_MORNING.intro}</p>
    <ol class="steps">${HARD_MORNING.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    <div id="br"></div>
    <label for="gesture">Mi gesto de cuidado de hoy</label><input type="text" id="gesture" placeholder="Ej.: desayunar tranquilo, caminar 10 minutos">
    ${closingFields()}<button class="btn primary" id="fin">Listo</button><button class="btn ghost" id="back">Atrás</button>`;
  breathing($('#br', el), 60); bindChips(el);
  $('#back', el).onclick = () => { flow = { kind: null }; render(); };
  $('#fin', el).onclick = () => {
    saveSession({ type: 'dificil', action: $('#gesture', el).value || 'Un gesto de cuidado', emotion: chipVal(el, 'emotion'), intensity: +$('input[name=intensity]', el).value });
    flow = null; sessionDone(el);
  };
}

function sessionDone(el) {
  const s = sessionToday();
  el.innerHTML = `<h1>Sesión hecha ✓</h1>
    <div class="card soft"><p class="mt0">Te diste este tiempo. Eso es el adulto sano en acción.</p>
    ${s?.action ? `<p class="mt0"><b>Para hoy:</b> ${esc(s.action)}</p>` : ''}</div>
    ${worsening() || (s?.intensity ?? 0) >= 9 ? `<div class="card sos"><p class="mt0">La intensidad está alta. Si lo necesitas, tu plan de seguridad y las líneas de ayuda están aquí.</p><a class="btn sos" href="#/plan">Mi plan de seguridad</a></div>` : ''}
    ${db.settings.shortcutEnabled ? '<p class="small muted">Apagando las alarmas pendientes con Atajos…</p>' : ''}
    <a class="btn primary" href="#/">Volver al inicio</a>`;
}

/* SOS: pausa guiada durante una discusión. Funciona sin internet y sin IA. */
let sos = null;
route('/sos', (el) => {
  if (!sos) sos = { step: 0, minutes: 20, data: {} };
  const N = 6;
  const bar = `<div class="progress">${Array.from({ length: N }, (_, i) => `<span class="${i <= sos.step ? 'on' : ''}"></span>`).join('')}</div>`;
  const back = sos.pauseUntil ? `<p class="small muted">Pausa hasta las <b>${fmtTime(new Date(sos.pauseUntil))}</b> · <span id="left"></span></p>` : '';
  const nav = (next = 'Seguir') => `<div class="btn-row"><button class="btn ghost" id="back">Atrás</button><button class="btn primary" id="next">${next}</button></div>`;
  const d = sos.data;
  const card = getCard();

  if (sos.step === 0) {
    const until = new Date(Date.now() + sos.minutes * 60000);
    const msg = `Necesito ${sos.minutes} minutos para calmarme. No me voy: vuelvo a las ${fmtTime(until)} para seguir hablando.`;
    el.innerHTML = `${bar}<p class="eyebrow">Paso 1 de ${N}</p><h1>Pide una pausa, no te vayas</h1>
      <p>Una pausa <b>con hora de regreso</b> no es un abandono, ni para ti ni para tu pareja.</p>
      <label>¿Cuánto tiempo?</label>${chips('min', ['20', '30', '45', '60'], String(sos.minutes))}
      <div class="card soft"><p class="mt0" id="msg">${esc(msg)}</p></div>
      <button class="btn" id="copy">Copiar mensaje</button>
      <button class="btn primary" id="next">Ya pedí la pausa</button>
      <button class="btn ghost" id="skip">No hace falta pausa, seguir</button>${helpLink}`;
    bindChips(el, (_, v) => { sos.minutes = +v; render(); });
    $('#copy', el).onclick = () => copy(msg);
    $('#next', el).onclick = () => { sos.pauseUntil = until.getTime(); sos.step = 1; render(); };
    $('#skip', el).onclick = () => { sos.step = 1; render(); };
    return;
  }
  if (sos.step === 1) {
    el.innerHTML = `${bar}${back}<p class="eyebrow">Paso 2 de ${N}</p><h1>Primero, el cuerpo</h1>
      <p>Con el cuerpo acelerado no se puede pensar bien. Dos minutos de respiración lenta:</p>
      <div id="br"></div>
      <details><summary>Otras opciones rápidas</summary>
        <p class="small">• Agua fría en la cara 15–30 segundos (evítalo si tienes un problema del corazón).<br>
        • Caminar rápido unos minutos.<br>• Nombrar 5 cosas que ves, 4 que sientes, 3 que oyes.</p></details>
      ${nav()}`;
    breathing($('#br', el), 120);
  } else if (sos.step === 2) {
    const m = MODES.find((x) => x.id === d.mode);
    el.innerHTML = `${bar}${back}<p class="eyebrow">Paso 3 de ${N}</p><h1>¿Qué parte de ti está al mando?</h1>
      ${chips('mode', MODES, d.mode)}
      ${m ? `<div class="card soft"><p class="small muted mt0">${esc(m.hint)}</p><p class="mt0">${esc(m.voice)}</p><p class="mt0"><b>Adulto sano:</b> ${esc(m.answer)}</p></div>` : ''}
      <div class="card"><p class="mt0"><b>Estoy sintiendo miedo al abandono; no necesariamente estoy siendo abandonado.</b></p></div>
      <label>¿Qué tan intenso es ahora? (0 a 10)</label>${range('before', d.intensityBefore ?? 7)}
      ${nav()}`;
    bindChips(el, (_, v) => { d.mode = v; d.intensityBefore = +$('input[name=before]', el).value; render(); });
  } else if (sos.step === 3) {
    el.innerHTML = `${bar}${back}<p class="eyebrow">Paso 4 de ${N}</p><h1>Tu tarjeta</h1>
      <div class="card soft">
        <p class="mt0"><b>Lo que siento:</b> ${esc(card.feeling)}</p>
        <p><b>De dónde viene:</b> ${esc(card.schema)}</p>
        <p><b>Lo que dice la realidad:</b> ${esc(card.reality)}</p>
        <p class="mt0"><b>Lo que voy a hacer:</b> ${esc(card.behavior)}</p>
      </div>
      ${db.card ? '' : '<p class="small muted">Esta es una tarjeta de ejemplo. Escribe la tuya en calma desde Más → Mi tarjeta.</p>'}
      ${nav()}`;
  } else if (sos.step === 4) {
    el.innerHTML = `${bar}${back}<p class="eyebrow">Paso 5 de ${N}</p><h1>Escribe todo lo que quisieras decir</h1>
      <p>Esto <b>no se envía</b>. Este espacio no tiene botón de enviar a propósito. Saca todo aquí, sin filtro.</p>
      <textarea id="draft" style="min-height:180px">${esc(d.draft)}</textarea>
      <label><input type="checkbox" id="keep" ${d.keepDraft ? 'checked' : ''}> Guardar este borrador en mi diario</label>
      ${nav()}`;
  } else {
    el.innerHTML = `${bar}${back}<p class="eyebrow">Paso 6 de ${N}</p><h1>Ahora, un pedido claro</h1>
      <p class="muted">No pidas que te prometan que no se irán: eso calma un momento y el miedo vuelve. Pide algo concreto.</p>
      <label for="r1">Cuando pasó…</label><input type="text" id="r1" value="${esc(d.r1)}" placeholder="discutimos por los planes del fin de semana">
      <label for="r2">me sentí…</label><input type="text" id="r2" value="${esc(d.r2)}" placeholder="triste y con miedo">
      <label>Lo que necesito es…</label>${chips('need', NEEDS, d.need)}
      <label for="r4">¿Podrías…?</label><input type="text" id="r4" value="${esc(d.r4)}" placeholder="hablar 10 minutos a las 8 sin pantallas">
      <div class="card soft"><p class="mt0" id="req"></p></div>
      <button class="btn" id="copy">Copiar pedido</button>
      <label>¿Qué tan intenso es ahora? (0 a 10)</label>${range('after', d.intensityAfter ?? Math.max(0, (d.intensityBefore ?? 7) - 2))}
      ${nav('Terminar y guardar')}`;
    const compose = () => {
      const need = chipVal(el, 'need');
      const t = `Cuando ${$('#r1', el).value || '…'}, me sentí ${$('#r2', el).value || '…'}. Lo que necesito es ${(need || '…').toLowerCase()}. ¿Podrías ${$('#r4', el).value || '…'}?`;
      $('#req', el).textContent = t; return t;
    };
    bindChips(el, compose); $$('input[type=text]', el).forEach((i) => i.addEventListener('input', compose)); compose();
    $('#copy', el).onclick = () => copy(compose());
  }

  if (sos.pauseUntil) {
    const upd = () => { const s = Math.round((sos.pauseUntil - Date.now()) / 1000); const l = $('#left', el); if (l) l.textContent = s > 0 ? `faltan ${Math.floor(s / 60)}:${pad(s % 60)}` : 'es hora de volver a hablar'; };
    upd(); every(upd, 1000);
  }
  const grab = () => {
    if ($('input[name=before]', el)) d.intensityBefore = +$('input[name=before]', el).value;
    if ($('#draft', el)) { d.draft = $('#draft', el).value; d.keepDraft = $('#keep', el).checked; }
    if ($('#r1', el)) { d.r1 = $('#r1', el).value; d.r2 = $('#r2', el).value; d.r4 = $('#r4', el).value; d.need = chipVal(el, 'need'); d.intensityAfter = +$('input[name=after]', el).value; d.request = $('#req', el).textContent; }
  };
  $('#back', el).onclick = () => { grab(); sos.step--; render(); };
  $('#next', el).onclick = () => {
    grab();
    if (sos.step < N - 1) { sos.step++; render(); return; }
    db.diary.push({ id: uid(), ts: Date.now(), kind: 'sos', situation: 'Pausa guiada durante una discusión', discussion: true,
      mode: d.mode, intensityBefore: d.intensityBefore, intensity: d.intensityAfter, need: d.need, request: d.request,
      draft: d.keepDraft ? d.draft : undefined });
    save(); sos = null;
    el.innerHTML = `<h1>Lo hiciste</h1><div class="card soft"><p class="mt0">Atravesaste la emoción sin dejar que tomara el control. Eso es entrenar al adulto sano.</p></div>
      <p class="muted">Cuando vuelvas a hablar: escucha, di tu pedido y recuerda que un desacuerdo no es una ruptura.</p>
      <a class="btn primary" href="#/">Volver al inicio</a>`;
  };
});

/* Diario de modos */
route('/diario', (el) => {
  const list = [...db.diary].sort((a, b) => b.ts - a.ts);
  el.innerHTML = `<h1>Diario</h1><p class="muted">Registra una situación cuando pase, o al final del día. Pocos campos, y siempre una respuesta del adulto sano.</p>
    <a class="btn primary" href="#/diario-nuevo">Nuevo registro</a>
    <a class="btn" href="#/patrones">Ver mis patrones</a>
    <div class="card">${list.length ? list.map((e) => {
      const m = MODES.find((x) => x.id === e.mode);
      return `<div class="entry"><div class="meta">${fmtDT(e.ts)}${e.kind === 'sos' ? ' · Pausa guiada' : ''}${e.discussion ? ' · discusión' : ''}</div>
        <div><b>${esc(e.situation || '')}</b></div>
        <div class="small">${m ? esc(m.name) : ''}${e.emotion ? ' · ' + esc(e.emotion) : ''}${e.intensityBefore != null ? ` · ${e.intensityBefore} → ${e.intensity}` : e.intensity != null ? ` · intensidad ${e.intensity}` : ''}</div>
        ${e.need ? `<div class="small muted">Necesidad: ${esc(e.need)}</div>` : ''}
        ${e.response ? `<div class="small">Adulto sano: ${esc(e.response)}</div>` : ''}
        ${e.request ? `<div class="small">Pedido: ${esc(e.request)}</div>` : ''}
        ${e.draft ? `<details><summary class="small">Borrador guardado</summary><p class="small">${esc(e.draft)}</p></details>` : ''}
        <button class="btn link small" data-del="${e.id}">Borrar</button></div>`;
    }).join('') : '<p class="muted mt0">Todavía no hay registros.</p>'}</div>`;
  $$('[data-del]', el).forEach((b) => b.onclick = () => {
    if (!confirm('¿Borrar este registro?')) return;
    db.diary = db.diary.filter((e) => e.id !== b.dataset.del); save(); render();
  });
});

route('/diario-nuevo', (el) => {
  el.innerHTML = `<h1>Nuevo registro</h1>
    <label for="sit">¿Qué pasó? (como lo vería una cámara)</label><textarea id="sit"></textarea>
    <label>¿Fue una discusión de pareja?</label>${chips('disc', ['Sí', 'No'], 'No')}
    <label>¿Qué modo apareció?</label>${chips('mode', MODES)}
    <label>Emoción principal</label>${chips('emotion', EMOTIONS)}
    <label>Intensidad (0 a 10)</label>${range('intensity', 5)}
    <label>¿Qué necesitabas?</label>${chips('need', NEEDS)}
    <label for="resp">¿Qué respondería o haría tu adulto sano?</label><textarea id="resp"></textarea>
    <button class="btn primary" id="save">Guardar</button><a class="btn ghost" href="#/diario">Cancelar</a>`;
  bindChips(el);
  $('#save', el).onclick = () => {
    db.diary.push({ id: uid(), ts: Date.now(), kind: 'registro', situation: $('#sit', el).value.trim(), discussion: chipVal(el, 'disc') === 'Sí',
      mode: chipVal(el, 'mode'), emotion: chipVal(el, 'emotion'), intensity: +$('input[name=intensity]', el).value,
      need: chipVal(el, 'need'), response: $('#resp', el).value.trim() });
    save(); toast('Guardado');
    location.hash = worsening() ? '#/' : '#/diario';
  };
});

/* Patrones */
route('/patrones', (el) => {
  const days = maxIntensityByDay(14);
  const since = Date.now() - 30 * 864e5;
  const counts = MODES.map((m) => ({ m, n: db.diary.filter((e) => e.ts >= since && e.mode === m.id).length }));
  const maxN = Math.max(1, ...counts.map((c) => c.n));
  const needs = {}; db.diary.filter((e) => e.ts >= since && e.need).forEach((e) => { needs[e.need] = (needs[e.need] || 0) + 1; });
  const topNeeds = Object.entries(needs).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const disc = db.diary.filter((e) => e.ts >= since && e.discussion).length;
  el.innerHTML = `<h1>Patrones</h1><p class="muted">Para entenderte, no para juzgarte. El progreso se ve en la intensidad, la duración y cómo respondes.</p>
    <div class="stat"><div><div class="num">${practicedThisMonth()}</div><div class="lbl">días practicados este mes</div></div>
      <div><div class="num">${disc}</div><div class="lbl">discusiones registradas (30 días)</div></div></div>
    <h2>Intensidad más alta por día</h2><p class="small muted">Últimos 14 días, de 0 a 10.</p>
    <div class="card">${barChart(days, { max: 10 })}</div>
    <h2>Modos en los últimos 30 días</h2>
    <div class="card">${counts.map((c) => `<div class="hbar"><span>${esc(c.m.name)}</span><div class="track"><div class="fill" style="width:${(c.n / maxN) * 100}%"></div></div><span>${c.n}</span></div>`).join('')}</div>
    ${topNeeds.length ? `<h2>Lo que más necesitas</h2><div class="card">${topNeeds.map(([k, v]) => `<div class="hbar"><span>${esc(k)}</span><div class="track"><div class="fill" style="width:${(v / topNeeds[0][1]) * 100}%"></div></div><span>${v}</span></div>`).join('')}</div>` : ''}
    ${db.weekly.length ? `<h2>Chequeo semanal de las alarmas</h2><div class="card">${db.weekly.slice(-6).map((w) => `<div class="entry"><span class="meta">${fmtDay(w.ts)}</span> · ${w.score}/10 ${w.score >= 6 ? '(más exigencia que apoyo)' : '(apoyo)'}</div>`).join('')}</div>` : ''}`;
});

/* Cannabis */
route('/cannabis', (el) => {
  const c = db.cannabis, unit = db.settings.cannabisUnit;
  const totalOn = (k) => c.logs.filter((l) => dayKey(new Date(l.ts)) === k).reduce((a, l) => a + l.amount, 0);
  const days = Array.from({ length: 14 }, (_, i) => { const d = addDays(new Date(), i - 13), k = dayKey(d); const t = totalOn(k); return { label: fmtDay(d), short: String(d.getDate()), value: c.logs.length ? t : null }; });
  const plan = c.plan;
  const target = plan ? Math.max(0, Math.round(plan.baseline * Math.pow(1 - plan.pct / 100, Math.floor((Date.now() - plan.start) / (7 * 864e5))) * 2) / 2) : null;
  const today = totalOn(dayKey());
  const motives = {}; c.logs.filter((l) => Date.now() - l.ts < 30 * 864e5).forEach((l) => { motives[l.motive] = (motives[l.motive] || 0) + 1; });
  const mList = Object.entries(motives).sort((a, b) => b[1] - a[1]);
  const last7 = Array.from({ length: 7 }, (_, i) => totalOn(dayKey(addDays(new Date(), -i - 1))));
  const avg7 = Math.round((last7.reduce((a, b) => a + b, 0) / 7) * 2) / 2;

  el.innerHTML = `<h1>Cannabis</h1><p class="muted">Sin juicios. Anotar te ayuda a ver para qué lo usas y cómo se relaciona con tu ánimo.</p>
    <div class="stat"><div><div class="num">${today}</div><div class="lbl">${esc(unit)} hoy</div></div>
      <div><div class="num">${target ?? '—'}</div><div class="lbl">meta diaria de esta semana</div></div></div>
    <div class="card"><h3>Anotar un consumo</h3>
      <label for="amt">Cantidad (${esc(unit)})</label><input type="number" id="amt" min="0" step="0.5" value="1" inputmode="decimal">
      <label>¿Para qué, sobre todo?</label>${chips('motive', CANNABIS_MOTIVES)}
      <label>Malestar justo antes (0 a 10)</label>${range('distress', 5)}
      <button class="btn primary" id="log">Anotar</button></div>
    <h2>Últimos 14 días</h2><div class="card">${barChart(days, { max: Math.max(4, ...days.map((d) => d.value || 0), target || 0), target, unit: ' ' + unit })}
      ${target != null ? '<p class="small muted">La línea punteada es tu meta diaria de esta semana.</p>' : ''}</div>
    ${mList.length ? `<h2>Motivos (30 días)</h2><div class="card">${mList.map(([k, v]) => `<div class="hbar"><span>${esc(k)}</span><div class="track"><div class="fill" style="width:${(v / mList[0][1]) * 100}%"></div></div><span>${v}</span></div>`).join('')}
      <p class="small muted">Usarlo para no sentir o después de una discusión es el motivo que más se asocia con problemas. En terapia de esquemas se parece al modo «protector»: calma ahora, pero la emoción queda sin atender.</p></div>` : ''}
    <h2>Plan gradual</h2>
    ${plan ? `<div class="card"><p class="mt0">Línea base: <b>${plan.baseline} ${esc(unit)}/día</b> · bajar <b>${plan.pct}%</b> cada semana.</p>
        <p>Meta de esta semana: <b>${target} ${esc(unit)}/día</b>.</p><button class="btn ghost" id="reset">Cambiar plan</button></div>`
      : `<div class="card"><p class="mt0">Bajar poco a poco suele hacer más llevadera la abstinencia (no hay estudios que lo comparen con dejarlo de golpe; elige lo que te resulte posible).</p>
        <label for="base">Línea base (${esc(unit)} por día)</label><input type="number" id="base" min="0" step="0.5" value="${avg7 || 2}" inputmode="decimal">
        <p class="small muted">${c.logs.length ? `Tu promedio de los últimos 7 días es ${avg7}.` : 'Anota unos días para conocer tu promedio real.'}</p>
        <label>Reducir cada semana</label>${chips('pct', ['10', '20', '25'], '20')}
        <button class="btn primary" id="plan">Empezar plan</button></div>`}
    <h2>Qué esperar si reduces o dejas</h2>
    <div class="card">${WITHDRAWAL.map(([t, d]) => `<div class="entry"><b>${t}</b><div class="small">${d}</div></div>`).join('')}
      <p class="small muted">Cerca de la mitad de quienes consumen a diario tienen síntomas al dejarlo. Son incómodos pero pasan. Si el consumo es alto o los síntomas son fuertes, busca apoyo: Centros de Integración Juvenil (55 5212 1212, por confirmar) o Línea de la Vida 800 911 2000.</p></div>
    <label for="unit">Unidad que usas</label><input type="text" id="unit" value="${esc(unit)}">
    <button class="btn ghost" id="saveunit">Guardar unidad</button>`;
  bindChips(el);
  $('#log', el).onclick = () => {
    const amount = parseFloat($('#amt', el).value); if (!(amount >= 0)) return toast('Escribe una cantidad');
    c.logs.push({ id: uid(), ts: Date.now(), amount, motive: chipVal(el, 'motive') || 'Sin especificar', distress: +$('input[name=distress]', el).value });
    save(); toast('Anotado'); render();
  };
  $('#plan', el)?.addEventListener('click', () => { c.plan = { baseline: parseFloat($('#base', el).value) || 0, pct: +(chipVal(el, 'pct') || 20), start: Date.now() }; save(); render(); });
  $('#reset', el)?.addEventListener('click', () => { if (confirm('¿Cambiar tu plan?')) { c.plan = null; save(); render(); } });
  $('#saveunit', el).onclick = () => { db.settings.cannabisUnit = $('#unit', el).value.trim() || 'porciones'; save(); render(); };
});

/* Mi tarjeta */
route('/tarjeta', (el) => {
  const c = db.card || {};
  const f = (k, label, ph) => `<label for="${k}">${label}</label><textarea id="${k}" placeholder="${esc(ph)}">${esc(c[k])}</textarea>`;
  el.innerHTML = `<h1>Mi tarjeta</h1><p class="muted">Escríbela en calma, con tus palabras. Aparecerá en el paso 4 de la pausa guiada.</p>
    ${f('feeling', '1. Lo que siento y qué lo disparó', DEFAULT_CARD.feeling)}
    ${f('schema', '2. Qué esquema se activó y de dónde viene', DEFAULT_CARD.schema)}
    ${f('reality', '3. Lo que dice la realidad', DEFAULT_CARD.reality)}
    ${f('behavior', '4. Lo que voy a hacer', DEFAULT_CARD.behavior)}
    <button class="btn primary" id="save">Guardar mi tarjeta</button>`;
  $('#save', el).onclick = () => {
    const v = {}; ['feeling', 'schema', 'reality', 'behavior'].forEach((k) => { v[k] = $('#' + k, el).value.trim() || DEFAULT_CARD[k]; });
    db.card = v; save(); toast('Tarjeta guardada');
  };
});

/* Plan de seguridad (modelo Stanley-Brown) */
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

/* Ayuda */
route('/ayuda', (el) => {
  el.innerHTML = `<h1>Ayuda ahora</h1>
    <div class="card sos"><p class="mt0"><b>Si estás en peligro o piensas en hacerte daño, llama ahora.</b> No tienes que estar seguro de que «es suficientemente grave».</p></div>
    ${CRISIS_LINES.map((l) => `<a class="btn ${l.tel === '911' || l.tel === '8009112000' ? 'sos' : ''}" href="tel:${l.tel}">${esc(l.name)} · ${esc(l.number)}</a><p class="small muted center">${esc(l.note)}</p>`).join('')}
    <a class="btn" href="https://wa.me/525555335533">WhatsApp Consejo Ciudadano</a>
    <p class="small muted">${CRISIS_VERIFIED}</p>
    <a class="btn primary" href="#/plan">Abrir mi plan de seguridad</a>`;
});

/* Más */
route('/mas', (el) => {
  el.innerHTML = `<h1>Más</h1>
    <div class="card">
      <a class="row-link" href="#/patrones">Mis patrones</a>
      <a class="row-link" href="#/tarjeta">Mi tarjeta de afrontamiento</a>
      <a class="row-link" href="#/cannabis">Cannabis: registro y plan</a>
      <a class="row-link" href="#/plan">Mi plan de seguridad</a>
      <a class="row-link" href="#/ayuda">Líneas de ayuda</a>
    </div>
    <div class="card">
      <a class="row-link" href="#/alarmas">Alarmas de la mañana (Atajos)</a>
      <a class="row-link" href="#/datos">Mis datos: copia, importar, borrar</a>
      <a class="row-link" href="#/acerca">Acerca de y buscar terapeuta</a>
    </div>`;
});

/* Alarmas con Atajos */
route('/alarmas', (el) => {
  const s = db.settings;
  el.innerHTML = `<h1>Alarmas de la mañana</h1>
    <p class="muted">Una app web no puede hacer sonar alarmas en el iPhone. Por eso usamos la app <b>Atajos</b> y el <b>Reloj</b>. Esta configuración está <b>por probar</b> en iOS 26: si un paso no aparece igual, me lo dices y lo ajustamos.</p>
    <div class="card">
      <label><input type="checkbox" id="en" ${s.shortcutEnabled ? 'checked' : ''}> Al responder la sesión, apagar las alarmas pendientes</label>
      <label for="sn">Nombre del atajo que apaga las alarmas</label><input type="text" id="sn" value="${esc(s.shortcutName)}">
      <button class="btn primary" id="save">Guardar</button><button class="btn" id="test">Probar el atajo ahora</button>
    </div>
    <h2>Paso 1. Crea 3 alarmas en el Reloj</h2>
    <ol class="steps"><li>Abre <b>Reloj → Alarmas</b> y crea tres alarmas (la hora no importa, las cambia el atajo).</li>
      <li>Ponles de etiqueta <span class="mono">Sesión 1</span>, <span class="mono">Sesión 2</span> y <span class="mono">Sesión 3</span>, y déjalas apagadas.</li></ol>
    <h2>Paso 2. Atajo «Empezar sesión»</h2>
    <ol class="steps"><li>En <b>Atajos</b>, crea un atajo nuevo llamado <span class="mono">Empezar sesión</span>.</li>
      <li>Agrega la acción <b>Ajustar fecha</b>: fecha actual + 5 minutos. Después, la acción de Reloj para <b>cambiar la hora de la alarma</b> «Sesión 1» a ese resultado y <b>activarla</b>.</li>
      <li>Repite para «Sesión 2» (+10 minutos) y «Sesión 3» (+20 minutos).</li>
      <li>Agrega <b>Abrir URL</b> con la dirección de esta app.</li></ol>
    <p class="small muted">Si tu iOS no deja cambiar la hora de una alarma existente, usa la acción <b>Crear alarma</b> con la misma etiqueta; el atajo del paso 4 las apaga igual.</p>
    <h2>Paso 3. Automatización: que empiece sola</h2>
    <ol class="steps"><li><b>Atajos → Automatización → Nueva</b> → <b>Alarma</b> → «Cuando se detiene» tu alarma de despertar → elige <b>Ejecutar inmediatamente</b> → acción: ejecutar <span class="mono">Empezar sesión</span>.</li>
      <li>Para los días sin alarma: otra automatización a la hora de respaldo (por ejemplo <b>8:15</b>) que ejecute lo mismo.</li></ol>
    <h2>Paso 4. Atajo «${esc(s.shortcutName)}»</h2>
    <ol class="steps"><li>Crea un atajo llamado exactamente <span class="mono">${esc(s.shortcutName)}</span>.</li>
      <li>Acción <b>Obtener todas las alarmas</b> → filtra las que tengan etiqueta que contenga «Sesión» → <b>Desactivar alarma</b> para cada una.</li>
      <li>Activa la casilla de arriba. Al terminar tu sesión (o elegir «hoy no»), la app abrirá Atajos un instante para apagar las alarmas.</li></ol>
    <div class="card warn"><p class="mt0 small">Las alarmas son para recordarte, no para exigirte. Empieza con 3. Si el chequeo semanal dice que se sienten como exigencia, quita una o cámbiales el texto por algo amable, por ejemplo: «Tu sesión te espera, aunque sean 2 minutos».</p></div>`;
  $('#save', el).onclick = () => { s.shortcutEnabled = $('#en', el).checked; s.shortcutName = $('#sn', el).value.trim() || 'Sesión hecha'; save(); toast('Guardado'); render(); };
  $('#test', el).onclick = () => { window.location.href = `shortcuts://run-shortcut?name=${encodeURIComponent($('#sn', el).value.trim() || 'Sesión hecha')}`; };
});

/* Mis datos: copia cifrada, importar, borrar */
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function deriveKey(pass, salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function encryptExport(pass) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pass, salt);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(db)));
  return JSON.stringify({ app: 'base-segura', v: 1, salt: b64(salt), iv: b64(iv), data: b64(data) });
}
async function decryptImport(text, pass) {
  const o = JSON.parse(text);
  const key = await deriveKey(pass, unb64(o.salt));
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(o.iv) }, key, unb64(o.data));
  return JSON.parse(new TextDecoder().decode(plain));
}
route('/datos', (el) => {
  el.innerHTML = `<h1>Mis datos</h1>
    <p class="muted">Todo lo que escribes se guarda <b>solo en este iPhone</b>. No se envía a ningún servidor. Si borras la app o los datos de Safari, se pierde: por eso conviene una copia cifrada.</p>
    <div class="card"><h3>Copia cifrada</h3>
      <label for="p1">Contraseña de la copia</label><input type="password" id="p1" autocomplete="new-password">
      <p class="small muted">Sin esta contraseña nadie puede leer la copia, ni tú. Guárdala en un lugar seguro.</p>
      <button class="btn primary" id="exp">Exportar copia</button>
      <p class="small muted">Última copia: ${db.settings.lastExport ? fmtDT(db.settings.lastExport) : 'nunca'}</p></div>
    <div class="card"><h3>Importar una copia</h3>
      <input type="file" id="file" accept=".json,.bss,application/json">
      <label for="p2">Contraseña</label><input type="password" id="p2" autocomplete="current-password">
      <button class="btn" id="imp">Importar (reemplaza lo actual)</button></div>
    <div class="card sos"><h3>Borrar todo</h3><p class="small">Elimina todos tus registros de este iPhone. No se puede deshacer.</p>
      <button class="btn sos" id="del">Borrar todos mis datos</button></div>`;
  $('#exp', el).onclick = async () => {
    const pass = $('#p1', el).value; if (pass.length < 6) return toast('Usa una contraseña de al menos 6 caracteres');
    const text = await encryptExport(pass);
    const name = `base-segura-${dayKey()}.json`;
    const file = new File([text], name, { type: 'application/json' });
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
      db = { ...DEFAULTS(), ...data }; save(); toast('Copia importada'); location.hash = '#/';
    } catch { toast('Contraseña incorrecta o archivo no válido'); }
  };
  $('#del', el).onclick = () => {
    if (!confirm('¿Borrar todos tus datos de este iPhone?')) return;
    if (!confirm('Última confirmación: no se puede deshacer.')) return;
    localStorage.removeItem(KEY); db = DEFAULTS(); toast('Datos borrados'); location.hash = '#/';
  };
});

/* Acerca */
route('/acerca', (el) => {
  el.innerHTML = `<h1>Acerca de Base Segura</h1>
    <p>Una app personal para practicar cada día las herramientas de la terapia de esquemas (niño vulnerable, protector, crítico y adulto sano) y otras con buena evidencia (respiración lenta, pausa con hora de regreso, revisar los hechos, autocompasión).</p>
    <div class="card warn"><p class="mt0"><b>No sustituye la psicoterapia.</b> Los ejercicios son de autoayuda y no hay estudios de apps centradas en el esquema de abandono. Si aparece angustia intensa, detente, vuelve al presente y busca apoyo profesional.</p></div>
    <h2>Buscar un terapeuta de esquemas en México</h2>
    <p>Programas de formación aprobados por la sociedad internacional de terapia de esquemas (ISST) en México: IMTE (soyimte.com), Esquema México (esquemamexico.com), terapiaesquemas.com y ADE México (alianzaesquemas.org). Pregunta allí por terapeutas formados.</p>
    <p>Verifica la cédula profesional gratis en <a href="https://cedulaprofesional.sep.gob.mx">cedulaprofesional.sep.gob.mx</a>.</p>
    <p>Opción gratuita: Programa de Atención Psicológica a Distancia de la UNAM, <a href="tel:5550250855">55 5025 0855</a> (lunes a viernes, 8 a 18 h).</p>
    <h2>Privacidad</h2>
    <p class="small">Sin cuentas, sin rastreadores y sin servidores: tus datos viven solo en tu iPhone. La app guarda sus archivos para funcionar sin internet.</p>
    <p class="small muted">Versión demo 0.1</p>`;
});

/* ───────────── Arranque ───────────── */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
render();
