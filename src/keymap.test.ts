import { afterEach, describe, expect, it, vi } from "vitest";
import { buildKeymap, layerTokens, type Layer } from "./keymap";
import { ALPHAS, DEFAULTS, OPTIONS, fromSearch, loadOptions, saveOptions, toSearch, type Options } from "./options";

// Alphas only change the base layer letters and the rest only changes the other layers and labels, so the two
// groups are covered separately instead of as one cross product.
const subLayerCombos = function* (): Generator<Options> {
  for (const firmware of OPTIONS.firmware.values)
    for (const labels of OPTIONS.labels.values)
      for (const nav of OPTIONS.nav.values)
        for (const clipboard of OPTIONS.clipboard.values)
          for (const layers of OPTIONS.layers.values) yield { ...DEFAULTS, firmware, labels, nav, clipboard, layers };
};
const alphaCombos = function* (): Generator<Options> {
  for (const firmware of OPTIONS.firmware.values)
    for (const layers of OPTIONS.layers.values)
      for (const alphas of ALPHAS) yield { ...DEFAULTS, firmware, layers, alphas, extra: alphas, tap: alphas };
};
function* combos() {
  yield* subLayerCombos();
  yield* alphaCombos();
}

const LAYERS: Layer[] = ["base", "nav", "mouse", "media", "num", "sym", "fun", "button"];
const media = (o: Options) => buildKeymap(o).flatMap((k) => Object.values(k.corners)).filter((c) => c.layer === "media").map((c) => c.text);

