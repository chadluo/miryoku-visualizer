import type { CSSProperties, PointerEvent } from "react";
import type { KeyModel, Layer } from "./keymap";

const KEY = 78;
const PITCH = 82;
const HAND_GAP = 28;
const PAD = 4;
const THUMB_DROP = 6;

/** Columns 0-4 are the left hand, 5-9 the right; thumb keys sit under columns 2-4 and 5-7. */
function position(i: number) {
  const [col, row] = i < 30 ? [i % 10, Math.floor(i / 10)] : [i - 30 + 2, 3];
  return {
    x: PAD + col * PITCH + (col >= 5 ? HAND_GAP : 0),
    y: PAD + row * PITCH + (row === 3 ? THUMB_DROP : 0),
  };
}

export const WIDTH = PAD * 2 + 10 * PITCH - (PITCH - KEY) + HAND_GAP;
export const HEIGHT = PAD * 2 + 3 * PITCH + THUMB_DROP + KEY;

interface Props {
  keys: KeyModel[];
  highlight: Layer | null;
  heldKey: number | null;
  onHold: (key: number | null) => void;
}

export default function Keyboard({ keys, highlight, heldKey, onHold }: Props) {
  // Highlighting only changes colour, background and opacity of labels, never size, weight or position.
  const cls = (layer: Layer, extra = "") => `label${extra}` + (highlight ? (highlight === layer ? " hl" : " dim") : "");

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="keyboard" role="img" aria-label="Miryoku keyboard layout">
      {keys.map((k, i) => {
        const { x, y } = position(i);
        const holdable = k.holdLayer !== undefined;
        const bind = holdable
          ? {
              onPointerDown: (e: PointerEvent) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                onHold(i);
              },
              onPointerUp: () => onHold(null),
              onPointerCancel: () => onHold(null),
              onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
            }
          : {};
        return (
          <g
            key={i}
            transform={`translate(${x} ${y})`}
            className={"key" + (holdable ? " holdable" : "") + (heldKey === i ? " held" : "")}
            style={heldKey === i ? ({ "--tint": `var(--c-${k.holdLayer})` } as CSSProperties) : undefined}
            {...bind}
          >
            <title>{k.tip}</title>
            <rect width={KEY} height={KEY} rx={6} />
            <text x={5} y={17} className={cls("base", " base")} data-layer="base">{k.base}</text>
            {k.corners.tr && <text x={KEY - 5} y={16} textAnchor="end" className={cls(k.corners.tr.layer)} data-layer={k.corners.tr.layer}>{k.corners.tr.text}</text>}
            {k.button && <text x={KEY / 2} y={KEY / 2 + 3} textAnchor="middle" className={cls("button", " button")} data-layer="button">{k.button}</text>}
            {k.corners.bl && <text x={5} y={KEY - 15} className={cls(k.corners.bl.layer)} data-layer={k.corners.bl.layer}>{k.corners.bl.text}</text>}
            {k.corners.br && <text x={KEY - 5} y={KEY - 15} textAnchor="end" className={cls(k.corners.br.layer)} data-layer={k.corners.br.layer}>{k.corners.br.text}</text>}
            {k.hold && <text x={KEY / 2} y={KEY - 4} textAnchor="middle" className={cls(k.holdLayer ?? "base", " hold")} data-layer={k.holdLayer ?? "base"}>{k.hold}</text>}
          </g>
        );
      })}
    </svg>
  );
}
