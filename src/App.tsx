import { useEffect, useMemo, useState } from "react";
import { FIRMWARE_INFO, snippets, type Firmware } from "./firmware";
import Keyboard from "./Keyboard";
import { LAYER_NAMES, buildKeymap, type BaseView, type Layer } from "./keymap";
import { DEFAULTS, OPTIONS, OPTION_KEYS, fromSearch, isAvailable, normalize, toSearch, type OptionKey } from "./options";

const LAYERS = Object.keys(LAYER_NAMES) as Layer[];

const valueText = (k: OptionKey, v: string) =>
  v === OPTIONS[k].default ? (v === "DEFAULT" ? "Default" : `${v} (default)`) : v;

function Snippet({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () =>
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  return (
    <div>
      <h3>{title}</h3>
      <pre>{text}</pre>
      <button type="button" onClick={copy}>{copied ? "Copied" : "Copy"}</button>
    </div>
  );
}

export default function App() {
  const [options, setOptions] = useState(() => fromSearch(location.search));
  const [view, setView] = useState<BaseView>("base");
  const [toggled, setToggled] = useState<Layer | null>(null);
  const [heldKey, setHeldKey] = useState<number | null>(null);
  const [firmware, setFirmware] = useState<Firmware>("qmk");

  useEffect(() => {
    history.replaceState(null, "", toSearch(options) || location.pathname);
  }, [options]);

  const keys = useMemo(() => buildKeymap(options, view), [options, view]);
  // A held thumb key wins over the toggle, and the toggle shows again on release.
  const highlight = heldKey !== null ? keys[heldKey].holdLayer ?? null : toggled;
  const info = FIRMWARE_INFO[firmware];
  const parts = snippets(firmware, options);

  return (
    <main>
      <h1>Miryoku Visualizer</h1>
      <p>
        Preview the <a href="https://github.com/manna-harbour/miryoku">Miryoku</a> layout for the compile options you
        pick. Press and hold a thumb key to see its layer.
      </p>

      <section aria-label="Compile options" className="options">
        {OPTION_KEYS.map((k) => (
          <label key={k}>
            <span>{OPTIONS[k].name}</span>
            <select value={options[k]} onChange={(e) => setOptions(normalize({ ...options, [k]: e.target.value }))}>
              {OPTIONS[k].values.map((v) => (
                <option key={v} value={v} disabled={!isAvailable(options, k, v)}>{valueText(k, v)}</option>
              ))}
            </select>
          </label>
        ))}
        <label>
          <span>Base layer shown</span>
          <select value={view} onChange={(e) => setView(e.target.value as BaseView)}>
            <option value="base">Base</option>
            <option value="extra">Extra</option>
            <option value="tap">Tap</option>
          </select>
        </label>
        <button type="button" onClick={() => setOptions(DEFAULTS)}>Reset options</button>
      </section>

      <section aria-label="Highlight a layer" className="layers">
        {LAYERS.map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={highlight === l}
            style={{ "--c": `var(--c-${l})` } as React.CSSProperties}
            onClick={() => setToggled(toggled === l ? null : l)}
          >
            {LAYER_NAMES[l]}
          </button>
        ))}
      </section>

      <div className="keyboard-wrap">
        <Keyboard keys={keys} highlight={highlight} heldKey={heldKey} onHold={setHeldKey} />
      </div>

      <section aria-label="Firmware">
        <h2>Apply the options</h2>
        <div className="tabs">
          {(Object.keys(FIRMWARE_INFO) as Firmware[]).map((f) => (
            <button key={f} type="button" aria-pressed={firmware === f} onClick={() => setFirmware(f)}>
              {FIRMWARE_INFO[f].name}
            </button>
          ))}
        </div>
        {parts.length === 0 ? (
          <p>All options are the default, so {info.name} needs no extra configuration.</p>
        ) : (
          parts.map((s) => (
            <Snippet key={s.title} {...s} />
          ))
        )}
        <p>
          <a href={info.workflowUrl}>{info.name} workflow builds</a> · <a href={info.readmeUrl}>{info.name} readme</a>
        </p>
      </section>
    </main>
  );
}
