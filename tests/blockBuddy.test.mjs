// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

import test from 'node:test';
import assert from 'node:assert/strict';

import { BlockDefinitionModel } from '../js/blockModel.js';
import {
  BUILTIN_DEVICES,
  createBlankDevice,
  cloneDevice,
  CAD_CONNECTORS,
  SIGNAL_FORMATS,
  formatColorForSignal,
} from '../js/deviceCatalog.js';
import { CAD_CONNECTOR_CATALOG, getConnectorMeta } from '../js/cadConnectorSymbols.js';

test('Block Definition Model Initialization', () => {
  const model = new BlockDefinitionModel('Audio DSP', 'DSP_CORE');
  assert.equal(model.name, 'DSP_CORE');
  assert.equal(model.kind, 'Audio DSP');
  assert.ok(model.ports.length >= 4);

  const leftPins = model.ports.filter(p => p.side === 'left');
  const rightPins = model.ports.filter(p => p.side === 'right');
  assert.ok(leftPins.length >= 2);
  assert.ok(rightPins.length >= 2);
});

test('Load Any Device from Built-in Catalog', () => {
  const model = new BlockDefinitionModel();

  // Test loading Discovered 34401A Multimeter
  const dmm = BUILTIN_DEVICES.find(d => d.id === 'dev_bench_34401a');
  assert.ok(dmm, 'DMM 34401A must exist in catalog');
  model.loadDevice(dmm);
  assert.equal(model.name, 'Keysight_34401A');
  assert.equal(model.make, 'Keysight / Agilent');
  assert.equal(model.kind, 'Test Instrument');
  assert.ok(model.ports.some(p => p.id === 'INPUT_HI'));

  // Test loading Q-SYS Core 110f
  const qsys = BUILTIN_DEVICES.find(d => d.id === 'dev_qsys_core110f');
  assert.ok(qsys, 'Q-SYS Core 110f must exist in catalog');
  model.loadDevice(qsys);
  assert.equal(model.name, 'QSYS_Core_110f');
  assert.equal(model.kind, 'Audio DSP');
  assert.ok(model.ports.some(p => p.id === 'LAN_A_PRI'));

  // Test loading Netgear Switch
  const sw = BUILTIN_DEVICES.find(d => d.id === 'dev_netgear_m4250_24g2f');
  assert.ok(sw, 'Netgear Switch must exist in catalog');
  model.loadDevice(sw);
  assert.equal(model.name, 'Netgear_M4250_24G2F');
  assert.equal(model.kind, 'Network Switch');

  // Test loading Yamaha Stage Box
  const stageBox = BUILTIN_DEVICES.find(d => d.id === 'dev_yamaha_tio1608d');
  assert.ok(stageBox, 'Yamaha Stage Box must exist');
  model.loadDevice(stageBox);
  assert.equal(model.name, 'Yamaha_Tio1608_D');
  assert.ok(model.ports.some(p => p.connector === 'EtherCON'));
});

test('Port Mutations and Bulk Operations', () => {
  const model = new BlockDefinitionModel('Test', 'TEST_DEVICE');
  model.ports = [];

  // Add individual port
  model.addPort({
    id: 'IN_XLR',
    side: 'left',
    dir: 'In',
    format: 'Analog Audio',
    connector: 'XLR-F'
  });
  assert.equal(model.ports.length, 1);
  assert.equal(model.ports[0].id, 'IN_XLR');

  // Bulk add 8 inputs
  model.bulkAddPorts('inputs8');
  assert.equal(model.ports.length, 9);
  const leftPorts = model.ports.filter(p => p.side === 'left');
  assert.equal(leftPorts.length, 9);

  // Bulk add 8 outputs
  model.bulkAddPorts('outputs8');
  assert.equal(model.ports.length, 17);
  const rightPorts = model.ports.filter(p => p.side === 'right');
  assert.equal(rightPorts.length, 8);

  // Bulk add Dante Pair
  model.bulkAddPorts('dante');
  assert.equal(model.ports.length, 19);
  assert.ok(model.ports.some(p => p.id === 'DANTE_PRI' && p.side === 'top'));

  // Bulk add Power & Ground
  model.bulkAddPorts('power_ground');
  assert.equal(model.ports.length, 21);
  assert.ok(model.ports.some(p => p.id === 'AC_MAINS' && p.side === 'bottom'));

  // Remove port
  const removed = model.removePort(0);
  assert.equal(removed.id, 'IN_XLR');
  assert.equal(model.ports.length, 20);
});

test('Device Creation and Cloning', () => {
  const blank = createBlankDevice('CUSTOM_PROCESSOR', 'CustomLab', 'DSP-8');
  assert.equal(blank.name, 'CUSTOM_PROCESSOR');
  assert.equal(blank.make, 'CustomLab');
  assert.equal(blank.model, 'DSP-8');
  assert.equal(blank.source, 'custom');
  assert.ok(blank.ports.length >= 6);

  const clone = cloneDevice(blank, 'CUSTOM_PROCESSOR_V2');
  assert.equal(clone.name, 'CUSTOM_PROCESSOR_V2');
  assert.notEqual(clone.id, blank.id);
  assert.equal(clone.ports.length, blank.ports.length);
});

test('Signal Color and CAD Connector Symbols Validation', () => {
  assert.equal(formatColorForSignal('Analog Audio'), '#10B981');
  assert.equal(formatColorForSignal('Dante / AES67'), '#38BDF8');
  assert.equal(formatColorForSignal('12G-SDI'), '#A855F7');
  assert.equal(formatColorForSignal('AC Mains 120/240V'), '#EF4444');

  // Verify CAD connector symbols
  assert.ok(Array.isArray(CAD_CONNECTORS));
  assert.ok(CAD_CONNECTOR_CATALOG.length >= 12);
  CAD_CONNECTORS.forEach(conn => {
    const meta = getConnectorMeta(conn);
    assert.ok(meta, `Connector metadata must exist for ${conn}`);
    assert.ok(meta.id, `Connector id must exist for ${conn}`);
    assert.ok(meta.label, `Connector label must exist for ${conn}`);
  });
});
