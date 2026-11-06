// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
// ROAD-3583: the schematic block's .ifc twin (js/blockIfc.js) — written byte-deterministically, read back to
// the same block; Save Model standalone writes both files. IFC_OUT=<dir> npm test also writes the fixtures
// there, for IfcOpenShell validate + the BIM oracle (DATABASE.server.BIM editors_census.py).
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BlockDefinitionModel } from '../js/blockModel.js';
import { partToBlockDevice } from '../js/bimPart.js';
import { blockToIfc, blockFromIfc, connectorWords, systemTypeOf, ifcOfKind, isIfcText, schemaOf } from '../js/blockIfc.js';
import { connectBlockHost, saveBlockModel } from '../js/blockHost.js';
import { world } from './hostWorld.mjs';

function out(name, text) {
  if (!process.env.IFC_OUT) return;
  mkdirSync(process.env.IFC_OUT, { recursive: true });
  writeFileSync(join(process.env.IFC_OUT, name), text);
}

/** A block as the editor saves it, without the clock. */
const blockOf = (m) => { const b = m.toJSON(); delete b.timestamp; return b; };

function dsp() {
  const m = new BlockDefinitionModel('Audio DSP', 'DSP_CORE');
  m.id = 'dev_dsp_core';
  m.bulkAddPorts('dante');
  m.bulkAddPorts('power_ground');
  return m;
}

/** A library part (apk.bim.part/1) placed as a block: its type is the BIM part's. */
const PART = {
  id: 'yamaha/rio1608-d2', manufacturer: 'Yamaha', model: 'Rio1608-D2', name: 'Yamaha Rio1608-D2', category: 'Audio',
  physical: { rack_units: 2 },
  ports: [
    { group: 'MIC IN', count: 2, side: 'input', domain: 'audio', connector: 'XLR-F' },
    { group: 'OUT', count: 1, side: 'output', domain: 'audio', connector: 'XLR-M' },
    { group: 'Dante', count: 1, side: 'connection', domain: 'network', connector: 'EtherCON', signal: 'Dante / AES67' },
    { group: 'AC IN', count: 1, side: 'supply', domain: 'power', connector: 'powerCON' },
  ],
};

function libraryBlock() {
  const dev = partToBlockDevice(PART, { part: PART.id, url: '/api/bim/parts/yamaha/rio1608-d2', rev: '3' });
  dev.id = 'bim_yamaha_rio1608_d2';
  const m = new BlockDefinitionModel();
  m.loadDevice({ ...dev, kind: 'Stage Box' });
  return m;
}

function discovered() {
  const m = new BlockDefinitionModel();
  m.loadDevice({
    id: 'dev_disc_b8_27_eb_00_00_01', name: 'STAGEPI', displayName: 'stagepi', make: 'Raspberry Pi', model: 'Pi 5',
    kind: 'Custom Device', ru: 'Discovered', width: 280, height: 180, source: 'discovered',
    identity: { id: 'b8:27:eb:00:00:01', mac: 'B8:27:EB:00:00:01', serial: 'SN-123' },
    ports: [{ id: 'NET', label: 'b8:27:eb:00:00:01', side: 'top', dir: 'Bidi', format: 'Ethernet / IP', connector: 'Blank' }],
  });
  return m;
}

