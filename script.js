// Motor de escenas: una escena a la vez, con transiciones suaves. Los textos viven en config.js.
const T = CONFIG.texts, $ = s => document.querySelector(s), app = $('#app');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
for (const [k, v] of Object.entries(CONFIG.colors)) document.documentElement.style.setProperty('--' + k, v);

// --- Detección de PWA instalada (standalone) ---
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
// Solo para probar en tu ordenador: http://localhost:8000/?dev
const dev = ['localhost', '127.0.0.1'].includes(location.hostname) && location.search.includes('dev');
const ua = navigator.userAgent;
const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /Android/.test(ua);

async function go(html, mood) {
  const cur = app.firstElementChild;
  if (cur) { cur.classList.add('out'); await sleep(800); cur.remove(); }
  if (mood) document.body.dataset.m = mood;
  const s = document.createElement('section');
  s.className = 'scene'; s.innerHTML = html; app.append(s);
  await sleep(40); s.classList.add('in'); return s;
}
const reveal = async (root, gap = 1500) => { for (const n of root.querySelectorAll('.l')) { n.classList.add('on'); await sleep(gap); } };
const btn = (root, label, cls = '') => new Promise(res => {
  const wrap = document.createElement('div');
  wrap.className = 'btn-slot';
  const b = document.createElement('button');
  b.className = 'btn ' + cls;
  b.textContent = label;
  b.onclick = () => { b.disabled = true; res(); };
  wrap.append(b);
  root.append(wrap);
  requestAnimationFrame(() => b.classList.add('on'));
});
const lines = (arr, first) => arr.map((t, i) => `<p class="l ${i === 0 && first ? 'kick' : ''}">${esc(t)}</p>`).join('');

// --- Fuera de la PWA: instalación obligatoria ---
let deferred = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('#inst')?.removeAttribute('hidden'); });
addEventListener('appinstalled', () => { if (!standalone()) almost(); });

const STEPS = {
  ios: ['Abre esta página en <b>Safari</b> y dale click a <b>las tres rayas</b>.', 'Elige <b>Compartir</b> y luego <b>Añadir a pantalla de inicio</b>.', 'Click en <b>Añadir</b>.', 'Cierra Safari y abre la app desde el <b>nuevo icono</b>.'],
  android: ['Si aparece, pulsa <b>Instalar</b> aquí abajo.', 'Si no, abre el menú ⋮ de Chrome y elige <b>Instalar aplicación</b> o <b>Añadir a pantalla de inicio</b>.', 'Confirma la instalación.', 'Abre la app desde el <b>nuevo icono</b>.'],
  other: ['Ábrela desde el móvil: es ahí donde tiene sentido 💞', 'En el navegador: menú → <b>Instalar aplicación</b> / <b>Añadir a pantalla de inicio</b>.', 'Abre la app desde el <b>nuevo icono</b>.']
};
async function install() {
  const steps = STEPS[isIOS ? 'ios' : isAndroid ? 'android' : 'other'];
  const s = await go(`<p class="l kick">${esc(T.installKicker)}</p>${lines(T.install)}
    <ol class="steps l">${steps.map(x => `<li><span>${x}</span></li>`).join('')}</ol>
    <button class="btn l" id="inst" hidden>Instalar</button>`, 'warm');
  reveal(s, 1300);
  $('#inst').onclick = async () => { if (deferred) { deferred.prompt(); await deferred.userChoice; deferred = null; $('#inst').hidden = true; } };
  if (deferred) $('#inst').hidden = false;
  await sleep(4500);
  await btn(s, 'Ya está instalada');
  almost();
}
async function almost() {      // Nunca desbloquea: solo vuelve a comprobar.
  if (standalone()) return location.reload();
  const s = await go(lines(T.almost, true) + '<button class="btn ghost on" id="back">Ver instrucciones otra vez</button>', 'night');
  reveal(s, 1200); $('#back').onclick = install;
}

// --- Entrada y archivo de cumpleaños ---
async function password() {
  const s = await go(`${lines(T.gate)}<div class="pw l"><input id="pw" type="password" autocomplete="off" autocapitalize="off" aria-label="Contraseña" placeholder="Contraseña"><div class="pw-actions"><button class="btn pw-enter on" id="ok">Entrar</button><button class="pw-eye" id="pwEye" type="button" aria-label="Mostrar contraseña" aria-pressed="false">Mostrar</button></div></div><p class="err" id="err"></p>`, 'warm');
  reveal(s, 1300);
  const i = $('#pw'), eye = $('#pwEye');
  eye.onclick = () => {
    const visible = i.type === 'text';
    i.type = visible ? 'password' : 'text';
    eye.textContent = visible ? 'Mostrar' : 'Ocultar';
    eye.classList.toggle('open', !visible);
    eye.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
    eye.setAttribute('aria-pressed', String(!visible));
  };
  await new Promise(res => {
    const check = () => {
      if (i.value.trim().toLowerCase() === CONFIG.password.toLowerCase()) { window.startMusic?.(); return res(); }
      $('#err').textContent = CONFIG.passwordHint || 'Esa no es.';
      i.classList.remove('shake'); void i.offsetWidth; i.classList.add('shake');
    };
    $('#ok').onclick = check; i.onkeydown = e => { if (e.key === 'Enter') check(); };
  });
}

