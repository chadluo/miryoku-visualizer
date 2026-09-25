import { describe, expect, it } from "vitest";
import { notes, snippets } from "./firmware";
import { DEFAULTS, MIRYOKU_KEYS, OPTIONS, type Firmware, type Options } from "./options";

const changed: Options = { ...DEFAULTS, alphas: "QWERTY", extra: "DVORAK", tap: "QWERTY", nav: "INVERTEDT", clipboard: "WIN", layers: "FLIP" };
const FIRMWARES: Firmware[] = ["QMK", "ZMK"];

describe("firmware snippets", () => {
  it("has nothing to show when every option is the default", () => {
    for (const firmware of FIRMWARES) expect(snippets({ ...DEFAULTS, firmware })).toEqual([]);
  });

  it.each(FIRMWARES)("%s config text names each changed option and no default one", (firmware) => {
    const config = snippets({ ...changed, firmware })[0].text;
    for (const k of MIRYOKU_KEYS) expect(config).toContain(OPTIONS[k].name);

    for (const s of snippets({ ...DEFAULTS, firmware, clipboard: "MAC" })) {
      expect(s.text).toMatch(/MAC|mac/);
      expect(s.text).not.toMatch(/ALPHAS|NAV|LAYERS|EXTRA|TAP|alphas|nav:|layers|extra|tap/);
    }
  });

  it("does not put view settings in the firmware config", () => {
    for (const firmware of FIRMWARES) expect(snippets({ ...DEFAULTS, firmware, labels: "TEXT" })).toEqual([]);
  });

  it("uses upstream syntax", () => {
    const qmk = snippets({ ...changed, firmware: "QMK" });
    expect(qmk[0].text).toContain("MIRYOKU_LAYERS=FLIP");
    expect(qmk[1].text).toContain("-e MIRYOKU_NAV=INVERTEDT");
    expect(snippets({ ...changed, firmware: "ZMK" })[0].text).toContain("#define MIRYOKU_NAV_INVERTEDT");
  });

  it("passes QMK extra and tap through the workflow rules input, as a JSON array", () => {
    const flow = snippets({ ...changed, firmware: "QMK" })[2].text;
    expect(flow).toContain(`rules: '["MIRYOKU_EXTRA=DVORAK\\nMIRYOKU_TAP=QWERTY"]'`);
    expect(flow).not.toContain("extra:");
    expect(snippets({ ...changed, firmware: "ZMK" })[1].text).toContain(`extra: '["dvorak"]'`);
  });

  it("leaves out an option the firmware ignores", () => {
    for (const firmware of FIRMWARES) {
      const text = snippets({ ...DEFAULTS, firmware, nav: "VI", layers: "FLIP" }).map((s) => s.text).join("\n");
      expect(text).toContain("FLIP");
      expect(text).not.toMatch(/NAV|nav/);
    }
  });
});

describe("firmware notes", () => {
  it("warns that VI does not work with FLIP, for both firmwares", () => {
    for (const firmware of FIRMWARES) {
      const warning = notes({ ...DEFAULTS, firmware, nav: "VI", layers: "FLIP" }, "base").filter((n) => n.kind === "warning");
      expect(warning).toHaveLength(1);
      expect(warning[0].text).toContain(firmware);
    }
    expect(notes({ ...DEFAULTS, nav: "VI" }, "base").filter((n) => n.kind === "warning")).toEqual([]);
  });

  it("explains the QMK rules input only when extra or tap changed", () => {
    const has = (o: Options) => notes(o, "base").some((n) => n.text.includes("rules input"));
    expect(has({ ...DEFAULTS, firmware: "QMK", extra: "DVORAK" })).toBe(true);
    expect(has({ ...DEFAULTS, firmware: "QMK" })).toBe(false);
    expect(has({ ...DEFAULTS, firmware: "ZMK", extra: "DVORAK" })).toBe(false);
  });
});
