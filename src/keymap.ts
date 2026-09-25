import { LAYERS } from "./data";
import type { Options } from "./options";

export type Layer = "base" | "nav" | "mouse" | "media" | "num" | "sym" | "fun" | "button";
export type Hand = "L" | "R";
/** Where a sub layer's label sits on a key. Layers activated by the same thumb position share a corner. */
export type Corner = "tr" | "br" | "bl";
export type BaseView = "base" | "extra" | "tap";

export const LAYER_NAMES: Record<Layer, string> = {
  base: "Base", nav: "Nav", mouse: "Mouse", media: "Media", num: "Num", sym: "Sym", fun: "Fun", button: "Button",
};

const SUB_LAYERS = ["nav", "mouse", "media", "num", "sym", "fun"] as const;
type SubLayer = (typeof SUB_LAYERS)[number];

export const CORNER: Record<SubLayer, Corner> = {
  nav: "tr", num: "tr", mouse: "br", sym: "br", media: "bl", fun: "bl",
};

/** Nav, Mouse and Media are right-hand layers; FLIP swaps the hands. */
const contentHand = (layer: SubLayer, flip: boolean): Hand =>
  (layer === "nav" || layer === "mouse" || layer === "media") !== flip ? "R" : "L";

export const handOf = (i: number): Hand => (i < 30 ? (i % 10 < 5 ? "L" : "R") : i < 33 ? "L" : "R");

export interface KeyModel {
  hand: Hand;
  base: string;
  corners: Partial<Record<Corner, { layer: SubLayer; text: string }>>;
  button: string;
  /** Hold behavior shown on the bottom edge: a modifier or a layer name. */
  hold: string;
  /** Set on layer-tap keys: the layer this key activates while held. */
  holdLayer?: Layer;
  /** All QMK keycodes for this position, one line per layer. */
  tip: string;
}

const SYMBOLS: Record<string, string> = {
  COMM: ",", DOT: ".", SLSH: "/", QUOT: "'", SCLN: ";", LBRC: "[", RBRC: "]", LCBR: "{", RCBR: "}", LPRN: "(",
  RPRN: ")", EQL: "=", MINS: "-", GRV: "`", BSLS: "\\", AMPR: "&", ASTR: "*", AT: "@", CIRC: "^", COLN: ":",
  DLR: "$", EXLM: "!", HASH: "#", PERC: "%", PIPE: "|", PLUS: "+", TILD: "~", UNDS: "_",
  BSPC: "⌫", DEL: "⌦", ENT: "↵", ESC: "Esc", SPC: "␣", TAB: "⇥", UP: "↑", DOWN: "↓", LEFT: "←", RGHT: "→",
  HOME: "Home", END: "End", PGUP: "PgUp", PGDN: "PgDn", INS: "Ins", APP: "App", PSCR: "PrtSc", SCRL: "ScrLk",
  PAUS: "Pause", MS_U: "Ms↑", MS_D: "Ms↓", MS_L: "Ms←", MS_R: "Ms→", WH_U: "Wh↑", WH_D: "Wh↓", WH_L: "Wh←",
  WH_R: "Wh→", BTN1: "Btn1", BTN2: "Btn2", BTN3: "Btn3", MNXT: "Next", MPRV: "Prev", MPLY: "Play", MSTP: "Stop",
  MUTE: "Mute", VOLU: "Vol+", VOLD: "Vol-", LGUI: "⌘", LALT: "⌥", LCTL: "⌃", LSFT: "⇧", ALGR: "AltGr",
};

const OTHER: Record<string, string> = {
  CW_TOGG: "CapsW", RGB_TOG: "RGB", RGB_MOD: "Mode", RGB_HUI: "Hue", RGB_SAI: "Sat", RGB_VAI: "Val", OU_AUTO: "Auto",
};

