// Motor de escenas: una escena a la vez, con transiciones suaves. Los textos viven en config.js.
const T = CONFIG.texts, $ = s => document.querySelector(s), app = $('#app');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const cleanText = s => String(s).replace(/\bvosotros\b/gi, 'nosotros').replace(/\bvosotras\b/gi, 'nosotras').replace(/\bvuestra\b/gi, 'nuestra').replace(/\bvuestras\b/gi, 'nuestras').replace(/\bvuestro\b/gi, 'nuestro').replace(/\bvuestros\b/gi, 'nuestros').replace(/\bustedes\b/gi, 'nosotros');
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
const lines = (arr, first) => arr.map((t, i) => `<p class="l ${i === 0 && first ? 'kick' : ''}">${esc(cleanText(t))}</p>`).join('');

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
  const s = await go(lines(T.intro), 'rose'); await reveal(s, 1700); await sleep(1800);
}
async function universe() {
  // Solo recuerdos que salen del chat y que tienen sentido por sí mismos.
  const memories = [
    { emoji: '🍓', title: 'Fresas', reveal: 'besis de fresii', detail: '3 de abril de 2025 · Carmen: «Besis» · Anas: «besis de fresii» · Carmen: «Besis a mi biscoquito de nata 😍»' },
    { emoji: '🏊', title: 'Piscina', reveal: 'voy a la piscina', detail: '25 de julio de 2025 · Anas: «voy a la piscina» · Una de esas cosas que aparecen una y otra vez en el chat.' },
    { emoji: '👑', title: 'Quién manda', reveal: 'Mando yo', detail: '3 de abril de 2025 · Carmen: «Yo soy el jefe» · Carmen: «Mando yo».' },
    { emoji: '🦄', title: 'Unicornio', reveal: 'me siento unicornio', detail: '10 de abril de 2025 · Anas: «me siento unicornio» · 12 de abril: Carmen: «Te identificas como unicornio?»' },
    { emoji: '🎶', title: 'Romeo Santos', reveal: 'You — Romeo Santos', detail: '22 de mayo de 2026 · Carmen: «Romeo santos muy tu». Esta canción te la dedico a ti.' },
    { emoji: '🍦', title: 'Heladito', reveal: 'heladito de vainilla', detail: '3 de abril de 2025 · Carmen: «Muchos besitos a mi heladito de vainilla».' },
    { emoji: '📱', title: 'TikTok', reveal: 'Que me copias 😒', detail: '14 de marzo de 2025 · Carmen: «Que me copias 😒». Y esa frase volvió a aparecer muchas veces después.' }
  ];
  const s = await go(`
    <p class="l kick">${esc(T.universe)}</p>
    <div class="memory-grid l" id="memoryGrid">
      ${memories.map((m, i) => `<button class="memory-card" data-i="${i}"><span class="memory-emoji">${m.emoji}</span><span>${esc(m.title)}</span></button>`).join('')}
    </div>
    <div class="memory-detail" id="memoryDetail" aria-live="polite" aria-hidden="true">
      <div class="memory-detail-inner">
        <button class="memory-close" id="memoryClose" aria-label="Cerrar">×</button>
        <div class="memory-detail-emoji" id="memoryEmoji"></div>
        <div class="memory-detail-title" id="memoryTitle"></div>
        <div class="memory-detail-reveal" id="memoryReveal"></div>
        <div class="memory-detail-text" id="memoryText"></div>
      </div>
    </div>
  `, 'rose');
  reveal(s, 600);
  const detail = $('#memoryDetail');
  const openMemory = async i => {
    const m = memories[i];
    $('#memoryEmoji').textContent = m.emoji;
    $('#memoryTitle').textContent = m.title;
    $('#memoryReveal').textContent = m.reveal;
    $('#memoryText').textContent = m.detail;
    detail.setAttribute('aria-hidden', 'false');
    detail.classList.add('on');
  };
  s.querySelectorAll('.memory-card').forEach(card => card.onclick = () => openMemory(Number(card.dataset.i)));
  $('#memoryClose').onclick = () => { detail.classList.remove('on'); detail.setAttribute('aria-hidden', 'true'); };
  await btn(s, 'Seguir');
}

async function eggs() {
  // Esta sección usa fragmentos reales del chat. La etiqueta identifica a la persona, no dice "Tú".
  const moments = [
    { date: '14 MAR 2025', title: 'Una conversación cualquiera', lines: [
      ['Carmen', 'Me encantas tu'],
      ['Anas', 'tu me enseñaste a amar definitivamente'],
      ['Carmen', 'Que me copias 😒']
    ]},
    { date: '03 ABR 2025', title: 'Besis de fresi', lines: [
      ['Carmen', 'Besiss'],
      ['Anas', 'besis de fresii'],
      ['Carmen', 'Besis a mi biscoquito de nata 😍'],
      ['Carmen', 'Muchos besitos a mi heladito de vainilla']
    ]},
    { date: '22 MAY 2026', title: 'Romeo', lines: [
      ['Carmen', 'Romeo santos muy tu'],
      ['Anas', 'si?'],
      ['Carmen', 'Tú para mí']
    ]},
    { date: '27 JUL 2025', title: 'Piscina', lines: [
      ['Anas', 'gracias por nu enfadarte conmigo por estar una semana solo en piscinas,te amo mucho']
    ]}
  ];

  const s = await go(`
    <p class="l kick">${esc(T.eggs)}</p>
    <p class="small l">Hay conversaciones que no necesitan explicación.</p>
    <div class="moment-list l" id="momentList">
      ${moments.map((m, i) => `<button class="moment-link" data-i="${i}"><span>${esc(m.date)}</span><strong>${esc(m.title)}</strong></button>`).join('')}
    </div>
    <div class="chat-sheet" id="chatSheet" aria-hidden="true">
      <div class="chat-sheet-inner">
        <button class="chat-close" id="chatClose" aria-label="Cerrar">×</button>
        <div class="chat-date" id="chatDate"></div>
        <div class="chat-title" id="chatTitle"></div>
        <div class="chat-lines" id="chatLines"></div>
      </div>
    </div>
  `, 'blue');
  await reveal(s, 700);

  const sheet = $('#chatSheet');
  const openChat = i => {
    const m = moments[i];
    $('#chatDate').textContent = m.date;
    $('#chatTitle').textContent = m.title;
    $('#chatLines').innerHTML = m.lines.map(([who, text]) => `
      <div class="chat-line ${who === 'Carmen' ? 'carmen' : 'anas'}">
        <span class="chat-who">${esc(who)}</span>
        <span class="chat-text">${esc(text)}</span>
      </div>`).join('');
    sheet.setAttribute('aria-hidden', 'false');
    sheet.classList.add('on');
  };
  s.querySelectorAll('.moment-link').forEach(link => link.onclick = () => openChat(Number(link.dataset.i)));
  $('#chatClose').onclick = () => { sheet.classList.remove('on'); sheet.setAttribute('aria-hidden', 'true'); };
  await btn(s, 'Seguir');
}

async function letter() {
  const paras = cleanText(CONFIG.personalMessage).trim().split(/\n\s*\n/);
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
  window.startMusic = () => a.play().then(() => b.classList.remove('off')).catch(() => {});
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
addEventListener('load', async () => {
  await sleep(900); $('#boot').classList.add('gone');
  (standalone() || dev) ? story() : install();
});
