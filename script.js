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
  const b = document.createElement('button'); b.className = 'btn ' + cls; b.textContent = label;
  b.onclick = () => { b.disabled = true; res(); }; root.append(b); requestAnimationFrame(() => b.classList.add('on'));
});
const lines = (arr, first) => arr.map((t, i) => `<p class="l ${i === 0 && first ? 'kick' : ''}">${esc(t)}</p>`).join('');

// --- Fuera de la PWA: instalación obligatoria ---
let deferred = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('#inst')?.removeAttribute('hidden'); });
addEventListener('appinstalled', () => { if (!standalone()) almost(); });

const STEPS = {
  ios: [
    'Abre esta página en <b>Safari</b> y dale click a <b>las tres rayas</b>.',
    'Elige <b>Compartir</b> y luego <b>Añadir a pantalla de inicio</b>.',
    'Click en <b>Añadir</b>.',
    'Cierra Safari y abre la app desde el <b>nuevo icono</b>.'
  ],
  android: [
    'Si aparece, pulsa <b>Instalar</b> aquí abajo.',
    'Si no, abre el menú ⋮ de Chrome y elige <b>Instalar aplicación</b> o <b>Añadir a pantalla de inicio</b>.',
    'Confirma la instalación.',
    'Abre la app desde el <b>nuevo icono</b>.'
  ],
  other: [
    'Ábrela desde el móvil: es ahí donde tiene sentido 💞',
    'En el navegador: menú → <b>Instalar aplicación</b> / <b>Añadir a pantalla de inicio</b>.',
    'Abre la app desde el <b>nuevo icono</b>.'
  ]
};

async function install() {
  const steps = STEPS[isIOS ? 'ios' : isAndroid ? 'android' : 'other'];
  const s = await go(`<p class="l kick">${esc(T.installKicker)}</p>${lines(T.install)}
    <ol class="steps l">${steps.map(x => `<li><span>${x}</span></li>`).join('')}</ol>
    <button class="btn l" id="inst" hidden>Instalar</button>`, 'warm');
  reveal(s, 1300);
  $('#inst').onclick = async () => {
    if (deferred) {
      deferred.prompt();
      await deferred.userChoice;
      deferred = null;
      $('#inst').hidden = true;
    }
  };
  if (deferred) $('#inst').hidden = false;
  await sleep(4500);
  await btn(s, 'Ya está instalada');
  almost();
}

async function almost() {
  if (standalone()) return location.reload();
  const s = await go(lines(T.almost, true) + '<button class="btn ghost on" id="back">Ver instrucciones otra vez</button>', 'night');
  reveal(s, 1200);
  $('#back').onclick = install;
}

// --- Experiencia ---
async function password() {
  const s = await go(
    `${lines(T.gate)}
    <div class="pw l">
      <input id="pw" type="password" autocomplete="off" autocapitalize="off" aria-label="Contraseña" placeholder="Contraseña">
      <div class="pw-actions">
        <button class="btn on" id="ok">Entrar</button>
        <button class="btn on ghost" id="show">Mostrar</button>
      </div>
    </div>
    <p class="err" id="err"></p>`,
    'warm'
  );

  reveal(s, 1300);

  const i = $('#pw');
  const show = $('#show');

  show.onclick = () => {
    const visible = i.type === 'text';
    i.type = visible ? 'password' : 'text';
    show.textContent = visible ? 'Mostrar' : 'Ocultar';
  };

  await new Promise(res => {
    const check = () => {
      if (i.value.trim().toLowerCase() === CONFIG.password.toLowerCase()) {
        window.startMusic?.();
        return res();
      }

      $('#err').textContent = CONFIG.passwordHint || 'Esa no es.';
      i.classList.remove('shake');
      void i.offsetWidth;
      i.classList.add('shake');
    };

    $('#ok').onclick = check;
    i.onkeydown = e => {
      if (e.key === 'Enter') check();
    };
  });
}

async function intro() {
  const s = await go(lines(T.intro), 'rose');
  await reveal(s, 1700);
  await sleep(1800);
}

