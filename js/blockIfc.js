// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/* blockIfc.js — THE SCHEMATIC BLOCK'S .IFC TWIN (ROAD-3583). Save Model writes the native block
   (BlockDefinitionModel.toJSON) AND this IFC4X3_ADD2 file through APKSoftapp.saveModel; Open Model
   reads it back to the same block. Written with the contracts STEP codec (vendor/apk-contracts/apk-ifc.js,
   scripts/vendor-ifc.mjs), no IfcOpenShell in the page. Byte-deterministic: the same block writes the
   same file.

     IfcProject ─ IfcSite ─ IfcBuilding ─ IfcBuildingStorey 'Blocks'   units: mm
     the device   ONE occurrence (Name = the block name, Description = its display name, Tag = its id),
                  contained in the storey, typed (IfcRelDefinesByType) by
     the type     the BIM part when the block came from the library: GlobalId part/<id> (the part's own
                  type in DATABASE.server.BIM, contracts ifcGuid) and APK_Part.PartId; else the block's own.
                  Name = make + model, Pset_ManufacturerTypeInformation Manufacturer / ModelReference.
                  The entity is the kind's (KIND_IFC, the contracts mapping.json words for those
                  categories): an AV appliance, a communications appliance, a flow instrument, or a plain
                  IfcDistributionElement for a custom device
                  APK_AVDevice.RackUnits when the RU text has a number; APK_Block: Kind, Mount (the RU
                  text), SymbolWidth / SymbolHeight (the symbol on the sheet), Source, ThingId, BimRef
     identity     a discovered unit: GlobalId inst/mac:<mac> (the contracts role grammar), APK_Identity
                  IdentityKey + MacAddress, Pset_ManufacturerOccurrence.SerialNumber. Never an IP.
     a pin        IfcDistributionPort nested in block order (IfcRelNests): Name = its label,
                  Description = its signal format, FlowDirection In SINK | Out SOURCE | Bidi SOURCEANDSINK,
                  SystemType from the format; Pset_DistributionPortCommon.PortNumber;
                  Pset_DistributionPortTypeCable ElectricalConnectionType / ConnectionSubtype /
                  ConnectionGender from the connector (the shared vocabulary's entry), Protocols for a
                  network format; APK_Terminal TerminalId (the pin id), Connector, SymbolSide, SymbolColour
   Every APK_ set is declared in DATABASE.server.BIM SRC/tools/ifc (apk_psets.py + apk_psets_editors.py). */

import { entitiesByType, enumv, getPsets, ifcGuid, isRef, parseStep, ports as portsOfEntity, real, ref, typed, writeStep } from '../vendor/apk-contracts/apk-ifc.js';
import { VOCABULARY } from './vocabulary.js';

export const BLOCK_IFC_SCHEMA = 'IFC4X3_ADD2';
const STAMP = '1970-01-01T00:00:00';   // fixed: the file is a function of the block, never of the clock

const str = (v) => (v == null ? '' : String(v));
const label = (s) => typed('IFCLABEL', String(s));
const ident = (s) => typed('IFCIDENTIFIER', String(s));
const text = (s) => typed('IFCTEXT', String(s));
const int = (n) => typed('IFCINTEGER', Math.trunc(n));
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : null);

/* The kind words this editor offers (deviceCatalog.js DEVICE_CATEGORIES) as IFC types — the same entity and
   predefined type the contracts mapping.json gives the BIM part class / category each one is. */
