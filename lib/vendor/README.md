# WFF renderer

`wff-web.js` and its declaration file are the compiled ESM build of `PatrickAuld/wff_web` commit `ebd8383b624d9548da0d6ededdfce9f0450922f6` (package version 0.2.0). The ISC license is included in `WFF-LICENSE`.

One local correction in `applyAttributes` preserves WFF's implicit base values when returning from an ambient Variant: alpha defaults to 255, scaleX/scaleY to 1, and other numeric targets to 0. Without this, faces with an ambient alpha Variant but no explicit normal alpha disappear in the normal display.

The React showcase dynamically imports this module, loads the local XML/assets, and calls `renderWatchFace` once, followed by serialized `update` calls with explicit time, animation elapsed time, time zone, and configuration. Both epoch and civil-time sources follow the same simulated clock.
