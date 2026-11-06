// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/* A BIM library part (DATABASE.server.BIM, apk.bim.part/1) as a Block Buddy device.
   Every terminal becomes a pin: inputs on the left, outputs and two-way ports on
   the right, control on top, power at the bottom. A port group of N is N pins,
   named from its labels when the part has them, capped so a 256-port frame
   still draws (the cap is said in the pin's label, never silent). */

const KIND = {
  Audio: 'Audio DSP', Microphones: 'Wireless Mic Rx', Video: 'Video Matrix', Network: 'Network Switch',
  'Test & Measurement': 'Test Instrument', Computing: 'Source / Player'
};
const FORMAT = {
  audio: 'Analog Audio', video: 'HDMI 2.1', network: 'Gigabit PoE+', control: 'RS-232 / 422', power: 'AC Mains 120/240V',
  clock: 'WordClock', rf: 'RF Coax', usb: 'USB 3.0 / C', midi: 'GPIO', signal: 'Analog Audio'
};
const COLOR = {
  audio: '#3B82F6', video: '#A855F7', network: '#10B981', control: '#F59E0B', power: '#EF4444',
  clock: '#14B8A6', rf: '#EC4899', usb: '#64748B', midi: '#F97316', signal: '#94A3B8'
};
const DIR = { input: 'In', output: 'Out', connection: 'Bidi', supply: 'In' };
export const PINS_PER_GROUP = 32;

function sideOf(port) {
  if (port.domain === 'power' || port.side === 'supply') return 'bottom';
  if (port.domain === 'control') return 'top';
  return port.side === 'input' ? 'left' : 'right';
}

const pinId = (text) => String(text).toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '') || 'PIN';

export function partToBlockDevice(part, bimRef = null) {
  const ports = [];
  const used = new Set();
  for (const p of part.ports || []) {
    const n = Math.max(1, p.count || 1);
    const shown = Math.min(n, PINS_PER_GROUP);
    const group = p.group || p.terminal || 'PORT';
    for (let i = 0; i < shown; i++) {
      const label = n === 1 ? group
        : (p.labels && p.labels[i]) ? `${group} ${p.labels[i]}`
        : `${group} ${i + 1}${i === shown - 1 && n > shown ? ` (+${n - shown} more)` : ''}`;
      let id = pinId(label);
      while (used.has(id)) id += '_';
      used.add(id);
      ports.push({
        id, label, side: sideOf(p), dir: DIR[p.side] || 'In',
        format: p.signal || FORMAT[p.domain] || 'Analog Audio',
        connector: p.connector || 'Blank', color: COLOR[p.domain] || COLOR.signal
      });
    }
  }
  const tall = Math.max(...['left', 'right'].map(s => ports.filter(x => x.side === s).length), 4);
  const ru = part.physical?.rack_units;
  return {
    id: `bim_${part.id.replace(/[^a-z0-9]+/gi, '_')}_${Date.now().toString(36)}`,
    name: `${part.manufacturer}_${part.model}`.replace(/\s+/g, '_'),
    displayName: part.name || `${part.manufacturer} ${part.model}`,
    make: part.manufacturer || '',
    model: part.model || '',
    kind: KIND[part.category] || 'Custom Device',
    ru: ru ? `${ru}U` : '',
    width: 280,
    height: Math.min(1200, Math.max(160, 40 + tall * 22)),
    source: 'library',
    bimId: part.id,
    // the BIM reference {part, url, rev} (ROAD-3572): the pick's, else the part's own
    bimRef: bimRef || (part.ref && part.ref.part ? { part: part.ref.part, url: part.ref.url || '', rev: part.ref.rev || '' } : null),
    ports
  };
}
