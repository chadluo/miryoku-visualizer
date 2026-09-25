import { describe, expect, it } from "vitest";
import { buildKeymap, layerTokens, type Layer } from "./keymap";
import { ALPHAS, DEFAULTS, OPTIONS, fromSearch, isAvailable, toSearch, type Options } from "./options";

const combos = function* (): Generator<Options> {
  for (const alphas of ALPHAS)
    for (const nav of OPTIONS.nav.values)
      for (const clipboard of OPTIONS.clipboard.values)
        for (const layers of OPTIONS.layers.values) {
          const o = { alphas, extra: alphas, tap: alphas, nav, clipboard, layers };
          if (isAvailable(o, "nav", nav)) yield o;
        }
};

const LAYERS: Layer[] = ["base", "nav", "mouse", "media", "num", "sym", "fun", "button"];

describe("keymap", () => {
  it("resolves 36 keys per layer and every keycode to a label, for every valid option combination", () => {
    for (const o of combos()) {
      for (const l of LAYERS) expect(layerTokens(o, l), JSON.stringify([o, l])).toHaveLength(36);
      for (const view of ["base", "extra", "tap"] as const)
        for (const k of buildKeymap(o, view)) {
          const texts = [k.base, k.button, ...Object.values(k.corners).map((c) => c.text)];
          for (const t of texts) expect(t).not.toMatch(/^(KC_|U_|TD\(|LT\(|\w+_T\()/);
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
    expect(held(DEFAULTS)).toEqual(["media", "nav", "mouse", "sym", "num", "fun"]);
    expect(held({ ...DEFAULTS, layers: "FLIP" })).toEqual(["fun", "num", "sym", "mouse", "nav", "media"]);
  });

  it("shows no hold behavior on the tap layer", () => {
    expect(buildKeymap(DEFAULTS, "tap").filter((k) => k.hold)).toHaveLength(0);
    expect(buildKeymap(DEFAULTS, "base").filter((k) => k.hold).length).toBeGreaterThan(0);
  });

  it("changes clipboard labels with the clipboard option", () => {
    const paste = (clipboard: string) => buildKeymap({ ...DEFAULTS, clipboard }).flatMap((k) => Object.values(k.corners)).map((c) => c.text);
    expect(paste("MAC")).toContain("⌘V");
    expect(paste("WIN")).toContain("⌃V");
    expect(paste("DEFAULT")).not.toContain("⌘V");
  });
});

describe("options in the URL", () => {
  it("leaves defaults out and round-trips the rest", () => {
    expect(toSearch(DEFAULTS)).toBe("");
    const o = { ...DEFAULTS, alphas: "QWERTY", nav: "INVERTEDT", layers: "FLIP" };
    expect(toSearch(o)).toBe("?alphas=qwerty&nav=invertedt&layers=flip");
    expect(fromSearch(toSearch(o))).toEqual(o);
  });

  it("ignores unknown values and drops vi nav when flipped", () => {
    expect(fromSearch("?alphas=nope&nav=bogus")).toEqual(DEFAULTS);
    expect(fromSearch("?nav=vi&layers=flip").nav).toBe("DEFAULT");
    expect(fromSearch("?nav=vi").nav).toBe("VI");
  });
});
