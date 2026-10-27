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

// --- Recuperación del viewport de la PWA en iOS ---
function setupViewportRecovery() {
  if (!isIOS || !(standalone() || dev)) return { recover() {} };

  const root = document.documentElement;
  const viewport = window.visualViewport;
  let frame = 0;
  let settleTimer = 0;
  const phone = /iPhone|iPod/.test(navigator.userAgent);
  const fullHeights = new Map();

  const layoutHeight = () => {
    let measured = Math.round(Math.max(window.innerHeight, viewport?.height || 0));
    if (!phone) return measured;

    // Only use phone-screen geometry when this standalone window spans its width.
    // Do not apply this assumption to iPad windows or ordinary Safari tabs.
    const width = Math.round(window.innerWidth);
    const screen = window.screen;
    const full = Math.abs(width - screen?.width) <= 2 ? screen.height
      : Math.abs(width - screen?.height) <= 2 ? screen.width : 0;
    if (!full) return measured;

    const key = width + ':' + full;
    const previous = fullHeights.get(key) || 0;
    const style = getComputedStyle(root);
    const safe = (parseFloat(style.getPropertyValue('--viewport-safe-top')) || 0) +
      (parseFloat(style.getPropertyValue('--viewport-safe-bottom')) || 0);
    const missing = full - measured;
    // The initial read may omit only the system insets. Larger differences
    // are not evidence that the whole screen is available to this web view.
    if (missing >= 0 && missing <= safe + 2) measured = full;

    // Keyboard dismissal and zoom can briefly report a smaller size at scale 1.
    // Keep the full size already established for this screen width/orientation.
    const height = Math.min(full, Math.max(measured, previous));
    if (height === full) fullHeights.set(key, height);
    return height;
  };

  const editing = () => {
    const active = document.activeElement;
    return active?.matches('input, textarea') || active?.isContentEditable;
  };

  const refresh = () => {
    frame = 0;
    // Let the keyboard and accessibility pinch zoom pan freely.
    if (document.hidden || editing() ||
        (viewport && Math.abs(viewport.scale - 1) > .02)) return;

    const height = layoutHeight();
    if (height > 0) {
      const value = height + 'px';
      if (root.style.getPropertyValue('--app-height') !== value) {
        root.style.setProperty('--app-height', value);
      }
    }

    // iOS can leave the document scrolled after dismissing its keyboard or zoom.
    // Reset only the document, preserving scroll inside the letter and scenes.
    const scrolling = document.scrollingElement;
    if (window.scrollX || window.scrollY || scrolling?.scrollTop ||
        scrolling?.scrollLeft || viewport?.offsetTop || viewport?.offsetLeft) {
      window.scrollTo(0, 0);
    }
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(refresh);
  };

  const recover = () => {
    schedule();
    clearTimeout(settleTimer);
    // Keyboard dismissal can finish after the focus/resize event.
    settleTimer = setTimeout(schedule, 450);
  };

  document.addEventListener('focusout', recover);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) recover();
  });
  addEventListener('pageshow', recover);
  addEventListener('resize', recover);
  addEventListener('scroll', schedule, { passive: true });
  viewport?.addEventListener('resize', recover);
  viewport?.addEventListener('scroll', schedule, { passive: true });
  recover();
  return { recover };
}
const viewportRecovery = setupViewportRecovery();

// --- Escenas ---

let sceneVersion = 0;
const cancelled = () => Object.assign(new Error('Scene replaced'), { name: 'AbortError' });
const sceneSleep = async (root, ms) => {
  await sleep(ms);
  if (!root.isConnected || root.dataset.version !== String(sceneVersion)) throw cancelled();
};

async function go(html, mood) {
  dismissVideoShortcut();
  const version = ++sceneVersion;
  app.querySelectorAll('video').forEach(v => v.pause());
  const cur = app.firstElementChild;
  if (cur) {
    cur.inert = true;
    cur.classList.add('out');
    await sleep(800);
    cur.remove();
  }

  if (version !== sceneVersion) throw cancelled();
  app.replaceChildren();
  if (mood) document.documentElement.dataset.m = mood;

  const s = document.createElement('section');
  s.className = 'scene';
  s.dataset.version = version;
  s.innerHTML = html;
  app.append(s);

  await sceneSleep(s, 40);
  s.classList.add('in');
  return s;
}