async function universe() {
  const U = CONFIG.universe, seen = new Set();
  const s = await go(
    `<p class="l kick">${esc(T.universe)}</p>
    <div class="orbs">${U.map((u, i) => `<button class="orb" data-i="${i}" aria-label="${esc(u.text)}">${u.emoji}</button>`).join('')}</div>
    <p class="orb-cap" id="cap">&nbsp;</p>`,
    'rose'
  );

  reveal(s, 600);

  await new Promise(res => s.querySelectorAll('.orb').forEach(o => o.onclick = async () => {
    const cap = $('#cap');
    cap.classList.remove('on');
    await sleep(250);
    cap.textContent = U[o.dataset.i].text;
    cap.classList.add('on');
    o.classList.add('seen');
    seen.add(o.dataset.i);

    if (seen.size === U.length) {
      await sleep(1800);
      res();
    }
  }));
}

async function eggs() {
  const E = CONFIG.easterEggs;
  let n = -1;

  const s = await go(
    `<p class="l kick">${esc(T.eggs)}</p>
    <div class="card l" id="card" role="button" tabindex="0">Toca</div>`,
    'blue'
  );

  reveal(s, 1300);

  const card = $('#card');

  await new Promise(res => card.onclick = async () => {
    if (n >= E.length) return;

    card.classList.add('swap');
    await sleep(350);
    n++;

    if (n < E.length) {
      card.innerHTML = `<span>${esc(E[n].phrase)}${E[n].note ? `<small>${esc(E[n].note)}</small>` : ''}</span>`;
    }

    card.classList.remove('swap');

    if (n === E.length - 1) {
      n = E.length;
      await sleep(1500);
      res();
    }
  });
}

async function letter() {
  const paras = CONFIG.personalMessage.trim().split(/\n\s*\n/);

  const s = await go(
    `<div class="letter">
      <p class="heart-line l on">Y, desde el fondo de mi corazón…</p>
      ${paras.map(p => `<p class="l">${esc(p.trim()).replace(/\n/g, '<br>')}</p>`).join('')}
    </div>`,
    'warm'
  );

  for (const p of s.querySelectorAll('.l:not(.heart-line)')) {
    p.classList.add('on');
    p.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    await sleep(900 + p.textContent.length * 35);
  }

  await sleep(800);
  await btn(s, 'Seguir');
}

async function fakeEnd() {
  await go(`<p class="l on">${esc(T.fakeEnd[0])}</p>`, 'night');
  await sleep(3200);

  await go(`<p class="l on kick">${esc(T.fakeEnd[1])}</p>`, 'night');
  await sleep(2600);
}

async function artist() {
  const s = await go(
    `<h1 class="l">${esc(T.artistTitle)}</h1>
    <figure class="photo" id="ph"><img alt="" src="${esc(CONFIG.artistImage)}"></figure>`,
    'night'
  );

  s.querySelector('img').onerror = e => {
    e.target.replaceWith(
      Object.assign(document.createElement('p'), {
        className: 'small',
        textContent: 'Falta ' + CONFIG.artistImage
      })
    );
  };

  s.querySelector('h1').classList.add('on');
  await sleep(2600);

  $('#ph').classList.add('on');
  await sleep(3600);

  await btn(s, 'Siguiente');
}

async function art() {
  const s = await go(
    `<h1 class="l">${esc(T.artTitle)}</h1>
    <div class="vid" id="vid">
      <video playsinline preload="auto" src="${esc(CONFIG.finalVideo)}"></video>
      <div class="play" id="play">▶</div>
    </div>`,
    'black'
  );

  $('#music').hidden = true;
  window.bgAudio?.pause();

  const v = s.querySelector('video');
  const play = $('#play');

  s.querySelector('h1').classList.add('on');
  await sleep(2800);

  $('#vid').classList.add('on');

  v.onerror = () => {
    play.textContent = 'Falta ' + CONFIG.finalVideo;
    play.style.fontSize = '1rem';
  };

  play.onclick = () => v.play();

  v.onplay = () => play.classList.add('gone');

  v.onclick = () => v.paused ? v.play() : v.pause();

  await new Promise(res => {
    v.onended = () => res();
  });

  await sleep(1200);

  const b = document.createElement('button');
  b.className = 'btn art-actions on';
  b.textContent = 'Y por último...';
  b.onclick = () => {
    b.disabled = true;
    renderEnd();
  };

  s.append(b);
}

const STORY_PAGES = 6;
let page = 1;
let pageHistory = [];

