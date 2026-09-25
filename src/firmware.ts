import { OPTIONS, nonDefault, type OptionKey, type Options } from "./options";

export type Firmware = "qmk" | "zmk";

export interface Snippet {
  title: string;
  text: string;
}

export const FIRMWARE_INFO: Record<Firmware, { name: string; workflowUrl: string; readmeUrl: string }> = {
  qmk: {
    name: "QMK",
    workflowUrl: "https://github.com/manna-harbour/miryoku_qmk/tree/miryoku/users/manna-harbour_miryoku#workflow-builds",
    readmeUrl: "https://github.com/manna-harbour/miryoku_qmk/tree/miryoku/users/manna-harbour_miryoku",
  },
  zmk: {
    name: "ZMK",
    workflowUrl: "https://github.com/manna-harbour/miryoku_zmk#workflow-builds",
    readmeUrl: "https://github.com/manna-harbour/miryoku_zmk",
  },
};

const lower = (v: string) => v.toLowerCase();

// Syntax verified against the upstream READMEs:
// QMK: MIRYOKU_OPTION=VALUE for make/qmk/custom_rules.mk; the workflow has alphas/nav/clipboard/layers inputs,
//      and extra/tap have to go through its `rules` input.
// ZMK: #define MIRYOKU_OPTION_VALUE in miryoku/custom_config.h; the workflow has an input per option.
export function snippets(fw: Firmware, o: Options): Snippet[] {
  const changed = nonDefault(o);
  if (!changed.length) return [];
  const pair = (k: OptionKey) => `${OPTIONS[k].name}=${o[k]}`;
  const input = (k: OptionKey) => `  ${k}: '["${lower(o[k])}"]'`;

  if (fw === "zmk") {
    return [
      {
        title: "miryoku/custom_config.h (local builds and workflow builds)",
        text: changed.map((k) => `#define ${OPTIONS[k].name}_${o[k]}`).join("\n"),
      },
      {
        title: "Build workflow inputs (fill in your board and shield)",
        text: ["with:", `  board: '["<board>"]'`, `  shield: '["<shield>"]'`, ...changed.map(input)].join("\n"),
      },
    ];
  }

  const viaInput = changed.filter((k) => k !== "extra" && k !== "tap");
  const viaRules = changed.filter((k) => k === "extra" || k === "tap");
  return [
    {
      title: "custom_rules.mk",
      text: changed.map(pair).join("\n"),
    },
    {
      title: "Build command",
      text: ["qmk compile -c -kb <keyboard> -km manna-harbour_miryoku", ...changed.map((k) => `  -e ${pair(k)}`)].join(" \\\n"),
    },
    {
      title: "Build workflow inputs (fill in your keyboard)",
      text: [
        "with:",
        `  keyboard: '["<keyboard>"]'`,
        ...viaInput.map(input),
        ...(viaRules.length ? [`  rules: '${viaRules.map(pair).join("\\n")}'`] : []),
      ].join("\n"),
    },
  ];
}
