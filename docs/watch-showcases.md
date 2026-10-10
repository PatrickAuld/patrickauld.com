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

A normal 24-hour day plays in 60 seconds at 1440×. The selected date is today's date in the configured zone; visitors can change it to explore the Sun in different seasons. Daylight-saving days retain their actual length. Scrubbing or setting a time freezes both the dial and its animations. In day playback, Play resumes from the chosen point. Fixed time stays still until the visitor chooses another clock mode. Current time returns to the actual instant.

Theme rotation changes the title, XML configuration, surrounding background, and bezel. Its interval uses real time, independent of accelerated playback. Manually choosing a theme stops rotation. Visitors can also select ambient display.

Reduced-motion preferences disable automatic playback and theme rotation initially. Visitors can explicitly enable either. Canvases and theme timers stop rendering while offscreen or while the tab is hidden. Previews and the renderer load only when a showcase approaches the viewport. Poster images remain available if the interactive preview fails.

## Local snapshots

This site serves all XML, assets, and renderer code locally. There are no runtime GitHub requests or coordinated deployments.

The three initial faces were copied from `PatrickAuld/watches` commit `2b051024fbc6a3440d905682e09c1bfa0be4d1ca`. Each directory contains:

- `watchface.xml`: the face definition.
- `assets/`: image resources referenced by that XML, retaining their original filenames.
- `manifest.json`: display name, resource-name-to-filename map, localized strings, and an ordered theme list.

Each theme specifies `id`, `label`, `configuration` (WFF setting IDs to option IDs), `background`, and `bezel` (CSS colors). Edit the manifest to curate the order or surrounding colors. This can showcase combinations of geometry and palette, rather than merely changing the bezel while leaving the face unchanged.

To add another face, copy its XML, referenced assets, manifest, and a poster at `public/watches/<face>.webp`, then insert a showcase comment. To update an existing face, replace its snapshot and check that manifest option IDs still match its XML. The Android release process is separate.

## Verification

Run `npm run build`, then `npm run test:e2e -- e2e/watches.spec.ts` with the repository's configured Yarn runtime available. The tests cover Pacific time and daylight-saving boundaries, Sun-dependent rendering, scrubbing and resume, independent theme rotation, mobile width, and reduced motion.
