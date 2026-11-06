// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

import { connectBlockHost, saveMeta, saveBlockModel, mergeDiscovered } from './blockHost.js';
import { blockFromIfc, isIfcText, schemaOf } from './blockIfc.js';
import { BlockDefinitionModel } from './blockModel.js';
import {
  DEVICE_CATEGORIES,
  SIGNAL_FORMATS,
  CAD_CONNECTORS,
  createBlankDevice,
  cloneDevice,
  formatColorForSignal,
} from './deviceCatalog.js';
import { CAD_SYMBOLS_SVG_SHEET } from './cadConnectorSymbols.js';
import { libraryButton, bimFields, readLibraryDrop } from './bimLibrary.js';
import { interpretToBlock } from './universalBlockInterpreter.js';
import { partToBlockDevice } from './bimPart.js';

export class BlockBuddyApp {
  constructor(S) {
    this.S = S;
    // Nothing ships in the source: a blank to start, then the bench's devices from the BIM library.
    this.devices = [createBlankDevice('CUSTOM_DEVICE', 'Custom', 'Device')];
    this.activeDeviceId = this.devices[0].id;
    this.activeFilter = 'all';
    this.selectedPortIndex = null;

    this.block = new BlockDefinitionModel();
    this.block.loadDevice(this.devices[0]);

    S.describe({
      name: 'Block Buddy',
      does: 'Builds a device schematic block: its ports on four sides (inputs left, outputs right, bus/clock top, power bottom), for the CAD.',
      inputs: [
        { name: 'Device block', from: 'the CAD (when opened from a drawing), or Open: .json / .txt / .csv / .sch, or its .ifc twin (IFC4X3_ADD2)', kind: 'file' },
        { name: 'Any port list', from: 'Ingest (paste JSON, CSV or a wirelist) or a file dropped on the page', kind: 'file' },
        { name: 'Bench devices', from: 'the BIM library: /api/bim/instances?state=online and their parts (when the host serves it)' },
        { name: 'Device library', from: 'the BIM library picker (Library button, when the host serves it)' },
        { name: 'Discovered devices', from: 'the bus: things scanners and agents found (kinds in config/discovery.json)', kind: 'bus' },
      ],
      outputs: [
        { name: 'Device block', to: 'the CAD on Save and on every edit; standalone, Save Model: the .json and its .ifc twin', kind: 'file' },
      ],
      controls: [
        { name: 'Device picker / New / Clone / Library', how: 'choose, start, copy or import the device being drawn' },
        { name: 'Name, Make, Model, Kind, RU, W, H', how: 'device fields; W and H size the block' },
        { name: 'Side filters', how: 'All / Left / Right / Top / Bottom show one side of ports' },
        { name: '+ 8 Inputs / + 8 Outputs / + Dante Net / + Power / + Add Port', how: 'add ports in bulk or one at a time; edit them in the table' },
        { name: 'Ingest', how: 'paste data (or load a preset) and Parse & Build' },
        { name: 'Discovered / Open / Save / Close', how: 'header buttons' },
      ],
      problems: ['bad_input', 'file_unreadable', 'not_in_cad', 'bus_missing', 'http_server_error', 'bad_json', 'save_failed'],
    });

    this.initElements();
    this.createTable();
    this.injectCadSymbols();
    this.populateKindPicker();
    this.populateDevicePicker();
    this.attachEvents();

    // The CAD sends the block after editorReady; the page must be built first.
    this.host = connectBlockHost(S, {
      onLoad: (block, meta) => this.handleBlockLoaded(block, meta),
      current: () => { this.syncActiveDeviceState(); return this.block.toJSON(); },
    });
    S.inheritTheme();
    this.render();
    this.readDiscovered();
    this.loadBench();
  }

