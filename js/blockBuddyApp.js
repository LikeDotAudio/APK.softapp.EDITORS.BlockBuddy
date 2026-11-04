// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

import { BlockBridge } from './blockBridge.js';
import { BlockDefinitionModel } from './blockModel.js';
import {
  BUILTIN_DEVICES,
  DEVICE_CATEGORIES,
  SIGNAL_FORMATS,
  CAD_CONNECTORS,
  createBlankDevice,
  cloneDevice,
  formatColorForSignal,
} from './deviceCatalog.js';
import { CAD_SYMBOLS_SVG_SHEET } from './cadConnectorSymbols.js';
import { interpretToBlock } from './universalBlockInterpreter.js';

export class BlockBuddyApp {
  constructor() {
    this.devices = [...BUILTIN_DEVICES];
    this.activeDeviceId = this.devices[0].id;
    this.activeFilter = 'all';
    this.selectedPortIndex = null;

    this.block = new BlockDefinitionModel();
    this.block.loadDevice(this.devices[0]);

    this.bridge = new BlockBridge({
      name: 'Block Buddy',
      type: 'schematic_block',
      onBlockLoaded: (block, meta) => this.handleBlockLoaded(block, meta),
      onBlockChanged: () => {},
    });

    this.initElements();
    this.injectCadSymbols();
    this.populateKindPicker();
    this.populateDevicePicker();
    this.attachEvents();
    this.loadInitialData();
  }

  injectCadSymbols() {
    const container = document.getElementById('cad-symbols-container');
    if (container && CAD_SYMBOLS_SVG_SHEET) {
      container.innerHTML = CAD_SYMBOLS_SVG_SHEET;
    }
  }

  initElements() {
    this.btnOpen = document.getElementById('btn-open');
    this.btnSave = document.getElementById('btn-save');
    this.btnClose = document.getElementById('btn-close');
    this.btnSyncDiscovered = document.getElementById('btn-sync-discovered');

    this.selectDevice = document.getElementById('select-device');
    this.btnNewDevice = document.getElementById('btn-new-device');
    this.btnCloneDevice = document.getElementById('btn-clone-device');

    this.inputDeviceName = document.getElementById('input-device-name');
    this.inputDeviceMake = document.getElementById('input-device-make');
    this.inputDeviceModel = document.getElementById('input-device-model');
    this.selectDeviceKind = document.getElementById('select-device-kind');
    this.inputDeviceRu = document.getElementById('input-device-ru');
    this.inputBlockW = document.getElementById('input-block-w');
    this.inputBlockH = document.getElementById('input-block-h');

    this.badgeSource = document.getElementById('device-source-badge');
    this.badgeKind = document.getElementById('device-kind-badge');
    this.badgePortCount = document.getElementById('port-count-badge');

    this.symbolStage = document.getElementById('symbol-preview-stage');
    this.tableBody = document.getElementById('pin-table-body');
    this.btnAddPin = document.getElementById('btn-add-pin');

    this.btnBulkIn8 = document.getElementById('btn-bulk-in8');
    this.btnBulkOut8 = document.getElementById('btn-bulk-out8');
    this.btnBulkDante = document.getElementById('btn-bulk-dante');
    this.btnBulkPwr = document.getElementById('btn-bulk-pwr');

    this.filterButtons = document.querySelectorAll('.tab-filter-btn');

    // Ingest Modal Elements
    this.btnIngest = document.getElementById('btn-ingest');
    this.modalIngest = document.getElementById('modal-ingest');
    this.btnCloseIngest = document.getElementById('btn-close-ingest-modal');
    this.btnCancelIngest = document.getElementById('btn-cancel-ingest');
    this.btnExecuteIngest = document.getElementById('btn-execute-ingest');
    this.ingestTextarea = document.getElementById('ingest-textarea');

    this.presetMixer = document.getElementById('preset-mixer');
    this.presetRoutes = document.getElementById('preset-routes');
    this.presetSwitch = document.getElementById('preset-switch');
    this.presetCsv = document.getElementById('preset-csv');
  }

