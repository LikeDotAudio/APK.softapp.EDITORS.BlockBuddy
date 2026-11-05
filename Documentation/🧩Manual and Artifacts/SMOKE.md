# Smoke test — EDITORS.BlockBuddy

Is `EDITORS.BlockBuddy` deployed? Written by `.apk.scripts/smoke.py` from the module's own shape; what each check means is in that script's header.

← [Wiki home](../README.md)

**✅ PASS** — 3/3 checks, since 2026-11-04 21:31 EST

| Check | Target | Result | Detail |
|---|---|---|---|
| pushed | [APK.softapp.EDITORS.BlockBuddy](https://github.com/LikeDotAudio/APK.softapp.EDITORS.BlockBuddy.git) | ✅ | HEAD is on origin |
| web | [index.html](https://apk.audio/APK%3ASoftapps/EDITORS/EDITORS.BlockBuddy/index.html) | ✅ | HTTP 200 |
| app | `OS/Block Buddy` → `PODS/POD.THIN/Softapps/EDITORS/EDITORS.BlockBuddy/index.html` | ✅ | present |

Re-run: `python3 .apk.scripts/smoke.py PODS/POD.THIN/Softapps/EDITORS/EDITORS.BlockBuddy`

<!-- smoke:sig 00e19a6d02f8 since 2026-11-04 21:31 EST -->
