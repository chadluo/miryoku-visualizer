import { useEffect, useState } from "react";
import { FIRMWARE_LINKS, notes, snippets } from "./firmware";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import Keyboard from "./Keyboard";
import { LAYER_NAMES, buildKeymap, type BaseView, type Layer } from "./keymap";
import {
  DEFAULTS, MIRYOKU_KEYS, OPTIONS, VIEW_KEYS, ignoredOptions, loadOptions, saveOptions, toSearch, type Firmware, type Options, type OptionKey,
} from "./options";

const LAYERS = Object.keys(LAYER_NAMES) as Layer[];

const link = "text-primary underline underline-offset-4";
const grid = "grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] items-end gap-3";

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
    <div className="mb-4">
      <h3 className="mb-1 font-medium">{title}</h3>
      <pre className="mb-2 overflow-x-auto rounded-lg border bg-muted p-3 text-sm">{text}</pre>
      <Button type="button" variant="outline" size="sm" onClick={copy}>{copied ? "Copied" : "Copy"}</Button>
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

  const optionField = (k: OptionKey) => (
    <div className="grid gap-1.5" key={k}>
      <Label htmlFor={`option-${k}`}>{OPTIONS[k].name}</Label>
      <NativeSelect id={`option-${k}`} name={k} className="w-full" value={options[k]} onChange={(e) => setOptions({ ...options, [k]: e.target.value })}>
        {OPTIONS[k].values.map((v) => (
          <option key={v} value={v}>{valueText(k, v, options)}</option>
        ))}
      </NativeSelect>
    </div>
  );

  const keys = buildKeymap(options, view);
  // A held thumb key wins over the toggle, and the toggle shows again on release.
  const highlight = heldKey !== null ? keys[heldKey].holdLayer ?? null : toggled;
  const firmware = options.firmware as Firmware;
  const parts = snippets(options);
  const allNotes = notes(options, view);
  const warnings = allNotes.filter((n) => n.kind === "warning");
  const infos = allNotes.filter((n) => n.kind === "info");

  return (
    <main className="mx-auto max-w-240 px-4 pb-12">
      <h1 className="my-6 text-3xl font-semibold">Miryoku Visualizer</h1>
      <p>
        Preview the <a className={link} href="https://github.com/manna-harbour/miryoku">Miryoku</a> layout for the compile options you
        pick. Press and hold a thumb key to see its layer.
      </p>

      <fieldset className="mb-6">
        <legend className="mb-2 text-lg font-medium">View</legend>
        <p className="mb-2 text-sm text-muted-foreground">Changes what the app shows. These are not passed to the firmware build.</p>
        <div className={grid}>
          {VIEW_KEYS.map(optionField)}
          <div className="grid gap-1.5">
            <Label htmlFor="option-view">Base layer shown</Label>
            <NativeSelect id="option-view" name="view" className="w-full" value={view} onChange={(e) => setView(e.target.value as BaseView)}>
              <option value="base">Base</option>
              <option value="extra">Extra</option>
              <option value="tap">Tap</option>
            </NativeSelect>
          </div>
        </div>
      </fieldset>

      <fieldset className="mb-6">
        <legend className="mb-2 text-lg font-medium">Miryoku compile options</legend>
        <div className={grid}>
          {MIRYOKU_KEYS.map(optionField)}
          <Button
            type="button"
            variant="outline"
            onClick={() => setOptions({ ...DEFAULTS, firmware: options.firmware, labels: options.labels })}
          >
            Reset compile options
          </Button>
        </div>
      </fieldset>

      <section aria-label="Highlight a layer" className="my-4 flex flex-wrap gap-2">
        {LAYERS.map((l) => (
          <Button
            key={l}
            type="button"
            variant={highlight === l ? "default" : "outline"}
            aria-pressed={highlight === l}
            onClick={() => setToggled(toggled === l ? null : l)}
          >
            <span className="size-2.5 rounded-full" style={{ background: `var(--c-${l})` }} />
            {LAYER_NAMES[l]}
          </Button>
        ))}
      </section>

      <div className="keyboard-wrap">
        <Keyboard keys={keys} highlight={highlight} heldKey={heldKey} onHold={setHeldKey} />
      </div>

      <section aria-label="Firmware">
        <h2 className="mb-3 text-xl font-medium">Apply the options in {firmware}</h2>
        {warnings.map((n) => (
          <Alert key={n.text} variant="destructive" className="mb-4">
            <AlertDescription><strong>Warning: </strong>{n.text}</AlertDescription>
          </Alert>
        ))}
        <Alert className="mb-4">
          <AlertDescription>
            <ul className="list-disc pl-5">{infos.map((n) => <li key={n.text}>{n.text}</li>)}</ul>
          </AlertDescription>
        </Alert>
        {parts.length === 0 ? (
          <p className="mb-4">All options are the default, so {firmware} needs no extra configuration.</p>
        ) : (
          parts.map((s) => <Snippet key={s.title} {...s} />)
        )}
        <p className="mb-4">
          {FIRMWARE_LINKS[firmware].map((l, i) => (
            <span key={l.url}>{i > 0 && " · "}<a className={link} href={l.url}>{l.label}</a></span>
          ))}
        </p>
      </section>
      <footer className="mt-8">
        <p>
          <a className={link} href="https://github.com/chadluo/miryoku-visualizer">Source on GitHub</a>
        </p>
      </footer>
    </main>
  );
}
