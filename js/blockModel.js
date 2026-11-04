// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

export class BlockDefinitionModel {
  constructor(kind = 'audio.dsp', name = 'DSP_CORE') {
    this.id = `blk_${Date.now()}`;
    this.kind = kind;
    this.name = name;
    this.width = 240;
    this.height = 160;
    this.ports = [
      { id: 'IN_1', side: 'left', format: 'Analog Audio', dir: 'In', color: '#10B981' },
      { id: 'IN_2', side: 'left', format: 'Analog Audio', dir: 'In', color: '#10B981' },
      { id: 'OUT_1', side: 'right', format: 'Analog Audio', dir: 'Out', color: '#38BDF8' },
      { id: 'OUT_2', side: 'right', format: 'Analog Audio', dir: 'Out', color: '#38BDF8' },
      { id: 'CTRL_CLK', side: 'top', format: 'WordClock', dir: 'In', color: '#F59E0B' },
      { id: 'PWR_VCC', side: 'bottom', format: 'DC Power', dir: 'In', color: '#EF4444' },
    ];
  }
}