function renderNav() {
  let nav = $('#page-nav');

  if (!nav) {
    nav = document.createElement('nav');
    nav.id = 'page-nav';
    nav.className = 'page-nav';
    document.body.append(nav);
  }

  nav.innerHTML = `
    <button id="prev-page" aria-label="Página anterior">←</button>
    <span>${page}/${STORY_PAGES}</span>
    <button id="next-page" aria-label="Página siguiente">→</button>
  `;

  $('#prev-page').disabled = pageHistory.length === 0;
  $('#next-page').disabled = page >= STORY_PAGES || !pageHistory.includes(page + 1);

  $('#prev-page').onclick = () => {
    if (!pageHistory.length) return;
    const previous = pageHistory.pop();
    page = previous;
    renderCurrent();
  };

  $('#next-page').onclick = () => {
    if (page >= STORY_PAGES || !pageHistory.includes(page + 1)) return;
    pageHistory.push(page);
    page++;
    renderCurrent();
  };
}

async function renderCurrent() {
  if (page === 1) await intro();
  if (page === 2) await letter();
  if (page === 3) await artist();
  if (page === 4) await guard();
  if (page === 5) await art();
  if (page === 6) renderEnd();

  renderNav();
}

function renderEnd() {
  const s = document.createElement('section');
  s.className = 'scene final-scene in';
  s.innerHTML = `<h1 class="final-title">${esc(T.final)}</h1>`;

  const cur = app.firstElementChild;
  if (cur) cur.remove();

  app.append(s);

  page = 6;
  renderNav();
}

async function guard() {
  const s = await go(
    `<div class="guard">
      <p class="l kick">Antes de seguir...</p>
      <p class="l">Quiero que esta parte la veas tranquila.</p>
      <p class="l">Asegúrate de que nadie esté mirando.</p>
      <button class="btn l" id="alone">Estoy a solas</button>
    </div>`,
    'night'
  );

  reveal(s, 1200);
  await new Promise(res => $('#alone').onclick = () => res());
}

function yearHub() {
  const YEARS = [
    { year: 2026, age: 15, status: 'Completado' },
    { year: 2027, age: 16, status: 'Próximamente' },
    { year: 2028, age: 17, status: 'Próximamente' },
    { year: 2029, age: 18, status: 'Próximamente' }
  ];

  $('#music').hidden = false;
  window.startMusic?.();

  const s = document.createElement('section');
  s.className = 'scene in archive-scene';

  s.innerHTML = `
    <div class="archive">
      <button class="archive-back" id="archive-back">←</button>
      <h1>Archivos</h1>
      <div class="year-grid">
        ${YEARS.map(y => `
          <button class="year-card" data-year="${y.year}">
            <strong>${y.year}</strong>
            <span>${y.status}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  const cur = app.firstElementChild;
  if (cur) cur.remove();

  app.append(s);

  $('#archive-back').onclick = () => {
    renderCurrent();
  };

  s.querySelectorAll('.year-card').forEach(card => {
    card.onclick = () => {
      const year = YEARS.find(y => String(y.year) === card.dataset.year);
      if (!year) return;

      const ageText = `${year.age} años`;

      s.innerHTML = `
        <div class="archive-detail">
          <button class="archive-back" id="detail-back">←</button>
          <p class="archive-year">${year.year}</p>
          <p class="archive-age">${ageText}</p>
          <p class="archive-status">${year.status}</p>
          <p class="archive-note">
            ${year.year === 2026
              ? 'Este fue el comienzo.'
              : 'Este archivo todavía no está abierto.'}
          </p>
        </div>
      `;

      $('#detail-back').onclick = () => yearHub();
    };
  });
}

function setupTopControls() {
  let archive = $('#archive');

  if (!archive) {
    archive = document.createElement('button');
    archive.id = 'archive';
    archive.textContent = 'Archivos';
    document.body.append(archive);
  }

  archive.onclick = yearHub;
}

window.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    window.bgAudio?.pause();
  }
});

async function startExperience() {
  setupTopControls();

  page = 1;
  pageHistory = [];

  await password();
  await renderCurrent();
}

async function boot() {
  $('#boot')?.remove();

  if (!standalone() && !dev) {
    await install();
    return;
  }

  startExperience();
}

boot();