  populateKindPicker() {
    if (!this.selectDeviceKind) return;
    this.selectDeviceKind.innerHTML = '';
    DEVICE_CATEGORIES.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      this.selectDeviceKind.appendChild(opt);
    });
  }

  populateDevicePicker() {
    if (!this.selectDevice) return;
    this.selectDevice.innerHTML = '';

    const discoveredGroup = document.createElement('optgroup');
    discoveredGroup.label = '⚡ Discovered Bench Devices';

    const libraryGroup = document.createElement('optgroup');
    libraryGroup.label = '📦 Pro AV / IT Hardware Library';

    const customGroup = document.createElement('optgroup');
    customGroup.label = '🛠 Custom Device Symbols';

    this.devices.forEach((dev) => {
      const opt = document.createElement('option');
      opt.value = dev.id;
      opt.textContent = `${dev.displayName || dev.name} (${dev.ports ? dev.ports.length : 0}P)`;

      if (dev.source === 'discovered') {
        discoveredGroup.appendChild(opt);
      } else if (dev.source === 'library') {
        libraryGroup.appendChild(opt);
      } else {
        customGroup.appendChild(opt);
      }
    });

    if (discoveredGroup.children.length > 0) this.selectDevice.appendChild(discoveredGroup);
    if (libraryGroup.children.length > 0) this.selectDevice.appendChild(libraryGroup);
    if (customGroup.children.length > 0) this.selectDevice.appendChild(customGroup);

    this.selectDevice.value = this.activeDeviceId;
  }

  attachEvents() {
    this.btnOpen?.addEventListener('click', () => this.promptOpen());
    this.btnSave?.addEventListener('click', () => this.saveBlock());
    this.btnClose?.addEventListener('click', () => this.bridge.close());
    this.btnSyncDiscovered?.addEventListener('click', () => this.loadFromDiscoveredProject(true));

    this.selectDevice?.addEventListener('change', (e) => {
      this.selectDeviceById(e.target.value);
    });

    this.btnNewDevice?.addEventListener('click', () => {
      const newDev = createBlankDevice('CUSTOM_DEVICE', 'Custom', 'Device');
      this.devices.push(newDev);
      this.activeDeviceId = newDev.id;
      this.block.loadDevice(newDev);
      this.populateDevicePicker();
      this.render();
      this.bridge.notifyChanged();
    });

    this.btnCloneDevice?.addEventListener('click', () => {
      const current = this.devices.find((d) => d.id === this.activeDeviceId);
      if (!current) return;
      const clone = cloneDevice(current);
      this.devices.push(clone);
      this.activeDeviceId = clone.id;
      this.block.loadDevice(clone);
      this.populateDevicePicker();
      this.render();
      this.bridge.notifyChanged();
    });

    this.inputDeviceName?.addEventListener('input', (e) => {
      this.block.name = e.target.value.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
      this.syncActiveDeviceState();
      this.renderSymbol();
      this.bridge.notifyChanged();
    });

    this.inputDeviceMake?.addEventListener('input', (e) => {
      this.block.make = e.target.value;
      this.syncActiveDeviceState();
      this.renderSymbol();
      this.bridge.notifyChanged();
    });

    this.inputDeviceModel?.addEventListener('input', (e) => {
      this.block.model = e.target.value;
      this.block.displayName = `${this.block.make} ${this.block.model}`;
      this.syncActiveDeviceState();
      this.renderSymbol();
      this.bridge.notifyChanged();
    });

    this.selectDeviceKind?.addEventListener('change', (e) => {
      this.block.kind = e.target.value;
      this.badgeKind.textContent = this.block.kind;
      this.syncActiveDeviceState();
      this.renderSymbol();
      this.bridge.notifyChanged();
    });

    this.inputDeviceRu?.addEventListener('input', (e) => {
      this.block.ru = e.target.value;
      this.syncActiveDeviceState();
      this.bridge.notifyChanged();
    });

    this.inputBlockW?.addEventListener('input', (e) => {
      this.block.width = Math.max(160, parseInt(e.target.value, 10) || 280);
      this.syncActiveDeviceState();
      this.renderSymbol();
      this.bridge.notifyChanged();
    });

    this.inputBlockH?.addEventListener('input', (e) => {
      this.block.height = Math.max(120, parseInt(e.target.value, 10) || 180);
      this.syncActiveDeviceState();
      this.renderSymbol();
      this.bridge.notifyChanged();
    });

    this.filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.filterButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.dataset.filter;
        this.renderTable();
      });
    });

    this.btnAddPin?.addEventListener('click', () => {
      this.block.addPort({
        side: this.activeFilter !== 'all' ? this.activeFilter : 'left',
      });
      this.syncActiveDeviceState();
      this.render();
      this.bridge.notifyChanged();
    });

    this.btnBulkIn8?.addEventListener('click', () => {
      this.block.bulkAddPorts('inputs8');
      this.syncActiveDeviceState();
      this.render();
      this.bridge.notifyChanged();
    });

    this.btnBulkOut8?.addEventListener('click', () => {
      this.block.bulkAddPorts('outputs8');
      this.syncActiveDeviceState();
      this.render();
      this.bridge.notifyChanged();
    });

    this.btnBulkDante?.addEventListener('click', () => {
      this.block.bulkAddPorts('dante');
      this.syncActiveDeviceState();
      this.render();
      this.bridge.notifyChanged();
    });

    this.btnBulkPwr?.addEventListener('click', () => {
      this.block.bulkAddPorts('power_ground');
      this.syncActiveDeviceState();
      this.render();
      this.bridge.notifyChanged();
    });

    // Ingest Modal & Presets
    this.btnIngest?.addEventListener('click', () => {
      if (this.modalIngest) this.modalIngest.style.display = 'flex';
    });

    this.btnCloseIngest?.addEventListener('click', () => {
      if (this.modalIngest) this.modalIngest.style.display = 'none';
    });

    this.btnCancelIngest?.addEventListener('click', () => {
      if (this.modalIngest) this.modalIngest.style.display = 'none';
    });

    this.btnExecuteIngest?.addEventListener('click', () => {
      const text = this.ingestTextarea?.value || '';
      if (!text.trim()) return;
      this.ingestArbitraryData(text);
      if (this.modalIngest) this.modalIngest.style.display = 'none';
    });

    this.presetMixer?.addEventListener('click', () => {
      if (this.ingestTextarea) {
        this.ingestTextarea.value = JSON.stringify({
          name: 'STUDIO_CONSOLE_8X4',
          make: 'Soundcraft',
          model: 'Signature 8',
          kind: 'Audio DSP',
          inputs: ['Mic_1', 'Mic_2', 'Mic_3', 'Mic_4', 'Stereo_5_6_L', 'Stereo_5_6_R', 'Stereo_7_8_L', 'Stereo_7_8_R'],
          outputs: ['Master_L', 'Master_R', 'Aux_1_Mon', 'Aux_2_FX'],
          control: ['USB_Audio_14x4', 'Footswitch_FX_Mute'],
          power: ['AC_Mains_120V']
        }, null, 2);
      }
    });

    this.presetRoutes?.addEventListener('click', () => {
      if (this.ingestTextarea) {
        this.ingestTextarea.value = JSON.stringify({
          name: 'VIDEO_MATRIX_4K',
          make: 'AJA',
          model: 'KUMO 1616-12G',
          kind: 'Video Matrix',
          connections: [
            { from: 'Camera_1_12G', to: 'Switcher_In_1', signal: '12G-SDI' },
            { from: 'Camera_2_12G', to: 'Switcher_In_2', signal: '12G-SDI' },
            { from: 'Graphics_HDMI', to: 'Converter_In', signal: 'HDMI 2.1' },
            { from: 'Server_Play_1', to: 'Program_Feed', signal: '12G-SDI' }
          ],
          control: ['LAN_WebUI_Gigabit', 'RS422_Sony_Protocol'],
          power: ['AC_Mains_Dual_Redundant']
        }, null, 2);
      }
    });

    this.presetSwitch?.addEventListener('click', () => {
      if (this.ingestTextarea) {
        this.ingestTextarea.value = JSON.stringify({
          name: 'AV_CORE_SWITCH',
          make: 'Cisco',
          model: 'CBS350-24P-4G',
          kind: 'Network Switch',
          ports: Array.from({ length: 24 }, (_, i) => ({
            id: `GE_${i + 1}`,
            label: `Port ${i + 1} PoE+`,
            side: i < 12 ? 'left' : 'right',
            format: 'Gigabit PoE+',
            connector: 'RJ45'
          })).concat([
            { id: 'SFP_25', label: '10G Fiber Uplink', side: 'top', format: '10GbE SFP+', connector: 'OpticalCON' },
            { id: 'SFP_26', label: '10G Fiber Uplink', side: 'top', format: '10GbE SFP+', connector: 'OpticalCON' },
            { id: 'CONSOLE', label: 'Serial Console', side: 'top', format: 'RS-232 / 422', connector: 'RJ45' },
            { id: 'AC_MAINS', label: 'AC Mains 120/240V', side: 'bottom', format: 'AC Mains 120/240V', connector: 'IEC' }
          ])
        }, null, 2);
      }
    });

    this.presetCsv?.addEventListener('click', () => {
      if (this.ingestTextarea) {
        this.ingestTextarea.value = `# Name, Type / Direction\nMIC_1, Analog Audio In\nMIC_2, Analog Audio In\nLINE_3, Analog Audio In\nLINE_4, Analog Audio In\nMAIN_L, Analog Audio Out\nMAIN_R, Analog Audio Out\nDANTE_PRI, Dante AES67 Network\nAC_POWER, AC Mains IEC Power`;
      }
    });

    // Window Drag & Drop for arbitrary JSON or text files
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    window.addEventListener('drop', (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          this.ingestArbitraryData(re.target.result);
        };
        reader.readAsText(file);
      }
    });
      this.render();
      this.bridge.notifyChanged();
    });
  }

  selectDeviceById(deviceId) {
    const dev = this.devices.find((d) => d.id === deviceId);
    if (!dev) return;
    this.activeDeviceId = dev.id;
    this.selectedPortIndex = null;
    this.block.loadDevice(dev);
    this.render();
    this.bridge.notifyChanged();
  }

  syncActiveDeviceState() {
    const dev = this.devices.find((d) => d.id === this.activeDeviceId);
    if (dev) {
      dev.name = this.block.name;
      dev.displayName = `${this.block.make} ${this.block.model}`;
      dev.make = this.block.make;
      dev.model = this.block.model;
      dev.kind = this.block.kind;
      dev.ru = this.block.ru;
      dev.width = this.block.width;
      dev.height = this.block.height;
      dev.ports = this.block.ports;
    }
  }

  loadInitialData() {
    this.loadFromDiscoveredProject(false).catch(() => {
      this.render();
    });
  }

  async loadFromDiscoveredProject(notify = false) {
    try {
      const data = await this.bridge.fetchDiscoveredProject();
      if (data) {
        const rawDevs =
          data?.all_discovered?.blocks?.Devices?.data ||
          data?.devices ||
          data?.blocks;

        if (Array.isArray(rawDevs) && rawDevs.length > 0) {
          const discoveredMap = new Set(this.devices.map((d) => d.name));
          rawDevs.forEach((item) => {
            const devName = item.device || item.name || item.id;
            if (devName && !discoveredMap.has(devName)) {
              discoveredMap.add(devName);
              const isInstrument = /34401|54641|33220|8903|4263|66102|6060|DS1104/i.test(devName);
              const isAudio = /Desk|inputs|Analog|Digital/i.test(devName);
              this.devices.unshift({
                id: `dev_disc_${devName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                name: devName.replace(/\s+/g, '_'),
                displayName: devName,
                make: isInstrument ? 'Keysight / HP' : isAudio ? 'APK Audio' : 'Discovered',
                model: devName,
                kind: isInstrument ? 'Test Instrument' : isAudio ? 'Audio DSP' : 'Custom Device',
                ru: isInstrument ? '2U Bench' : '1U Rackmount',
                width: 280,
                height: 180,
                source: 'discovered',
                ports: [
                  { id: 'IN_1', label: `${devName} In 1`, side: 'left', dir: 'In', format: 'Analog Audio', connector: 'XLR-F', color: '#10B981' },
                  { id: 'IN_2', label: `${devName} In 2`, side: 'left', dir: 'In', format: 'Analog Audio', connector: 'XLR-F', color: '#10B981' },
                  { id: 'OUT_1', label: `${devName} Out 1`, side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'XLR-M', color: '#10B981' },
                  { id: 'OUT_2', label: `${devName} Out 2`, side: 'right', dir: 'Out', format: 'Analog Audio', connector: 'XLR-M', color: '#10B981' },
                  { id: 'NET_CTRL', label: 'Ethernet / Bus', side: 'top', dir: 'Bidi', format: 'Gigabit PoE+', connector: 'RJ45', color: '#38BDF8' },
                  { id: 'AC_POWER', label: 'AC Mains', side: 'bottom', dir: 'In', format: 'AC Mains 120/240V', connector: 'IEC', color: '#EF4444' }
                ]
              });
            }
          });
          this.populateDevicePicker();
          if (notify) {
            this.badgeSource.textContent = `⚡ SYNCED (${rawDevs.length} DISCOVERED DEVICES)`;
          }
        }
      }
    } catch (_) {}
    this.render();
  }

  ingestArbitraryData(raw, meta = {}) {
    try {
      const blockDef = interpretToBlock(raw, { defaultName: meta.title });
      this.devices.unshift(blockDef);
      this.activeDeviceId = blockDef.id;
      this.block.loadDevice(blockDef);
      this.populateDevicePicker();
      this.render();
      this.bridge.notifyChanged();
      return blockDef;
    } catch (err) {
      console.error('Failed to interpret payload into block:', err);
      alert('Could not interpret input data. Ensure it has valid text, JSON, inputs, outputs or connections.');
      return null;
    }
  }

  handleBlockLoaded(block, meta = {}) {
    if (!block) return;
    // Use universal interpreter if block has inputs/outputs/connections or isn't a standard schematic block
    if (block.inputs || block.outputs || block.connections || block.routes || block.cables || block.pins || !block.ports) {
      return this.ingestArbitraryData(block, meta);
    }
    this.block.loadDevice(block);
    let matched = this.devices.find((d) => d.name === this.block.name);
    if (!matched) {
      matched = {
        id: `dev_${Date.now()}`,
        name: this.block.name,
        displayName: meta.title || this.block.name,
        make: this.block.make || 'CAD Import',
        model: this.block.model || this.block.name,
        kind: this.block.kind || 'Custom Device',
        ru: this.block.ru || '1U Rackmount',
        width: this.block.width,
        height: this.block.height,
        source: 'custom',
        ports: this.block.ports,
      };
      this.devices.push(matched);
    } else {
      matched.ports = this.block.ports;
    }
    this.activeDeviceId = matched.id;
    this.populateDevicePicker();
    this.render();
  }

  saveBlock() {
    this.syncActiveDeviceState();
    const block = this.block.toJSON();
    this.bridge.saveBlock(block, {
      title: `${this.block.displayName || this.block.name} (${this.block.ports.length} Ports)`,
      filename: `block_${this.block.name.toLowerCase()}`,
    });
  }

  render() {
    if (this.selectDevice) this.selectDevice.value = this.activeDeviceId;
    if (this.inputDeviceName) this.inputDeviceName.value = this.block.name;
    if (this.inputDeviceMake) this.inputDeviceMake.value = this.block.make;
    if (this.inputDeviceModel) this.inputDeviceModel.value = this.block.model;
    if (this.selectDeviceKind) this.selectDeviceKind.value = this.block.kind;
    if (this.inputDeviceRu) this.inputDeviceRu.value = this.block.ru;
    if (this.inputBlockW) this.inputBlockW.value = this.block.width;
    if (this.inputBlockH) this.inputBlockH.value = this.block.height;

    if (this.badgeSource) {
      if (this.block.source === 'discovered') {
        this.badgeSource.textContent = '⚡ DISCOVERED BENCH DEVICE';
        this.badgeSource.style.borderColor = 'rgba(244, 144, 44, 0.4)';
        this.badgeSource.style.color = '#F4902C';
      } else if (this.block.source === 'library') {
        this.badgeSource.textContent = '📦 PRO AV TEMPLATE';
        this.badgeSource.style.borderColor = 'rgba(56, 189, 248, 0.4)';
        this.badgeSource.style.color = '#38BDF8';
      } else {
        this.badgeSource.textContent = '🛠 CUSTOM DEVICE';
        this.badgeSource.style.borderColor = 'rgba(168, 85, 247, 0.4)';
        this.badgeSource.style.color = '#A855F7';
      }
    }

    if (this.badgeKind) this.badgeKind.textContent = this.block.kind;
    if (this.badgePortCount) this.badgePortCount.textContent = `${this.block.ports.length} PORTS`;

    this.renderSymbol();
    this.renderTable();
  }

  renderSymbol() {
    const w = this.block.width || 280;
    const h = this.block.height || 180;
    const pad = 65;
    const svgW = w + pad * 2;
    const svgH = h + pad * 2;

    const leftPins = this.block.ports.filter((p) => p.side === 'left');
    const rightPins = this.block.ports.filter((p) => p.side === 'right');
    const topPins = this.block.ports.filter((p) => p.side === 'top');
    const bottomPins = this.block.ports.filter((p) => p.side === 'bottom');

    const parts = [];

    // Background Shadow & Chassis Box
    parts.push(`
      <defs>
        <filter id="block-shadow" x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#000000" flood-opacity="0.8"/>
        </filter>
        <linearGradient id="header-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#242428"/>
          <stop offset="100%" stop-color="#18181b"/>
        </linearGradient>
      </defs>
    `);

    // Main Chassis
    parts.push(`
      <rect x="${pad}" y="${pad}" width="${w}" height="${h}" rx="6" 
            fill="#18181b" stroke="#3f3f46" stroke-width="1.5" filter="url(#block-shadow)"/>
    `);

    // Top Header Banner
    const headerH = 28;
    parts.push(`
      <path d="M ${pad + 1} ${pad + 1 + 5} A 5 5 0 0 1 ${pad + 6} ${pad + 1} L ${pad + w - 6} ${pad + 1} A 5 5 0 0 1 ${pad + w - 1} ${pad + 1 + 5} L ${pad + w - 1} ${pad + headerH} L ${pad + 1} ${pad + headerH} Z" 
            fill="url(#header-grad)" stroke="#2c2c2c" stroke-width="1"/>
      <text x="${pad + 10}" y="${pad + 18}" fill="#888888" font-size="10" font-weight="700" font-family="monospace">${this.escapeXml(this.block.make)}</text>
      <text x="${pad + w - 10}" y="${pad + 18}" fill="#38BDF8" font-size="9" font-weight="600" text-anchor="end" font-family="monospace">${this.escapeXml(this.block.ru || this.block.kind)}</text>
      <line x1="${pad}" y1="${pad + headerH}" x2="${pad + w}" y2="${pad + headerH}" stroke="#2c2c2c" stroke-width="1"/>
    `);

    // Center Display - Device Name & Model
    const centerY = pad + headerH + (h - headerH) / 2;
    parts.push(`
      <text x="${pad + w / 2}" y="${centerY - 8}" fill="#F4902C" font-size="15" font-weight="800" text-anchor="middle" font-family="sans-serif" letter-spacing="0.04em">
        ${this.escapeXml(this.block.name)}
      </text>
      <text x="${pad + w / 2}" y="${centerY + 10}" fill="#F4F4F5" font-size="11" font-weight="600" text-anchor="middle" font-family="sans-serif">
        ${this.escapeXml(this.block.model || '')}
      </text>
      <text x="${pad + w / 2}" y="${centerY + 26}" fill="#71717A" font-size="9" text-anchor="middle" font-family="monospace">
        ${this.escapeXml(this.block.kind)}
      </text>
    `);

    // Draw Pins with CAD Vector Connector Icons
    const drawPins = (list, side) => {
      const count = list.length;
      list.forEach((p, i) => {
        const fullIndex = this.block.ports.indexOf(p);
        const isSelected = this.selectedPortIndex === fullIndex;
        const color = p.color || formatColorForSignal(p.format);
        const conn = p.connector || 'XLR-F';
        const stubLen = 22;

        let px = 0, py = 0, lx = 0, ly = 0, anchor = 'start';
        let iconX = 0, iconY = 0;

        if (side === 'left') {
          px = pad;
          py = pad + headerH + ((i + 1) / (count + 1)) * (h - headerH);
          lx = px + 10;
          ly = py + 3;
          anchor = 'start';
          iconX = px - stubLen - 14;
          iconY = py - 7;

          parts.push(`
            <line x1="${px - stubLen}" y1="${py}" x2="${px}" y2="${py}" stroke="${isSelected ? '#F4902C' : '#3F3F46'}" stroke-width="${isSelected ? 2 : 1.5}"/>
            <circle cx="${px - stubLen}" cy="${py}" r="${isSelected ? 4.5 : 3.5}" fill="${color}" stroke="#121212" stroke-width="1"/>
            <use href="#cad-icon-${conn.toLowerCase()}" x="${iconX}" y="${iconY}" width="14" height="14" style="color: ${color};"/>
          `);
        } else if (side === 'right') {
          px = pad + w;
          py = pad + headerH + ((i + 1) / (count + 1)) * (h - headerH);
          lx = px - 10;
          ly = py + 3;
          anchor = 'end';
          iconX = px + stubLen;
          iconY = py - 7;

          parts.push(`
            <line x1="${px}" y1="${py}" x2="${px + stubLen}" y2="${py}" stroke="${isSelected ? '#F4902C' : '#3F3F46'}" stroke-width="${isSelected ? 2 : 1.5}"/>
            <circle cx="${px + stubLen}" cy="${py}" r="${isSelected ? 4.5 : 3.5}" fill="${color}" stroke="#121212" stroke-width="1"/>
            <use href="#cad-icon-${conn.toLowerCase()}" x="${iconX}" y="${iconY}" width="14" height="14" style="color: ${color};"/>
          `);
        } else if (side === 'top') {
          px = pad + ((i + 1) / (count + 1)) * w;
          py = pad;
          lx = px;
          ly = py + 14;
          anchor = 'middle';
          iconX = px - 7;
          iconY = py - stubLen - 14;

          parts.push(`
            <line x1="${px}" y1="${py - stubLen}" y2="${px}" y2="${py}" stroke="${isSelected ? '#F4902C' : '#3F3F46'}" stroke-width="${isSelected ? 2 : 1.5}"/>
            <circle cx="${px}" cy="${py - stubLen}" r="${isSelected ? 4.5 : 3.5}" fill="${color}" stroke="#121212" stroke-width="1"/>
            <use href="#cad-icon-${conn.toLowerCase()}" x="${iconX}" y="${iconY}" width="14" height="14" style="color: ${color};"/>
          `);
        } else if (side === 'bottom') {
          px = pad + ((i + 1) / (count + 1)) * w;
          py = pad + h;
          lx = px;
          ly = py - 10;
          anchor = 'middle';
          iconX = px - 7;
          iconY = py + stubLen;

          parts.push(`
            <line x1="${px}" y1="${py}" x2="${px}" y2="${py + stubLen}" stroke="${isSelected ? '#F4902C' : '#3F3F46'}" stroke-width="${isSelected ? 2 : 1.5}"/>
            <circle cx="${px}" cy="${py + stubLen}" r="${isSelected ? 4.5 : 3.5}" fill="${color}" stroke="#121212" stroke-width="1"/>
            <use href="#cad-icon-${conn.toLowerCase()}" x="${iconX}" y="${iconY}" width="14" height="14" style="color: ${color};"/>
          `);
        }

        // Port Text Label
        parts.push(`
          <text x="${lx}" y="${ly}" fill="${isSelected ? '#F4902C' : '#F4F4F5'}" font-size="9" font-weight="${isSelected ? '700' : '600'}" text-anchor="${anchor}" font-family="monospace">
            ${this.escapeXml(p.id)}
          </text>
        `);

        // Invisible Click Target for selecting port
        parts.push(`
          <rect class="svg-pin-target" data-idx="${fullIndex}" x="${Math.min(px, iconX) - 4}" y="${Math.min(py, iconY) - 4}" width="${Math.abs(px - iconX) + 20}" height="${Math.abs(py - iconY) + 20}" fill="transparent" cursor="pointer"/>
        `);
      });
    };

    drawPins(leftPins, 'left');
    drawPins(rightPins, 'right');
    drawPins(topPins, 'top');
    drawPins(bottomPins, 'bottom');

    this.symbolStage.innerHTML = `
      <svg id="schematic-symbol-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        ${parts.join('')}
      </svg>
    `;

    // Attach click listeners to SVG pin targets
    this.symbolStage.querySelectorAll('.svg-pin-target').forEach((el) => {
      el.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        this.selectPort(idx);
      });
    });
  }

  selectPort(index) {
    this.selectedPortIndex = index;
    this.renderSymbol();
    this.renderTable();

    // Scroll selected row into view
    const row = this.tableBody.querySelector(`tr[data-full-idx="${index}"]`);
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  renderTable() {
    this.tableBody.innerHTML = '';

    const filtered = this.block.ports
      .map((p, idx) => ({ port: p, index: idx }))
      .filter((item) => this.activeFilter === 'all' || item.port.side === this.activeFilter);

    if (filtered.length === 0) {
      const emptyTr = document.createElement('tr');
      emptyTr.innerHTML = `
        <td colspan="8" style="text-align: center; padding: 24px; color: var(--osc-text-muted);">
          No ports assigned to the "${this.activeFilter}" side. Click "+ Add Port" or use a bulk action above.
        </td>
      `;
      this.tableBody.appendChild(emptyTr);
      return;
    }

    filtered.forEach((item, pos) => {
      const p = item.port;
      const fullIdx = item.index;
      const isSelected = this.selectedPortIndex === fullIdx;

      const tr = document.createElement('tr');
      tr.className = `port-item-row ${isSelected ? 'selected' : ''}`;
      tr.dataset.fullIdx = fullIdx;

      // Build options for Format and Connectors
      const formatOptions = SIGNAL_FORMATS.map(
        (f) => `<option value="${f}" ${p.format === f ? 'selected' : ''}>${f}</option>`
      ).join('');

      const connOptions = CAD_CONNECTORS.map(
        (c) => `<option value="${c}" ${p.connector === c ? 'selected' : ''}>${c}</option>`
      ).join('');

      tr.innerHTML = `
        <td class="col-idx text-center" style="font-weight: 600; color: var(--osc-text-muted);">${pos + 1}</td>
        <td>
          <input type="text" class="cell-input" data-idx="${fullIdx}" data-field="id" value="${this.escapeXml(p.id)}" style="font-family: monospace; font-weight: 600; color: ${p.color || '#F4902C'};">
        </td>
        <td>
          <input type="text" class="cell-input" data-idx="${fullIdx}" data-field="label" value="${this.escapeXml(p.label || p.id)}">
        </td>
        <td>
          <select class="cell-input" data-idx="${fullIdx}" data-field="side">
            <option value="left" ${p.side === 'left' ? 'selected' : ''}>Left (In)</option>
            <option value="right" ${p.side === 'right' ? 'selected' : ''}>Right (Out)</option>
            <option value="top" ${p.side === 'top' ? 'selected' : ''}>Top (Bus/Clk)</option>
            <option value="bottom" ${p.side === 'bottom' ? 'selected' : ''}>Bottom (Power)</option>
          </select>
        </td>
        <td>
          <select class="cell-input" data-idx="${fullIdx}" data-field="dir">
            <option value="In" ${p.dir === 'In' ? 'selected' : ''}>Input</option>
            <option value="Out" ${p.dir === 'Out' ? 'selected' : ''}>Output</option>
            <option value="Bidi" ${p.dir === 'Bidi' ? 'selected' : ''}>Bi-directional</option>
          </select>
        </td>
        <td>
          <select class="cell-input" data-idx="${fullIdx}" data-field="format">
            ${formatOptions}
          </select>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 4px;">
            <svg class="cad-icon-svg" width="16" height="16" style="color: ${p.color};">
              <use href="#cad-icon-${(p.connector || 'XLR-F').toLowerCase()}"/>
            </svg>
            <select class="cell-input" data-idx="${fullIdx}" data-field="connector" style="flex: 1;">
              ${connOptions}
            </select>
          </div>
        </td>
        <td class="col-actions">
          <button class="btn-icon btn-del-pin" data-idx="${fullIdx}" title="Delete Port">🗑</button>
        </td>
      `;

      tr.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT' && e.target.tagName !== 'BUTTON') {
          this.selectPort(fullIdx);
        }
      });

      this.tableBody.appendChild(tr);
    });

    // Attach row input listeners
    this.tableBody.querySelectorAll('.cell-input').forEach((input) => {
      input.addEventListener('change', (e) => {
        const i = parseInt(e.target.dataset.idx, 10);
        const f = e.target.dataset.field;
        this.block.ports[i][f] = e.target.value;

        if (f === 'format') {
          this.block.ports[i].color = formatColorForSignal(e.target.value);
        }

        this.syncActiveDeviceState();
        this.renderSymbol();
        this.renderTable();
        this.bridge.notifyChanged();
      });
    });

    // Attach delete listeners
    this.tableBody.querySelectorAll('.btn-del-pin').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const i = parseInt(e.target.dataset.idx, 10);
        this.block.removePort(i);
        if (this.selectedPortIndex === i) this.selectedPortIndex = null;
        this.syncActiveDeviceState();
        this.render();
        this.bridge.notifyChanged();
      });
    });
  }

  escapeXml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
    });
  }

  promptOpen() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.txt,.csv,.sch';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (re) => {
        this.ingestArbitraryData(re.target.result, { title: file.name });
      };
      reader.readAsText(file);
    };
    input.click();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.blockBuddyApp = new BlockBuddyApp();
  });
}
