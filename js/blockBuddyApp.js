// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.

import { BlockBridge } from './blockBridge.js';
import { BlockDefinitionModel } from './blockModel.js';

export class BlockBuddyApp {
  constructor() {
    this.block = new BlockDefinitionModel('audio.dsp', 'DSP_CORE');

    this.bridge = new BlockBridge({
      name: 'Block Buddy',
      type: 'schematic_block',
      onBlockLoaded: (block, meta) => this.handleBlockLoaded(block, meta),
      onBlockChanged: () => {},
    });

    this.initElements();
    this.attachEvents();
    this.loadInitialData();
  }

  initElements() {
    this.btnOpen = document.getElementById('btn-open');
    this.btnSave = document.getElementById('btn-save');
    this.btnClose = document.getElementById('btn-close');
    this.btnSyncDiscovered = document.getElementById('btn-sync-discovered');

    this.inputBlockName = document.getElementById('input-block-name');
    this.inputBlockKind = document.getElementById('input-block-kind');
    this.inputBlockW = document.getElementById('input-block-w');
    this.inputBlockH = document.getElementById('input-block-h');

    this.symbolStage = document.getElementById('symbol-preview-stage');
    this.tableBody = document.getElementById('pin-table-body');
    this.btnAddPin = document.getElementById('btn-add-pin');
  }

  attachEvents() {
    this.btnOpen?.addEventListener('click', () => this.promptOpen());
    this.btnSave?.addEventListener('click', () => this.saveBlock());
    this.btnClose?.addEventListener('click', () => this.bridge.close());
    this.btnSyncDiscovered?.addEventListener('click', () => this.loadFromDiscoveredProject());

    this.inputBlockName.addEventListener('input', (e) => {
      this.block.name = e.target.value;
      this.renderSymbol();
      this.bridge.notifyChanged();
    });

    this.inputBlockKind.addEventListener('input', (e) => {
      this.block.kind = e.target.value;
      this.bridge.notifyChanged();
    });

    this.inputBlockW.addEventListener('input', (e) => {
      this.block.width = parseInt(e.target.value, 10) || 240;
      this.renderSymbol();
      this.bridge.notifyChanged();
    });

    this.inputBlockH.addEventListener('input', (e) => {
      this.block.height = parseInt(e.target.value, 10) || 160;
      this.renderSymbol();
      this.bridge.notifyChanged();
    });

    this.btnAddPin?.addEventListener('click', () => {
      const idx = this.block.ports.length + 1;
      this.block.ports.push({
        id: `PIN_${idx}`,
        side: 'left',
        format: 'Analog Audio',
        dir: 'In',
        color: '#10B981',
      });
      this.render();
      this.bridge.notifyChanged();
    });
  }

  loadInitialData() {
    this.loadFromDiscoveredProject().catch(() => {
      this.render();
    });
  }

  async loadFromDiscoveredProject() {
    try {
      const data = await this.bridge.fetchDiscoveredProject();
      if (data && (data.blocks || data.schematicBlocks)) {
        const blocks = data.blocks || data.schematicBlocks;
        if (Array.isArray(blocks) && blocks.length > 0) {
          this.handleBlockLoaded(blocks[0], { title: blocks[0].name });
          return;
        }
      }
    } catch (_) {}
    this.render();
  }

  handleBlockLoaded(block, meta = {}) {
    if (!block) return;
    this.block.id = block.id || this.block.id;
    this.block.name = block.name || this.block.name;
    this.block.kind = block.kind || this.block.kind;
    this.block.width = block.width || this.block.width;
    this.block.height = block.height || this.block.height;
    if (Array.isArray(block.ports)) {
      this.block.ports = block.ports;
    }
    this.render();
  }