export const KIND_IFC = {
  'Audio DSP': ['IFCAUDIOVISUALAPPLIANCE', 'USERDEFINED', 'DSP / Mixer'],
  'Network Switch': ['IFCCOMMUNICATIONSAPPLIANCE', 'NETWORKAPPLIANCE'],
  'Video Matrix': ['IFCAUDIOVISUALAPPLIANCE', 'SWITCHER'],
  'Stage Box': ['IFCAUDIOVISUALAPPLIANCE', 'USERDEFINED', 'Audio I/O'],
  'Power Amplifier': ['IFCAUDIOVISUALAPPLIANCE', 'AMPLIFIER'],
  'Wireless Mic Rx': ['IFCAUDIOVISUALAPPLIANCE', 'RECEIVER'],
  'Audio Interface': ['IFCAUDIOVISUALAPPLIANCE', 'USERDEFINED', 'Audio I/O'],
  'Test Instrument': ['IFCFLOWINSTRUMENT', 'USERDEFINED', 'Test Instrument'],
  'Source / Player': ['IFCAUDIOVISUALAPPLIANCE', 'PLAYER'],
  'Studio Monitor': ['IFCAUDIOVISUALAPPLIANCE', 'SPEAKER'],
};
const PLAIN = ['IFCDISTRIBUTIONELEMENT', null];   // a custom device, or a kind IFC has no word for

/** The occurrence entity, its predefined type and the USERDEFINED word for a kind. */
export function ifcOfKind(kind) {
  const [entity, predefined, word] = KIND_IFC[str(kind)] || PLAIN;
  return { entity, predefined, word: word || null };
}

/** The IfcDistributionSystemEnum word a signal format reads as. */
export function systemTypeOf(format, name = '') {
  const t = String(format || '').toLowerCase();
  if (/\b(gnd|ground|chassis|earth)\b/i.test(`${name} ${format}`)) return 'EARTHING';
  if (!t) return 'NOTDEFINED';
  if (/power|mains|\bac\b|\bdc\b|\bpoe\b(?!\+)|\bvolt/.test(t) && !/gigabit|ethernet/.test(t)) return 'ELECTRICAL';
  if (/network|ethernet|gigabit|\blan\b|dante|aes67|2110|\bip\b|\bdata\b|cat ?5|cat ?6|fib(er|re)|usb|sfp/.test(t)) return 'DATA';
  if (/speaker|loudspeaker/.test(t)) return 'ELECTROACOUSTIC';
  if (/\brf\b|antenna|coax/.test(t)) return 'COMMUNICATION';
  if (/video|sdi|hdmi|\b(3|6|12)g\b|dvi|displayport|audio|aes|mic|line|analog|madi|adat/.test(t)) return 'AUDIOVISUAL';
  if (/control|rs-?232|rs-?422|rs-?485|gpio|gpi|midi|serial|dmx/.test(t)) return 'CONTROL';
  return 'SIGNAL';
}

/** The transports a network format names (Pset_DistributionPortTypeCable.Protocols); [] when it names none. */
export function protocolsOf(format) {
  const t = String(format || '').toLowerCase();
  const out = [];
  if (/dante/.test(t)) out.push('Dante');
  if (/aes67/.test(t)) out.push('AES67');
  if (/2110/.test(t)) out.push('SMPTE ST 2110');
  if (/\bndi\b/.test(t)) out.push('NDI');
  if (!out.length && /ethernet|gigabit|\blan\b|cat ?5|cat ?6/.test(t)) out.push('Ethernet');
  return out;
}

const TYPE_RULES = [
  [/powercon|\biec\b|\bc1[3-9]\b|\bc2[0-4]\b|power-ac|\bac\b|nema|schuko/, 'ACPLUG'],
  [/power-dc|\bdc\b|barrel/, 'DCPLUG'],
  [/ethercon|\becon\b|rj-?45|rj-modular|8p8c|\blan\b/, 'RJ'],
  [/xlr|\bx\d[sp]\b/, 'XLR'],
  [/bnc|coax|\bvideo\b/, 'COAXIAL'],
  [/\btrs\b|\btt\b|tt-|bantam|1\/4|6\.35|patchbay|jack/, 'TRS'],
  [/hdmi/, 'HDMI'],
  [/usb/, 'USB'],
  [/\bdb-?\d+|d-?sub/, 'DSUB'],
  [/rca|phono/, 'RCA'],
  [/\bdvi/, 'DVI'],
  [/\bdin\b/, 'DIN'],
  [/\brf\b|\bsma\b|antenna/, 'RADIO'],
];

