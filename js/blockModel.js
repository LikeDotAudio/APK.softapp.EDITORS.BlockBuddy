// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

import { formatColorForSignal } from './deviceCatalog.js';

export class BlockDefinitionModel {
  constructor(kind = 'Audio DSP', name = 'DSP_CORE') {
    this.id = `dev_${Date.now()}`;
    this.name = name;
    this.displayName = name;
    this.make = 'APK Audio';
    this.model = name;
    this.kind = kind;
    this.ru = '1U Rackmount';
    this.width = 280;
    this.height = 180;
    this.source = 'custom';
    this.ports = [
      { id: 'IN_1', label: 'Analog In 1', side: 'left', format: 'Analog Audio', connector: 'XLR-F', dir: 'In', color: '#10B981' },
      { id: 'IN_2', label: 'Analog In 2', side: 'left', format: 'Analog Audio', connector: 'XLR-F', dir: 'In', color: '#10B981' },
      { id: 'OUT_1', label: 'Analog Out 1', side: 'right', format: 'Analog Audio', connector: 'XLR-M', dir: 'Out', color: '#10B981' },
      { id: 'OUT_2', label: 'Analog Out 2', side: 'right', format: 'Analog Audio', connector: 'XLR-M', dir: 'Out', color: '#10B981' },
      { id: 'CTRL_CLK', label: 'WordClock Ref', side: 'top', format: 'WordClock', connector: 'BNC', dir: 'In', color: '#F59E0B' },
      { id: 'PWR_AC', label: 'AC Mains 120V', side: 'bottom', format: 'AC Mains 120/240V', connector: 'IEC', dir: 'In', color: '#EF4444' },
    ];
  }

  loadDevice(dev) {
    if (!dev) return;
    this.id = dev.id || this.id;
    this.name = dev.name || this.name;
    this.displayName = dev.displayName || dev.name || this.displayName;
    this.make = dev.make || this.make;
    this.model = dev.model || this.model;
    this.kind = dev.kind || this.kind;
    this.ru = dev.ru || this.ru;
    this.width = Number(dev.width) || this.width;
    this.height = Number(dev.height) || this.height;
    this.source = dev.source || this.source;

    if (Array.isArray(dev.ports)) {
      this.ports = dev.ports.map((p, idx) => ({
        id: p.id || `P_${idx + 1}`,
        label: p.label || p.id || `Port ${idx + 1}`,
        side: p.side || 'left',
        format: p.format || 'Analog Audio',
        connector: p.connector || 'XLR-F',
        dir: p.dir || 'In',
        color: p.color || formatColorForSignal(p.format || 'Analog Audio')
      }));
    }
  }

  addPort(data = {}) {
    const idx = this.ports.length + 1;
    const side = data.side || 'left';
    const dir = data.dir || (side === 'left' ? 'In' : side === 'right' ? 'Out' : 'Bidi');
    const format = data.format || 'Analog Audio';
    const port = {
      id: data.id || `PORT_${idx}`,
      label: data.label || `Port ${idx}`,
      side,
      dir,
      format,
      connector: data.connector || (dir === 'In' ? 'XLR-F' : 'XLR-M'),
      color: data.color || formatColorForSignal(format)
    };
    this.ports.push(port);
    return port;
  }

  removePort(index) {
    if (index >= 0 && index < this.ports.length) {
      return this.ports.splice(index, 1)[0];
    }
    return null;
  }

  bulkAddPorts(category) {
    switch (category) {
      case 'inputs8':
        for (let i = 1; i <= 8; i++) {
          this.addPort({
            id: `IN_${i}`,
            label: `Analog In ${i}`,
            side: 'left',
            dir: 'In',
            format: 'Analog Audio',
            connector: 'XLR-F'
          });
        }
        break;
      case 'outputs8':
        for (let i = 1; i <= 8; i++) {
          this.addPort({
            id: `OUT_${i}`,
            label: `Analog Out ${i}`,
            side: 'right',
            dir: 'Out',
            format: 'Analog Audio',
            connector: 'XLR-M'
          });
        }
        break;
      case 'dante':
        this.addPort({
          id: 'DANTE_PRI',
          label: 'Dante Primary',
          side: 'top',
          dir: 'Bidi',
          format: 'Dante / AES67',
          connector: 'EtherCON'
        });
        this.addPort({
          id: 'DANTE_SEC',
          label: 'Dante Secondary',
          side: 'top',
          dir: 'Bidi',
          format: 'Dante / AES67',
          connector: 'EtherCON'
        });
        break;
      case 'power_ground':
        this.addPort({
          id: 'AC_MAINS',
          label: 'AC Mains 120/240V',
          side: 'bottom',
          dir: 'In',
          format: 'AC Mains 120/240V',
          connector: 'IEC'
        });
        this.addPort({
          id: 'CHASSIS_GND',
          label: 'Chassis Earth Ground',
          side: 'bottom',
          dir: 'In',
          format: 'DC Low Voltage',
          connector: 'Terminal-Block'
        });
        break;
      default:
        break;
    }
  }

  toJSON() {
    return {
      type: 'schematic_block',
      id: this.id,
      name: this.name,
      displayName: this.displayName,
      make: this.make,
      model: this.model,
      kind: this.kind,
      ru: this.ru,
      width: this.width,
      height: this.height,
      source: this.source,
      ports: this.ports,
      timestamp: new Date().toISOString()
    };
  }
}
