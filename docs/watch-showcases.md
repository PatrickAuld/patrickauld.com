# Watch showcases

The narrative is edited in `_posts/watches.md`. Insert a standalone comment where a watch should appear:

```html
<!-- watch-showcase {"face":"sundial-ii","mode":"day","time":"06:00","speed":1440} -->
```

```html
<!-- watch-showcase {"face":"radial-moire","mode":"live","cycleThemes":true,"themeInterval":8} -->
```

```html
<!-- watch-showcase {"face":"crosshatch","mode":"fixed","time":"10:25"} -->
```

| Option | Meaning | Default |
| --- | --- | --- |
| `face` | Directory name in `public/watches/faces/` | Required |
| `mode` | `live`, `fixed`, or `day` | `live` |
| `time` | Initial simulated time, `HH:MM` or `HH:MM:SS` | `10:10` |
| `speed` | Simulated seconds per real second in day playback | `1440` |
| `cycleThemes` | Rotate the configured themes independently of time | `false` |
| `themeInterval` | Real seconds between theme changes, at least 2 | `8` |
| `timeZone` | IANA time zone for the dial and controls | `America/Los_Angeles` |

The showcases have no visitor controls. Configure their behavior here in the Markdown. A normal 24-hour day plays in 60 seconds at `speed: 1440`; Sundial starts at 06:00 and loops through the day. `live` follows the current instant, while `fixed` keeps the selected time. The date is today's date in the configured zone; daylight-saving days retain their actual length.

Moiré uses `cycleThemes: true` and `themeInterval: 8`. Change the interval to your chosen number of real seconds. Its title identifies the selected theme, and a caption makes clear that these are theme changes, separate from the face's own motion. The surrounding stage and bezel follow each theme.

SplitFlap's wake animation can be scheduled independently of its clock:

```html
<!-- watch-showcase {"face":"split-flap","mode":"fixed","time":"10:08:30","wakeDelay":1,"wakeInterval":8} -->
```

`wakeDelay` specifies seconds after the ready showcase enters the viewport; `wakeInterval` specifies seconds between subsequent triggers (at least 2). Omit `wakeInterval` to play once after the delay. Omit both to show the settled face. The animation fires the XML's `ON_VISIBLE` controller and plays at normal speed, landing on the chosen time. The manifest's `wakeAnimationMs` sets its playback window; overlapping intervals are clamped to that window plus 100 ms. Leaving the viewport or hiding the tab clears the schedule; entering again starts it afresh.

Reduced-motion preferences show still watches and disable automatic theme rotation and wake playback. Canvases and timers stop while offscreen or while the tab is hidden. Previews and renderer code load only when a showcase approaches the viewport. Poster images remain available if the simulation fails.

## Local snapshots

This site serves all XML, assets, and renderer code locally. There are no runtime GitHub requests or coordinated deployments.

The three initial faces were copied from `PatrickAuld/watches` commit `2b051024fbc6a3440d905682e09c1bfa0be4d1ca`. Each directory contains:

- `watchface.xml`: the face definition.
- `assets/`: image resources referenced by that XML, retaining their original filenames.
- `manifest.json`: display name, resource-name-to-filename map, localized strings, and an ordered theme list.

Each theme specifies `id`, `label`, `configuration` (WFF setting IDs to option IDs), `background`, and `bezel` (CSS colors). Edit the manifest to curate the order or surrounding colors. This can showcase combinations of geometry and palette, rather than merely changing the bezel while leaving the face unchanged.

To add another face, copy its XML, referenced assets, manifest, and a poster at `public/watches/<face>.webp`, then insert a showcase comment. To update an existing face, replace its snapshot and check that manifest option IDs still match its XML. The Android release process is separate. SplitFlap includes lossless frame atlases and per-frame timing alongside its original animated WebP files, so browsers without `ImageDecoder` can play the same animation.

## Verification

Run `npm run build`, then `npm run test:e2e -- e2e/watches.spec.ts` with the repository's configured Yarn runtime available. The tests cover Pacific time and daylight-saving boundaries, authored day playback, automatic theme rotation, repeated SplitFlap playback with native decoding and its frame-atlas fallback, mobile width, and reduced motion.
