import { LAYERS_QMK } from "./data.qmk";
import { LAYERS_ZMK } from "./data.zmk";
import { ignoredOptions, type Firmware, type Options } from "./options";

const LAYERS = { QMK: LAYERS_QMK, ZMK: LAYERS_ZMK };

interface Ctx {
  clipboard: string;
  labels: string;
  firmware: Firmware;
}

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

const NAMES: Record<string, string> = {
  COMM: ",", DOT: ".", SLSH: "/", QUOT: "'", SCLN: ";", LBRC: "[", RBRC: "]", LCBR: "{", RCBR: "}", LPRN: "(",
  RPRN: ")", EQL: "=", MINS: "-", GRV: "`", BSLS: "\\", AMPR: "&", ASTR: "*", AT: "@", CIRC: "^", COLN: ":",
  DLR: "$", EXLM: "!", HASH: "#", PERC: "%", PIPE: "|", PLUS: "+", TILD: "~", UNDS: "_",
  UP: "↑", DOWN: "↓", LEFT: "←", RGHT: "→",
  HOME: "Home", END: "End", PGUP: "PgUp", PGDN: "PgDn", INS: "Ins", APP: "App", PSCR: "PrtSc", SCRL: "ScrLk",
  PAUS: "Pause", MS_U: "Ms↑", MS_D: "Ms↓", MS_L: "Ms←", MS_R: "Ms→", WH_U: "Wh↑", WH_D: "Wh↓", WH_L: "Wh←",
  WH_R: "Wh→", BTN1: "Btn1", BTN2: "Btn2", BTN3: "Btn3", MNXT: "Next", MPRV: "Prev", MPLY: "Play", MSTP: "Stop",
  MUTE: "Mute", VOLU: "Vol+", VOLD: "Vol-", ESC: "Esc", ALGR: "AltGr",
};

/** Keys and modifiers that are drawn as symbols by default, and spelled out in the text style. */
const SYMBOLS: Record<string, string> = {
  BSPC: "⌫", DEL: "⌦", ENT: "↵", SPC: "␣", TAB: "⇥", LGUI: "⌘", LALT: "⌥", LCTL: "⌃", LSFT: "⇧",
};
const TEXT: Record<string, string> = {
  BSPC: "Bksp", DEL: "Del", ENT: "Enter", SPC: "Space", TAB: "Tab", LGUI: "Gui", LALT: "Alt", LCTL: "Ctrl", LSFT: "Shift",
};
const nameOf = (kc: string, ctx: Ctx) => (ctx.labels === "TEXT" ? TEXT : SYMBOLS)[kc] ?? NAMES[kc];

const OTHER: Record<string, string> = {
  CW_TOGG: "CapsW", RGB_TOG: "RGB", RGB_MOD: "Mod", RGB_HUI: "Hue", RGB_SAI: "Sat", RGB_VAI: "Val", OU_AUTO: "Auto",
  OU_TOG: "Out", EP_TOG: "ExtPwr",
};

const CLIPBOARD: Record<string, Record<string, Record<string, string>>> = {
  SYMBOLS: {
    DEFAULT: { U_UND: "Undo", U_CUT: "Cut", U_CPY: "Copy", U_PST: "Paste", U_RDO: "Redo" },
    FUN: { U_UND: "Undo", U_CUT: "Cut", U_CPY: "Copy", U_PST: "Paste", U_RDO: "Redo" },
    MAC: { U_UND: "⌘Z", U_CUT: "⌘X", U_CPY: "⌘C", U_PST: "⌘V", U_RDO: "⇧⌘Z" },
    WIN: { U_UND: "⌃Z", U_CUT: "⌃X", U_CPY: "⌃C", U_PST: "⌃V", U_RDO: "⌃Y" },
  },
  TEXT: {
    DEFAULT: { U_UND: "Undo", U_CUT: "Cut", U_CPY: "Copy", U_PST: "Paste", U_RDO: "Redo" },
    FUN: { U_UND: "Undo", U_CUT: "Cut", U_CPY: "Copy", U_PST: "Paste", U_RDO: "Redo" },
    MAC: { U_UND: "Cmd+Z", U_CUT: "Cmd+X", U_CPY: "Cmd+C", U_PST: "Cmd+V", U_RDO: "Cmd+Sh+Z" },
    WIN: { U_UND: "Ctrl+Z", U_CUT: "Ctrl+X", U_CPY: "Ctrl+C", U_PST: "Ctrl+V", U_RDO: "Ctrl+Y" },
  },
};

