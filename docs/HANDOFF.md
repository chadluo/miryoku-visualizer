# Handoff: Miryoku Visualizer web app

Source brief: [INITIATIVE.md](INITIATIVE.md). Glossary: [../CONTEXT.md](../CONTEXT.md). Use its terms.

## Goal

A static web app that shows the Miryoku 36-key layout for the selected compile options, lets the user highlight
one layer, and shows how to apply the options in QMK or ZMK.

## Done when

1. `npm run build` gives a static site, and a GitHub Actions workflow deploys it to GitHub Pages.
2. The keyboard shows 36 keys. Each key has Base plus 3 layer labels in corners, a hold behavior on the bottom edge,
   and a Button label in the center.
3. A change to any compile option updates the keyboard and the firmware panel at once, and also updates the URL.
4. When you open a shared URL, the app shows the same options.
5. A layer button toggles the highlight for its layer. When you press and hold a thumb key, the app highlights that
   key's layer until you release it (pointer events, so mouse and touch both work).
6. The highlight does not change the layout, font size or font weight. Only color and background change.
7. The firmware panel shows the config text and the build command for QMK and ZMK, with a copy button for each.
8. `npm test` passes. It includes the invariant tests below.
9. You checked each point above manually in a browser, in light and dark mode, at desktop width and at phone width.

## Decisions

| Area | Decision |
| --- | --- |
| Stack | Vite, React, TypeScript. The SVG is written in JSX. Do not add a keyboard, chart, state or CSS library. |
| Data | We write the layer data by hand in TS, copied from upstream. Each data file has a link to its upstream source. Do not parse the upstream files. |
| Geometry | The Miryoku 36-key core only: 3×5 keys per hand plus 3 thumb keys per hand. Do not add other keyboard mappings. |
| Options | `MIRYOKU_ALPHAS` (all upstream values), `MIRYOKU_EXTRA`, `MIRYOKU_TAP`, `MIRYOKU_NAV`, `MIRYOKU_CLIPBOARD`, `MIRYOKU_LAYERS` (`FLIP`). Do not add `KLUDGE` options or keyboard mappings. |
| State | Keep the options in the URL query string (`URLSearchParams`, `history.replaceState`). Leave out default values. Do not use localStorage or a store library. |
| Labels | Use symbols and short names (`⌫`, `←`, `Vol+`, `⌘C`). Show the keycode in a tooltip (SVG `<title>`). `CLIPBOARD=MAC` changes the clipboard labels. |
| Theme | Colors are CSS variables. Follow `prefers-color-scheme`. Do not add a theme toggle. |
| Hosting | GitHub Pages, deployed by a GitHub Actions workflow. The app has no backend. |

## Key label positions

Each key has fixed positions, with the same geometry for all keys:

```text
┌─────────────────────────┐
│ Base       Middle-thumb │   Middle thumb: Nav (right-hand keys) / Num (left-hand keys)
│          Button         │   Button layer, center
│ Outer-thumb Inner-thumb │   Outer: Media / Fun    Inner: Mouse / Sym
│      Hold behavior      │   bottom edge: Shift/Ctrl/Alt/GUI or the layer name on thumb keys
└─────────────────────────┘
```

- The layer pairs follow the thumb position: Nav↔Num (middle), Mouse↔Sym (inner), Media↔Fun (outer). A key shows
  the layers that the thumb keys of the other hand activate. With `FLIP`, the hands swap, but a pair keeps its corner.
- Base uses the primary color. Each of the other 7 layers has its own accent color. The corner position and the
  layer button use the same color.
- An empty position (a transparent or unused key) shows nothing. Do not show a placeholder.

## Highlight

- The highlighted layer's labels get a stronger color and/or a background tint. All other labels are dimmed.
- The layout, font size and font weight do not change.
- The held thumb key shows a pressed state.
- Only one layer can be highlighted at a time. The thumb-key hold has priority over the button toggle. When you
  release the thumb key, the toggled layer shows again.

## Firmware panel

For each firmware, show:

- **QMK**: the lines to put in `config.h` or `rules.mk` (`MIRYOKU_ALPHAS=QWERTY` etc.), the build command
  (`qmk compile -c -kb <keyboard> -km manna-harbour_miryoku -e MIRYOKU_ALPHAS=QWERTY ...`), and a link to the upstream
  GitHub Actions workflow.
- **ZMK**: the `#define` lines for the `miryoku_zmk` config (`#define MIRYOKU_ALPHAS_QWERTY` etc.), and a link to the
  upstream GitHub Actions workflow and its inputs.
- Include only the options that are not the default. If all options are the default, show a line that says so.

Before you write this text, verify the exact syntax against the upstream README of each repo. The syntax above is
from memory.

## Suggested structure

Keep the number of files small. A starting point:

```text
src/
  data/layers.ts      layer data for each option value (Base per ALPHAS, Nav per NAV, etc.)
  keymap.ts           options → 36 keys × layer labels; applies FLIP and CLIPBOARD
  firmware.ts         options → QMK/ZMK text
  options.ts          option definitions, defaults, URL read/write
  App.tsx             options form, layer buttons, firmware panel
  Keyboard.tsx        SVG keyboard and highlight state
  keymap.test.ts
```

Use native `<select>` and `<button>` elements for the controls.

## Tests (Vitest)

Test only the invariants:

- For each combination of option values, each layer has exactly 36 keys.
- `FLIP` mirrors the layers between the hands.
- For each firmware, the config text contains each option that is not the default, and no option that is the default.

Do not write UI tests or snapshot tests. Check the UI manually (see "Done when", item 9).

## Upstream sources

- Reference manual (layer tables, option values):
  <https://github.com/manna-harbour/miryoku/blob/master/docs/reference/readme.org>
- QMK implementation: <https://github.com/manna-harbour/miryoku_qmk/tree/miryoku/users/manna-harbour_miryoku>
- ZMK implementation: <https://github.com/manna-harbour/miryoku_zmk>
- Upstream layer definitions (use these to check the data): the `miryoku_babel` directory in the Miryoku repos.

## Out of scope for v1

Keyboard mappings beyond the 36-key core, `KLUDGE` options, parsing the upstream files, a theme toggle, and
localStorage.
