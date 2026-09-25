# Miryoku Visualizer

A web app that shows the Miryoku keyboard layout for a set of compile options and firmware.

## Language

**Key**:
One of the 36 physical positions of the Miryoku core (3×5 per hand plus 3 thumb keys per hand).
_Avoid_: button, switch

**Layer**:
A named set of key functions: Base, Nav, Mouse, Media, Num, Sym, Fun, Button.
_Avoid_: mode, level

**Base layer**:
The layer active when no layer key is held.

**Layer label**:
The text a key shows for one layer, drawn in that layer's fixed position on the key.

**Hold behavior**:
What a key does when held instead of tapped: a modifier (home-row mods) or a layer activation (thumb keys).
_Avoid_: mod-tap (firmware term)

**Highlight**:
The state where one layer is emphasized on the keyboard and the other layer labels are dimmed. The layout does not change.

**Compile option**:
A Miryoku build setting, such as `MIRYOKU_ALPHAS` or `MIRYOKU_NAV`, with one selected value.

**Firmware**:
The keyboard firmware that builds Miryoku: QMK or ZMK.
