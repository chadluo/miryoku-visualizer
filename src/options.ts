// Compile options from the Miryoku reference manual:
// https://github.com/manna-harbour/miryoku/blob/master/docs/reference/readme.org
// BEAKL15 is also accepted by upstream QMK/ZMK but is not in the manual.

export const ALPHAS = [
  "AZERTY", "BEAKL15", "COLEMAK", "COLEMAKDH", "COLEMAKDHK", "DVORAK", "HALMAK", "QWERTY", "QWERTZ", "WORKMAN",
] as const;

export const OPTIONS = {
  // View settings: they change what the app shows, not what the firmware is built with.
  firmware: { name: "Firmware", default: "QMK", values: ["QMK", "ZMK"] },
  labels: { name: "Key labels", default: "SYMBOLS", values: ["SYMBOLS", "TEXT"] },
  // Miryoku compile options.
  alphas: { name: "MIRYOKU_ALPHAS", default: "COLEMAKDH", values: ALPHAS },
  extra: { name: "MIRYOKU_EXTRA", default: "QWERTY", values: ALPHAS },
  tap: { name: "MIRYOKU_TAP", default: "COLEMAKDH", values: ALPHAS },
  nav: { name: "MIRYOKU_NAV", default: "DEFAULT", values: ["DEFAULT", "VI", "INVERTEDT"] },
  clipboard: { name: "MIRYOKU_CLIPBOARD", default: "DEFAULT", values: ["DEFAULT", "FUN", "MAC", "WIN"] },
  layers: { name: "MIRYOKU_LAYERS", default: "DEFAULT", values: ["DEFAULT", "FLIP"] },
} as const;

export type OptionKey = keyof typeof OPTIONS;
export type Options = Record<OptionKey, string>;
export type Firmware = "QMK" | "ZMK";

export const OPTION_KEYS = Object.keys(OPTIONS) as OptionKey[];
export const MIRYOKU_KEYS = OPTION_KEYS.filter((k) => OPTIONS[k].name.startsWith("MIRYOKU_"));
export const VIEW_KEYS = OPTION_KEYS.filter((k) => !MIRYOKU_KEYS.includes(k));

export const DEFAULTS = Object.fromEntries(OPTION_KEYS.map((k) => [k, OPTIONS[k].default])) as Options;

/**
 * Miryoku options the firmware accepts but ignores. QMK and ZMK both select the layers with
 * `MIRYOKU_LAYERS_FLIP` first, and there is no vi-style flipped Nav, so VI falls through to the
 * default flipped Nav (miryoku_babel/miryoku_layer_selection.h in both repos).
 */
export const ignoredOptions = (o: Options): OptionKey[] => (o.layers === "FLIP" && o.nav === "VI" ? ["nav"] : []);

/** Keeps only known keys with known values, so stale or hand-edited input can never break the app. */
export function sanitize(input: Partial<Record<string, unknown>>): Options {
  const o = { ...DEFAULTS };
  for (const k of OPTION_KEYS) {
    const v = typeof input[k] === "string" ? input[k].toUpperCase() : "";
    if ((OPTIONS[k].values as readonly string[]).includes(v)) o[k] = v;
  }
  return o;
}

export const fromSearch = (search: string) => sanitize(Object.fromEntries(new URLSearchParams(search)));

/** Only non-default values are written, so the default layout has a clean URL. */
export function toSearch(o: Options): string {
  const p = new URLSearchParams();
  for (const k of OPTION_KEYS) if (o[k] !== DEFAULTS[k]) p.set(k, o[k].toLowerCase());
  const s = p.toString();
  return s && "?" + s;
}

/** Miryoku options that differ from the default and that the firmware will actually apply. */
export function appliedOptions(o: Options): OptionKey[] {
  const ignored = ignoredOptions(o);
  return MIRYOKU_KEYS.filter((k) => o[k] !== DEFAULTS[k] && !ignored.includes(k));
}

const STORAGE_KEY = "miryoku-visualizer.options";

/** Options from the URL win over the ones remembered in localStorage, which win over the defaults. */
export function loadOptions(search: string): Options {
  let stored: unknown = {};
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    // Storage can be blocked or hold junk; fall back to the defaults.
  }
  return sanitize({ ...(stored as object), ...Object.fromEntries(new URLSearchParams(search)) });
}

export function saveOptions(o: Options) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
  } catch {
    // Not being able to remember the options is not worth an error.
  }
}