/**
 * A connector → its ISO 16739 port words (Pset_DistributionPortTypeCable), read from the connector and its
 * shared vocabulary entry (abbreviation + group first, the description only when those say nothing).
 * null for a blank (no connector).
 */
export function connectorWords(connector) {
  const c = str(connector).trim();
  if (!c) return null;
  const e = VOCABULARY.connectorFor(c);
  if ((e && e.group === 'Blank') || /^blank/i.test(c)) return null;
  const head = `${c} ${e ? `${e.abbreviation} ${e.group}` : ''}`.toLowerCase();
  const desc = str(e && e.description).toLowerCase();
  const hit = (t) => (TYPE_RULES.find(([re]) => re.test(t)) || [])[1];
  const type = hit(head) || hit(desc) || 'OTHER';
  const d = str(e && e.description);
  const gender = /female|socket|(^|[-\s])f$/i.test(c) || /^SOCKET\s*:/.test(d) ? 'FEMALE'
    : /\bmale\b|plug|(^|[-\s])m$/i.test(c) || /^PLUG\s*:/.test(d) ? 'MALE' : null;
  return { type, gender, subtype: c };
}

const FLOW = { in: 'SINK', out: 'SOURCE', bidi: 'SOURCEANDSINK' };
const DIR = { SINK: 'In', SOURCE: 'Out', SOURCEANDSINK: 'Bidi' };
const MAC_RE = /^[0-9a-f]{2}([:-][0-9a-f]{2}){5}$/i;
const macOf = (s) => (MAC_RE.test(str(s).trim()) ? str(s).trim().toLowerCase().replace(/-/g, ':') : '');

class Writer {
  constructor() { this.entities = []; }
  add(type, ...args) {
    const id = this.entities.length + 1;
    this.entities.push({ id, type, args });
    return ref(id);
  }
}

const stemOf = (name) => String(name || 'block').replace(/\.(ifc|json)$/i, '');

