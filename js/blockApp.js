// Part of the APK.audio project — Anthony Kuzub
// MIT Licence.

export class BlockDefinitionModel {
  constructor(id = 'flow.custom', name = 'CUSTOM_BLOCK') {
    this.id = id;
    this.name = name;
    this.size = { w: 1.6, h: 1.0 };
    this.ports = [
      { id: 'IN', side: 'input', label: 'in', format: 'analog' },
      { id: 'OUT', side: 'output', label: 'out', format: 'analog' },
      { id: 'CTL', side: 'control', label: 'ctl', format: 'ip' },
      { id: 'PWR', side: 'power', label: 'pwr', format: 'dc' }
    ];
  }

  addPort(id, side, label, format = 'analog') {
    this.ports.push({ id, side, label, format });
  }

  removePort(id) {
    this.ports = this.ports.filter(p => p.id !== id);
  }

  getPortsBySide(side) {
    return this.ports.filter(p => p.side === side);
  }
}
