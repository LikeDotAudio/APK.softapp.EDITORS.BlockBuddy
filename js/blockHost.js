// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
// The schematic block in and out of the CAD over cad.like.audio/host@1, through
// the vendored APKSoftapp client (vendor/apk-softapp/), and a discovered thing
// off the bus (APKSoftapp.discovered) as a device to draw. No DOM here: the
// tests drive it.

export const EDITOR = 'Block Buddy';
export const BLOCK_TYPE = 'schematic_block';

/** What a discovered device's one known port is: it was seen on the network, nothing more is known. */
export const NETWORK_FORMAT = 'Ethernet / IP';

export function saveMeta(block) {
  const name = String(block.name || 'block');
  return {
    blockName: name,
    title: `${block.displayName || name} (${(block.ports || []).length} Ports)`,
    filename: `block_${name.toLowerCase()}`,
  };
}

/**
 * One host@1 link. onLoad(block, meta) takes the CAD's block; current() returns
 * the block Save sends (the CAD's toEditor.request asks for it too).
 */
export function connectBlockHost(S, { onLoad, current, notice } = {}) {
  return S.connectHost({
    editor: EDITOR,
    blockType: BLOCK_TYPE,
    notice,
    onLoad: (block, meta) => { if (onLoad) onLoad(block, meta); },
    onRequest: () => {
      const block = current();
      return { block, meta: saveMeta(block) };
    },
  });
}

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

/**
 * A discovered thing as a device. Identity is the thing's id (MAC, else serial,
 * else agent — never an IP). Only what the bus said goes in: vendor, model, its
 * category when one of its kinds names one, and a single network port, because
 * being seen on the network is all that is known about its connectors.
 */
export function deviceFromThing(thing, categories = []) {
  if (!thing || !thing.id) return null;
  const kinds = (thing.kinds || []).map((k) => String(k).toLowerCase());
  const kind = categories.find((c) => kinds.includes(String(c).toLowerCase())) || 'Custom Device';
  const display = thing.name || thing.model || thing.mac || thing.serial || thing.id;
  return {
    id: `dev_disc_${slug(thing.id)}`,
    name: String(display).replace(/[^A-Za-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').toUpperCase() || 'DISCOVERED',
    displayName: String(display),
    make: thing.vendor || 'Unknown vendor',
    model: thing.model || 'Unknown model',
    kind,
    ru: 'Discovered',
    width: 280,
    height: 180,
    source: 'discovered',
    identity: { id: thing.id, mac: thing.mac || '', serial: thing.serial || '' },
    live: thing.live || { state: 'dead', why: 'never verified' },
    protocols: thing.protocols || [],
    ports: [{
      id: 'NET',
      label: thing.mac || thing.serial || 'network',
      side: 'top',
      dir: 'Bidi',
      format: NETWORK_FORMAT,
      connector: 'Blank',
    }],
  };
}

/**
 * Fold a fresh discovery list into the device list: new things are added at the
 * top, known ones only get their live state and protocols (the user's edits to
 * their ports stay). Returns the number added.
 */
export function mergeDiscovered(devices, things, categories = []) {
  let added = 0;
  for (const t of things || []) {
    const dev = deviceFromThing(t, categories);
    if (!dev) continue;
    const known = devices.find((d) => d.id === dev.id);
    if (known) {
      known.live = dev.live;
      known.protocols = dev.protocols;
    } else {
      devices.unshift(dev);
      added++;
    }
  }
  return added;
}