const YEARS = Array.from({ length: 20 }, (_, i) => 2026 + i);
let pageHistory = [], historyIndex = 0, currentPage = 0, pageNav = null;
const STORY_PAGES = 6; // 2026: intro, carta, artista, aviso, arte, final

async function yearHub() {
  const cards = YEARS.map(year => year === 2026
    ? `<button class="year-card complete" data-year="${year}"><span class="year-number">${year}</span><span class="year-status">Completado</span></button>`
    : `<button class="year-card upcoming" data-year="${year}"><span class="year-number">${year}</span><span class="year-status">Próximamente</span></button>`).join('');
  const s = await go(`<p class="l kick">Para ti, cada año.</p><h1 class="l archive-title">Tus cumpleaños</h1><p class="small l">Un capítulo por cada vuelta al sol.</p><div class="year-grid l">${cards}</div>`, 'night');
  await reveal(s, 650);
  s.querySelectorAll('.year-card').forEach(card => card.onclick = () => {
    const year = Number(card.dataset.year);
    if (year === 2026) startJourney();
    else upcomingYear(year);
  });
}

async function upcomingYear(year) {
  const s = await go(`<p class="l kick">${year}</p><h1 class="l archive-title">Próximamente</h1><p class="l">Este capítulo todavía no está escrito.</p><p class="small l">Cuando llegue tu cumpleaños, aquí tendrás tu propio recuerdo.</p>`, 'night');
  await reveal(s, 900);
  await btn(s, 'Volver al archivo').then(yearHub);
}

function makePageNav() {
  if (pageNav) return pageNav;
  pageNav = document.createElement('nav');
  pageNav.className = 'page-nav';
  pageNav.setAttribute('aria-label', 'Navegación de páginas');
  pageNav.innerHTML = '<button class="page-arrow" id="pageBack" aria-label="Página anterior">‹</button><span class="page-count" id="pageCount">01 / 06</span><button class="page-arrow" id="pageForward" aria-label="Volver a una página visitada">›</button>';
  document.body.append(pageNav);
  $('#pageBack').onclick = () => { if (historyIndex > 0) { historyIndex--; currentPage = pageHistory[historyIndex]; renderPage(currentPage); } };
  $('#pageForward').onclick = () => { if (historyIndex < pageHistory.length - 1) { historyIndex++; currentPage = pageHistory[historyIndex]; renderPage(currentPage); } };
  return pageNav;
}
function updatePageNav(show) {
  const nav = makePageNav();
  nav.hidden = !show;
  if (!show) return;
  $('#pageCount').textContent = `${String(currentPage + 1).padStart(2, '0')} / ${String(STORY_PAGES).padStart(2, '0')}`;
  $('#pageBack').disabled = historyIndex <= 0;
  $('#pageForward').disabled = historyIndex >= pageHistory.length - 1;
}
function goNextPage() {
  const next = currentPage + 1;
  if (next >= STORY_PAGES) return;
  if (historyIndex < pageHistory.length - 1 && pageHistory[historyIndex + 1] === next) historyIndex++;
  else { pageHistory = pageHistory.slice(0, historyIndex + 1); pageHistory.push(next); historyIndex++; }
  currentPage = next;
  renderPage(currentPage);
}
function startJourney() {
  pageHistory = [0]; historyIndex = 0; currentPage = 0;
  renderPage(0);
}

async function renderPage(index) {
  currentPage = index;
  // La navegación pertenece a toda la historia, incluso al vídeo y al final.
  // La composición del vídeo no se modifica: la navegación es un elemento fijo independiente.
  updatePageNav(true);
  if (index === 0) return renderIntro();
  if (index === 1) return renderLetter();
  if (index === 2) return renderArtist();
  if (index === 3) return renderGuard();
  if (index === 4) return renderArt();
  return renderEnd();
}

async function renderIntro() {
  const s = await go(`
    <p class="l kick">15 años, la criatura.</p>
    <p class="l">Hoy te toca recibir tu regalito.</p>
    <p class="small l">Cuando estés lista, dale a empezar.</p>
  `, 'rose');
  s.classList.add('has-page-nav');
  await reveal(s, 1400);
  await sleep(500);
  await btn(s, 'Empezar');
  goNextPage();
}

