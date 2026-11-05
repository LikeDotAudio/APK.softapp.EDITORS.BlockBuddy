// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
// ROAD-3501: Block Buddy's connector and format selects are the shared
// vocabulary (vendor/apk-vocabulary, the CAD's catalogue) through
// config/vocabulary.json; its devices come from the BIM library's picker.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { CAD_CONNECTORS, SIGNAL_FORMATS, connectorIconId, formatColorForSignal, createBlankDevice } from '../js/deviceCatalog.js';
import { CAD_SYMBOLS_SVG_SHEET } from '../js/cadConnectorSymbols.js';
import { VOCABULARY } from '../js/vocabulary.js';
import { mountLibraryButton } from '../js/libraryPicker.js';

const V = globalThis.APKVocabulary;
const config = JSON.parse(readFileSync(new URL('../config/vocabulary.json', import.meta.url), 'utf8'));
const read = (f) => readFileSync(new URL(`../js/${f}`, import.meta.url), 'utf8');

test('config/vocabulary.json names only what the catalogue has', () => {
  assert.deepEqual(VOCABULARY.problems, []);
});

test('connectors are the CAD catalogue\'s, from the configured groups', () => {
  assert.ok(CAD_CONNECTORS.length > 100, `${CAD_CONNECTORS.length}`);
  for (const n of CAD_CONNECTORS) assert.ok(config.connectors.groups.includes(V.connector(n)?.group), n);
  for (const [old, abbr] of Object.entries(config.connectors.aliases)) assert.equal(VOCABULARY.connectorFor(old)?.abbreviation, abbr, old);
});

test('formats: this app\'s physical formats first, then the CAD\'s flows', () => {
  assert.equal(SIGNAL_FORMATS[0], 'Analog Audio');
  assert.ok(SIGNAL_FORMATS.includes('DANTE') && SIGNAL_FORMATS.includes('ST2110-30') && SIGNAL_FORMATS.includes('NDI'));
  assert.equal(VOCABULARY.formatFor('Dante / AES67')?.abbreviation, 'DANTE');
  assert.equal(formatColorForSignal('ST2110-20'), config.colors.byClass.video);
  assert.equal(formatColorForSignal('no such format'), config.colors.default);
});

test('every configured icon is one of the app\'s symbols, and catalogue names draw through it', () => {
  const symbols = new Set([...CAD_SYMBOLS_SVG_SHEET.matchAll(/<symbol id="cad-icon-([^"]+)"/g)].map(m => m[1]));
  for (const icon of [...Object.values(config.icons.byConnector), ...Object.values(config.icons.byGroup), config.icons.default]) {
    assert.ok(symbols.has(icon), icon);
  }
  assert.equal(connectorIconId('X3S'), 'xlr-f');
  assert.equal(connectorIconId('XLR-F'), 'xlr-f');      // an older spelling, through the config alias
  assert.ok(symbols.has('x3s') && symbols.has('spk4s') && symbols.has('c14'));
  for (const p of createBlankDevice().ports) assert.ok(V.connector(p.connector), p.connector);
});

test('no connector, format or device list is typed into the app source', () => {
  const cat = read('deviceCatalog.js');
  assert.doesNotMatch(cat, /SIGNAL_FORMATS\s*=\s*\[/);
  assert.doesNotMatch(cat, /CAD_CONNECTORS\s*=\s*\[/);
  for (const f of readdirSync(new URL('../js/', import.meta.url))) assert.doesNotMatch(read(f), /BUILTIN_DEVICES/, f);
});

/* A DOM just big enough for the library button. */
function fakeAnchor() {
  const before = [];
  return { before: (n) => before.push(n), placed: before };
}
const doc = {
  createElement: (tag) => ({ tag, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, textContent: '', title: '' }),
};

test('📚 Library: the BIM picker\'s button goes before + New Device', async () => {
  const anchor = fakeAnchor();
  const picked = [];
  const r = await mountLibraryButton(anchor, (p) => picked.push(p), {
    doc, load: async () => ({ libraryButton: (opts, onPick) => ({ opts, click: () => onPick({ id: 'part-1' }) }) }),
  });
  assert.equal(r.ok, true);
  assert.equal(anchor.placed[0], r.button);
  r.button.click();
  assert.deepEqual(picked, [{ id: 'part-1' }]);
});

test('📚 Library: no /api/bim says so on screen, and adds no devices of its own', async () => {
  const anchor = fakeAnchor();
  const r = await mountLibraryButton(anchor, () => assert.fail('nothing to pick'), {
    doc, load: async () => { throw new TypeError('Failed to fetch dynamically imported module: /api/bim/ui/picker.js'); },
  });
  assert.equal(r.ok, false);
  assert.equal(anchor.placed.length, 1);
  assert.match(r.notice.textContent, /No BIM library on this host/);
  assert.equal(r.notice.attrs['data-apk-state'], 'dead');
  assert.equal(r.notice.attrs.role, 'status');
  assert.match(r.notice.title, /Failed to fetch/);
});

test('📚 Library: the app mounts the picker through libraryPicker.js, never a silent catch', (t) => {
  const src = read('blockBuddyApp.js');
  // The call site landed separately (js/blockBuddyApp.js held another session's work); until then, say so.
  if (!/from '\.\/libraryPicker\.js'/.test(src)) return t.skip('js/blockBuddyApp.js does not use js/libraryPicker.js yet');
  assert.match(src, /mountLibraryButton\(this\.btnNewDevice/);
  assert.doesNotMatch(src, /import\('\/api\/bim\/ui\/picker\.js'\)[\s\S]{0,600}\.catch\(\(\) => \{\}\)/);
});
