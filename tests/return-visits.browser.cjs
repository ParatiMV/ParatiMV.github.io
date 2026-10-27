// Run with Playwright installed: node tests/return-visits.browser.cjs
// Optional PARATIMV_PLAYWRIGHT module path and PARATIMV_BROWSER executable.
const { chromium } = require(process.env.PARATIMV_PLAYWRIGHT || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PARATIMV_BROWSER ? { executablePath: process.env.PARATIMV_BROWSER } : {})
  });
  const errors = [];
  const observedGates = [];
  const makeContext = async (storageBlocked = false) => {
    const context = await browser.newContext({
      viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true, serviceWorkers: 'block',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 27_0_1 like Mac OS X) AppleWebKit/605.1.15 Version/27.0 Mobile/15E148 Safari/604.1'
    });
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      if (!['index.html', 'script.js', 'config.js', 'style.css', 'manifest.json'].includes(name)) {
        return route.abort(); // No personal media can be fetched or decoded.
      }
      const contentType = name.endsWith('.js') ? 'text/javascript' : name.endsWith('.css') ? 'text/css'
        : name.endsWith('.json') ? 'application/json' : 'text/html';
      await route.fulfill({ contentType, body: fs.readFileSync(path.join(__dirname, '..', name)) });
    });
    await context.addInitScript(blocked => {
      // Feature tests compress timers. The normal-intro test uses real timing separately.
      const timeout = window.setTimeout.bind(window);
      window.setTimeout = (fn, ms, ...args) => timeout(fn, Math.min(ms, 25), ...args);
      window.Audio = class extends EventTarget {
        paused = true;
        play() { this.paused = false; this.dispatchEvent(new Event('play')); return Promise.resolve(); }
        pause() { this.paused = true; this.dispatchEvent(new Event('pause')); }
      };
      if (blocked) Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage unavailable'); } });
      addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.textContent = '* { transition: none !important; animation: none !important; }';
        document.head.append(style);
      });
    }, storageBlocked);
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    return { context, page };
  };
  const gate = async page => {
    await page.goto('http://localhost/?dev');
    await page.waitForFunction(() => typeof document.querySelector('#pw')?.onkeydown === 'function');
    const title = (await page.locator('#app .scene > p.l').first().textContent()).trim();
    const variants = await page.evaluate(() => CONFIG.texts.returnGates.map(lines => lines[0]));
    if (variants.includes(title)) {
      assert.notEqual(title, observedGates.at(-1));
      const cycle = observedGates.slice(Math.floor(observedGates.length / variants.length) * variants.length);
      assert.ok(!cycle.includes(title), 'greetings must not repeat within one cycle');
      observedGates.push(title);
    }
  };
  const login = async page => {
    await page.locator('#pw').fill(await page.evaluate(() => CONFIG.password));
    await page.locator('#pw').press('Enter');
    await page.waitForFunction(() => document.querySelector('.scene.has-page-nav')?.textContent.includes('Hoy te toca'));
  };
  const count = async page => (await page.locator('#pageCount').textContent()).trim();

  try {
    const { context, page } = await makeContext();
    await gate(page);
    assert.match(await page.locator('#app').innerText(), /Esto es para ti/);
    await page.locator('#pw').fill((await page.evaluate(() => CONFIG.password)) + '-wrong');
    await page.locator('#pw').press('Enter');
    assert.equal(await page.evaluate(() => localStorage.getItem('paratimv:entered')), null);
    assert.equal(await page.locator('#video-shortcut').count(), 0);
    await login(page);
    assert.equal(await page.evaluate(() => localStorage.getItem('paratimv:entered')), '1');
    assert.equal(await page.locator('#video-shortcut').count(), 0);
    assert.equal(await count(page), '01 / 07');
    console.log('PASS first visit and wrong password: original gate, marker only after success, no shortcut');

    await gate(page);
    assert.ok((await page.evaluate(() => CONFIG.texts.returnGates.map(lines => lines[0]))).some(title => observedGates.includes(title)));
    assert.equal(await page.locator('#video-shortcut').count(), 0);
    await login(page);
    await page.waitForSelector('#video-shortcut');
    assert.equal(await count(page), '01 / 07');
    assert.equal(await page.locator('.notice-go').isDisabled(), true);
    const noticeRect = await page.locator('#video-shortcut').boundingBox();
    assert.ok(Math.abs(noticeRect.x + noticeRect.width / 2 - 393 / 2) < 1);
    assert.equal(await page.locator('#video-shortcut').evaluate(e => getComputedStyle(e).touchAction), 'pinch-zoom');
    if (process.env.PARATIMV_SNAPSHOT) await page.screenshot({ path: process.env.PARATIMV_SNAPSHOT });
    await page.setViewportSize({ width: 428, height: 926 });
    await page.waitForFunction(() => document.body.getBoundingClientRect().height === 926);
    const wideNotice = await page.locator('#video-shortcut').boundingBox();
    assert.ok(Math.abs(wideNotice.x + wideNotice.width / 2 - 214) < 1);
    assert.ok(Math.abs(wideNotice.y - 76.8) < 1);
    if (process.env.PARATIMV_SNAPSHOT) await page.screenshot({ path: process.env.PARATIMV_SNAPSHOT.replace('.png', '-wide.png') });
    await page.setViewportSize({ width: 393, height: 852 });
    await page.waitForFunction(() => document.body.getBoundingClientRect().height === 852);
    await page.locator('[data-choice="no"]').click();
    assert.equal(await page.locator('[data-choice="no"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.notice-go').isEnabled(), true);
    await page.locator('.notice-go').click();
    await page.locator('#video-shortcut').waitFor({ state: 'detached' });
    assert.equal(await count(page), '01 / 07');
    console.log('PASS second visit: new gate; No requires Ir and stays on page one');

    await gate(page); await login(page);
    await page.waitForSelector('#video-shortcut');
    await page.locator('.notice-close').click();
    await page.locator('#video-shortcut').waitFor({ state: 'detached' });
    assert.equal(await count(page), '01 / 07');
    console.log('PASS returning notice closes with X');

    await gate(page); await login(page);
    const notice = page.locator('#video-shortcut');
    await notice.waitFor();
    const box = await notice.boundingBox();
    const dragX = box.x + box.width / 2, dragY = box.y + box.height - 15;
    await page.mouse.move(dragX, dragY);
    await page.mouse.down();
    await page.mouse.move(dragX + 100, dragY, { steps: 8 });
    await page.mouse.up();
    assert.equal(await page.locator('#video-shortcut').count(), 1);
    await page.mouse.move(dragX, dragY);
    await page.mouse.down();
    await page.mouse.move(dragX, dragY - 90, { steps: 8 });
    await page.mouse.up();
    await page.locator('#video-shortcut').waitFor({ state: 'detached' });
    assert.equal(await count(page), '01 / 07');
    console.log('PASS upward swipe dismisses, horizontal swipe stays; centered card preserves pinch zoom');

    await gate(page); await login(page);
    await page.waitForSelector('#video-shortcut');
    const choiceBox = await page.locator('[data-choice="no"]').boundingBox();
    const choiceX = choiceBox.x + choiceBox.width / 2, choiceY = choiceBox.y + choiceBox.height / 2;
    await page.mouse.move(choiceX, choiceY);
    await page.mouse.down();
    await page.mouse.move(choiceX, choiceY - 90, { steps: 8 });
    await page.mouse.up();
    await page.locator('#video-shortcut').waitFor({ state: 'detached' });
    assert.equal(await count(page), '01 / 07');
    console.log('PASS upward drag starting on an action dismisses without activating it');

    await gate(page); await login(page);
    await page.waitForSelector('#video-shortcut');
    await page.locator('[data-choice="yes"]').click();
    assert.equal(await page.locator('[data-choice="yes"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await count(page), '01 / 07');
    assert.equal(await page.locator('video').count(), 0);
    await page.locator('.notice-go').click();
    await page.waitForSelector('video', { state: 'attached' });
    assert.equal(await count(page), '06 / 07');
    assert.equal(await page.locator('#video-shortcut').count(), 0);
    assert.equal(await page.locator('video').getAttribute('preload'), 'none');
    assert.equal(await page.locator('video').getAttribute('autoplay'), null);
    assert.equal(await page.locator('video').evaluate(v => v.paused), true);
    await page.locator('#pageBack').click();
    await page.waitForFunction(() => document.querySelector('.scene.has-page-nav')?.textContent.includes('Hoy te toca'));
    assert.equal(await count(page), '01 / 07');
    assert.equal(await page.locator('#video-shortcut').count(), 0);
    await page.locator('#pageForward').click();
    await page.waitForSelector('video', { state: 'attached' });
    assert.equal(await count(page), '06 / 07');
    console.log('PASS Yes waits for Ir, skips to paused video, preserves back/forward history');

    await gate(page); await login(page);
    await page.waitForSelector('#video-shortcut');
    await page.getByRole('button', { name: 'Empezar', exact: true }).click();
    await page.waitForSelector('.letter');
    assert.equal(await page.locator('#video-shortcut').count(), 0);
    assert.equal(await count(page), '02 / 07');
    console.log('PASS normal continuation dismisses the old notice');
    while (observedGates.length < 8) await gate(page);
    console.log('PASS shuffled greeting cycles across reloads without consecutive repeats');

    const blocked = await makeContext(true);
    await gate(blocked.page); await login(blocked.page);
    assert.equal(await blocked.page.locator('#video-shortcut').count(), 0);
    assert.equal(await count(blocked.page), '01 / 07');
    await blocked.context.close();
    assert.deepEqual(errors, []);
    await context.close();
    console.log('PASS unavailable storage does not block login; no uncaught browser errors');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

