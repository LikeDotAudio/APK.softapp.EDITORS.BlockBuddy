// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

import { VOCABULARY } from './vocabulary.js';

/* The port table's format and connector selects are the shared vocabulary —
   the CAD's catalogue (vendor/apk-vocabulary) through config/vocabulary.json,
   where this app's own formats, older spellings, colours and icons are data
   (ROAD-3501). A value a block brings that is not listed is kept as it is. */
export const SIGNAL_FORMATS = VOCABULARY.formatNames;
export const CAD_CONNECTORS = VOCABULARY.connectorNames;

/** The icon symbol (js/cadConnectorSymbols.js, `cad-icon-<id>`) a connector is drawn with. */
export function connectorIconId(connector) {
  const icons = VOCABULARY.config.icons || {};
  const e = VOCABULARY.connectorFor(connector);
  if (!e) return null;
  return (icons.byConnector || {})[e.abbreviation] || (icons.byGroup || {})[e.group] || icons.default || null;
}

export const DEVICE_CATEGORIES = [
  'Audio DSP',
  'Network Switch',
  'Video Matrix',
  'Stage Box',
  'Power Amplifier',
  'Wireless Mic Rx',
  'Audio Interface',
  'Test Instrument',
  'Source / Player',
  'Studio Monitor',
  'Custom Device'
];

/* No built-in devices: every device type lives in the BIM library
   (DATABASE.server.BIM). The app loads the bench's devices from it, and the
   📚 Library button adds any other. */

export function createBlankDevice(name = 'NEW_DEVICE', make = 'Generic', model = 'Device') {
  return {
    id: `dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
    displayName: `${make} ${model}`,
    make,
    model,
    kind: 'Custom Device',
    ru: '1U Rackmount',
    width: 260,
    height: 180,
    source: 'custom',
    ports: [
      { id: 'IN_1', label: 'Input 1', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'X3S', color: '#10B981' },
      { id: 'IN_2', label: 'Input 2', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'X3S', color: '#10B981' },
      { id: 'OUT_1', label: 'Output 1', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'X3P', color: '#10B981' },
      { id: 'OUT_2', label: 'Output 2', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'X3P', color: '#10B981' },
      { id: 'NET_PRI', label: 'Network Primary', side: 'top', dir: 'Bidi', format: 'Gigabit PoE+', connector: 'RJ45', color: '#38BDF8' },
      { id: 'AC_POWER', label: 'AC Mains IEC', side: 'bottom', dir: 'In', format: 'AC Mains 120/240V', connector: 'C14', color: '#EF4444' }
    ]
  };
}

export function cloneDevice(device, newName) {
  const clone = JSON.parse(JSON.stringify(device));
  clone.id = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  if (newName) {
    clone.name = newName.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    clone.displayName = `${clone.make} ${newName}`;
  } else {
    clone.name = `${clone.name}_COPY`;
    clone.displayName = `${clone.displayName} (Copy)`;
  }
  clone.source = 'custom';
  delete clone.identity;   // a copy is not the discovered unit: no MAC / serial of its own
  delete clone.live;
  return clone;
}

/** A format's colour: its own (config extra), else its signal class's, else the default — all config data. */
export function formatColorForSignal(format) {
  const colors = VOCABULARY.config.colors || {};
  const f = VOCABULARY.formatFor(format);
  return (f && (f.color || (colors.byClass || {})[f.class])) || colors.default || '#94A3B8';
}
