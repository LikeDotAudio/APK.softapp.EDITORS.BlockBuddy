# 🧩 EDITORS.BlockBuddy — Block & Symbol Editor

Defines a device's schematic block: pins with side, direction, format and connector, drawn as a symbol.

**No device ships in the source.** On open it loads the bench's online devices from the BIM library
(`/api/bim/instances` → each part, every terminal a pin: inputs left, outputs and two-way right, control on top,
power at the bottom — `js/bimPart.js`); **📚 Library** adds any other part as a block. A group of N ports is N
pins (capped at 32, the remainder named on the last). Tests: `node --test tests/*.test.mjs` (the thirteen
devices it used to ship are a fixture, `tests/fixtures/builtinDevices.mjs`).
