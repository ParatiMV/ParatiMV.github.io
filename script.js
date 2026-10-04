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

// --- Experiencia ---
async function password() {
  const s = await go(`${lines(T.gate)}<div class="pw l"><div class="pw-field"><input id="pw" type="password" autocomplete="off" autocapitalize="off" aria-label="Contraseña" placeholder="Contraseña"><button class="pw-eye" id="pwEye" type="button" aria-label="Mostrar contraseña" aria-pressed="false">Mostrar</button></div><button class="btn on" id="ok">Entrar</button></div><p class="err" id="err"></p>`, 'warm');
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

async function intro() {
  const s = await go(`
    <p class="l kick">15 años, la criatura.</p>
    <p class="l">Hoy te toca recibir tu regalito.</p>
    <p class="small l">Y ahora sí, empieza.</p>
  `, 'rose');
  await reveal(s, 1400);
  await sleep(900);
  await btn(s, 'Seguir');
}

async function letter() {
  const paras = CONFIG.personalMessage.trim().split(/\n\s*\n/);
  const s = await go(`
    <div class="letter-scene">
      <div class="letter">${paras.map(p => `<p class="l">${esc(p.trim()).replace(/\n/g, '<br>')}</p>`).join('')}</div>
      <div class="letter-actions" id="letterActions"></div>
    </div>
  `, 'warm');
  s.classList.add('letter-scene-root');
  for (const p of s.querySelectorAll('.letter .l')) {
    p.classList.add('on');
    await sleep(700);
  }
  await sleep(500);
  const actions = $('#letterActions');
  await new Promise(res => {
    const b = document.createElement('button');
    b.className = 'btn on';
    b.textContent = 'Seguir';
    b.onclick = () => { b.disabled = true; res(); };
    actions.append(b);
  });
}

async function artist() {
  const s = await go(`<h1 class="l">${esc(T.artistTitle)}</h1><figure class="photo" id="ph"><img alt="" src="${esc(CONFIG.artistImage)}"></figure><p class="small l artist-tip">Mantén pulsada la foto para guardarla.</p>`, 'night');
  s.querySelector('img').onerror = e => { e.target.replaceWith(Object.assign(document.createElement('p'), { className: 'small', textContent: 'Falta ' + CONFIG.artistImage })); };
  s.querySelector('h1').classList.add('on');
  await sleep(2600);
  $('#ph').classList.add('on');
  await sleep(3600);
  const tip = s.querySelector('.artist-tip');
  tip.classList.add('on');
  await btn(s, 'Siguiente');
}

async function art() {
  const guard = await go(`
    <p class="l kick">Antes de seguir…</p>
    <p class="l">Asegúrate de que no haya nadie mirando.</p>
    <p class="small l">Lo que viene ahora es solo para ti.</p>
  `, 'black');
  await reveal(guard, 1200);
  await btn(guard, 'Estoy a solas');

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
}

async function theEnd() {
  await go(`<h1 class="final l on">${esc(T.final)}</h1>`, 'warm');
}

async function story() {
  setupMusic();
  await password();
  await intro();
  await letter();
  await artist();
  await art();
  await theEnd();
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
