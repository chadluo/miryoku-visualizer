import { describe, expect, it } from "vitest";
import { snippets, type Firmware } from "./firmware";
import { DEFAULTS, OPTIONS, type Options } from "./options";

const changed: Options = { alphas: "QWERTY", extra: "DVORAK", tap: "QWERTY", nav: "INVERTEDT", clipboard: "WIN", layers: "FLIP" };

describe("firmware snippets", () => {
  it("has nothing to show when every option is the default", () => {
    for (const fw of ["qmk", "zmk"] as Firmware[]) expect(snippets(fw, DEFAULTS)).toEqual([]);
  });

  it.each(["qmk", "zmk"] as Firmware[])("%s config text names each changed option and no default one", (fw) => {
    const config = snippets(fw, changed)[0].text;
    for (const k of Object.keys(OPTIONS) as (keyof Options)[]) expect(config).toContain(OPTIONS[k].name);

    const oneChange = snippets(fw, { ...DEFAULTS, clipboard: "MAC" });
    for (const s of oneChange) {
      expect(s.text).toMatch(/MAC|mac/);
      expect(s.text).not.toMatch(/ALPHAS|NAV|LAYERS|EXTRA|TAP|alphas|nav:|layers|extra|tap/);
    }
  });

  it("uses upstream syntax", () => {
    expect(snippets("qmk", changed)[0].text).toContain("MIRYOKU_LAYERS=FLIP");
    expect(snippets("qmk", changed)[1].text).toContain("-e MIRYOKU_NAV=INVERTEDT");
    expect(snippets("zmk", changed)[0].text).toContain("#define MIRYOKU_NAV_INVERTEDT");
  });

  it("passes QMK extra and tap through the workflow rules input", () => {
    const flow = snippets("qmk", changed)[2].text;
    expect(flow).toContain(`rules: 'MIRYOKU_EXTRA=DVORAK\\nMIRYOKU_TAP=QWERTY'`);
    expect(flow).not.toContain("extra:");
  });
});
