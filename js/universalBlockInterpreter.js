// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

import { formatColorForSignal } from './deviceCatalog.js';

/**
 * Universal Block Interpreter
 * Ingests ANY arbitrary object, payload, or text containing inputs, outputs, connections,
 * channels, pins, or wirelists, and normalizes it into a complete Schematic Block Definition.
 */
export function interpretToBlock(raw, options = {}) {
  let data = raw;

  // 1. If string, attempt JSON parse or line-by-line CSV / text parse
  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        data = JSON.parse(trimmed);
      } catch (_) {
        data = parseTextLines(trimmed);
      }
    } else {
      data = parseTextLines(trimmed);
    }
  }

  // Handle arrays: if array of strings or objects, convert to container
  if (Array.isArray(data)) {
    data = normalizeArrayPayload(data);
  }

  if (!data || typeof data !== 'object') {
    data = {};
  }

  // Extract name and metadata
  const name = String(
    data.name ||
    data.device ||
    data.device_name ||
    data.id ||
    data.title ||
    data.label ||
    options.defaultName ||
    'INTERPRETED_DEVICE'
  ).toUpperCase().replace(/[^A-Z0-9_]/g, '_');

  const make = String(data.make || data.manufacturer || data.vendor || data.brand || 'Interpreted Make');
  const model = String(data.model || data.model_number || data.device || name);
  const kind = String(data.kind || data.category || data.type || detectCategory(data, name));

  const ports = [];
  const processedPortIds = new Set();

  const addUniquePort = (p) => {
    if (!p || !p.id) return;
    const baseId = String(p.id).trim().replace(/\s+/g, '_');
    let finalId = baseId;
    let counter = 1;
    while (processedPortIds.has(finalId)) {
      finalId = `${baseId}_${counter++}`;
    }
    processedPortIds.add(finalId);

    const side = p.side || 'left';
    const dir = p.dir || (side === 'left' ? 'In' : side === 'right' ? 'Out' : 'Bidi');
    const format = p.format || detectFormat(finalId, p.type || p.format);
    const connector = p.connector || detectConnector(finalId, format, dir);

    ports.push({
      id: finalId,
      label: p.label || p.id,
      side,
      dir,
      format,
      connector,
      color: p.color || formatColorForSignal(format)
    });
  };

  // 2. Interpret standard block ports/pins
  if (Array.isArray(data.ports)) {
    data.ports.forEach(p => addUniquePort(typeof p === 'string' ? { id: p } : p));
  } else if (Array.isArray(data.pins)) {
    data.pins.forEach(p => {
      const pinObj = typeof p === 'string' ? { id: p } : p;
      const side = pinObj.side || (pinObj.type === 'input' ? 'left' : pinObj.type === 'output' ? 'right' : pinObj.type === 'power' ? 'bottom' : 'left');
      addUniquePort({ ...pinObj, side });
    });
  }

  // 3. Interpret explicit Inputs / In
  const rawInputs = data.inputs || data.input || data.in || data.ins || data.sources;
  if (rawInputs) {
    extractPortList(rawInputs).forEach((p, idx) => {
      addUniquePort({
        id: p.id || `IN_${idx + 1}`,
        label: p.label || p.id || `Input ${idx + 1}`,
        side: 'left',
        dir: 'In',
        format: p.format,
        connector: p.connector
      });
    });
  }

  // 4. Interpret explicit Outputs / Out
  const rawOutputs = data.outputs || data.output || data.out || data.outs || data.destinations || data.sinks;
  if (rawOutputs) {
    extractPortList(rawOutputs).forEach((p, idx) => {
      addUniquePort({
        id: p.id || `OUT_${idx + 1}`,
        label: p.label || p.id || `Output ${idx + 1}`,
        side: 'right',
        dir: 'Out',
        format: p.format,
        connector: p.connector
      });
    });
  }

  // 5. Interpret Connections / Links / Routes / Wirelist
  const rawConnections = data.connections || data.routes || data.links || data.cables || data.wires;
  if (Array.isArray(rawConnections)) {
    rawConnections.forEach((conn, idx) => {
      if (typeof conn === 'string') {
        const [src, dst] = conn.split(/->|=>|--|to/).map(s => s.trim());
        if (src) addUniquePort({ id: src, side: 'left', dir: 'In' });
        if (dst) addUniquePort({ id: dst, side: 'right', dir: 'Out' });
      } else if (typeof conn === 'object' && conn !== null) {
        const fromPort = conn.from_port || conn.source_port || conn.from || conn.source;
        const toPort = conn.to_port || conn.destination_port || conn.to || conn.destination || conn.dest;
        const sig = conn.signal || conn.format || conn.type;

        if (fromPort) {
          addUniquePort({
            id: String(fromPort),
            label: String(fromPort),
            side: 'left',
            dir: 'In',
            format: sig
          });
        }
        if (toPort) {
          addUniquePort({
            id: String(toPort),
            label: String(toPort),
            side: 'right',
            dir: 'Out',
            format: sig
          });
        }
      }
    });
  }

  // 6. Interpret Channels / Matrix Nodes / Faders
  if (typeof data.channels === 'number') {
    for (let i = 1; i <= data.channels; i++) {
      addUniquePort({ id: `CH_${i}_IN`, side: 'left', dir: 'In', format: 'Analog Audio' });
      addUniquePort({ id: `CH_${i}_OUT`, side: 'right', dir: 'Out', format: 'Analog Audio' });
    }
  }

  // 7. Interpret Control, Clocks, Bus, Network (Top side)
  const rawControl = data.control || data.bus || data.network || data.clocks || data.sync;
  if (rawControl) {
    extractPortList(rawControl).forEach((p, idx) => {
      addUniquePort({
        id: p.id || `CTRL_${idx + 1}`,
        label: p.label || p.id || `Control ${idx + 1}`,
        side: 'top',
        dir: 'Bidi',
        format: p.format || 'Gigabit PoE+',
        connector: p.connector || 'RJ45'
      });
    });
  }

  // 8. Interpret Power & Mains (Bottom side)
  const rawPower = data.power || data.mains || data.supply || data.voltages;
  if (rawPower) {
    extractPortList(rawPower).forEach((p, idx) => {
      addUniquePort({
        id: p.id || `PWR_${idx + 1}`,
        label: p.label || p.id || `Power ${idx + 1}`,
        side: 'bottom',
        dir: 'In',
        format: 'AC Mains 120/240V',
        connector: 'IEC'
      });
    });
  }

  // If no ports were detected at all, supply default balanced stereo In/Out + Power
  if (ports.length === 0) {
    ports.push(
      { id: 'IN_1', label: 'Input 1', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'XLR-F', color: '#10B981' },
      { id: 'IN_2', label: 'Input 2', side: 'left', dir: 'In', format: 'Analog Audio', connector: 'XLR-F', color: '#10B981' },
      { id: 'OUT_1', label: 'Output 1', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'XLR-M', color: '#10B981' },
      { id: 'OUT_2', label: 'Output 2', side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'XLR-M', color: '#10B981' },
      { id: 'NET_PRI', label: 'Network Control', side: 'top', dir: 'Bidi', format: 'Gigabit PoE+', connector: 'RJ45', color: '#38BDF8' },
      { id: 'AC_POWER', label: 'AC Mains 120V', side: 'bottom', dir: 'In', format: 'AC Mains 120/240V', connector: 'IEC', color: '#EF4444' }
    );
  }

  // Determine dynamic block dimensions based on port count
  const leftCount = ports.filter(p => p.side === 'left').length;
  const rightCount = ports.filter(p => p.side === 'right').length;
  const topCount = ports.filter(p => p.side === 'top').length;
  const bottomCount = ports.filter(p => p.side === 'bottom').length;

  const maxVertical = Math.max(leftCount, rightCount, 4);
  const maxHorizontal = Math.max(topCount, bottomCount, 4);

  const calculatedHeight = Math.max(160, Math.min(800, maxVertical * 26 + 60));
  const calculatedWidth = Math.max(260, Math.min(800, maxHorizontal * 38 + 100));

  return {
    id: `dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name,
    displayName: `${make} ${model}`,
    make,
    model,
    kind,
    ru: data.ru || (maxVertical > 12 ? '3U Rackmount' : maxVertical > 6 ? '2U Rackmount' : '1U Rackmount'),
    width: calculatedWidth,
    height: calculatedHeight,
    source: 'interpreted',
    ports,
    originalData: data
  };
}

/**
 * Extracts a normalized list of port objects from array, object, or number
 */
function extractPortList(raw) {
  if (Array.isArray(raw)) {
    return raw.map((item, idx) => {
      if (typeof item === 'string') return { id: item, label: item };
      if (typeof item === 'object' && item !== null) return item;
      return { id: `P_${idx + 1}` };
    });
  }
  if (typeof raw === 'object' && raw !== null) {
    return Object.entries(raw).map(([key, val]) => {
      if (typeof val === 'object' && val !== null) {
        return { id: key, ...val };
      }
      return { id: key, label: String(val) };
    });
  }
  if (typeof raw === 'number') {
    const list = [];
    for (let i = 1; i <= raw; i++) {
      list.push({ id: `PORT_${i}` });
    }
    return list;
  }
  return [];
}

/**
 * Parses line-delimited text (CSV, tab-separated, or bare lines)
 */
function parseTextLines(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const inputs = [];
  const outputs = [];
  const connections = [];

  for (const line of lines) {
    if (line.startsWith('#') || line.startsWith('//')) continue;
    if (line.includes('->') || line.includes('=>') || line.includes('--')) {
      connections.push(line);
      continue;
    }
    const parts = line.split(/[,;\t]/).map(s => s.trim());
    const name = parts[0];
    const type = (parts[1] || '').toLowerCase();

    if (type.includes('out') || type.includes('dest')) {
      outputs.push(name);
    } else {
      inputs.push(name);
    }
  }

  return { inputs, outputs, connections };
}

function normalizeArrayPayload(arr) {
  const inputs = [];
  const outputs = [];
  const connections = [];

  arr.forEach((item, idx) => {
    if (typeof item === 'string') {
      if (/out|output|tx|snd/i.test(item)) outputs.push(item);
      else inputs.push(item);
    } else if (typeof item === 'object' && item !== null) {
      if (item.from || item.to || item.source || item.destination) {
        connections.push(item);
      } else if (item.dir === 'Out' || item.direction === 'output') {
        outputs.push(item);
      } else {
        inputs.push(item);
      }
    }
  });

  return {
    name: 'INTERPRETED_LIST',
    inputs,
    outputs,
    connections
  };
}

function detectCategory(data, name) {
  const s = (name + ' ' + JSON.stringify(data)).toLowerCase();
  if (s.includes('switch') || s.includes('vlan') || s.includes('poe')) return 'Network Switch';
  if (s.includes('dsp') || s.includes('qsys') || s.includes('matrix')) return 'Audio DSP';
  if (s.includes('atem') || s.includes('sdi') || s.includes('video') || s.includes('hdmi')) return 'Video Matrix';
  if (s.includes('amp') || s.includes('watt') || s.includes('speakon')) return 'Power Amplifier';
  if (s.includes('mic') || s.includes('rf') || s.includes('wireless')) return 'Wireless Mic Rx';
  if (s.includes('dmm') || s.includes('scope') || s.includes('meter') || s.includes('gpib')) return 'Test Instrument';
  if (s.includes('stage') || s.includes('tio') || s.includes('rio')) return 'Stage Box';
  return 'Custom Device';
}

function detectFormat(id, hint) {
  const s = (id + ' ' + (hint || '')).toLowerCase();
  if (s.includes('hdmi')) return 'HDMI 2.1';
  if (s.includes('sdi')) return '12G-SDI';
  if (s.includes('dante') || s.includes('aes67') || s.includes('q-lan')) return 'Dante / AES67';
  if (s.includes('eth') || s.includes('lan') || s.includes('net') || s.includes('poe')) return 'Gigabit PoE+';
  if (s.includes('sfp') || s.includes('10g') || s.includes('fiber')) return '10GbE SFP+';
  if (s.includes('aes') || s.includes('spdif')) return 'AES3';
  if (s.includes('clk') || s.includes('sync') || s.includes('word')) return 'WordClock';
  if (s.includes('rs232') || s.includes('serial') || s.includes('gpib')) return 'RS-232 / 422';
  if (s.includes('gpio') || s.includes('trig') || s.includes('logic')) return 'GPIO';
  if (s.includes('ac') || s.includes('mains') || s.includes('120v') || s.includes('240v')) return 'AC Mains 120/240V';
  if (s.includes('dc') || s.includes('volt') || s.includes('vcc') || s.includes('gnd')) return 'DC Low Voltage';
  if (s.includes('usb')) return 'USB 3.0 / C';
  if (s.includes('rf') || s.includes('ant')) return 'RF Coax';
  return 'Analog Audio';
}

function detectConnector(id, format, dir) {
  const s = (id + ' ' + (format || '')).toLowerCase();
  if (s.includes('ethercon')) return 'EtherCON';
  if (s.includes('rj45') || format.includes('Gigabit') || format.includes('Dante')) return 'RJ45';
  if (s.includes('sfp') || format.includes('SFP+') || format.includes('Fiber')) return 'OpticalCON';
  if (s.includes('hdmi')) return 'HDMI';
  if (s.includes('usb')) return 'USB-C';
  if (s.includes('bnc') || format.includes('SDI') || format.includes('WordClock') || format.includes('RF')) return 'BNC';
  if (s.includes('speakon') || format.includes('Speaker')) return 'Speakon';
  if (s.includes('trs') || s.includes('jack') || s.includes('phone')) return 'TRS';
  if (s.includes('db25') || s.includes('dsub') || format.includes('RS-232')) return 'DB-25';
  if (format.includes('AC Mains')) return 'IEC';
  if (s.includes('term') || s.includes('phoenix') || s.includes('euroblock')) return 'Terminal-Block';
  return dir === 'In' ? 'XLR-F' : 'XLR-M';
}
