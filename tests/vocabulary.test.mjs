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
  assert.doesNotMatch(read('cadConnectorSymbols.js'), /CAD_CONNECTOR_CATALOG\s*=\s*\[/);
  for (const s of config.icons.symbols) assert.ok(V.connector(s.abbreviation), `icon ${s.id} -> ${s.abbreviation}`);
  for (const f of readdirSync(new URL('../js/', import.meta.url))) assert.doesNotMatch(read(f), /BUILTIN_DEVICES/, f);
});

test('📚 Library: the app calls up the shared BIM picker (bimLibrary.js), not the old /api/bim/ui/picker.js, and makes no blank typed device', () => {
  const src = read('blockBuddyApp.js');
  assert.match(src, /from '\.\/bimLibrary\.js'/);
  assert.doesNotMatch(src, /\/api\/bim\/ui\/picker\.js/);
  assert.doesNotMatch(src, /createBlankDevice\('CUSTOM_DEVICE', 'Custom', 'Device'\);\n\s*this\.devices\.push/);
});