const reveal = async (root, gap = 1500) => {
  for (const n of root.querySelectorAll('.l')) {
    n.classList.add('on');
    await sceneSleep(root, gap);
  }
};

const btn = (root, label, cls = '') => new Promise((res, reject) => {
  if (!root.isConnected || root.dataset.version !== String(sceneVersion)) return reject(cancelled());
  const wrap = document.createElement('div');
  wrap.className = 'btn-slot';

  const b = document.createElement('button');
  b.className = 'btn ' + cls;
  b.textContent = label;

  b.onclick = () => {
    if (!root.isConnected || root.dataset.version !== String(sceneVersion)) return;
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
    'Abre esta página en <b>Safari</b> y dale click a <b>el botón Compartir</b>.',
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

  reveal(s, 1300).catch(error => { if (error.name !== 'AbortError') console.error(error); });

  $('#inst').onclick = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      deferred = null;
      $('#inst').hidden = true;
    }
  };

  if (deferred) $('#inst').hidden = false;

  await sceneSleep(s, 4500);
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

  reveal(s, 1200).catch(error => { if (error.name !== 'AbortError') console.error(error); });
  $('#back').onclick = install;
}

// --- Regresos: solo se recuerda una entrada correcta, nunca la contraseña ---
const VISIT_KEY = 'paratimv:entered';
function hasEnteredBefore() {
  try { return localStorage.getItem(VISIT_KEY) === '1'; }
  catch (_) { return false; }
}
function rememberEntry() {
  try { localStorage.setItem(VISIT_KEY, '1'); }
  catch (_) { /* La experiencia sigue funcionando sin almacenamiento. */ }
}

// --- Saludos de regreso ---
const GREETING_KEY = 'paratimv:return-greetings';
function pickReturnGate() {
  const options = Array.isArray(T.returnGates) && T.returnGates.length
    ? T.returnGates : [T.returnGate || T.gate];
  const signature = JSON.stringify(options);
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(GREETING_KEY)); } catch (_) {}
  const valid = saved?.signature === signature;
  const last = valid && Number.isInteger(saved.last) ? saved.last : -1;
  let remaining = valid && Array.isArray(saved.remaining)
    ? [...new Set(saved.remaining.filter(i => Number.isInteger(i) && i >= 0 && i < options.length && i !== last))]
    : [];
  if (!remaining.length) remaining = options.map((_, index) => index);
  const eligible = remaining.filter(index => index !== last);
  const pool = eligible.length ? eligible : remaining;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  try {
    localStorage.setItem(GREETING_KEY, JSON.stringify({
      signature, last: chosen, remaining: remaining.filter(index => index !== chosen)
    }));
  } catch (_) {}
  return options[chosen];
}

// --- Aviso de vídeo ---
let activeVideoShortcut = null;
function dismissVideoShortcut() {
  activeVideoShortcut?.();
}

