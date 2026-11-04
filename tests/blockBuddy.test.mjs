// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

import test from 'node:test';
import assert from 'node:assert/strict';

import { BlockDefinitionModel } from '../js/blockModel.js';

test('Block Definition Model Initialization', () => {
  const model = new BlockDefinitionModel('audio.dsp', 'DSP_CORE');
  assert.equal(model.name, 'DSP_CORE');
  assert.equal(model.kind, 'audio.dsp');
  assert.ok(model.ports.length >= 4);

  const leftPins = model.ports.filter(p => p.side === 'left');
  const rightPins = model.ports.filter(p => p.side === 'right');
  assert.ok(leftPins.length >= 2);
  assert.ok(rightPins.length >= 2);
});
