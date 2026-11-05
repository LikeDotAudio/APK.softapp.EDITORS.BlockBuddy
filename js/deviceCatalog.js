// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

export const SIGNAL_FORMATS = [
  'Analog Audio',
  'AES3',
  'Dante / AES67',
  'MADI',
  'HDMI 2.1',
  '12G-SDI',
  'Gigabit PoE+',
  '10GbE SFP+',
  'RS-232 / 422',
  'GPIO',
  'DMX512',
  'WordClock',
  'RF Coax',
  'USB 3.0 / C',
  'Ethernet / IP',
  'AC Mains 120/240V',
  'DC Low Voltage'
];

export const CAD_CONNECTORS = [
  'XLR-F',
  'XLR-M',
  'BNC',
  'EtherCON',
  'RJ45',
  'Speakon',
  'TRS',
  'HDMI',
  'USB-C',
  'OpticalCON',
  'DB-25',
  'PowerCon',
  'IEC',
  'Terminal-Block',
  'Blank'
];

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
      { id: 'IN_1', label: 'Input 1', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'XLR-F', color: '#10B981' },
      { id: 'IN_2', label: 'Input 2', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'XLR-F', color: '#10B981' },
      { id: 'OUT_1', label: 'Output 1', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'XLR-M', color: '#10B981' },
      { id: 'OUT_2', label: 'Output 2', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'XLR-M', color: '#10B981' },
      { id: 'NET_PRI', label: 'Network Primary', side: 'top', dir: 'Bidi', format: 'Gigabit PoE+', connector: 'RJ45', color: '#38BDF8' },
      { id: 'AC_POWER', label: 'AC Mains IEC', side: 'bottom', dir: 'In', format: 'AC Mains 120/240V', connector: 'IEC', color: '#EF4444' }
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

export function formatColorForSignal(format) {
  switch (format) {
    case 'Analog Audio':
      return '#10B981'; // emerald green
    case 'AES3':
    case 'Dante / AES67':
    case 'MADI':
    case 'Gigabit PoE+':
    case '10GbE SFP+':
    case 'Ethernet / IP':
      return '#38BDF8'; // sky cyan
    case 'HDMI 2.1':
    case '12G-SDI':
      return '#A855F7'; // purple
    case 'RS-232 / 422':
    case 'GPIO':
    case 'DMX512':
    case 'WordClock':
    case 'RF Coax':
      return '#F59E0B'; // amber
    case 'AC Mains 120/240V':
    case 'DC Low Voltage':
      return '#EF4444'; // rose / red
    case 'USB 3.0 / C':
      return '#06B6D4'; // teal
    default:
      return '#94A3B8'; // slate
  }
}
