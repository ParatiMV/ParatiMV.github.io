const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function harness({ ios = true, installed = true, visual = true } = {}) {
  const frames = [], timers = new Map(), properties = new Map();
  const events = {}, viewportEvents = {};
  let id = 0, scrollCalls = 0;
  const viewport = Object.assign({ height: 926, scale: 1, offsetTop: 0, offsetLeft: 0 }, {
    addEventListener: (name, fn) => { viewportEvents[name] = fn; }
  });
  const scrolling = { scrollTop: 0, scrollLeft: 0 };
  const document = {
    hidden: false, activeElement: null, scrollingElement: scrolling,
    documentElement: {
      clientHeight: 879,
      style: {
        getPropertyValue: key => properties.get(key) || '',
        setProperty: (key, value) => properties.set(key, value)
      }
    },
    addEventListener: (name, fn) => { events['document:' + name] = fn; }
  };
  const window = {
    innerHeight: 926, scrollX: 0, scrollY: 0,
    visualViewport: visual ? viewport : undefined,
    scrollTo: () => {
      scrollCalls++;
      window.scrollX = window.scrollY = scrolling.scrollTop = scrolling.scrollLeft = 0;
      viewport.offsetTop = viewport.offsetLeft = 0;
    }
  };
  const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
  const code = source.split('// --- Recuperación del viewport de la PWA en iOS ---')[1].split('// --- Escenas ---')[0];
  const context = {
    window, document, isIOS: ios, standalone: () => installed, dev: false, Math,
    requestAnimationFrame: fn => { frames.push(fn); return ++id; },
    setTimeout: fn => { const key = ++id; timers.set(key, fn); return key; },
    clearTimeout: key => timers.delete(key),
    addEventListener: (name, fn) => { events[name] = fn; }
  };
  vm.runInNewContext(code + '\nglobalThis.recovery = viewportRecovery;', context);
  const flush = () => {
    let count = 0;
    while (frames.length) {
      assert.ok(++count < 20, 'recovery must not loop');
      frames.shift()();
    }
  };
  const drift = () => {
    window.scrollY = scrolling.scrollTop = viewport.offsetTop = 47;
  };
  return { window, document, viewport, properties, events, viewportEvents, timers,
    recovery: context.recovery, flush, drift, get scrollCalls() { return scrollCalls; } };
}

test('uses full window height instead of the shorter document client height', () => {
  const h = harness();
  h.flush();
  assert.equal(h.properties.get('--app-height'), '926px');
  assert.equal(h.document.documentElement.clientHeight, 879);
});

test('does not interfere while typing, then restores the document after focus leaves', () => {
  const h = harness();
  h.flush();
  h.document.activeElement = { matches: () => true };
  h.window.innerHeight = h.viewport.height = 600;
  h.drift();
  h.viewportEvents.resize();
  h.flush();
  assert.equal(h.scrollCalls, 0);
  assert.equal(h.properties.get('--app-height'), '926px');
  h.document.activeElement = null;
  h.window.innerHeight = 926;
  // The visual viewport can still be smaller during keyboard dismissal.
  h.events['document:focusout']();
  h.flush();
  assert.equal(h.scrollCalls, 1);
  assert.equal(h.window.scrollY, 0);
  assert.equal(h.properties.get('--app-height'), '926px');
});

test('preserves pinch zoom, then recovers when scale returns to one', () => {
  const h = harness();
  h.flush();
  h.viewport.scale = 2;
  h.window.innerHeight = h.viewport.height = 463;
  h.drift();
  h.viewportEvents.resize();
  h.flush();
  assert.equal(h.scrollCalls, 0);
  assert.equal(h.properties.get('--app-height'), '926px');
  h.viewport.scale = 1;
  h.window.innerHeight = 879;
  h.viewport.height = 926;
  h.viewportEvents.resize();
  h.flush();
  assert.equal(h.scrollCalls, 1);
  assert.equal(h.properties.get('--app-height'), '926px');
});

test('adapts to rotation and returning from the background', () => {
  const h = harness();
  h.flush();
  h.window.innerHeight = h.viewport.height = 428;
  h.events.resize();
  h.flush();
  assert.equal(h.properties.get('--app-height'), '428px');
  h.drift();
  h.events.pageshow();
  h.flush();
  assert.equal(h.window.scrollY, 0);
});

test('leaves ordinary browsers and non-iOS devices alone', () => {
  for (const options of [{ ios: false }, { installed: false }]) {
    const h = harness(options);
    h.flush();
    h.recovery.recover();
    h.flush();
    assert.equal(h.properties.size, 0);
    assert.equal(h.scrollCalls, 0);
  }
});

test('has a window-size fallback when visualViewport is absent', () => {
  const h = harness({ visual: false });
  h.flush();
  h.drift();
  h.recovery.recover();
  h.flush();
  assert.equal(h.properties.get('--app-height'), '926px');
  assert.equal(h.window.scrollY, 0);
});
