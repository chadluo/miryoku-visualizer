import type { BaseView } from "./keymap";
import { OPTIONS, appliedOptions, ignoredOptions, type Firmware, type OptionKey, type Options } from "./options";

export interface Snippet {
  title: string;
  text: string;
}

export interface Note {
  kind: "warning" | "info";
  text: string;
}

const QMK = "https://github.com/manna-harbour/miryoku_qmk";
const QMK_README = `${QMK}/tree/miryoku/users/manna-harbour_miryoku`;
const ZMK = "https://github.com/manna-harbour/miryoku_zmk";

export const FIRMWARE_LINKS: Record<Firmware, { label: string; url: string }[]> = {
  QMK: [
    { label: "Local builds", url: `${QMK_README}#local-builds` },
    { label: "Workflow builds", url: `${QMK_README}#workflow-builds` },
    { label: "Build Inputs workflow file", url: `${QMK}/blob/miryoku/.github/workflows/build-inputs.yml` },
  ],
  ZMK: [
    { label: "Config file", url: `${ZMK}#config-file` },
    { label: "Workflow builds", url: `${ZMK}#workflow-builds` },
    { label: "Build Inputs workflow file", url: `${ZMK}/blob/master/.github/workflows/build-inputs.yml` },
  ],
};

// Syntax verified against the upstream READMEs and workflow files:
// QMK: MIRYOKU_OPTION=VALUE for make/qmk/custom_rules.mk. The workflow has alphas/nav/clipboard/layers inputs, and
//      extra/tap have to go through its `rules` input. Every workflow input is a JSON array of strings.
// ZMK: #define MIRYOKU_OPTION_VALUE in miryoku/custom_config.h. The workflow has an input per option.
export function snippets(o: Options): Snippet[] {
  const applied = appliedOptions(o);
  if (!applied.length) return [];
  const pair = (k: OptionKey) => `${OPTIONS[k].name}=${o[k]}`;
  const input = (k: OptionKey) => `  ${k}: '["${o[k].toLowerCase()}"]'`;

  if (o.firmware === "ZMK") {
    return [
      {
        title: "miryoku/custom_config.h (local builds and workflow builds)",
        text: applied.map((k) => `#define ${OPTIONS[k].name}_${o[k]}`).join("\n"),
      },
      {
        title: "Build workflow inputs (fill in your board and shield)",
        text: ["with:", `  board: '["<board>"]'`, `  shield: '["<shield>"]'`, ...applied.map(input)].join("\n"),
      },
    ];
  }

  const viaInput = applied.filter((k) => k !== "extra" && k !== "tap");
  const viaRules = applied.filter((k) => k === "extra" || k === "tap");
  return [
    {
      title: "custom_rules.mk",
      text: applied.map(pair).join("\n"),
    },
    {
      title: "Build command",
      text: ["qmk compile -c -kb <keyboard> -km manna-harbour_miryoku", ...applied.map((k) => `  -e ${pair(k)}`)].join(" \\\n"),
    },
    {
      title: "Build workflow inputs (fill in your keyboard)",
      text: [
        "with:",
        `  keyboard: '["<keyboard>"]'`,
        ...viaInput.map(input),
        ...(viaRules.length ? [`  rules: '["${viaRules.map(pair).join("\\n")}"]'`] : []),
      ].join("\n"),
    },
  ];
}

/** What a user needs to know about the selected options for the selected firmware. */
export function notes(o: Options, view: BaseView): Note[] {
  const fw = o.firmware as Firmware;
  const out: Note[] = [];
  if (ignoredOptions(o).includes("nav"))
    out.push({
      kind: "warning",
      text: `MIRYOKU_NAV=VI has no effect with MIRYOKU_LAYERS=FLIP. ${fw} has no vi-style Nav for flipped layers and builds the default flipped Nav, which is what the keyboard shows. The option is left out of the config below.`,
    });
  if (fw === "QMK" && (o.extra !== OPTIONS.extra.default || o.tap !== OPTIONS.tap.default))
    out.push({
      kind: "info",
      text: "The QMK build workflow has no extra or tap input, so the workflow snippet passes MIRYOKU_EXTRA and MIRYOKU_TAP through the rules input.",
    });
  if (view === "tap")
    out.push({ kind: "info", text: "Returning from the Tap layer needs a reset or a custom keybinding." });
  if (o.clipboard === "DEFAULT")
    out.push({ kind: "info", text: "Undo and Redo use Fun Cluster keycodes, which most applications need rebound." });
  if (o.clipboard === "FUN")
    out.push({ kind: "info", text: "All clipboard keys use Fun Cluster keycodes, which most applications need rebound." });
  out.push({
    kind: "info",
    text:
      fw === "ZMK"
        ? "The Media layer shown is the ZMK one: it has RGB, external power, output and Bluetooth profile keys. What works depends on your keyboard."
        : "The Media layer shown is the QMK one: it has RGB and output-auto keys. Bluetooth and external power keys exist only in ZMK. What works depends on your keyboard.",
  });
  return out;
}
