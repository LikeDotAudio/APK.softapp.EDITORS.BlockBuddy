# 🧩 EDITORS.BlockBuddy — Block & Symbol Editor

Defines a device's schematic block: pins with side, direction, format and connector, drawn as a symbol.

**No device ships in the source.** On open it loads the bench's online devices from the BIM library
(`/api/bim/instances` → each part, every terminal a pin: inputs left, outputs and two-way right, control on top,
power at the bottom — `js/bimPart.js`); **📚 Library** adds any other part as a block. A group of N ports is N
pins (capped at 32, the remainder named on the last). Tests: `node --test tests/*.test.mjs` (the thirteen
devices it used to ship are a fixture, `tests/fixtures/builtinDevices.mjs`).

**Save** returns the block to the CAD; standalone it is **Save Model** — the block's `.json` and its IFC4X3_ADD2 `.ifc`
twin (`js/blockIfc.js`: one occurrence typed by its BIM part, every pin an `IfcDistributionPort`); **Open** reads either.

<!-- wiki:smoke -->
**Smoke test** — ❌ FAIL 2/3 since 2026-11-12 00:16 EST — [results](Documentation/%F0%9F%A7%A9Manual%20and%20Artifacts/SMOKE.md)
<!-- /wiki:smoke -->
