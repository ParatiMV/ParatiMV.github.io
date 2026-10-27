const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const config = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'config.js'), 'utf8') +
  '\nglobalThis.texts = CONFIG.texts;', config);
const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8')
  .split('// --- Saludos de regreso ---')[1].split('// --- Aviso de vídeo ---')[0];
const key = 'paratimv:return-greetings';

function picker(storage, { texts = config.texts, blocked = false, random = () => 0 } = {}) {
  const math = Object.create(Math);
  math.random = random;
  const context = vm.createContext({
    T: texts, Math: math, Set, JSON, Array, Number,
    localStorage: {
      getItem: name => { if (blocked) throw Error('blocked'); return storage.get(name) ?? null; },
      setItem: (name, value) => { if (blocked) throw Error('blocked'); storage.set(name, value); }
    }
  });
  vm.runInContext(source, context);
  return () => vm.runInContext('pickReturnGate()', context);
}

test('uses every greeting before repeating and never repeats across cycle boundaries', () => {
  const storage = new Map(), next = picker(storage);
  const size = config.texts.returnGates.length;
  assert.ok(size >= 6);
  const titles = Array.from({ length: size * 8 }, () => next()[0]);
  for (let i = 1; i < titles.length; i++) assert.notEqual(titles[i], titles[i - 1]);
  for (let start = 0; start < titles.length; start += size) {
    assert.equal(new Set(titles.slice(start, start + size)).size, size);
  }
});

test('preserves greeting history across page instances', () => {
  const storage = new Map();
  const first = picker(storage)()[0];
  const second = picker(storage)()[0];
  assert.notEqual(first, second);
});

test('recovers malformed JSON and invalid remaining indexes', () => {
  const storage = new Map([[key, '{broken']]);
  const next = picker(storage);
  const first = next()[0];
  const state = JSON.parse(storage.get(key));
  state.remaining = [state.last, state.last, -1, 999, 'no'];
  storage.set(key, JSON.stringify(state));
  assert.notEqual(next()[0], first);
});

test('changed text sets reset the previous selection bag safely', () => {
  const storage = new Map(), old = picker(storage);
  old();
  const texts = { ...config.texts, returnGates: [['Nuevo uno', 'Uno'], ['Nuevo dos', 'Dos']] };
  const next = picker(storage, { texts });
  assert.equal(next()[0], 'Nuevo uno');
  assert.equal(next()[0], 'Nuevo dos');
});

test('unavailable storage and a legacy single greeting do not prevent rendering', () => {
  const next = picker(new Map(), { blocked: true });
  const title = next()[0];
  assert.ok(config.texts.returnGates.some(lines => lines[0] === title));
  const legacy = picker(new Map(), { texts: { gate: ['Hola', 'Contraseña'] } });
  assert.equal(legacy()[0], 'Hola');
  assert.equal(legacy()[0], 'Hola');
});

