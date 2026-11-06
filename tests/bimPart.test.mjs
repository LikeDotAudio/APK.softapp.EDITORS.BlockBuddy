// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import test from 'node:test';
import assert from 'node:assert/strict';
import { partToBlockDevice, PINS_PER_GROUP } from '../js/bimPart.js';
import { BlockDefinitionModel } from '../js/blockModel.js';

const PART = {
  id: 'qsc/core-110f', manufacturer: 'QSC', model: 'Core 110f', name: 'QSC Core 110f', category: 'Audio',
  physical: { rack_units: 1 },
  ports: [
    { group: 'Mic In', side: 'input', domain: 'audio', connector: 'Phoenix 3-pin', count: 8 },
    { group: 'LAN', side: 'connection', domain: 'network', connector: 'RJ45', count: 2, labels: ['A', 'B'] },
    { group: 'GPIO', side: 'connection', domain: 'control', count: 1 },
    { group: 'Mains', side: 'input', domain: 'power', connector: 'IEC C14', count: 1 },
    { group: 'Ch', side: 'output', domain: 'audio', count: 100 }
  ]
};

test('a library part becomes a block: every terminal a pin, on its side', () => {
  const d = partToBlockDevice(PART);
  assert.equal(d.make, 'QSC');
  assert.equal(d.bimId, 'qsc/core-110f');
  assert.equal(d.ru, '1U');
  assert.equal(d.ports.filter(p => p.side === 'left').length, 8);
  assert.deepEqual(d.ports.filter(p => /^LAN/.test(p.label)).map(p => p.label), ['LAN A', 'LAN B']);
  assert.equal(d.ports.find(p => p.label === 'GPIO').side, 'top');
  assert.equal(d.ports.find(p => p.label === 'Mains').side, 'bottom');
  const ch = d.ports.filter(p => p.label.startsWith('Ch '));
  assert.equal(ch.length, PINS_PER_GROUP);
  assert.match(ch.at(-1).label, /\+68 more/);
  assert.equal(new Set(d.ports.map(p => p.id)).size, d.ports.length);
});

test('the block model loads it', () => {
  const m = new BlockDefinitionModel();
  m.loadDevice(partToBlockDevice(PART));
  assert.ok(JSON.stringify(m.toJSON()).includes('Core 110f'));
});

test('a block from a pick keeps the part and its BIM reference, and saves them (ROAD-3572)', () => {
  const ref = { part: 'qsc/core-110f', url: 'http://apk.local:8160/api/bim/parts/qsc/core-110f', rev: 'abc' };
  const d = partToBlockDevice(PART, ref);
  assert.deepEqual(d.bimRef, ref);
  const m = new BlockDefinitionModel();
  m.loadDevice(d);
  const j = m.toJSON();
  assert.equal(j.bimId, 'qsc/core-110f');
  assert.deepEqual(j.bimRef, ref);
  const old = new BlockDefinitionModel();
  old.loadDevice({ name: 'X', make: 'Typed', model: 'By hand', ports: [] });
  assert.equal(old.toJSON().make, 'Typed', 'a typed make from before stays readable');
  assert.equal(old.toJSON().bimRef, undefined);
});
