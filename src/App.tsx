import { useEffect, useMemo, useState } from "react";
import { FIRMWARE_LINKS, notes, snippets } from "./firmware";
import Keyboard from "./Keyboard";
import { LAYER_NAMES, buildKeymap, type BaseView, type Layer } from "./keymap";
import {
  DEFAULTS, OPTIONS, OPTION_KEYS, ignoredOptions, loadOptions, saveOptions, toSearch, type Firmware, type Options, type OptionKey,
} from "./options";

const LAYERS = Object.keys(LAYER_NAMES) as Layer[];

const TITLE_CASE: OptionKey[] = ["labels"];

function valueText(k: OptionKey, v: string, o: Options) {
  const text = TITLE_CASE.includes(k) ? v[0] + v.slice(1).toLowerCase() : v === "DEFAULT" ? "Default" : v;
  const ignored = ignoredOptions({ ...o, [k]: v }).includes(k) ? " (no effect with FLIP)" : "";
  return text + (v === OPTIONS[k].default && v !== "DEFAULT" ? " (default)" : "") + ignored;
}

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
  const [options, setOptions] = useState(() => loadOptions(location.search));
  const [view, setView] = useState<BaseView>("base");
  const [toggled, setToggled] = useState<Layer | null>(null);
  const [heldKey, setHeldKey] = useState<number | null>(null);

  useEffect(() => {
    history.replaceState(null, "", toSearch(options) || location.pathname);
    saveOptions(options);
  }, [options]);

  const keys = useMemo(() => buildKeymap(options, view), [options, view]);
  // A held thumb key wins over the toggle, and the toggle shows again on release.
  const highlight = heldKey !== null ? keys[heldKey].holdLayer ?? null : toggled;
  const firmware = options.firmware as Firmware;
  const parts = snippets(options);

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
            <select value={options[k]} onChange={(e) => setOptions({ ...options, [k]: e.target.value })}>
              {OPTIONS[k].values.map((v) => (
                <option key={v} value={v}>{valueText(k, v, options)}</option>
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
        <h2>Apply the options in {firmware}</h2>
        <ul className="notes">
          {notes(options, view).map((n) => (
            <li key={n.text} className={n.kind}>{n.kind === "warning" ? "Warning: " : ""}{n.text}</li>
          ))}
        </ul>
        {parts.length === 0 ? (
          <p>All options are the default, so {firmware} needs no extra configuration.</p>
        ) : (
          parts.map((s) => <Snippet key={s.title} {...s} />)
        )}
        <p>
          {FIRMWARE_LINKS[firmware].map((l, i) => (
            <span key={l.url}>{i > 0 && " · "}<a href={l.url}>{l.label}</a></span>
          ))}
        </p>
      </section>
    </main>
  );
}
