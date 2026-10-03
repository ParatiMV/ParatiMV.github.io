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
  ios: ['Abre esta página en <b>Safari</b> y pulsa <b>Compartir</b> (el cuadrado con la flecha ↑).', 'Elige <b>Añadir a pantalla de inicio</b>.', 'Pulsa <b>Añadir</b>.', 'Cierra Safari y abre la app desde el <b>nuevo icono</b>.'],
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
  const s = await go(`${lines(T.gate)}<div class="pw l"><input id="pw" type="password" autocomplete="off" autocapitalize="off" aria-label="Contraseña" placeholder="Contraseña"><button class="btn on" id="ok">Entrar</button></div><p class="err" id="err"></p>`, 'warm');
  reveal(s, 1300);
  const i = $('#pw');
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
  // El texto ahora explica la interacción real: hay cosas que debe tocar para descubrir.
  const s = await go(`
    <p class="l kick">Vale.</p>
    <p class="l">Hay cosas aquí que solo aparecen cuando las tocas.</p>
    <p class="small l">No tienes que resolver nada. Solo descubre lo que reconozcas.</p>
  `, 'rose');
  await reveal(s, 1500);
  await sleep(700);
  await btn(s, 'Empezar');
}
async function universe() {
  // Aquí empieza la parte de descubrimiento: tocar una cosa la muestra,
  // pero algunas esconden un segundo detalle si vuelves a insistir.
  const U = CONFIG.universe;
  const E = CONFIG.easterEggs;
  const secretMap = [0, 2, 5, 8];
  const found = new Set();
  const s = await go(`
    <p class="l kick">${esc(T.universe)}</p>
    <p class="small l">Toca una cosa para verla. Algunas esconden algo más.</p>
    <div class="orbs">${U.map((u, i) => `<button class="orb" data-i="${i}" aria-label="${esc(u.text)}">${u.emoji}</button>`).join('')}</div>
    <p class="orb-cap" id="cap">&nbsp;</p>
  `, 'rose');
  await reveal(s, 650);

  s.querySelectorAll('.orb').forEach(o => {
    let taps = 0;
    let timer = null;
    o.onclick = async () => {
      const i = Number(o.dataset.i);
      const cap = $('#cap');
      taps++;
      cap.classList.remove('on');
      await sleep(180);

      if (secretMap.includes(i) && taps >= 2) {
        const secretIndex = secretMap.indexOf(i);
        cap.textContent = E[secretIndex]?.phrase || U[i].text;
        o.classList.add('egg-found');
        found.add(i);
      } else {
        cap.textContent = U[i].text;
        o.classList.add('seen');
      }
      cap.classList.add('on');

      if (found.size === secretMap.length && !s.querySelector('.btn-slot')) {
        await sleep(900);
        btn(s, 'Seguir');
      }
    };
    o.addEventListener('dblclick', e => e.preventDefault());
  });
}
async function eggs() {
  // Segunda capa: los easter eggs ya descubiertos vuelven a aparecer aquí,
  // pero como recuerdos sueltos, no como un menú de acertijos.
  const E = CONFIG.easterEggs;
  const selected = E.slice(4, 12);
  const s = await go(`
    <p class="l kick">${esc(T.eggs)}</p>
    <p class="small l">No hace falta encontrar todos. Solo mira qué se esconde.</p>
    <div class="egg-grid l" id="eggGrid">
      ${selected.map((_, i) => `<button class="egg-tile" data-i="${i}" aria-label="Descubrir">?</button>`).join('')}
    </div>
    <p class="orb-cap" id="eggCap">&nbsp;</p>
  `, 'blue');
  reveal(s, 1000);

  const order = [2, 6, 0, 5, 3, 7, 1, 4];
  const discovered = new Set();
  s.querySelectorAll('.egg-tile').forEach(tile => {
    tile.onclick = async () => {
      const i = Number(tile.dataset.i);
      if (tile.classList.contains('found')) return;
      tile.classList.add('found');
      const phrase = selected[order[i]]?.phrase || selected[i]?.phrase || '';
      $('#eggCap').classList.remove('on');
      await sleep(180);
      $('#eggCap').textContent = phrase;
      $('#eggCap').classList.add('on');
      discovered.add(i);
      if (discovered.size >= 4 && !s.querySelector('.btn-slot')) {
        await sleep(700);
        btn(s, 'Seguir');
      }
    };
  });
}
async function letter() {
  const paras = CONFIG.personalMessage.trim().split(/\n\s*\n/);
  const s = await go(`<div class="letter">${paras.map(p => `<p class="l">${esc(p.trim()).replace(/\n/g, '<br>')}</p>`).join('')}</div>`, 'warm');
  for (const p of s.querySelectorAll('.l')) {
    p.classList.add('on');
    await sleep(900 + p.textContent.length * 35);
  }
  await sleep(800); await btn(s, 'Seguir');
}
async function fakeEnd() {
  await go(`<p class="l on">${esc(T.fakeEnd[0])}</p>`, 'night'); await sleep(3200);
  await go(`<p class="l on kick">${esc(T.fakeEnd[1])}</p>`, 'night'); await sleep(2600);
}
async function artist() {
  const s = await go(`<h1 class="l">${esc(T.artistTitle)}</h1><figure class="photo" id="ph"><img alt="" src="${esc(CONFIG.artistImage)}"></figure>`, 'night');
  s.querySelector('img').onerror = e => { e.target.replaceWith(Object.assign(document.createElement('p'), { className: 'small', textContent: 'Falta ' + CONFIG.artistImage })); };
  s.querySelector('h1').classList.add('on'); await sleep(2600);
  $('#ph').classList.add('on'); await sleep(3600); await btn(s, 'Siguiente');
}
async function art() {
  // Antes de mostrar EL ARTE, se confirma que está a solas.
  const guard = await go(`
    <p class="l kick">Antes de seguir…</p>
    <p class="l">Asegúrate de que no haya nadie mirando.</p>
    <p class="small l">Lo que viene ahora es solo para ti.</p>
  `, 'black');
  await reveal(guard, 1200);
  await btn(guard, 'Estoy a solas');

  const s = await go(`<h1 class="l">${esc(T.artTitle)}</h1><div class="vid" id="vid"><video playsinline preload="auto" src="${esc(CONFIG.finalVideo)}"></video><div class="play" id="play">▶</div></div>`, 'black');
  $('#music').hidden = true; window.bgAudio?.pause();
  const v = s.querySelector('video'), play = $('#play');
  s.querySelector('h1').classList.add('on'); await sleep(1800); $('#vid').classList.add('on');
  v.onerror = () => { play.textContent = 'Falta ' + CONFIG.finalVideo; play.style.fontSize = '1rem'; };
  v.onloadedmetadata = () => {
    if (v.videoWidth && v.videoHeight) s.style.setProperty('--video-ratio', `${v.videoWidth} / ${v.videoHeight}`);
  };
  play.onclick = () => v.play();
  v.onplay = () => play.classList.add('gone');
  v.onclick = () => v.paused ? v.play() : v.pause();
  await new Promise(res => v.onended = res);

  // El cumpleaños NO aparece automáticamente: ella tiene que abrir la última puerta.
  await btn(s, 'Y por último...');
}
async function theEnd() {   // Final absoluto: sin botones, sin salida.
  await go(`<h1 class="final l on">${esc(T.final)}</h1>`, 'warm');
}
async function story() {
  setupMusic();
  await password(); await intro(); await universe(); await eggs(); await letter();
  await fakeEnd(); await artist(); await art(); await theEnd();
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
  // Al salir, bloquear el móvil o cambiar de app, la música se detiene.
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
