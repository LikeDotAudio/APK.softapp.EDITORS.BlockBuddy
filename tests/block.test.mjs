import test from 'node:test';
import assert from 'node:assert/strict';
import { BlockDefinitionModel } from '../js/blockApp.js';

test('BlockDefinitionModel manages ports and sides correctly', () => {
  const model = new BlockDefinitionModel('flow.source', 'FLOW_SOURCE');
  assert.equal(model.ports.length, 4);

  model.addPort('AUX', 'output', 'aux', 'aes67');
  assert.equal(model.ports.length, 5);

  const outputs = model.getPortsBySide('output');
  assert.equal(outputs.length, 2);

  model.removePort('AUX');
  assert.equal(model.ports.length, 4);
});
