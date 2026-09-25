// Compile options from the Miryoku reference manual:
// https://github.com/manna-harbour/miryoku/blob/master/docs/reference/readme.org
// BEAKL15 is also accepted by upstream QMK/ZMK but is not in the manual.

export const ALPHAS = [
  "AZERTY", "BEAKL15", "COLEMAK", "COLEMAKDH", "COLEMAKDHK", "DVORAK", "HALMAK", "QWERTY", "QWERTZ", "WORKMAN",
] as const;

export const OPTIONS = {
  alphas: { name: "MIRYOKU_ALPHAS", default: "COLEMAKDH", values: ALPHAS },
  extra: { name: "MIRYOKU_EXTRA", default: "QWERTY", values: ALPHAS },
  tap: { name: "MIRYOKU_TAP", default: "COLEMAKDH", values: ALPHAS },
  nav: { name: "MIRYOKU_NAV", default: "DEFAULT", values: ["DEFAULT", "VI", "INVERTEDT"] },
  clipboard: { name: "MIRYOKU_CLIPBOARD", default: "DEFAULT", values: ["DEFAULT", "FUN", "MAC", "WIN"] },
  layers: { name: "MIRYOKU_LAYERS", default: "DEFAULT", values: ["DEFAULT", "FLIP"] },
} as const;

export type OptionKey = keyof typeof OPTIONS;
export type Options = Record<OptionKey, string>;

export const OPTION_KEYS = Object.keys(OPTIONS) as OptionKey[];

export const DEFAULTS = Object.fromEntries(OPTION_KEYS.map((k) => [k, OPTIONS[k].default])) as Options;

/** Upstream has no vi-style nav for flipped layers. */
export const isAvailable = (o: Options, key: OptionKey, value: string) =>
  !(key === "nav" && value === "VI" && o.layers === "FLIP");

export function normalize(o: Options): Options {
  return isAvailable(o, "nav", o.nav) ? o : { ...o, nav: DEFAULTS.nav };
}

export function fromSearch(search: string): Options {
  const p = new URLSearchParams(search);
  const o = { ...DEFAULTS };
  for (const k of OPTION_KEYS) {
    const v = p.get(k)?.toUpperCase();
    if (v && (OPTIONS[k].values as readonly string[]).includes(v)) o[k] = v;
  }
  return normalize(o);
}

/** Only non-default values are written, so the default layout has a clean URL. */
export function toSearch(o: Options): string {
  const p = new URLSearchParams();
  for (const k of OPTION_KEYS) if (o[k] !== DEFAULTS[k]) p.set(k, o[k].toLowerCase());
  const s = p.toString();
  return s && "?" + s;
}

export const nonDefault = (o: Options) => OPTION_KEYS.filter((k) => o[k] !== DEFAULTS[k]);