  /** After an edit: the CAD hears blockChanged (standalone, nothing is sent). */
  changed() {
    const block = this.block.toJSON();
    this.host.changed(block, saveMeta(block));
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
    this.tableHost = document.getElementById('pin-table');
    this.discoveryStatus = document.getElementById('discovery-status');
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
    discoveredGroup.label = '⚡ Discovered on the bus';

    const libraryGroup = document.createElement('optgroup');
    libraryGroup.label = '📦 Pro AV / IT Hardware Library';

    const customGroup = document.createElement('optgroup');
    customGroup.label = '🛠 Custom Device Symbols';

    this.devices.forEach((dev) => {
      const opt = document.createElement('option');
      opt.value = dev.id;
      opt.textContent = `${dev.displayName || dev.name} (${dev.ports ? dev.ports.length : 0}P)`
        + (dev.source === 'discovered' && dev.live ? ` · ${dev.live.state}` : '');

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
    this.btnClose?.addEventListener('click', () => this.host.close());
    this.btnSyncDiscovered?.addEventListener('click', () => this.readDiscovered());

    this.selectDevice?.addEventListener('change', (e) => {
      this.selectDeviceById(e.target.value);
    });

    // 📚 Library (ROAD-3572): every new device is a BIM part, pins and all, with its BIM
    // reference — no blank device with a typed make and model (the old + New Device).
    this.addFromLibrary = (items) => {
      let dev = null;
      for (const it of items) {
        dev = partToBlockDevice(it.bim, bimFields(it).bimRef);
        this.devices.push(dev);
      }
      if (!dev) return;
      this.activeDeviceId = dev.id;
      this.block.loadDevice(dev);
      this.populateDevicePicker();
      this.render();
      this.changed();
    };
    this.btnNewDevice?.replaceWith(libraryButton(this.addFromLibrary, {
      className: 'btn btn-secondary btn-sm', title: 'Add a device from the BIM library as a block' }));

    this.btnCloneDevice?.addEventListener('click', () => {
      const current = this.devices.find((d) => d.id === this.activeDeviceId);
      if (!current) return;
      const clone = cloneDevice(current);
      this.devices.push(clone);
      this.activeDeviceId = clone.id;
      this.block.loadDevice(clone);
      this.populateDevicePicker();
      this.render();
      this.changed();
    });

    this.inputDeviceName?.addEventListener('input', (e) => {
      this.block.name = e.target.value.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
      this.syncActiveDeviceState();
      this.renderSymbol();
      this.changed();
    });

    this.inputDeviceMake?.addEventListener('input', (e) => {
      this.block.make = e.target.value;
      this.syncActiveDeviceState();
      this.renderSymbol();
      this.changed();
    });

    this.inputDeviceModel?.addEventListener('input', (e) => {
      this.block.model = e.target.value;
      this.block.displayName = `${this.block.make} ${this.block.model}`;
      this.syncActiveDeviceState();
      this.renderSymbol();
      this.changed();
    });

    this.selectDeviceKind?.addEventListener('change', (e) => {
      this.block.kind = e.target.value;
      this.badgeKind.textContent = this.block.kind;
      this.syncActiveDeviceState();
      this.renderSymbol();
      this.changed();
    });

    this.inputDeviceRu?.addEventListener('input', (e) => {
      this.block.ru = e.target.value;
      this.syncActiveDeviceState();
      this.changed();
    });

    this.inputBlockW?.addEventListener('input', (e) => {
      this.block.width = Math.max(160, parseInt(e.target.value, 10) || 280);
      this.syncActiveDeviceState();
      this.renderSymbol();
      this.changed();
    });

    this.inputBlockH?.addEventListener('input', (e) => {
      this.block.height = Math.max(120, parseInt(e.target.value, 10) || 180);
      this.syncActiveDeviceState();
      this.renderSymbol();
      this.changed();
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
      this.changed();
    });

    this.btnBulkIn8?.addEventListener('click', () => {
      this.block.bulkAddPorts('inputs8');
      this.syncActiveDeviceState();
      this.render();
      this.changed();
    });

    this.btnBulkOut8?.addEventListener('click', () => {
      this.block.bulkAddPorts('outputs8');
      this.syncActiveDeviceState();
      this.render();
      this.changed();
    });

    this.btnBulkDante?.addEventListener('click', () => {
      this.block.bulkAddPorts('dante');
      this.syncActiveDeviceState();
      this.render();
      this.changed();
    });

    this.btnBulkPwr?.addEventListener('click', () => {
      this.block.bulkAddPorts('power_ground');
      this.syncActiveDeviceState();
      this.render();
      this.changed();
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
      // a paste that cannot be read keeps the modal open, with the problem card saying why
      if (this.ingestArbitraryData(text, { title: 'pasted data' }) && this.modalIngest) this.modalIngest.style.display = 'none';
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
      // a part dragged from the BIM library becomes a block (ROAD-3572)
      const part = readLibraryDrop(e);
      if (part) { this.addFromLibrary([part]); return; }
      const file = e.dataTransfer.files?.[0];
      if (file) this.readFile(file);
    });
  }

  selectDeviceById(deviceId) {
    const dev = this.devices.find((d) => d.id === deviceId);
    if (!dev) return;
    this.activeDeviceId = dev.id;
    this.selectedPortIndex = null;
    this.block.loadDevice(dev);
    this.render();
    this.changed();
  }

  syncActiveDeviceState() {
    const dev = this.devices.find((d) => d.id === this.activeDeviceId);
    if (dev) {
      dev.name = this.block.name;
      dev.displayName = `${this.block.make} ${this.block.model}`;
      dev.make = this.block.make;
      dev.model = this.block.model;
      if (this.block.bimRef) { dev.bimId = this.block.bimId; dev.bimRef = this.block.bimRef; }
      dev.kind = this.block.kind;
      dev.ru = this.block.ru;
      dev.width = this.block.width;
      dev.height = this.block.height;
      dev.ports = this.block.ports;
    }
  }

  /* Discovered devices are the things the bus knows (APKSoftapp.discovered), never a list of our own. */
  /** The bench's online devices, each as its BIM library part with every pin. */
  async loadBench() {
    // No library on this host (a static copy: unreachable or 404) is normal and stays quiet;
    // a library that is there but fails says what happened, with Retry.
    const quiet = (p) => !p || p.code === 'fetch_failed' || p.code === 'http_not_found';
    const fail = (r) => {
      if (!quiet(r.problem)) this.S.showProblem(r.problem, { subject: 'BIM library (bench devices)', onRetry: () => this.loadBench() });
    };
    try {
      const r = await this.S.fetchJson('/api/bim/instances?state=online', { subject: 'BIM library' });
      if (!r.ok) return fail(r);
      const ids = [...new Set(((r.data && r.data.items) || []).map(i => i.part?.id).filter(Boolean))];
      if (!ids.length) return;
      const q = await this.S.fetchJson(`/api/bim/parts?full=1&limit=200&id=${ids.map(encodeURIComponent).join(',')}`, { subject: 'BIM library' });
      if (!q.ok) return fail(q);
      const parts = (q.data && q.data.items) || [];
      const have = new Set(this.devices.map(d => d.bimId).filter(Boolean));
      const fresh = parts.filter(p => !have.has(p.id) && (p.ports || []).length).map((p) => partToBlockDevice(p));
      if (!fresh.length) return;
      const onlyBlank = this.devices.length === 1 && !this.devices[0].ports?.length && !this.devices[0].bimId;
      this.devices.push(...fresh);
      if (onlyBlank) {
        this.activeDeviceId = fresh[0].id;
        this.block.loadDevice(fresh[0]);
      }
      this.populateDevicePicker();
      this.render();
    } catch (_) { /* no library on this host: the blank and the 📚 button's absence say so */ }
  }

  async readDiscovered() {
    if (this.discovery) {
      this.applyDiscovered(this.discovery.things());
      return;
    }
    let kinds = [];
    try {
      const r = await fetch(new URL('../config/discovery.json', import.meta.url), { cache: 'no-store' });
      if (r.ok) kinds = (await r.json()).kinds || [];
    } catch (_) { /* no config: every thing */ }
    const d = await this.S.discovered({ kinds, onChange: (things) => this.applyDiscovered(things) });
    if (!d.ok) {
      this.sayDiscovery('dead', d.reason);
      // asked for explicitly (the button), so say what to do; at startup the status line is enough
      if (this.discoveryAsked && d.problem) this.S.showProblem(d.problem, { subject: 'Discovered devices', onRetry: () => this.readDiscovered() });
      this.discoveryAsked = true;
      return;
    }
    this.discovery = d;
    this.applyDiscovered(d.things());
  }

  applyDiscovered(things) {
    const added = mergeDiscovered(this.devices, things, DEVICE_CATEGORIES);
    const good = things.filter((t) => t.live && t.live.state === 'good').length;
    const link = this.discovery && this.discovery.bus;
    const empty = link && link.connected === false ? 'No broker reachable from this page yet: no discovered devices.' : 'The bus knows no devices yet.';
    this.sayDiscovery(good ? 'good' : things.length ? 'kinda' : 'dead',
      things.length ? `${things.length} discovered on the bus, ${good} verified in the last 5 min.` : empty);
    if (added || things.length) this.populateDevicePicker();   // live state is in the option text
    this.renderSourceBadge();
  }

  sayDiscovery(state, text) {
    if (!this.discoveryStatus) return;
    this.discoveryStatus.textContent = text;
    this.discoveryStatus.setAttribute('data-apk-state', state);
  }

  ingestArbitraryData(raw, meta = {}) {
    try {
      const blockDef = interpretToBlock(raw, { defaultName: meta.title });
      this.devices.unshift(blockDef);
      this.activeDeviceId = blockDef.id;
      this.block.loadDevice(blockDef);
      this.populateDevicePicker();
      this.render();
      this.changed();
      return blockDef;
    } catch (err) {
      this.S.showProblem('bad_input', {
        subject: meta.title || 'input data',
        detail: err && err.message ? err.message : String(err),
        fix: [
          'Give it JSON with ports, inputs / outputs or connections, or one "Name, Type / Direction" line per port (Ingest shows presets of each).',
          'A CAD block .json saved by Block Buddy opens as-is.',
        ],
        onRetry: meta.retry,
      });
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

  /** Save & Return: into the CAD; standalone, Save Model — the .json and its .ifc twin (js/blockIfc.js). */
  saveBlock() {
    this.syncActiveDeviceState();
    return saveBlockModel(this.S, this.host, this.block.toJSON(), { onRetry: () => this.saveBlock() });
  }

  /** An IFC model's device (js/blockIfc.js); false (and a problem card) when it holds none. */
  loadIfc(text, name, retry) {
    let block;
    try {
      block = blockFromIfc(text);
    } catch (err) {
      this.S.showProblem('bad_input', {
        subject: name, detail: err && err.message ? err.message : String(err),
        fix: ['Open an .ifc saved by Block Buddy, or one with a device that has its ports nested on it (IfcDistributionPort).'],
        onRetry: retry,
      });
      return false;
    }
    this.handleBlockLoaded(block, { title: `${name} · ${schemaOf(text)}` });
    this.changed();
    return true;
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

    this.renderSourceBadge();

    if (this.badgeKind) this.badgeKind.textContent = this.block.kind;
    if (this.badgePortCount) this.badgePortCount.textContent = `${this.block.ports.length} PORTS`;

    this.renderSymbol();
    this.renderTable();
  }

  renderSourceBadge() {
    if (this.badgeSource) {
      this.badgeSource.removeAttribute('data-apk-state');
      this.badgeSource.title = '';
      if (this.block.source === 'discovered') {
        const dev = this.devices.find((d) => d.id === this.activeDeviceId);
        const live = (dev && dev.live) || { state: 'dead', why: 'not on the bus' };
        this.badgeSource.textContent = `⚡ DISCOVERED · ${live.state.toUpperCase()} · ${live.why}`;
        this.badgeSource.setAttribute('data-apk-state', live.state);
        this.badgeSource.title = dev && dev.identity ? `identity ${dev.identity.id}` : '';
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
            <circle cx="${px - stubLen}" cy="${py}" r="${isSelected ? 4.5 : 3.5}" fill="${this.escapeXml(color)}" stroke="#121212" stroke-width="1"/>
            <use href="#cad-icon-${this.escapeXml(conn.toLowerCase())}" x="${iconX}" y="${iconY}" width="14" height="14" style="color: ${this.escapeXml(color)};"/>
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
            <circle cx="${px + stubLen}" cy="${py}" r="${isSelected ? 4.5 : 3.5}" fill="${this.escapeXml(color)}" stroke="#121212" stroke-width="1"/>
            <use href="#cad-icon-${this.escapeXml(conn.toLowerCase())}" x="${iconX}" y="${iconY}" width="14" height="14" style="color: ${this.escapeXml(color)};"/>
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
            <line x1="${px}" y1="${py - stubLen}" x2="${px}" y2="${py}" stroke="${isSelected ? '#F4902C' : '#3F3F46'}" stroke-width="${isSelected ? 2 : 1.5}"/>
            <circle cx="${px}" cy="${py - stubLen}" r="${isSelected ? 4.5 : 3.5}" fill="${this.escapeXml(color)}" stroke="#121212" stroke-width="1"/>
            <use href="#cad-icon-${this.escapeXml(conn.toLowerCase())}" x="${iconX}" y="${iconY}" width="14" height="14" style="color: ${this.escapeXml(color)};"/>
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
            <circle cx="${px}" cy="${py + stubLen}" r="${isSelected ? 4.5 : 3.5}" fill="${this.escapeXml(color)}" stroke="#121212" stroke-width="1"/>
            <use href="#cad-icon-${this.escapeXml(conn.toLowerCase())}" x="${iconX}" y="${iconY}" width="14" height="14" style="color: ${this.escapeXml(color)};"/>
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
    const row = this.tableHost && this.tableHost.querySelector('tr.selected');
    if (row && row.scrollIntoView) row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /** The port table is APKTable: its rows are the block's own port objects, filtered by side. */
  createTable() {
    const sides = ['left', 'right', 'top', 'bottom'];
    this.table = window.APKTable.create(this.tableHost, {
      id: 'blockbuddy-ports',
      columns: [
        { key: '_n', label: '#', render: (v, row) => String(this.block.ports.indexOf(row) + 1) },
        { key: 'id', label: 'Pin Identifier', mono: true },
        { key: 'label', label: 'Display Label' },
        { key: 'side', label: 'Chassis Side', type: 'select', options: sides },
        { key: 'dir', label: 'Direction', type: 'select', options: ['In', 'Out', 'Bidi'] },
        { key: 'format', label: 'Signal Format', type: 'select', options: SIGNAL_FORMATS },
        { key: '_icon', label: '', render: (v, row) => this.connectorIcon(row) },
        { key: 'connector', label: 'CAD Connector', type: 'select', options: CAD_CONNECTORS },
      ],
      rows: [],
      rowClass: (row) => `port-item-row${this.block.ports.indexOf(row) === this.selectedPortIndex ? ' selected' : ''}`,
      onSelect: (i, row) => {
        const idx = this.block.ports.indexOf(row);
        if (idx >= 0 && idx !== this.selectedPortIndex) this.selectPort(idx);
      },
      onEdit: (i, key, value, row) => {
        if (key === 'format') row.color = formatColorForSignal(value);
        this.syncActiveDeviceState();
        this.renderSymbol();
        this.renderTable();
        this.changed();
      },
      onDelete: (i, row) => {
        const idx = this.block.ports.indexOf(row);
        this.block.removePort(idx);
        if (this.selectedPortIndex === idx) this.selectedPortIndex = null;
        this.syncActiveDeviceState();
        this.render();
        this.changed();
      },
      empty: 'No ports on this side. Click "+ Add Port" or use a bulk action above.',
    });
  }

  connectorIcon(port) {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'cad-icon-svg');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.style.color = port.color || formatColorForSignal(port.format);
    const use = document.createElementNS(NS, 'use');
    use.setAttribute('href', `#cad-icon-${String(port.connector || 'XLR-F').toLowerCase()}`);
    svg.appendChild(use);
    return svg;
  }

  renderTable() {
    if (!this.table) return;
    this.table.setRows(this.block.ports.filter((p) => this.activeFilter === 'all' || p.side === this.activeFilter));
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
    input.accept = '.json,.txt,.csv,.sch,.ifc';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      this.readFile(file, () => this.promptOpen());
    };
    input.click();
  }

  /** A dropped or picked file into the interpreter; a read failure says so, with Retry when we can pick again. */
  readFile(file, retry) {
    const reader = new FileReader();
    reader.onerror = () => this.S.showProblem('file_unreadable', {
      subject: file.name, detail: reader.error && reader.error.message, onRetry: retry,
    });
    reader.onload = (re) => {
      const text = re.target.result;
      if (/\.ifc$/i.test(file.name) || isIfcText(text)) this.loadIfc(text, file.name, retry);
      else this.ingestArbitraryData(text, { title: file.name, retry });
    };
    reader.readAsText(file);
  }
}

if (typeof window !== 'undefined') {
  const start = () => {
    if (!window.APKSoftapp || !window.APKTable) {
      document.body.prepend(Object.assign(document.createElement('p'), {
        textContent: 'vendor/apk-softapp or vendor/apk-table did not load: this editor cannot start.',
      }));
      return;
    }
    window.blockBuddyApp = new BlockBuddyApp(window.APKSoftapp);
  };
  // An import with top-level await (js/vocabulary.js) finishes this module AFTER
  // DOMContentLoaded — a listener added then never fires, and the editor never
  // started. Start now when the document is already parsed.
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', start);
  else start();
}