test('the same block writes the same bytes, and reads back to the same block', () => {
  const block = blockOf(dsp());
  const a = blockToIfc(block, { name: 'block_dsp_core' });
  assert.equal(a, blockToIfc(JSON.parse(JSON.stringify(block)), { name: 'block_dsp_core' }));
  assert.ok(isIfcText(a));
  assert.equal(schemaOf(a), 'IFC4X3_ADD2');
  out('block-dsp.ifc', a);
  assert.match(a, /IFCAUDIOVISUALAPPLIANCE\('[^']+',#\d+,'DSP_CORE','DSP_CORE','DSP \/ Mixer',#\d+,\$,'dev_dsp_core',\.USERDEFINED\.\)/);
  assert.match(a, /IFCAUDIOVISUALAPPLIANCETYPE\('[^']+',#\d+,'APK Audio DSP_CORE'/);
  assert.match(a, /'RackUnits',\$,IFCINTEGER\(1\)/);
  assert.match(a, /IFCDISTRIBUTIONPORT\('[^']+',#\d+,'Analog In 1','Analog Audio',\$,\$,\$,\.SINK\.,\.CABLE\.,\.AUDIOVISUAL\.\)/);
  assert.match(a, /IFCDISTRIBUTIONPORT\('[^']+',#\d+,'Analog Out 1','Analog Audio',\$,\$,\$,\.SOURCE\./);
  assert.match(a, /IFCDISTRIBUTIONPORT\('[^']+',#\d+,'Dante Primary','Dante \/ AES67',\$,\$,\$,\.SOURCEANDSINK\.,\.CABLE\.,\.DATA\.\)/);
  assert.match(a, /'Protocols',\$,\(IFCIDENTIFIER\('Dante'\),IFCIDENTIFIER\('AES67'\)\)/);
  assert.match(a, /IFCDISTRIBUTIONPORT\('[^']+',#\d+,'Chassis Earth Ground',[^)]*\.EARTHING\.\)/);
  assert.match(a, /'ElectricalConnectionType',\$,\(IFCLABEL\('XLR'\)\)/);
  const b = blockFromIfc(a);
  assert.deepEqual(b, block);
  assert.equal(blockToIfc(b, { name: 'block_dsp_core' }), a, 'read and written again: the same file');
});

test('a library block: typed by its BIM part (GlobalId part/<id>, APK_Part.PartId), its reference kept', async () => {
  const { ifcGuid } = await import('../vendor/apk-contracts/apk-ifc.js');
  const block = blockOf(libraryBlock());
  const a = blockToIfc(block, { name: 'block_rio' });
  out('block-library-part.ifc', a);
  assert.match(a, new RegExp(`IFCAUDIOVISUALAPPLIANCETYPE\\('${ifcGuid('part', PART.id).replace(/\$/g, '\\$')}',#\\d+,'Yamaha Rio1608-D2'`));
  assert.match(a, /'PartId',\$,IFCIDENTIFIER\('yamaha\/rio1608-d2'\)/);
  assert.match(a, /'RackUnits',\$,IFCINTEGER\(2\)/);
  assert.match(a, /'ConnectionGender',\$,\(IFCLABEL\('FEMALE'\)\)/);
  assert.match(a, /'ElectricalConnectionType',\$,\(IFCLABEL\('ACPLUG'\)\)/);
  const b = blockFromIfc(a);
  assert.deepEqual(b, block);
  assert.equal(b.bimId, PART.id);
  assert.deepEqual(b.bimRef, { part: PART.id, url: '/api/bim/parts/yamaha/rio1608-d2', rev: '3' });
});

test('a discovered unit: GlobalId inst/mac:<mac>, its identity in APK_Identity and the serial ISO\'s; never an IP', async () => {
  const { ifcGuid } = await import('../vendor/apk-contracts/apk-ifc.js');
  const block = blockOf(discovered());
  const a = blockToIfc(block, { name: 'block_stagepi' });
  out('block-discovered.ifc', a);
  assert.match(a, new RegExp(`IFCDISTRIBUTIONELEMENT\\('${ifcGuid('inst', 'mac:b8:27:eb:00:00:01').replace(/\$/g, '\\$')}'`));
  assert.match(a, /'IdentityKey',\$,IFCIDENTIFIER\('mac:b8:27:eb:00:00:01'\)/);
  assert.match(a, /'SerialNumber',\$,IFCIDENTIFIER\('SN-123'\)/);
  assert.match(a, /IFCDISTRIBUTIONPORT\('[^']+',#\d+,'b8:27:eb:00:00:01','Ethernet \/ IP',\$,\$,\$,\.SOURCEANDSINK\.,\.NOTDEFINED\.,\.DATA\.\)/, 'a blank connector is no cable');
  const b = blockFromIfc(a);
  assert.deepEqual(b.identity, { id: 'b8:27:eb:00:00:01', mac: 'b8:27:eb:00:00:01', serial: 'SN-123' });
  assert.deepEqual({ ...b, identity: null }, { ...block, identity: null });
});

test('the vocabulary helpers', () => {
  assert.deepEqual(connectorWords('X3S'), { type: 'XLR', gender: 'FEMALE', subtype: 'X3S' });
  assert.deepEqual(connectorWords('XLR-M'), { type: 'XLR', gender: 'MALE', subtype: 'XLR-M' });
  assert.equal(connectorWords('EtherCON').type, 'RJ');
  assert.equal(connectorWords('RJ45').type, 'RJ');
  assert.equal(connectorWords('BNC').type, 'COAXIAL');
  assert.equal(connectorWords('C14').type, 'ACPLUG');
  assert.equal(connectorWords('IEC').type, 'ACPLUG');
  assert.equal(connectorWords('Blank'), null);
  assert.equal(systemTypeOf('Gigabit PoE+'), 'DATA');
  assert.equal(systemTypeOf('AC Mains 120/240V'), 'ELECTRICAL');
  assert.equal(systemTypeOf('WordClock'), 'SIGNAL');
  assert.equal(systemTypeOf('RS-232 / 422'), 'CONTROL');
  assert.deepEqual(ifcOfKind('Network Switch'), { entity: 'IFCCOMMUNICATIONSAPPLIANCE', predefined: 'NETWORKAPPLIANCE', word: null });
  assert.deepEqual(ifcOfKind('Something New'), { entity: 'IFCDISTRIBUTIONELEMENT', predefined: null, word: null });
});

test('not a device: a sentence, never a half-read block', () => {
  const a = blockToIfc(blockOf(dsp()), { name: 'x' }).replace(/IFCRELNESTS\(/g, 'IFCRELAGGREGATES(');
  assert.throws(() => blockFromIfc(a), /no device in this IFC/);
});

test('standalone Save Model: the .ifc twin and the .json, both downloaded; in the CAD, back to the drawing', async () => {
  const alone = world({ framed: false });
  const block = blockOf(dsp());
  const host = connectBlockHost(alone.S, { current: () => block, notice: false });
  assert.equal(await saveBlockModel(alone.S, host, block), 'download');
  assert.deepEqual(alone.downloads.map((d) => d.name), ['block_dsp_core.ifc', 'block_dsp_core.json']);
  assert.deepEqual(blockFromIfc(alone.downloads[0].text), JSON.parse(alone.downloads[1].text));

  const framed = world();
  const h2 = connectBlockHost(framed.S, { current: () => block, notice: false });
  await saveBlockModel(framed.S, h2, block);
  assert.equal(framed.toParent.at(-1).m.type, 'blockSave');
});
