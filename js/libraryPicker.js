// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
/* 📚 Library — every device type is one part in the BIM library
   (DATABASE.server.BIM, /api/bim), so Block Buddy keeps no device list of its
   own (ROAD-3501). The button is the library's shared picker, served by the
   gateway at /api/bim/ui/picker.js (the one BOM and Acoustic use). A host with
   no library (a standalone copy) says so on screen, where the button would
   be — never a hard-coded list in its place. */

export const PICKER_URL = '/api/bim/ui/picker.js';

/**
 * Put the library button before `anchor`; `onPick(part)` gets each part
 * picked. Resolves { ok: true, button } or { ok: false, notice, reason }.
 * `load` and `doc` are seams for the tests.
 */
export async function mountLibraryButton(anchor, onPick, {
  load = () => import(PICKER_URL),
  doc = globalThis.document,
  title = 'Add a device from the BIM library as a block',
} = {}) {
  if (!anchor) return { ok: false, reason: 'no place for the button' };
  let lib;
  try {
    lib = await load();
    if (!lib || typeof lib.libraryButton !== 'function') throw new Error(`${PICKER_URL} has no libraryButton`);
  } catch (err) {
    const reason = (err && err.message) || String(err);
    const notice = doc.createElement('span');
    notice.className = 'window-pill-category bim-library-absent';
    notice.setAttribute('role', 'status');
    notice.setAttribute('data-apk-state', 'dead');
    notice.title = reason;
    // textContent only: the reason is whatever the failure said, never markup.
    notice.textContent = '📚 No BIM library on this host (/api/bim did not answer): devices come from Open, Ingest and Discovered.';
    anchor.before(notice);
    return { ok: false, notice, reason };
  }
  const button = lib.libraryButton({ title }, onPick);
  anchor.before(button);
  return { ok: true, button };
}