describe("keymap", () => {
  it("resolves 36 keys per layer and every keycode to a label, for every option combination and firmware", () => {
    for (const o of combos()) {
      for (const l of LAYERS) expect(layerTokens(o, l), JSON.stringify([o, l])).toHaveLength(36);
      for (const view of ["base", "extra", "tap"] as const)
        for (const k of buildKeymap(o, view)) {
          const texts = [k.base, k.button, k.hold, ...Object.values(k.corners).map((c) => c.text)];
          for (const t of texts) expect(t).not.toMatch(/^(KC_|U_|TD\(|LT\(|&(kp|u_|mkp|mmv|msc)|\w+_T\()/);
        }
    }
  });

  it("puts nav/mouse/media on the right hand and num/sym/fun on the left, and FLIP swaps them", () => {
    const layersByHand = (o: Options) => {
      const seen = { L: new Set<string>(), R: new Set<string>() };
      for (const k of buildKeymap(o)) for (const c of Object.values(k.corners)) seen[k.hand].add(c.layer);
      return seen;
    };
    const plain = layersByHand(DEFAULTS);
    expect([...plain.R].sort()).toEqual(["media", "mouse", "nav"]);
    expect([...plain.L].sort()).toEqual(["fun", "num", "sym"]);
    const flipped = layersByHand({ ...DEFAULTS, layers: "FLIP" });
    expect([...flipped.L].sort()).toEqual(["media", "mouse", "nav"]);
    expect([...flipped.R].sort()).toEqual(["fun", "num", "sym"]);
  });

  it("assigns thumb layers by position, so a layer's hold key sits on the opposite hand of its labels", () => {
    // Default: left thumbs hold Media/Nav/Mouse, right thumbs hold Sym/Num/Fun (upstream reference manual).
    const held = (o: Options) => buildKeymap(o).slice(30).map((k) => k.holdLayer);
    for (const firmware of OPTIONS.firmware.values) {
      expect(held({ ...DEFAULTS, firmware })).toEqual(["media", "nav", "mouse", "sym", "num", "fun"]);
      expect(held({ ...DEFAULTS, firmware, layers: "FLIP" })).toEqual(["fun", "num", "sym", "mouse", "nav", "media"]);
    }
  });

  it("shows no hold behavior on the tap layer", () => {
    expect(buildKeymap(DEFAULTS, "tap").filter((k) => k.hold)).toHaveLength(0);
    expect(buildKeymap(DEFAULTS, "base").filter((k) => k.hold).length).toBeGreaterThan(0);
  });

  it("changes clipboard labels with the clipboard option", () => {
    const labels = (clipboard: string) => buildKeymap({ ...DEFAULTS, clipboard }).flatMap((k) => Object.values(k.corners)).map((c) => c.text);
    expect(labels("MAC")).toContain("⌘V");
    expect(labels("WIN")).toContain("⌃V");
    expect(labels("DEFAULT")).toContain("Paste");
  });

  it("uses each firmware's own layer data", () => {
    // ZMK's Media layer has Bluetooth profiles and external power; QMK's has neither.
    expect(media({ ...DEFAULTS, firmware: "ZMK" })).toEqual(expect.arrayContaining(["BT0", "BT3", "ExtPwr", "Out"]));
    expect(media({ ...DEFAULTS, firmware: "QMK" })).not.toContain("BT0");
    expect(media({ ...DEFAULTS, firmware: "QMK" })).toContain("Auto");
    // The tooltip shows the firmware's own keycode spelling.
    expect(buildKeymap({ ...DEFAULTS, firmware: "ZMK" })[31].tip).toContain("&kp SPACE");
    expect(buildKeymap({ ...DEFAULTS, firmware: "QMK" })[31].tip).toContain("KC_SPC");
  });

  it("draws modifiers and Space/Tab/Enter as symbols or as text", () => {
    for (const firmware of OPTIONS.firmware.values) {
      const shown = (labels: string) => {
        const k = buildKeymap({ ...DEFAULTS, firmware, labels });
        return { homeMod: k[13].hold, space: k[31].base, enter: k[33].base, tab: k[32].base };
      };
      expect(shown("SYMBOLS")).toEqual({ homeMod: "⇧", space: "␣", enter: "↵", tab: "⇥" });
      expect(shown("TEXT")).toEqual({ homeMod: "Shift", space: "Space", enter: "Enter", tab: "Tab" });
    }
  });

  it("ignores VI nav under FLIP, as both firmwares do, and builds the default flipped nav", () => {
    for (const firmware of OPTIONS.firmware.values) {
      const flipped = { ...DEFAULTS, firmware, layers: "FLIP" };
      expect(buildKeymap({ ...flipped, nav: "VI" })).toEqual(buildKeymap(flipped));
      expect(buildKeymap({ ...DEFAULTS, firmware, nav: "VI" })).not.toEqual(buildKeymap({ ...DEFAULTS, firmware }));
    }
  });
});

describe("options in the URL and storage", () => {
  const stubStorage = (initial: Record<string, string> = {}) => {
    const data = { ...initial };
    vi.stubGlobal("localStorage", { getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => void (data[k] = v) });
    return data;
  };
  afterEach(() => vi.unstubAllGlobals());

  it("leaves defaults out and round-trips the rest", () => {
    expect(toSearch(DEFAULTS)).toBe("");
    const o = { ...DEFAULTS, alphas: "QWERTY", nav: "INVERTEDT", layers: "FLIP", firmware: "ZMK" };
    expect(toSearch(o)).toBe("?firmware=zmk&alphas=qwerty&nav=invertedt&layers=flip");
    expect(fromSearch(toSearch(o))).toEqual(o);
  });

  it("ignores unknown keys and values", () => {
    expect(fromSearch("?alphas=nope&nav=bogus&x=1")).toEqual(DEFAULTS);
  });

  it("keeps VI selected under FLIP so the app can explain it", () => {
    expect(fromSearch("?nav=vi&layers=flip").nav).toBe("VI");
  });

  it("remembers options, and lets the URL win per option", () => {
    const data = stubStorage();
    saveOptions({ ...DEFAULTS, alphas: "DVORAK", clipboard: "MAC" });
    expect(loadOptions("")).toEqual({ ...DEFAULTS, alphas: "DVORAK", clipboard: "MAC" });
    expect(loadOptions("?alphas=qwerty")).toEqual({ ...DEFAULTS, alphas: "QWERTY", clipboard: "MAC" });
    data["miryoku-visualizer.options"] = "not json";
    expect(loadOptions("?nav=vi")).toEqual({ ...DEFAULTS, nav: "VI" });
  });

  it("works when storage is unavailable", () => {
    vi.stubGlobal("localStorage", { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } });
    expect(() => saveOptions(DEFAULTS)).not.toThrow();
    expect(loadOptions("?layers=flip").layers).toBe("FLIP");
  });
});