async function renderLetter() {
  const paras = CONFIG.personalMessage.trim().split(/\n\s*\n/);
  const s = await go(`
    <div class="letter-scene">
      <p class="l heart-line">Y, desde el fondo de mi corazón…</p>
      <div class="letter">${paras.map(p => `<p class="l">${esc(p.trim()).replace(/\n/g, '<br>')}</p>`).join('')}</div>
      <div class="letter-actions"><button class="btn on" id="letterNext">Seguir</button></div>
    </div>
  `, 'warm');
  s.classList.add('letter-scene-root', 'has-page-nav');
  for (const p of s.querySelectorAll('.heart-line, .letter .l')) { p.classList.add('on'); await sleep(700); }
  $('#letterNext').onclick = goNextPage;
}

async function renderArtist() {
  const s = await go(`<h1 class="l">${esc(T.artistTitle)}</h1><figure class="photo" id="ph"><img alt="" src="${esc(CONFIG.artistImage)}"></figure><p class="small l artist-tip">Mantén pulsada la foto para guardarla.</p>`, 'night');
  s.classList.add('has-page-nav');
  s.querySelector('img').onerror = e => { e.target.replaceWith(Object.assign(document.createElement('p'), { className: 'small', textContent: 'Falta ' + CONFIG.artistImage })); };
  s.querySelector('h1').classList.add('on');
  await sleep(1000);
  $('#ph').classList.add('on');
  await sleep(1200);
  s.querySelector('.artist-tip').classList.add('on');
  await btn(s, 'Siguiente');
  goNextPage();
}

async function renderGuard() {
  const s = await go(`
    <p class="l kick">Antes de seguir…</p>
    <p class="l">Asegúrate de que no haya nadie mirando.</p>
    <p class="small l">Lo que viene ahora es solo para ti.</p>
  `, 'black');
  s.classList.add('has-page-nav');
  await reveal(s, 1200);
  await btn(s, 'Estoy a solas');
  goNextPage();
}

// EL ARTE: se conserva la composición, proporción y controles del vídeo aprobados.
async function renderArt() {
  const s = await go(`<h1 class="l">${esc(T.artTitle)}</h1><div class="vid" id="vid"><video playsinline preload="metadata" src="${esc(CONFIG.finalVideo)}"></video><div class="play" id="play">▶</div></div><div class="art-actions"><button class="btn" id="lastDoor">Y por último...</button></div>`, 'black');
  s.classList.add('art-scene');
  $('#music').hidden = true; window.bgAudio?.pause();
  const v = s.querySelector('video'), play = $('#play'), lastDoor = $('#lastDoor');
  s.querySelector('h1').classList.add('on');
  await sleep(1200);
  $('#vid').classList.add('on');
  lastDoor.disabled = true;
  lastDoor.classList.remove('on');
  v.onerror = () => { play.textContent = 'Falta ' + CONFIG.finalVideo; play.style.fontSize = '1rem'; };
  v.onloadedmetadata = () => {
    if (v.videoWidth && v.videoHeight) s.style.setProperty('--video-native-ratio', `${v.videoWidth} / ${v.videoHeight}`);
  };
  play.onclick = () => v.play().catch(() => {});
  v.onplay = () => play.classList.add('gone');
  v.onclick = () => v.paused ? v.play().catch(() => {}) : v.pause();
  await new Promise(res => v.onended = res);
  await sleep(500);
  lastDoor.disabled = false;
  requestAnimationFrame(() => lastDoor.classList.add('on'));
  await new Promise(res => lastDoor.onclick = () => { lastDoor.disabled = true; res(); });
  goNextPage();
}

async function renderEnd() {
  updatePageNav(true);
  await go(`<h1 class="final l on">${esc(T.final)}</h1>`, 'warm');
}

async function story() {
  setupMusic();
  await password();
  await yearHub();
}

function setupMusic() {
  if (!CONFIG.music) return;
  const a = window.bgAudio = new Audio(CONFIG.music), b = $('#music'); a.loop = true; a.volume = .35; b.hidden = false;
  b.onclick = () => { if (a.paused) { a.play(); b.classList.remove('off'); } else { a.pause(); b.classList.add('off'); } };
  b.classList.add('off');
  const stopMusic = () => {
    if (!a.paused) a.pause();
    b.classList.add('off');
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopMusic(); });
  addEventListener('pagehide', stopMusic);
  addEventListener('blur', stopMusic);
  window.stopMusic = stopMusic;
  window.startMusic = () => a.play().then(() => b.classList.remove('off')).catch(() => {});
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
addEventListener('load', async () => {
  await sleep(900); $('#boot').classList.add('gone');
  (standalone() || dev) ? story() : install();
});