const CLIPBOARD: Record<string, Record<string, string>> = {
  DEFAULT: { U_UND: "Undo", U_CUT: "⇧⌦", U_CPY: "⌃Ins", U_PST: "⇧Ins", U_RDO: "Redo" },
  FUN: { U_UND: "Undo", U_CUT: "Cut", U_CPY: "Copy", U_PST: "Paste", U_RDO: "Redo" },
  MAC: { U_UND: "⌘Z", U_CUT: "⌘X", U_CPY: "⌘C", U_PST: "⌘V", U_RDO: "⇧⌘Z" },
  WIN: { U_UND: "⌃Z", U_CUT: "⌃X", U_CPY: "⌃C", U_PST: "⌃V", U_RDO: "⌃Y" },
};

/** Unknown tokens come back as-is so a data typo is visible in the UI (and caught by the tests). */
export function labelOf(token: string, clipboard: string): string {
  if (token === "U_NA" || token === "U_NU") return "";
  const clip = CLIPBOARD[clipboard][token];
  if (clip) return clip;
  const td = /^TD\(U_TD_(?:U_)?(\w+)\)$/.exec(token)?.[1];
  if (td) {
    const name = td[0] + td.slice(1).toLowerCase();
    return td === "BOOT" ? name : /^(BASE|EXTRA|TAP)$/.test(td) ? "→" + name : "Lk " + name;
  }
  const kc = /^KC_(\w+)$/.exec(token)?.[1];
  if (kc) return SYMBOLS[kc] ?? (/^F\d+$/.test(kc) ? kc : kc.length === 1 ? kc : token);
  return OTHER[token] ?? token;
}

const MOD_TAP = /^(\w+)_T\((KC_\w+)\)$/;
const LAYER_TAP = /^LT\(U_(\w+),(KC_\w+)\)$/;

/** Splits a base layer token into what it types and what it does when held. */
function splitBase(token: string, clipboard: string) {
  const mt = MOD_TAP.exec(token);
  if (mt) return { tap: labelOf(mt[2], clipboard), hold: SYMBOLS[mt[1]] };
  const lt = LAYER_TAP.exec(token);
  if (lt) {
    const layer = lt[1].toLowerCase() as Layer;
    return { tap: labelOf(lt[2], clipboard), hold: LAYER_NAMES[layer], holdLayer: layer };
  }
  return { tap: labelOf(token, clipboard), hold: "" };
}

const variant = (layer: Layer, nav: string, flip: boolean) => {
  const name = layer.toUpperCase();
  if (layer === "button") return name;
  const navVariant = layer === "nav" || layer === "mouse" || layer === "media" ? nav : "DEFAULT";
  return [name, navVariant !== "DEFAULT" && navVariant, flip && "FLIP"].filter(Boolean).join("_");
};

export function layerTokens(o: Options, layer: Layer, view: BaseView = "base") {
  const flip = o.layers === "FLIP";
  if (layer === "base") {
    const [table, alpha] = view === "tap" ? ["TAP", o.tap] : ["BASE", view === "extra" ? o.extra : o.alphas];
    return LAYERS[[table, alpha, flip && "FLIP"].filter(Boolean).join("_")];
  }
  return LAYERS[variant(layer, o.nav, flip)];
}

export function buildKeymap(o: Options, view: BaseView = "base"): KeyModel[] {
  const flip = o.layers === "FLIP";
  const all = Object.fromEntries(
    (Object.keys(LAYER_NAMES) as Layer[]).map((l) => [l, layerTokens(o, l, view)]),
  ) as Record<Layer, readonly string[]>;

  return Array.from({ length: 36 }, (_, i) => {
    const hand = handOf(i);
    const { tap, hold, holdLayer } = splitBase(all.base[i], o.clipboard);
    const corners: KeyModel["corners"] = {};
    for (const layer of SUB_LAYERS) {
      const text = labelOf(all[layer][i], o.clipboard);
      if (contentHand(layer, flip) === hand && text) corners[CORNER[layer]] = { layer, text };
    }
    const tip = (Object.keys(all) as Layer[])
      .filter((l) => !/^U_N[AU]$/.test(all[l][i]))
      .map((l) => `${LAYER_NAMES[l]}: ${all[l][i]}`)
      .join("\n");
    return { hand, base: tap, corners, button: labelOf(all.button[i], o.clipboard), hold, holdLayer, tip };
  });
}