function showVideoShortcut(root) {
  dismissVideoShortcut();
  if (!root.isConnected || root.dataset.version !== String(sceneVersion)) return;

  const notice = document.createElement('aside');
  notice.id = 'video-shortcut';
  notice.className = 'return-notice';
  notice.setAttribute('aria-label', 'Acceso rápido al vídeo');
  notice.innerHTML = `
    <div class="notice-header">
      <span class="notice-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none"><path d="m9 6 9 6-9 6V6Z" fill="currentColor"/></svg>
      </span>
      <div class="notice-source">
        <span class="notice-brand">PARA TI MI VIDA</span>
        <span class="notice-context">Un pequeño atajo</span>
      </div>
      <button type="button" class="notice-close" aria-label="Cerrar notificación">×</button>
    </div>
    <p class="notice-title" role="status">${esc(T.videoPrompt)}</p>
    <p class="notice-hint">Elige cómo quieres seguir.</p>
    <div class="notice-actions">
      <div class="notice-options" role="group" aria-label="Elegir si quieres saltar al vídeo">
        <button type="button" class="notice-choice" data-choice="yes" aria-pressed="false">Sí</button>
        <button type="button" class="notice-choice" data-choice="no" aria-pressed="false">No</button>
      </div>
      <button type="button" class="notice-go" disabled>
        Ir <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
    <span class="notice-handle" aria-hidden="true"></span>
  `;

  let choice = null, closing = false, removeTimer = 0;
  const remove = () => {
    clearTimeout(removeTimer);
    notice.remove();
    if (activeVideoShortcut === dismiss) activeVideoShortcut = null;
  };
  const dismiss = (animate = false) => {
    if (!animate) return remove();
    if (closing) return;
    closing = true;
    notice.inert = true;
    delete notice.dataset.dragging;
    notice.classList.add('leaving');
    removeTimer = setTimeout(remove, 220);
  };
  activeVideoShortcut = dismiss;
  notice.querySelector('.notice-close').onclick = () => dismiss(true);
  notice.addEventListener('keydown', event => {
    if (event.key === 'Escape') dismiss(true);
  });
  const goButton = notice.querySelector('.notice-go');
  const choices = [...notice.querySelectorAll('[data-choice]')];
  for (const button of choices) {
    button.onclick = () => {
      if (closing) return;
      choice = button.dataset.choice;
      for (const option of choices) option.setAttribute('aria-pressed', String(option === button));
      goButton.disabled = false;
    };
  }
  goButton.onclick = () => {
    if (closing || !choice || !root.isConnected || root.dataset.version !== String(sceneVersion)) return;
    const skip = choice === 'yes';
    dismiss(!skip);
    if (skip) goToVideo();
  };

  let gesture = null;
  const resetDrag = () => {
    gesture = null;
    delete notice.dataset.dragging;
    notice.style.removeProperty('--notice-drag-y');
    notice.style.removeProperty('opacity');
  };
  notice.addEventListener('pointerdown', event => {
    if (closing || !event.isPrimary || event.button !== 0) return;
    const captured = !event.target.closest('button');
    gesture = { x: event.clientX, y: event.clientY, pointer: event.pointerId, captured };
    if (captured) notice.setPointerCapture(event.pointerId);
  });
  notice.addEventListener('pointermove', event => {
    if (!gesture || gesture.pointer !== event.pointerId) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (dy > -8 || Math.abs(dy) <= Math.abs(dx)) return;
    if (!gesture.captured) {
      notice.setPointerCapture(event.pointerId);
      gesture.captured = true;
    }
    notice.dataset.dragging = 'true';
    notice.style.setProperty('--notice-drag-y', dy + 'px');
    notice.style.opacity = String(Math.max(.25, 1 + dy / 220));
  });
  notice.addEventListener('pointerup', event => {
    if (!gesture || gesture.pointer !== event.pointerId) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    resetDrag();
    if (dy <= -56 && Math.abs(dy) > Math.abs(dx) * 1.2) dismiss(true);
  });
  notice.addEventListener('pointercancel', resetDrag);
  notice.addEventListener('lostpointercapture', resetDrag);
  document.body.append(notice);
}