// Keycodes behind the U_* clipboard aliases (miryoku_clipboard.h in ZMK, manna-harbour_miryoku.h in QMK),
// shown in tooltips. Order matches CLIPBOARD_ALIASES.
const CLIPBOARD_KEYCODES: Record<Firmware, Record<string, string[]>> = {
  QMK: {
    DEFAULT: ["KC_UNDO", "S(KC_DEL)", "C(KC_INS)", "S(KC_INS)", "KC_AGIN"],
    FUN: ["KC_UNDO", "KC_CUT", "KC_COPY", "KC_PSTE", "KC_AGIN"],
    MAC: ["LCMD(KC_Z)", "LCMD(KC_X)", "LCMD(KC_C)", "LCMD(KC_V)", "SCMD(KC_Z)"],
    WIN: ["C(KC_Z)", "C(KC_X)", "C(KC_C)", "C(KC_V)", "C(KC_Y)"],
  },
  ZMK: {
    DEFAULT: ["&kp K_UNDO", "&kp LS(DEL)", "&kp LC(INS)", "&kp LS(INS)", "&kp K_AGAIN"],
    FUN: ["&kp K_UNDO", "&kp K_CUT", "&kp K_COPY", "&kp K_PASTE", "&kp K_AGAIN"],
    MAC: ["&kp LG(Z)", "&kp LG(X)", "&kp LG(C)", "&kp LG(V)", "&kp LS(LG(Z))"],
    WIN: ["&kp LC(Z)", "&kp LC(X)", "&kp LC(C)", "&kp LC(V)", "&kp LC(Y)"],
  },
};
const CLIPBOARD_ALIASES = ["U_UND", "U_CUT", "U_CPY", "U_PST", "U_RDO"];
const keycodeOf = (token: string, ctx: Ctx) =>
  CLIPBOARD_KEYCODES[ctx.firmware][ctx.clipboard][CLIPBOARD_ALIASES.indexOf(token)] ?? token;

// ZMK names that differ from the QMK names used for labelling.
const ZMK_KEY: Record<string, string> = {
  COMMA: "COMM", SLASH: "SLSH", SQT: "QUOT", SEMI: "SCLN", LBKT: "LBRC", RBKT: "RBRC", LBRC: "LCBR", RBRC: "RCBR",
  LPAR: "LPRN", RPAR: "RPRN", EQUAL: "EQL", MINUS: "MINS", GRAVE: "GRV", BSLH: "BSLS", AMPS: "AMPR", ASTRK: "ASTR",
  CARET: "CIRC", COLON: "COLN", DLLR: "DLR", EXCL: "EXLM", PRCNT: "PERC", TILDE: "TILD", UNDER: "UNDS", RET: "ENT", SPACE: "SPC",
  RIGHT: "RGHT", PG_UP: "PGUP", PG_DN: "PGDN", K_APP: "APP", PSCRN: "PSCR", SLCK: "SCRL", PAUSE_BREAK: "PAUS",
  LCTRL: "LCTL", LSHFT: "LSFT", RALT: "ALGR", C_MUTE: "MUTE", C_NEXT: "MNXT", C_PREV: "MPRV", C_PP: "MPLY",
  C_STOP: "MSTP", C_VOL_UP: "VOLU", C_VOL_DN: "VOLD",
};
const ZMK_OTHER: Record<string, string> = {
  "&u_caps_word": "CW_TOGG", "&u_out_tog": "OU_TOG", U_BOOT: "TD(U_TD_BOOT)", U_EP_TOG: "EP_TOG",
  U_RGB_TOG: "RGB_TOG", U_RGB_EFF: "RGB_MOD", U_RGB_HUI: "RGB_HUI", U_RGB_SAI: "RGB_SAI", U_RGB_BRI: "RGB_VAI",
  U_BTN1: "KC_BTN1", U_BTN2: "KC_BTN2", U_BTN3: "KC_BTN3",
  U_MS_U: "KC_MS_U", U_MS_D: "KC_MS_D", U_MS_L: "KC_MS_L", U_MS_R: "KC_MS_R",
  U_WH_U: "KC_WH_U", U_WH_D: "KC_WH_D", U_WH_L: "KC_WH_L", U_WH_R: "KC_WH_R",
};

/** Translates a ZMK token to the QMK spelling the labelling below understands. */
function toQmk(token: string): string {
  const key = (n: string) => "KC_" + (ZMK_KEY[n] ?? n.replace(/^N(\d)$/, "$1"));
  let m: RegExpExecArray | null;
  if ((m = /^&kp (\w+)$/.exec(token))) return key(m[1]);
  if ((m = /^U_MT\((\w+), (\w+)\)$/.exec(token))) return `${ZMK_KEY[m[1]] ?? m[1]}_T(${key(m[2])})`;
  if ((m = /^U_LT\((\w+), (\w+)\)$/.exec(token))) return `LT(${m[1]},${key(m[2])})`;
  if ((m = /^&u_to_(U_\w+)$/.exec(token))) return `TD(U_TD_${m[1]})`;
  if ((m = /^&u_bt_sel_(\d)$/.exec(token))) return `BT_${m[1]}`;
  return ZMK_OTHER[token] ?? token;
}

