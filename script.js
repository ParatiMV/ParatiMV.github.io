// Motor de escenas: una escena a la vez, con transiciones suaves. Los textos viven en config.js.
const T = CONFIG.texts, $ = s => document.querySelector(s), app = $('#app');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
for (const [k, v] of Object.entries(CONFIG.colors)) document.documentElement.style.setProperty('--' + k, v);

// --- Detección de PWA instalada (standalone) ---
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const dev = ['localhost', '127.0.0.1'].includes(location.hostname) && location.search.includes('dev');
const ua = navigator.userAgent;
const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /Android/.test(ua);

async function go(html, mood) {
  const cur = app.firstElementChild;
  if (cur) {
    cur.classList.add('out');
    await sleep(800);
    cur.remove();
  }

  if (mood) document.body.dataset.m = mood;

  const s = document.createElement('section');
  s.className = 'scene';
  s.innerHTML = html;
  app.append(s);

  await sleep(40);
  s.classList.add('in');
  return s;
}

const reveal = async (root, gap = 1500) => {
  for (const n of root.querySelectorAll('.l')) {
    n.classList.add('on');
    await sleep(gap);
  }
};

const btn = (root, label, cls = '') => new Promise(res => {
  const wrap = document.createElement('div');
  wrap.className = 'btn-slot';

  const b = document.createElement('button');
  b.className = 'btn ' + cls;
  b.textContent = label;

  b.onclick = () => {
    b.disabled = true;
    res();
  };

  wrap.append(b);
  root.append(wrap);

  requestAnimationFrame(() => b.classList.add('on'));
});

const lines = (arr, first) =>
  arr.map((t, i) =>
    `<p class="l ${i === 0 && first ? 'kick' : ''}">${esc(t)}</p>`
  ).join('');

// --- Fuera de la PWA: instalación obligatoria ---
let deferred = null;

addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferred = e;
  $('#inst')?.removeAttribute('hidden');
});

addEventListener('appinstalled', () => {
  if (!standalone()) almost();
});

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

  const s = await go(`
    <p class="l kick">${esc(T.installKicker)}</p>
    ${lines(T.install)}
    <ol class="steps l">
      ${steps.map(x => `<li><span>${x}</span></li>`).join('')}
    </ol>
    <button class="btn l" id="inst" hidden>Instalar</button>
  `, 'warm');

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

  const s = await go(
    lines(T.almost, true) +
    '<button class="btn ghost on" id="back">Ver instrucciones otra vez</button>',
    'night'
  );

  reveal(s, 1200);
  $('#back').onclick = install;
}

