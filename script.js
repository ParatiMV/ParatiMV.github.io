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
  // Recuerdos reales del chat: cada elemento representa algo que sí aparece
  // repetidamente entre vosotros. No hay que completar una cuadrícula para seguir.
  const memories = [
    { emoji: '🍓', title: 'Fresas', reveal: 'Besis de fresiii 🍓', detail: 'Una despedida que acabó convirtiéndose en una frase vuestra.' },
    { emoji: '🎮', title: 'Brawl Stars', reveal: '¿Al Brawl?', detail: 'El juego que aparecía una y otra vez en vuestras conversaciones.' },
    { emoji: '📱', title: 'TikTok', reveal: 'Que me copias 😒', detail: 'Una de esas frases pequeñas que se repetían entre bromas.' },
    { emoji: '🏊', title: 'Piscina', reveal: '5 años más tarde', detail: 'Una frase que aparecía incluso cuando la espera era mucho más corta.' },
    { emoji: '👑', title: 'Yo mando', reveal: 'Porque yo mando', detail: 'Sí, esta discusión también tiene historia.' },
    { emoji: '🦄', title: 'Unicornio', reveal: 'Me siento unicornio', detail: 'Una frase que ya estaba entre las cosas que querías guardar.' },
    { emoji: '🎶', title: 'Romeo Santos', reveal: 'Romeo Santos muy tú', detail: 'Otra referencia que terminó quedándose asociada a vosotros.' },
    { emoji: '🍦', title: 'Helado', reveal: 'Muchos besitos a mi heladito de vainilla', detail: 'El helado aparece tantas veces que era imposible no dejarlo aquí.' },
    { emoji: '🍄', title: 'Seta', reveal: 'Seta', detail: 'Esta palabra se convirtió en una referencia recurrente del chat.' }
  ];

  const s = await go(`
    <p class="l kick">Toca algo que te suene.</p>
    <p class="small l">No hay orden correcto. Solo recuerdos.</p>
    <div class="memory-grid l" id="memoryGrid">
      ${memories.map((m, i) => `<button class="memory-card" data-i="${i}" aria-label="${esc(m.title)}"><span class="memory-emoji">${m.emoji}</span><span class="memory-title">${esc(m.title)}</span></button>`).join('')}
    </div>
    <div class="memory-reveal" id="memoryReveal" aria-live="polite">
      <p class="memory-phrase" id="memoryPhrase"></p>
      <p class="small" id="memoryDetail"></p>
    </div>
  `, 'rose');
  await reveal(s, 650);

  const revealBox = $('#memoryReveal');
  s.querySelectorAll('.memory-card').forEach(card => {
    card.onclick = async () => {
      const m = memories[Number(card.dataset.i)];
      s.querySelectorAll('.memory-card').forEach(x => x.classList.remove('active'));
      card.classList.add('active');
      revealBox.classList.remove('on');
      await sleep(180);
      $('#memoryPhrase').textContent = m.reveal;
      $('#memoryDetail').textContent = m.detail;
      revealBox.classList.add('on');
    };
  });

  // Una sola acción explícita para avanzar; descubrir recuerdos es opcional.
  await btn(s, 'Seguir');
}

async function eggs() {
  // Easter Eggs como recuerdos reales del chat: no hay cuadrícula ni contador.
  // Se presentan como pequeños fragmentos de conversación que puedes explorar.
  const fragments = [
    { date: '03/14', lines: ['Nunca nadie me había querido como tú', 'tu me enseñaste a amar definitivamente', 'Que me copias 😒'], note: 'Esa frase apareció justo después de hablar de copiarse.' },
    { date: '04/03', lines: ['Besiss', 'besis de fresii', 'Besis a mi biscoquito de nata 😍'], note: 'De ahí salió una de esas despedidas que acabaron siendo muy vuestras.' },
    { date: '01/14', lines: ['…', '5 años más tarde', 'Dis que'], note: 'No habían pasado cinco años. Evidentemente.' },
    { date: '09/06', lines: ['te daría muchos besitos', 'y abrazitos', 'Eso no es de Dios'], note: 'Una respuesta que se quedó como frase recurrente.' }
  ];
  const s = await go(`
    <p class="l kick">Algunas cosas no necesitan explicación.</p>
    <p class="small l">Solo verlas otra vez y pensar: “JAJAJ, esto sí me acuerdo”.</p>
    <div class="chat-memory l" id="chatMemory">
      ${fragments.map((f, i) => `<button class="chat-fragment" data-i="${i}"><span class="chat-date">${f.date}</span>${f.lines.map((line, j) => `<span class="chat-line ${j === f.lines.length - 1 ? 'secret-line' : ''}">${esc(line)}</span>`).join('')}</button>`).join('')}
    </div>
    <div class="memory-reveal" id="eggReveal"><p class="memory-phrase" id="eggPhrase"></p><p class="small" id="eggNote"></p></div>
  `, 'blue');
  await reveal(s, 700);

  s.querySelectorAll('.chat-fragment').forEach(fragment => {
    fragment.onclick = async () => {
      const f = fragments[Number(fragment.dataset.i)];
      s.querySelectorAll('.chat-fragment').forEach(x => x.classList.remove('active'));
      fragment.classList.add('active');
      $('#eggReveal').classList.remove('on');
      await sleep(180);
      $('#eggPhrase').textContent = f.lines[f.lines.length - 1];
      $('#eggNote').textContent = f.note;
      $('#eggReveal').classList.add('on');
    };
  });

  await btn(s, 'Seguir');
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
    // El marco es vertical y estable; solo guardamos la proporción real para accesibilidad/debug.
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