/** The schematic block (toJSON) as IFC4X3_ADD2 STEP text. `name` is the file stem. */
export function blockToIfc(block, { name } = {}) {
  const b = block || {};
  const pins = Array.isArray(b.ports) ? b.ports : [];
  const stem = stemOf(name || b.name);
  const blockId = str(b.id) || stem;
  const W = new Writer();
  const P = ifcGuid('block', blockId);
  const rel = (...roles) => ifcGuid('rel', ...roles);

  // ---- owner, units (mm), context, the spine
  const person = W.add('IFCPERSON', null, 'APK.audio', null, null, null, null, null, null);
  const org = W.add('IFCORGANIZATION', null, 'APK.audio', 'Block editor', null, null);
  const po = W.add('IFCPERSONANDORGANIZATION', person, org, null);
  const app = W.add('IFCAPPLICATION', org, '1', 'APK.audio block editor', 'EDITORS.BlockBuddy');
  const oh = W.add('IFCOWNERHISTORY', po, app, null, null, null, null, null, 0);
  const mm = W.add('IFCSIUNIT', { kind: 'derived' }, enumv('LENGTHUNIT'), enumv('MILLI'), enumv('METRE'));
  const units = W.add('IFCUNITASSIGNMENT', [mm]);
  const origin = W.add('IFCAXIS2PLACEMENT3D', W.add('IFCCARTESIANPOINT', [real(0), real(0), real(0)]), null, null);
  const ctx = W.add('IFCGEOMETRICREPRESENTATIONCONTEXT', null, 'Model', 3, real(1e-5), origin, null);
  const project = W.add('IFCPROJECT', P, oh, str(b.displayName) || str(b.name) || stem, 'Block editor: one device schematic block', null, null, null, [ctx], units);
  const sitePl = W.add('IFCLOCALPLACEMENT', null, origin);
  const buildingPl = W.add('IFCLOCALPLACEMENT', sitePl, origin);
  const storeyPl = W.add('IFCLOCALPLACEMENT', buildingPl, origin);
  const siteGid = ifcGuid('site', P, 'site');
  const buildingGid = ifcGuid('site', P, 'building');
  const storeyGid = ifcGuid('site', P, 'storey');
  const site = W.add('IFCSITE', siteGid, oh, 'Site', null, null, sitePl, null, null, enumv('ELEMENT'), null, null, null, null, null);
  const building = W.add('IFCBUILDING', buildingGid, oh, 'Building', null, null, buildingPl, null, null, enumv('ELEMENT'), null, null, null);
  const storey = W.add('IFCBUILDINGSTOREY', storeyGid, oh, 'Blocks', null, null, storeyPl, null, null, enumv('ELEMENT'), real(0));
  W.add('IFCRELAGGREGATES', rel('aggregates', P), oh, null, null, project, [site]);
  W.add('IFCRELAGGREGATES', rel('aggregates', siteGid), oh, null, null, site, [building]);
  W.add('IFCRELAGGREGATES', rel('aggregates', buildingGid), oh, null, null, building, [storey]);

  const defs = [];
  const prop = (n, v) => (v == null || v === '' ? null : W.add('IFCPROPERTYSINGLEVALUE', n, null, v, null));
  const enumProp = (n, v) => (v ? W.add('IFCPROPERTYENUMERATEDVALUE', n, null, [label(v)], null) : null);
  const listProp = (n, vs) => (vs.length ? W.add('IFCPROPERTYLISTVALUE', n, null, vs, null) : null);
  const pset = (setName, ownerGid, props, owner) => {
    const list = props.filter(Boolean);
    if (!list.length) return null;
    const ps = W.add('IFCPROPERTYSET', ifcGuid('rel', 'pset', ownerGid, setName), oh, setName, null, list);
    if (owner) defs.push([ifcGuid('rel', 'props', ownerGid, setName), owner, ps]);
    return ps;
  };

  // ---- the type: the BIM part, else this block's own
  const { entity, predefined, word } = ifcOfKind(b.kind);
  const partId = str(b.bimId || b.bimRef?.part);
  const typeGid = partId ? ifcGuid('part', partId) : ifcGuid('decl', P, 'type');
  const typeName = [str(b.make), str(b.model)].filter(Boolean).join(' ') || str(b.displayName) || str(b.name) || 'Device';
  const typeSets = [
    pset('Pset_ManufacturerTypeInformation', typeGid, [
      prop('Manufacturer', b.make ? label(b.make) : null),
      prop('ModelReference', b.model ? label(b.model) : null),
    ]),
    partId ? pset('APK_Part', typeGid, [prop('PartId', ident(partId))]) : null,
  ].filter(Boolean);
  const typeArgs = [typeGid, oh, typeName, null, null, typeSets.length ? typeSets : null, null, partId || null, word];
  const type = predefined
    ? W.add(`${entity}TYPE`, ...typeArgs, enumv(predefined))
    : W.add(`${entity}TYPE`, ...typeArgs);
  W.add('IFCRELDECLARES', rel('declares', P), oh, null, null, project, [type]);

  // ---- the device itself
  const id = b.identity || null;
  const mac = macOf(id && id.mac);
  const devGid = mac ? ifcGuid('inst', `mac:${mac}`) : ifcGuid('decl', P, 'device');
  const devPl = W.add('IFCLOCALPLACEMENT', storeyPl, origin);
  const occArgs = [devGid, oh, str(b.name) || stem, b.displayName ? str(b.displayName) : null, word, devPl, null, blockId];
  const dev = predefined ? W.add(entity, ...occArgs, enumv(predefined)) : W.add(entity, ...occArgs);
  W.add('IFCRELDEFINESBYTYPE', rel('type', devGid), oh, null, null, [dev], type);
  W.add('IFCRELCONTAINEDINSPATIALSTRUCTURE', rel('contains', storeyGid), oh, null, null, [dev], storey);
  const ru = /(\d+)\s*U\b/i.exec(str(b.ru));
  if (ru && Number(ru[1]) > 0) pset('APK_AVDevice', devGid, [prop('RackUnits', int(Number(ru[1])))], dev);
  const w = num(b.width);
  const h = num(b.height);
  pset('APK_Block', devGid, [
    prop('Kind', b.kind ? label(b.kind) : null),
    prop('Mount', b.ru ? label(b.ru) : null),
    w != null ? prop('SymbolWidth', typed('IFCREAL', real(w))) : null,
    h != null ? prop('SymbolHeight', typed('IFCREAL', real(h))) : null,
    prop('Source', b.source ? label(b.source) : null),
    prop('ThingId', id && id.id ? ident(id.id) : null),
    prop('BimRef', b.bimRef ? text(JSON.stringify(b.bimRef)) : null),
  ], dev);
  if (mac) pset('APK_Identity', devGid, [prop('IdentityKey', ident(`mac:${mac}`)), prop('MacAddress', ident(mac))], dev);
  if (id && str(id.serial).trim()) pset('Pset_ManufacturerOccurrence', devGid, [prop('SerialNumber', ident(str(id.serial).trim()))], dev);

  // ---- its pins, in block order
  const ports = pins.map((p, i) => {
    const gid = ifcGuid('decl', P, 'port', String(i));
    const words = connectorWords(p.connector);
    const sys = systemTypeOf(p.format, p.label);
    const flow = FLOW[str(p.dir).toLowerCase()] || 'SOURCEANDSINK';
    const port = W.add('IFCDISTRIBUTIONPORT', gid, oh, str(p.label) || str(p.id) || `P${i + 1}`, p.format ? str(p.format) : null, null, null, null,
      enumv(flow), enumv(words ? 'CABLE' : 'NOTDEFINED'), enumv(sys));
    pset('Pset_DistributionPortCommon', gid, [prop('PortNumber', int(i + 1))], port);
    if (words) {
      pset('Pset_DistributionPortTypeCable', gid, [
        enumProp('ElectricalConnectionType', words.type),
        prop('ConnectionSubtype', label(words.subtype)),
        enumProp('ConnectionGender', words.gender || 'NOTKNOWN'),
        listProp('Protocols', sys === 'DATA' ? protocolsOf(p.format).map(ident) : []),
      ], port);
    }
    pset('APK_Terminal', gid, [
      prop('TerminalId', p.id ? ident(p.id) : null),
      prop('Connector', p.connector ? label(p.connector) : null),
      prop('SymbolSide', p.side ? label(p.side) : null),
      prop('SymbolColour', p.color ? label(p.color) : null),
    ], port);
    return port;
  });
  if (ports.length) W.add('IFCRELNESTS', rel('nests', devGid), oh, null, null, dev, ports);
  for (const [g, owner, ps] of defs) W.add('IFCRELDEFINESBYPROPERTIES', g, oh, null, null, [owner], ps);

  return writeStep({
    header: [
      { type: 'FILE_DESCRIPTION', args: [['ViewDefinition [ReferenceView]'], '2;1'] },
      { type: 'FILE_NAME', args: [`${stem}.ifc`, STAMP, ['APK.audio'], ['APK.audio'], 'APK.audio block editor', 'EDITORS.BlockBuddy', ''] },
      { type: 'FILE_SCHEMA', args: [[BLOCK_IFC_SCHEMA]] },
    ],
    entities: W.entities,
  });
}