  saveBlock() {
    const block = {
      type: 'schematic_block',
      id: this.block.id,
      name: this.block.name,
      kind: this.block.kind,
      width: this.block.width,
      height: this.block.height,
      ports: this.block.ports,
      timestamp: new Date().toISOString(),
    };
    this.bridge.saveBlock(block, {
      title: `${this.block.name} (${this.block.ports.length} Pins)`,
      filename: `block_${this.block.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    });
  }

  render() {
    this.inputBlockName.value = this.block.name;
    this.inputBlockKind.value = this.block.kind;
    this.inputBlockW.value = this.block.width;
    this.inputBlockH.value = this.block.height;
    this.renderSymbol();
    this.renderTable();
  }

  renderSymbol() {
    const w = this.block.width || 240;
    const h = this.block.height || 160;

    const leftPins = this.block.ports.filter(p => p.side === 'left');
    const rightPins = this.block.ports.filter(p => p.side === 'right');
    const topPins = this.block.ports.filter(p => p.side === 'top');
    const bottomPins = this.block.ports.filter(p => p.side === 'bottom');

    const parts = [];
    const pad = 40;
    const svgW = w + pad * 2;
    const svgH = h + pad * 2;

    // Body
    parts.push(`<rect x="${pad}" y="${pad}" width="${w}" height="${h}" rx="6" fill="#121A2F" stroke="#2D3D60" stroke-width="1.5"/>`);
    parts.push(`<text x="${pad + w / 2}" y="${pad + h / 2 - 4}" fill="#F4902C" font-size="14" font-weight="bold" text-anchor="middle" font-family="sans-serif">${this.block.name}</text>`);
    parts.push(`<text x="${pad + w / 2}" y="${pad + h / 2 + 12}" fill="#8B9BB4" font-size="10" text-anchor="middle" font-family="monospace">${this.block.kind}</text>`);

    // Helper for pins
    const drawPins = (list, side) => {
      const count = list.length;
      list.forEach((p, i) => {
        let px = 0, py = 0, lx = 0, ly = 0, anchor = 'start';
        if (side === 'left') {
          px = pad;
          py = pad + ((i + 1) / (count + 1)) * h;
          lx = px + 8; ly = py + 3; anchor = 'start';
          parts.push(`<line x1="${px - 14}" y1="${py}" x2="${px}" y2="${py}" stroke="#4A9EFF" stroke-width="1.5"/>`);
          parts.push(`<circle cx="${px - 14}" cy="${py}" r="3" fill="#10B981"/>`);
        } else if (side === 'right') {
          px = pad + w;
          py = pad + ((i + 1) / (count + 1)) * h;
          lx = px - 8; ly = py + 3; anchor = 'end';
          parts.push(`<line x1="${px}" y1="${py}" x2="${px + 14}" y2="${py}" stroke="#4A9EFF" stroke-width="1.5"/>`);
          parts.push(`<circle cx="${px + 14}" cy="${py}" r="3" fill="#38BDF8"/>`);
        } else if (side === 'top') {
          px = pad + ((i + 1) / (count + 1)) * w;
          py = pad;
          lx = px; ly = py + 12; anchor = 'middle';
          parts.push(`<line x1="${px}" y1="${py - 14}" x2="${px}" y2="${py}" stroke="#F59E0B" stroke-width="1.5"/>`);
          parts.push(`<circle cx="${px}" cy="${py - 14}" r="3" fill="#F59E0B"/>`);
        } else if (side === 'bottom') {
          px = pad + ((i + 1) / (count + 1)) * w;
          py = pad + h;
          lx = px; ly = py - 8; anchor = 'middle';
          parts.push(`<line x1="${px}" y1="${py}" x2="${px}" y2="${py + 14}" stroke="#EF4444" stroke-width="1.5"/>`);
          parts.push(`<circle cx="${px}" cy="${py + 14}" r="3" fill="#EF4444"/>`);
        }
        parts.push(`<text x="${lx}" y="${ly}" fill="#F0F4F8" font-size="9" font-weight="600" text-anchor="${anchor}" font-family="monospace">${p.id}</text>`);
      });
    };

    drawPins(leftPins, 'left');
    drawPins(rightPins, 'right');
    drawPins(topPins, 'top');
    drawPins(bottomPins, 'bottom');

    this.symbolStage.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        ${parts.join('')}
      </svg>
    `;
  }

  renderTable() {
    this.tableBody.innerHTML = '';
    this.block.ports.forEach((p, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="col-idx text-center">${idx + 1}</td>
        <td><input type="text" class="cell-input" data-idx="${idx}" data-field="id" value="${p.id}"></td>
        <td>
          <select class="cell-input" data-idx="${idx}" data-field="side">
            <option value="left" ${p.side === 'left' ? 'selected' : ''}>Left</option>
            <option value="right" ${p.side === 'right' ? 'selected' : ''}>Right</option>
            <option value="top" ${p.side === 'top' ? 'selected' : ''}>Top</option>
            <option value="bottom" ${p.side === 'bottom' ? 'selected' : ''}>Bottom</option>
          </select>
        </td>
        <td>
          <select class="cell-input" data-idx="${idx}" data-field="dir">
            <option value="In" ${p.dir === 'In' ? 'selected' : ''}>Input</option>
            <option value="Out" ${p.dir === 'Out' ? 'selected' : ''}>Output</option>
            <option value="Bidi" ${p.dir === 'Bidi' ? 'selected' : ''}>Bi-directional</option>
          </select>
        </td>
        <td><input type="text" class="cell-input" data-idx="${idx}" data-field="format" value="${p.format || ''}"></td>
        <td class="col-actions">
          <button class="btn-icon btn-del-pin" data-idx="${idx}" title="Delete Pin">🗑</button>
        </td>
      `;
      this.tableBody.appendChild(tr);
    });

    this.tableBody.querySelectorAll('.cell-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const i = parseInt(e.target.dataset.idx, 10);
        const f = e.target.dataset.field;
        this.block.ports[i][f] = e.target.value;
        this.renderSymbol();
        this.bridge.notifyChanged();
      });
    });

    this.tableBody.querySelectorAll('.btn-del-pin').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const i = parseInt(e.target.dataset.idx, 10);
        this.block.ports.splice(i, 1);
        this.render();
        this.bridge.notifyChanged();
      });
    });
  }

  promptOpen() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (re) => {
        try {
          const parsed = JSON.parse(re.target.result);
          this.handleBlockLoaded(parsed, { title: file.name });
        } catch (err) {
          alert('Invalid JSON block');
        }
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