/** Unknown tokens come back as-is so a data typo is visible in the UI (and caught by the tests). */
export function labelOf(raw: string, ctx: Ctx): string {
  const token = ctx.firmware === "ZMK" ? toQmk(raw) : raw;
  if (token === "U_NA" || token === "U_NU") return "";
  const clip = CLIPBOARD[ctx.labels][ctx.clipboard][token];
  if (clip) return clip;
  const td = /^TD\(U_TD_(?:U_)?(\w+)\)$/.exec(token)?.[1];
  if (td) {
    const name = td[0] + td.slice(1).toLowerCase();
    return td === "BOOT" ? name : /^(BASE|EXTRA|TAP)$/.test(td) ? "→" + name : "Lk " + name;
  }
  const bt = /^BT_(\d)$/.exec(token)?.[1];
  if (bt) return "BT" + bt;
  const kc = /^KC_(\w+)$/.exec(token)?.[1];
  if (kc) return nameOf(kc, ctx) ?? (/^F\d+$/.test(kc) ? kc : kc.length === 1 ? kc : token);
  return OTHER[token] ?? token;
}

const MOD_TAP = /^(\w+)_T\((KC_\w+)\)$/;
const LAYER_TAP = /^LT\(U_(\w+),(KC_\w+)\)$/;

/** Splits a base layer token into what it types and what it does when held. */
function splitBase(raw: string, ctx: Ctx) {
  const token = ctx.firmware === "ZMK" ? toQmk(raw) : raw;
  const qmk: Ctx = { ...ctx, firmware: "QMK" }; // the token is already in QMK spelling
  const mt = MOD_TAP.exec(token);
  if (mt) return { tap: labelOf(mt[2], qmk), hold: nameOf(mt[1], ctx) ?? mt[1] };
  const lt = LAYER_TAP.exec(token);
  if (lt) {
    const layer = lt[1].toLowerCase() as Layer;
    return { tap: labelOf(lt[2], qmk), hold: LAYER_NAMES[layer], holdLayer: layer };
  }
  return { tap: labelOf(token, qmk), hold: "" };
}

const variant = (layer: Layer, o: Options) => {
  const name = layer.toUpperCase();
  if (layer === "button") return name;
  const isNav = layer === "nav" || layer === "mouse" || layer === "media";
  const navVariant = isNav && o.nav !== "DEFAULT" && !ignoredOptions(o).includes("nav") ? o.nav : "";
  return [name, navVariant, o.layers === "FLIP" && "FLIP"].filter(Boolean).join("_");
};

export function layerTokens(o: Options, layer: Layer, view: BaseView = "base") {
  const table = LAYERS[o.firmware as Firmware];
  if (layer === "base") {
    const [kind, alpha] = view === "tap" ? ["TAP", o.tap] : ["BASE", view === "extra" ? o.extra : o.alphas];
    return table[[kind, alpha, o.layers === "FLIP" && "FLIP"].filter(Boolean).join("_")];
  }
  return table[variant(layer, o)];
}

export function buildKeymap(o: Options, view: BaseView = "base"): KeyModel[] {
  const flip = o.layers === "FLIP";
  const ctx: Ctx = { clipboard: o.clipboard, labels: o.labels, firmware: o.firmware as Firmware };
  const all = Object.fromEntries(
    (Object.keys(LAYER_NAMES) as Layer[]).map((l) => [l, layerTokens(o, l, view)]),
  ) as Record<Layer, readonly string[]>;

  return Array.from({ length: 36 }, (_, i) => {
    const hand = handOf(i);
    const { tap, hold, holdLayer } = splitBase(all.base[i], ctx);
    const corners: KeyModel["corners"] = {};
    for (const layer of SUB_LAYERS) {
      const text = labelOf(all[layer][i], ctx);
      if (contentHand(layer, flip) === hand && text) corners[CORNER[layer]] = { layer, text };
    }
    const tip = (Object.keys(all) as Layer[])
      .filter((l) => !/^U_N[AU]$/.test(all[l][i]))
      .map((l) => `${LAYER_NAMES[l]}: ${keycodeOf(all[l][i], ctx)}`)
      .join("\n");
    return { hand, base: tap, corners, button: labelOf(all.button[i], ctx), hold, holdLayer, tip };
  });
}