/* ───────────────────────── reading it back ───────────────────────── */

/** The schema an .ifc text declares (FILE_SCHEMA), '' when none. */
export function schemaOf(t) {
  const m = /FILE_SCHEMA\s*\(\s*\(\s*'([^']+)'/i.exec(String(t || ''));
  return m ? m[1] : '';
}

/** Is this text an ISO 10303-21 file (an .ifc)? */
export const isIfcText = (t) => /^\s*ISO-10303-21\s*;/.test(String(t || ''));

/**
 * An IFC model → the schematic block. The device is the element carrying APK_Block, else the first
 * element with ports nested on it; throws a sentence when the file holds none.
 */
export function blockFromIfc(t) {
  const file = parseStep(String(t));
  const get = (v) => (isRef(v) ? file.byId.get(v.id) : undefined);
  const hosts = new Set(entitiesByType(file, 'IFCRELNESTS').map((r) => r.args[4]).filter(isRef).map((v) => v.id));
  const elements = file.entities.filter((e) => e.args.length >= 8 && hosts.has(e.id) && /^IFC/.test(e.type) && !/TYPE$/.test(e.type));
  const dev = elements.find((e) => getPsets(file, e).APK_Block) || elements.find((e) => portsOfEntity(file, e).length);
  if (!dev) throw new TypeError('no device in this IFC: no element has ports nested on it');
  let type = null;
  for (const r of entitiesByType(file, 'IFCRELDEFINESBYTYPE')) {
    if ((r.args[4] || []).some((x) => isRef(x) && x.id === dev.id)) type = get(r.args[5]);
  }
  const ps = getPsets(file, dev);
  const info = ps.APK_Block || {};
  const maker = ps.Pset_ManufacturerTypeInformation || {};
  const partId = str(ps.APK_Part?.PartId);
  const name = str(dev.args[2]);
  const pins = portsOfEntity(file, dev).map((port, i) => {
    const pp = getPsets(file, port);
    const term = pp.APK_Terminal || {};
    const out = {
      id: str(term.TerminalId) || `P_${i + 1}`,
      label: str(port.args[2]),
      side: str(term.SymbolSide) || 'left',
      dir: DIR[port.args[7]?.value] || 'Bidi',
      format: str(port.args[3]),
      connector: str(term.Connector) || str(pp.Pset_DistributionPortTypeCable?.ConnectionSubtype) || 'Blank',
    };
    if (term.SymbolColour) out.color = str(term.SymbolColour);
    return { out, n: num(pp.Pset_DistributionPortCommon?.PortNumber) ?? i + 1 };
  }).sort((a, z) => a.n - z.n).map((x) => x.out);
  const kind = str(info.Kind) || (dev.type === 'IFCDISTRIBUTIONELEMENT' ? 'Custom Device'
    : Object.keys(KIND_IFC).find((k) => KIND_IFC[k][0] === dev.type && KIND_IFC[k][1] === dev.args[8]?.value) || 'Custom Device');
  const block = {
    type: 'schematic_block',
    id: str(dev.args[7]) || `dev_${name}`,
    name,
    displayName: str(dev.args[3]) || name,
    make: str(maker.Manufacturer),
    model: str(maker.ModelReference),
    kind,
    ru: str(info.Mount),
    width: num(info.SymbolWidth) ?? 280,
    height: num(info.SymbolHeight) ?? 180,
    source: str(info.Source) || 'custom',
    ports: pins,
  };
  const ident0 = ps.APK_Identity || {};
  const serial = str(ps.Pset_ManufacturerOccurrence?.SerialNumber);
  if (info.ThingId || ident0.MacAddress || serial) block.identity = { id: str(info.ThingId), mac: str(ident0.MacAddress), serial };
  if (partId) block.bimId = partId;
  if (info.BimRef) { try { block.bimRef = JSON.parse(str(info.BimRef)); } catch (_) { /* not JSON: no reference */ } }
  if (type && !block.make && !block.model) block.model = str(type.args[2]);
  return block;
}