// --- Entrada ---
async function password(returningVisit = false) {
  const s = await go(`
    ${lines(returningVisit ? pickReturnGate() : T.gate)}

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

  reveal(s, 1300).catch(error => { if (error.name !== 'AbortError') console.error(error); });

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
    let accepted = false;
    const check = () => {
      if (accepted) return;
      if (
        i.value.trim().toLowerCase() ===
        CONFIG.password.toLowerCase()
      ) {
        accepted = true;
        rememberEntry();
        window.startMusic?.();
        i.blur();
        s.querySelector('#ok').disabled = true;
        viewportRecovery.recover();
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
      if (e.key === 'Enter') {
        e.preventDefault();
        check();
      }
    };
  });
  // Allow focus dismissal and its first layout refresh before the next scene.
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

// --- Archivo de cumpleaños ---
const YEARS = [
  { year: 2026, age: 15, status: 'Completado' },
  { year: 2027, age: 16, status: 'Próximamente' },
  { year: 2028, age: 17, status: 'Próximamente' },
  { year: 2029, age: 18, status: 'Próximamente' }
];

let offerVideoOnIntro = false;
let pageHistory = [];
let historyIndex = 0;
let currentPage = 0;
let pageNav = null;

const STORY_PAGES = 7;

// --- Archivo ---
async function yearHub() {
  currentPage = -1;
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

function goToVideo() {
  pageHistory = pageHistory.slice(0, historyIndex + 1);
  pageHistory.push(5);
  historyIndex = pageHistory.length - 1;
  renderPage(5);
}

function startJourney({ offerVideo = false } = {}) {
  offerVideoOnIntro = offerVideo;
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
  if (offerVideoOnIntro) {
    offerVideoOnIntro = false;
    showVideoShortcut(s);
  }

  await reveal(s, 1400);
  await sceneSleep(s, 500);

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
    await sceneSleep(s, 700);
  }

  s.querySelector('#letterNext').onclick =
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
  await sceneSleep(s, 400);
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

  await sceneSleep(s, 1000);

  s.querySelector('#ph').classList.add('on');

  await sceneSleep(s, 1200);

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
        preload="none"
        src="${esc(CONFIG.finalVideo)}"
      ></video>

      <button
        type="button"
        class="play"
        id="play"
        aria-label="Reproducir vídeo"
      >
        ▶
      </button>
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

  const unlock = () => {
    if (!s.isConnected) return;
    lastDoor.disabled = false;
    lastDoor.classList.add('on');
  };
  const failed = () => {
    play.classList.remove('gone');
    play.textContent = 'No se puede reproducir, toca para reintentar';
    play.style.fontSize = '1rem';
    unlock();
  };
  lastDoor.disabled = true;
  lastDoor.onclick = () => {
    if (lastDoor.disabled || !s.isConnected) return;
    lastDoor.disabled = true;
    v.pause();
    goNextPage();
  };
  v.onerror = failed;
  v.onended = unlock;
  v.onplay = () => play.classList.add('gone');
  v.onpause = () => { if (!v.ended) play.classList.remove('gone'); };
  play.onclick = () => {
    if (v.error) v.load();
    v.play().catch(failed);
  };
  v.onclick = () => v.paused ? v.play().catch(failed) : v.pause();
  s.querySelector('h1').classList.add('on');
  await sceneSleep(s, 1200);
  s.querySelector('#vid').classList.add('on');
  // A stalled request must never trap the recipient.
  await sceneSleep(s, 15000);
  unlock();

}

// --- Página 6 ---
async function renderEnd() {
  updatePageNav(true);

  const s = await go(`
    <div class="final-envelope-content">
      <p class="final-envelope-brand">PARA TI MI VIDA</p>
      <h1 class="final-envelope-heading">${esc(T.finalEnvelopeTitle)}</h1>
      <button class="final-envelope-trigger" type="button"
        aria-label="Abrir el sobre final" aria-haspopup="dialog"
        aria-expanded="false" aria-controls="final-note">
        <span class="final-envelope-art" aria-hidden="true">
          <span class="final-envelope-back"></span>
          <span class="final-envelope-slip">Para ${esc(CONFIG.name)}</span>
          <span class="final-envelope-flap"></span>
          <span class="final-envelope-left"></span>
          <span class="final-envelope-right"></span>
          <span class="final-envelope-bottom"></span>
          <span class="final-envelope-seal">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
                stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </span>
        <span class="final-envelope-label">Toca el sobre</span>
      </button>
    </div>
    <dialog id="final-note" class="final-note-dialog" aria-labelledby="final-note-title">
      <div class="final-note-bar">
        <span>PARA TI</span>
        <button class="final-note-close" type="button" aria-label="Cerrar la carta" autofocus>×</button>
      </div>
      <div class="final-note-content">
        <h2 id="final-note-title">${esc(T.final).replace(/(\S+) (💞)$/, '<span class="final-note-name">$1 $2</span>')}</h2>
        <div class="final-note-rule" aria-hidden="true"></div>
        <p class="final-note-message">${esc(T.finalNote)}</p>
        <p class="final-note-signature">Contigo <u>4ever</u></p>
      </div>
    </dialog>
  `, 'warm');
  s.classList.add('final-envelope-scene', 'has-page-nav');

  const trigger = s.querySelector('.final-envelope-trigger');
  const dialog = s.querySelector('.final-note-dialog');
  trigger.onclick = async () => {
    if (trigger.disabled || !s.isConnected || s.dataset.version !== String(sceneVersion)) return;
    trigger.disabled = true;
    s.classList.add('envelope-open');
    try {
      await sceneSleep(s, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350);
      // The native dialog keeps focus inside and makes the background inert.
      dialog.showModal();
      trigger.setAttribute('aria-expanded', 'true');
    } catch (error) {
      if (error.name !== 'AbortError') {
        s.classList.remove('envelope-open');
        trigger.disabled = false;
        console.error(error);
      }
    }
  };
  s.querySelector('.final-note-close').onclick = () => dialog.close();
  dialog.addEventListener('close', () => {
    s.classList.remove('envelope-open');
    trigger.disabled = false;
    trigger.setAttribute('aria-expanded', 'false');
    if (s.isConnected && s.dataset.version === String(sceneVersion)) trigger.focus({ preventScroll: true });
  });
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
  const returningVisit = hasEnteredBefore();
  setupMusic();

  await password(returningVisit);

  makeArchiveButton();

  startJourney({ offerVideo: returningVisit });
}

// --- Música ---
function setupMusic() {
  if (!CONFIG.music) return;

  let musicWanted = true;
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
    musicWanted = a.paused;
    if (musicWanted) {
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


  window.stopMusic = stopMusic;

  window.startMusic = () => {
    if (musicWanted && !document.hidden && currentPage !== 5) return a.play().catch(() => {});
  };
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) window.startMusic();
  });
}

// --- Service Worker ---
if (
  'serviceWorker' in navigator
) {
  navigator.serviceWorker
    .register('sw.js', { updateViaCache: 'none' })
    .catch(() => {});
}

// --- Introducción de entrada ---
const bootFadeDuration = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches ? 150 : 750;

function bootIntro() {
  const boot = $('#boot');
  if (!boot) return Promise.resolve();

  document.documentElement.classList.add('booting');
  document.body.classList.add('booting');
  boot.classList.add('active');
  boot.innerHTML = `
    <div class="boot-heart" aria-hidden="true">♡</div>
    <h1 class="boot-title">Para ti mi vida</h1>
    <p class="boot-subtitle">Hay algo que quiero que descubras...</p>
    <div class="boot-progress" aria-hidden="true"><span></span></div>
    <p class="boot-caption">Contigo <u>4ever</u></p>
  `;

  // Duración total prevista: 10 s, incluido el desvanecimiento.
  // No hay botón para saltarla.
  const fadeMs = bootFadeDuration();
  return new Promise(resolve => {
    window.setTimeout(resolve, 10000 - fadeMs);
  });
}

// Ignore only work cancelled by a newer scene, preserving real errors.
const safeScene = fn => (...args) => fn(...args).catch(error => {
  if (error.name !== 'AbortError') console.error(error);
});
install = safeScene(install);
almost = safeScene(almost);
yearHub = safeScene(yearHub);
upcomingYear = safeScene(upcomingYear);
renderPage = safeScene(renderPage);

// --- Inicio ---
addEventListener(
  'load',
  async () => {
    // La web normal solo muestra el tutorial de instalación: nada de intro ni spoilers.
    // La intro y toda la experiencia se reservan para la PWA instalada (o modo dev).
    if (!(standalone() || dev)) {
      $('#boot')?.remove();
      await install();
      return;
    }

    await bootIntro();

    const boot = $('#boot');
    boot?.classList.add('gone');
    // Espera a que termine el desvanecimiento antes de retirar el fondo compartido.
    await sleep(bootFadeDuration() + 50);
    boot?.remove();

    // Inicia la primera escena antes de retirar la clase del fondo raíz.
    // Así el fondo de la historia ya está elegido al cerrar la intro.
    story();
    document.body.classList.remove('booting');
    document.documentElement.classList.remove('booting');
  }
);