// --- Entrada ---
async function password() {
  const s = await go(`
    ${lines(T.gate)}

    <div class="pw l">
      <input
        id="pw"
        type="password"
        autocomplete="off"
        autocapitalize="off"
        aria-label="Contraseña"
        placeholder="Contraseña"
      >

      <div class="pw-actions">
        <button class="btn pw-enter on" id="ok">Entrar</button>

        <button
          class="pw-eye"
          id="pwEye"
          type="button"
          aria-label="Mostrar contraseña"
          aria-pressed="false"
        >
          Mostrar
        </button>
      </div>
    </div>

    <p class="err" id="err"></p>
  `, 'warm');

  reveal(s, 1300);

  const i = $('#pw');
  const eye = $('#pwEye');

  eye.onclick = () => {
    const visible = i.type === 'text';

    i.type = visible ? 'password' : 'text';
    eye.textContent = visible ? 'Mostrar' : 'Ocultar';
    eye.classList.toggle('open', !visible);
    eye.setAttribute(
      'aria-label',
      visible ? 'Mostrar contraseña' : 'Ocultar contraseña'
    );
    eye.setAttribute(
      'aria-pressed',
      String(!visible)
    );
  };

  await new Promise(res => {
    const check = () => {
      if (
        i.value.trim().toLowerCase() ===
        CONFIG.password.toLowerCase()
      ) {
        window.startMusic?.();
        return res();
      }

      $('#err').textContent =
        CONFIG.passwordHint || 'Esa no es.';

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

// --- Archivo de cumpleaños ---
const YEARS = [
  { year: 2026, age: 15, status: 'Completado' },
  { year: 2027, age: 16, status: 'Próximamente' },
  { year: 2028, age: 17, status: 'Próximamente' },
  { year: 2029, age: 18, status: 'Próximamente' }
];

let pageHistory = [];
let historyIndex = 0;
let currentPage = 0;
let pageNav = null;

const STORY_PAGES = 7;

// --- Archivo ---
async function yearHub() {
  updatePageNav(false);

  // Abrir el archivo NO debe apagar la música.
  $('#music').hidden = false;
  window.startMusic?.();

  const cards = YEARS.map(({ year, age, status }) =>
    year === 2026
      ? `
        <button class="year-card complete" data-year="${year}">
          <span class="year-number">${year}</span>
          <span class="year-age">${age} años</span>
          <span class="year-status">${status}</span>
        </button>
      `
      : `
        <button class="year-card upcoming" data-year="${year}">
          <span class="year-number">${year}</span>
          <span class="year-age">${age} años</span>
          <span class="year-status">${status}</span>
        </button>
      `
  ).join('');

  const s = await go(`
    <p class="l kick">Para ti, cada año.</p>

    <h1 class="l archive-title">
      Tus cumpleaños
    </h1>

    <p class="small l">
      Un capítulo por cada vuelta al sol.
    </p>

    <div class="year-grid l">
      ${cards}
    </div>
  `, 'night');

  await reveal(s, 650);

  s.querySelectorAll('.year-card').forEach(card => {
    card.onclick = () => {
      const year = Number(card.dataset.year);

      if (year === 2026) {
        startJourney();
      } else {
        upcomingYear(year);
      }
    };
  });
}

async function upcomingYear(year) {
  const item = YEARS.find(x => x.year === year);

  const s = await go(`
    <p class="l kick">${year}</p>

    <h1 class="l archive-title">
      ${item.age} años
    </h1>

    <p class="l">
      Este capítulo todavía no está escrito.
    </p>

    <p class="small l">
      Cuando llegue tu cumpleaños, aquí tendrás tu propio recuerdo.
    </p>
  `, 'night');

  await reveal(s, 900);

  await btn(s, 'Volver a tus cumpleaños');

  yearHub();
}

// --- Navegación ---
function makePageNav() {
  if (pageNav) return pageNav;

  pageNav = document.createElement('nav');

  pageNav.className = 'page-nav';

  pageNav.setAttribute(
    'aria-label',
    'Navegación de páginas'
  );

  pageNav.innerHTML = `
    <button
      class="page-arrow"
      id="pageBack"
      aria-label="Página anterior"
    >
      ‹
    </button>

    <span
      class="page-count"
      id="pageCount"
    >
      01 / 06
    </span>

    <button
      class="page-arrow"
      id="pageForward"
      aria-label="Volver a una página visitada"
    >
      ›
    </button>
  `;

  document.body.append(pageNav);

  $('#pageBack').onclick = () => {
    if (historyIndex > 0) {
      historyIndex--;
      currentPage = pageHistory[historyIndex];
      renderPage(currentPage);
    }
  };

  $('#pageForward').onclick = () => {
    if (historyIndex < pageHistory.length - 1) {
      historyIndex++;
      currentPage = pageHistory[historyIndex];
      renderPage(currentPage);
    }
  };

  return pageNav;
}

function updatePageNav(show) {
  const nav = makePageNav();

  nav.hidden = !show;

  if (!show) return;

  $('#pageCount').textContent =
    `${String(currentPage + 1).padStart(2, '0')} / ${String(STORY_PAGES).padStart(2, '0')}`;

  $('#pageBack').disabled =
    historyIndex <= 0;

  $('#pageForward').disabled =
    historyIndex >= pageHistory.length - 1;
}

function goNextPage() {
  const next = currentPage + 1;

  if (next >= STORY_PAGES) return;

  if (
    historyIndex < pageHistory.length - 1 &&
    pageHistory[historyIndex + 1] === next
  ) {
    historyIndex++;
  } else {
    pageHistory =
      pageHistory.slice(0, historyIndex + 1);

    pageHistory.push(next);
    historyIndex++;
  }

  currentPage = next;

  renderPage(currentPage);
}

function startJourney() {
  pageHistory = [0];
  historyIndex = 0;
  currentPage = 0;

  renderPage(0);
}

async function renderPage(index) {
  currentPage = index;

  updatePageNav(true);

  if (index === 5) {
    $('#music').hidden = true;
    $('#archive').hidden = true;
    window.bgAudio?.pause();
  } else {
    $('#music').hidden = false;
    $('#archive').hidden = false;
    window.startMusic?.();
  }

  if (index === 0) return renderIntro();
  if (index === 1) return renderLetter();
  if (index === 2) return renderGiftIntro();
  if (index === 3) return renderArtist();
  if (index === 4) return renderGuard();
  if (index === 5) return renderArt();

  return renderEnd();
}

// --- Página 1 ---
async function renderIntro() {
  const s = await go(`
    <p class="l kick">
      15 años, la criatura.
    </p>

    <p class="l">
      Hoy te toca recibir tu regalito.
    </p>

    <p class="small l">
      Cuando estés lista, dale a empezar.
    </p>
  `, 'rose');

  s.classList.add('has-page-nav');

  await reveal(s, 1400);
  await sleep(500);

  await btn(s, 'Empezar');

  goNextPage();
}

// --- Página 2 ---
async function renderLetter() {
  const paras =
    CONFIG.personalMessage
      .trim()
      .split(/\n\s*\n/);

  const s = await go(`
    <div class="letter-scene">

      <p class="l heart-line">
        Y, desde el fondo de mi corazón…
      </p>

      <div class="letter">
        ${paras.map(p =>
          `<p class="l">${esc(p.trim()).replace(/\n/g, '<br>')}</p>`
        ).join('')}
      </div>

      <div class="letter-actions">
        <button
          class="btn on"
          id="letterNext"
        >
          Seguir
        </button>
      </div>

    </div>
  `, 'warm');

  s.classList.add(
    'letter-scene-root',
    'has-page-nav'
  );

  for (
    const p of s.querySelectorAll(
      '.heart-line, .letter .l'
    )
  ) {
    p.classList.add('on');
    await sleep(700);
  }

  $('#letterNext').onclick =
    goNextPage;
}

// --- Página 3: antes del regalo ---
async function renderGiftIntro() {
  const s = await go(`
    <p class="l kick">
      Y ahora…
    </p>

    <h1 class="l archive-title">
      llega tu regalo.
    </h1>

    <p class="small l">
      Lo he preparado con mucho cariño para ti.
    </p>
  `, 'rose');

  s.classList.add('has-page-nav');

  await reveal(s, 1200);
  await sleep(400);
  await btn(s, 'Descubrir mi regalo');

  goNextPage();
}

// --- Página 4 ---
async function renderArtist() {
  const s = await go(`
    <h1 class="l">
      ${esc(T.artistTitle)}
    </h1>

    <figure
      class="photo"
      id="ph"
    >
      <img
        alt=""
        src="${esc(CONFIG.artistImage)}"
      >
    </figure>

    <p class="small l artist-tip">
      Mantén pulsada la foto para guardarla.
    </p>
  `, 'night');

  s.classList.add('has-page-nav');

  s.querySelector('img').onerror =
    e => {
      e.target.replaceWith(
        Object.assign(
          document.createElement('p'),
          {
            className: 'small',
            textContent:
              'Falta ' +
              CONFIG.artistImage
          }
        )
      );
    };

  s.querySelector('h1').classList.add('on');

  await sleep(1000);

  $('#ph').classList.add('on');

  await sleep(1200);

  s.querySelector(
    '.artist-tip'
  ).classList.add('on');

  await btn(s, 'Siguiente');

  goNextPage();
}

// --- Página 4 ---
async function renderGuard() {
  const s = await go(`
    <p class="l kick">
      Antes de seguir…
    </p>

    <p class="l">
      Asegúrate de que no haya nadie mirando.
    </p>

    <p class="small l">
      Lo que viene ahora es solo para ti.
    </p>
  `, 'black');

  s.classList.add('has-page-nav');

  await reveal(s, 1200);

  await btn(s, 'Estoy a solas');

  goNextPage();
}

// --- Página 5 ---
// EL ARTE: no tocar la composición aprobada.
async function renderArt() {
  const s = await go(`
    <h1 class="l">
      ${esc(T.artTitle)}
    </h1>

    <div
      class="vid"
      id="vid"
    >
      <video
        playsinline
        preload="metadata"
        src="${esc(CONFIG.finalVideo)}"
      ></video>

      <div
        class="play"
        id="play"
      >
        ▶
      </div>
    </div>

    <div class="art-actions">
      <button
        class="btn"
        id="lastDoor"
      >
        Y por último...
      </button>
    </div>
  `, 'black');

  s.classList.add(
    'art-scene',
    'has-page-nav'
  );

  $('#music').hidden = true;
  $('#archive').hidden = true;
  window.bgAudio?.pause();

  const v =
    s.querySelector('video');

  const play =
    $('#play');

  const lastDoor =
    $('#lastDoor');

  s.querySelector(
    'h1'
  ).classList.add('on');

  await sleep(1200);

  $('#vid').classList.add('on');

  lastDoor.disabled = true;
  lastDoor.classList.remove('on');

  v.onerror = () => {
    play.textContent =
      'Falta ' +
      CONFIG.finalVideo;

    play.style.fontSize =
      '1rem';
  };

  v.onloadedmetadata = () => {
    if (
      v.videoWidth &&
      v.videoHeight
    ) {
      s.style.setProperty(
        '--video-native-ratio',
        `${v.videoWidth} / ${v.videoHeight}`
      );
    }
  };

  play.onclick = () =>
    v.play().catch(() => {});

  v.onplay = () =>
    play.classList.add('gone');

  v.onclick = () =>
    v.paused
      ? v.play().catch(() => {})
      : v.pause();

  await new Promise(res => {
    v.onended = res;
  });

  await sleep(500);

  lastDoor.disabled = false;

  requestAnimationFrame(() =>
    lastDoor.classList.add('on')
  );

  await new Promise(res => {
    lastDoor.onclick = () => {
      lastDoor.disabled = true;
      res();
    };
  });

  goNextPage();
}

// --- Página 6 ---
async function renderEnd() {
  updatePageNav(true);

  await go(`
    <h1 class="final l on">
      ${esc(T.final)}
    </h1>
  `, 'warm');
}

// --- Botón del archivo ---
function makeArchiveButton() {
  if (
    document.getElementById(
      'archive'
    )
  ) return;

  const b =
    document.createElement(
      'button'
    );

  b.id = 'archive';
  b.type = 'button';
  b.textContent = '🗃️';

  b.setAttribute(
    'aria-label',
    'Tus cumpleaños'
  );

  b.title =
    'Tus cumpleaños';

  b.onclick =
    yearHub;

  document.body.append(b);
}

// --- Arranque ---
async function story() {
  setupMusic();

  await password();

  makeArchiveButton();

  startJourney();
}

// --- Música ---
function setupMusic() {
  if (!CONFIG.music) return;

  const a =
    window.bgAudio =
      new Audio(CONFIG.music);

  const b =
    $('#music');

  a.loop = true;
  a.volume = .35;
  b.hidden = false;
  b.textContent = '🔇';
  b.classList.add('off');
  b.setAttribute('aria-label', 'Activar música');
  b.title = 'Música apagada';

  const showMusicState = () => {
    const playing = !a.paused;
    b.textContent = playing ? '🔊' : '🔇';
    b.classList.toggle('off', !playing);
    b.setAttribute(
      'aria-label',
      playing ? 'Apagar música' : 'Activar música'
    );
    b.title = playing ? 'Música activada' : 'Música apagada';
  };

  b.onclick = async () => {
    if (a.paused) {
      try {
        await a.play();
      } catch (_) {}
    } else {
      a.pause();
    }
    showMusicState();
  };

  a.addEventListener('play', showMusicState);
  a.addEventListener('pause', showMusicState);

  const stopMusic = () => {
    if (!a.paused) a.pause();
    showMusicState();
  };

  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden)
        stopMusic();
    }
  );

  addEventListener('pagehide', stopMusic);
  addEventListener('blur', stopMusic);

  window.stopMusic = stopMusic;

  window.startMusic = () =>
    a.play().catch(() => {});
}

// --- Service Worker ---
if (
  'serviceWorker' in navigator
) {
  navigator.serviceWorker
    .register('sw.js')
    .catch(() => {});
}

// --- Introducción de entrada ---
function bootIntro() {
  const boot = $('#boot');
  if (!boot) return Promise.resolve();

  boot.innerHTML = `
    <canvas class="boot-stars" aria-hidden="true"></canvas>
    <div class="boot-copy">
      <h1 class="boot-title">Para ti</h1>
      <p class="boot-subtitle">Hay algo que quiero que descubras...</p>
      <div class="boot-progress" aria-hidden="true"><span></span></div>
      <p class="boot-caption">Preparando una sorpresa</p>
    </div>
    <button class="boot-skip" type="button">Saltar introducción <span aria-hidden="true">→</span></button>
  `;

  return new Promise(resolve => {
    let finished = false;
    let raf = 0;
    let resizeHandler;
    const duration = 6500;
    const canvas = boot.querySelector('.boot-stars');
    const ctx = canvas?.getContext('2d');
    const copy = boot.querySelector('.boot-copy');
    let width = 0, height = 0, dpr = 1, stars = [];

    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      if (resizeHandler) removeEventListener('resize', resizeHandler);
      resolve();
    };

    function sampleTextTargets(text, font, yCenter) {
      const off = document.createElement('canvas');
      const octx = off.getContext('2d', { willReadFrequently: true });
      const fontSize = Math.min(width * .13, 58);
      octx.font = `600 ${fontSize}px ${font}`;
      const metrics = octx.measureText(text);
      off.width = Math.ceil(metrics.width + 24);
      off.height = Math.ceil(fontSize * 1.8);
      octx.font = `600 ${fontSize}px ${font}`;
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.fillStyle = '#fff';
      octx.fillText(text, off.width / 2, off.height / 2);
      const data = octx.getImageData(0, 0, off.width, off.height).data;
      const pts = [];
      const step = width < 400 ? 4 : 5;
      for (let y = 0; y < off.height; y += step) {
        for (let x = 0; x < off.width; x += step) {
          if (data[(y * off.width + x) * 4 + 3] > 100) {
            pts.push({ x: width / 2 + x - off.width / 2, y: yCenter + y - off.height / 2 });
          }
        }
      }
      return pts;
    }

    function heartTargets() {
      const pts = [];
      const scale = Math.min(width / 38, height / 44, 9.2);
      const cx = width / 2;
      const cy = height * .40;
      for (let i = 0; i < 240; i++) {
        const a = Math.PI * 2 * i / 240;
        const x = 16 * Math.pow(Math.sin(a), 3);
        const y = 13 * Math.cos(a) - 5 * Math.cos(2*a) - 2 * Math.cos(3*a) - Math.cos(4*a);
        pts.push({ x: cx + x * scale, y: cy - y * scale });
      }
      // Add a few points inside the outline for a fuller, starry heart.
      for (let i = 0; i < 95; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * .78;
        const x = 16 * Math.pow(Math.sin(a), 3) * r;
        const y = (13 * Math.cos(a) - 5 * Math.cos(2*a) - 2 * Math.cos(3*a) - Math.cos(4*a)) * r;
        pts.push({ x: cx + x * scale, y: cy - y * scale });
      }
      return pts;
    }

    function setup() {
      if (!canvas || !ctx) return;
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const textTargets = sampleTextTargets('CARMEN', 'Arial, sans-serif', height * .40);
      const heart = heartTargets();
      const count = Math.min(210, Math.max(150, textTargets.length));
      stars = Array.from({ length: count }, (_, i) => {
        const textPoint = textTargets[Math.floor(i * textTargets.length / count)] || { x: width/2, y: height*.4 };
        const heartPoint = heart[Math.floor(i * heart.length / count)];
        return {
          sx: Math.random() * width,
          sy: Math.random() * height,
          tx: textPoint.x, ty: textPoint.y,
          hx: heartPoint.x, hy: heartPoint.y,
          size: .7 + Math.random() * 1.7,
          phase: Math.random() * Math.PI * 2,
          hue: Math.random() < .72 ? 330 : 265
        };
      });
    }

    const ease = t => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
    function draw(now) {
      if (finished || !ctx) return;
      const elapsed = now - startedAt;
      const p = Math.min(1, elapsed / duration);
      ctx.clearRect(0, 0, width, height);
      const gather = ease(elapsed / 2300);
      const transform = ease((elapsed - 2300) / 2100);
      const heartAlpha = Math.max(0, Math.min(1, (elapsed - 2300) / 500));

      for (const star of stars) {
        let x, y, alpha = .55 + .45 * Math.sin(now / 280 + star.phase);
        if (elapsed < 2300) {
          x = star.sx + (star.tx - star.sx) * gather;
          y = star.sy + (star.ty - star.sy) * gather;
        } else {
          x = star.tx + (star.hx - star.tx) * transform;
          y = star.ty + (star.hy - star.ty) * transform;
          alpha *= heartAlpha;
        }
        ctx.beginPath();
        ctx.fillStyle = `hsla(${star.hue}, 75%, ${elapsed > 2300 ? 82 : 86}%, ${alpha})`;
        ctx.shadowColor = star.hue === 330 ? 'rgba(232,163,184,.8)' : 'rgba(168,125,255,.8)';
        ctx.shadowBlur = 5;
        ctx.arc(x, y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      if (elapsed >= 4300) {
        copy?.classList.add('is-visible');
      }
      if (p < 1) raf = requestAnimationFrame(draw);
    }

    const startedAt = performance.now();
    resizeHandler = () => setup();
    setup();
    addEventListener('resize', resizeHandler, { passive: true });
    boot.querySelector('.boot-skip')?.addEventListener('click', finish, { once: true });
    raf = requestAnimationFrame(draw);
    window.setTimeout(finish, duration);
  });
}

// --- Inicio ---
addEventListener(
  'load',
  async () => {
    await bootIntro();

    $('#boot')
      .classList
      .add('gone');

    await sleep(350);

    (
      standalone() ||
      dev
    )
      ? story()
      : install();
  }
);
