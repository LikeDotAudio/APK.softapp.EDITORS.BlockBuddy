// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
// ROAD-3487: the schematic block round trip over cad.like.audio/host@1 (the
// real vendored apk-softapp.js), and discovered things as devices.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { world, ORIGIN, PROTOCOL } from './hostWorld.mjs';
import { BlockDefinitionModel } from '../js/blockModel.js';
import { DEVICE_CATEGORIES, SIGNAL_FORMATS, cloneDevice } from '../js/deviceCatalog.js';
import { connectBlockHost, deviceFromThing, mergeDiscovered, BLOCK_TYPE, NETWORK_FORMAT } from '../js/blockHost.js';

function linked(S) {
  const model = new BlockDefinitionModel('Audio DSP', 'DSP_CORE');
  const loads = [];
  const host = connectBlockHost(S, {
    onLoad: (block, meta) => { model.loadDevice(block); loads.push(meta); },
    current: () => model.toJSON(),
    notice: false,
  });
  return { model, host, loads };
}

test('in the CAD: editorReady, load fills the block, request saves the edited block to our origin only', () => {
  const { S, toParent, fire } = world();
  const { model, loads } = linked(S);
  assert.deepEqual(toParent[0], { m: { protocol: PROTOCOL, type: 'editorReady', editor: 'Block Buddy', blockType: BLOCK_TYPE }, o: ORIGIN });

  const cad = new BlockDefinitionModel('Stage Box', 'STAGE_A').toJSON();
  fire({ protocol: PROTOCOL, type: 'load', block: cad, meta: { blockName: 'STAGE_A' } });
  assert.deepEqual(loads, [{ blockName: 'STAGE_A' }]);
  assert.equal(model.name, 'STAGE_A');
  assert.equal(model.kind, 'Stage Box');

  model.bulkAddPorts('dante');
  fire({ protocol: PROTOCOL, type: 'request' });
  const save = toParent.at(-1);
  assert.equal(save.o, ORIGIN);
  assert.equal(save.m.type, 'blockSave');
  assert.equal(save.m.blockType, BLOCK_TYPE);
  assert.equal(save.m.block.name, 'STAGE_A');
  assert.equal(save.m.block.ports.length, cad.ports.length + 2);
  assert.equal(save.m.meta.filename, 'block_stage_a');
  assert.match(save.m.meta.title, /\(8 Ports\)$/);
  assert.ok(toParent.every((x) => x.o === ORIGIN));

  const back = new BlockDefinitionModel();
  back.loadDevice(save.m.block);
  assert.deepEqual(back.ports, save.m.block.ports, 'what was saved loads back unchanged');
});

test('standalone: Save downloads block_<name>.json', () => {
  const { S, downloads, toParent } = world({ framed: false });
  const { model, host } = linked(S);
  assert.equal(host.save(model.toJSON(), { filename: 'block_dsp_core' }), 'download');
  assert.equal(toParent.length, 0);
  assert.equal(downloads[0].name, 'block_dsp_core.json');
  assert.equal(JSON.parse(downloads[0].text).name, 'DSP_CORE');
});

// The shape APKSoftapp.discovered().things() returns (apk-softapp.js header).
const switchThing = {
  id: '00:07:f5:42:06:a2', mac: '00:07:f5:42:06:a2', serial: '', name: 'core-sw-1', ips: ['44.44.44.20'],
  vendor: 'Netgear', model: 'M4250-26G4F', protocols: ['snmp', 'ping'], kinds: ['snmp', 'ping', 'network switch'],
  fields: {}, agent: '', live: { state: 'good', why: 'verified 12s ago' },
};
const bareThing = {
  id: 'SN-0042', mac: '', serial: 'SN-0042', name: '', ips: ['44.44.44.77'], vendor: '', model: '',
  protocols: ['visa'], kinds: ['visa'], fields: {}, agent: '', live: { state: 'kinda', why: 'last verified 9 min ago' },
};

test('a discovered thing becomes a device keyed by MAC / serial, never IP, with only what the bus said', () => {
  const dev = deviceFromThing(switchThing, DEVICE_CATEGORIES);
  assert.equal(dev.id, 'dev_disc_00_07_f5_42_06_a2');
  assert.equal(dev.source, 'discovered');
  assert.equal(dev.kind, 'Network Switch', 'device_class names a category');
  assert.equal(dev.make, 'Netgear');
  assert.deepEqual(dev.identity, { id: '00:07:f5:42:06:a2', mac: '00:07:f5:42:06:a2', serial: '' });
  assert.deepEqual(dev.live, switchThing.live);
  assert.equal(dev.ports.length, 1, 'only the network port it was seen on');
  assert.equal(dev.ports[0].format, NETWORK_FORMAT);
  assert.ok(SIGNAL_FORMATS.includes(NETWORK_FORMAT));
  assert.ok(!JSON.stringify(dev).includes('44.44.44.20'), 'no IP in the device');

  const bare = deviceFromThing(bareThing, DEVICE_CATEGORIES);
  assert.equal(bare.id, 'dev_disc_sn_0042');
  assert.equal(bare.kind, 'Custom Device');
  assert.equal(bare.ports[0].label, 'SN-0042');
  assert.equal(deviceFromThing({}, DEVICE_CATEGORIES), null);

  const model = new BlockDefinitionModel();
  model.loadDevice(dev);
  assert.deepEqual(model.toJSON().identity, dev.identity, 'the saved block carries its identity');
  model.loadDevice(cloneDevice(dev));
  assert.equal(model.toJSON().identity, undefined, 'a copy is not the discovered unit');
});

test('merging keeps the user\'s edits to a known device and updates only its live state', () => {
  const devices = [];
  assert.equal(mergeDiscovered(devices, [switchThing, bareThing], DEVICE_CATEGORIES), 2);
  devices.find((d) => d.identity.serial === 'SN-0042').ports.push({ id: 'CH1', side: 'left' });
  const later = { ...bareThing, live: { state: 'dead', why: 'lost 2 min ago' } };
  assert.equal(mergeDiscovered(devices, [later], DEVICE_CATEGORIES), 0);
  const bare = devices.find((d) => d.identity.serial === 'SN-0042');
  assert.equal(bare.live.state, 'dead');
  assert.equal(bare.ports.length, 2);
});

test('nothing in the source claims to be discovered, and the discovery kinds are a config tunable', () => {
  const catalog = fs.readFileSync(new URL('../js/deviceCatalog.js', import.meta.url), 'utf8');
  assert.ok(!/source:\s*'discovered'/.test(catalog));
  const app = fs.readFileSync(new URL('../js/blockBuddyApp.js', import.meta.url), 'utf8');
  assert.ok(!/34401|\/api\/discovered|all_discovered/.test(app));
  const cfg = JSON.parse(fs.readFileSync(new URL('../config/discovery.json', import.meta.url)));
  assert.ok(Array.isArray(cfg.kinds));
});
