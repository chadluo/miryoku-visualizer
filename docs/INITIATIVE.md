# Miryoku Visualizer

## Background

[Miryoku](https://github.com/manna-harbour/miryoku) is an ergonomic, minimal, orthogonal, and universal keyboard layout.

Miryoku supports customisations including base key layouts, nav keys, clipboard and flips. Together with its own layers
it could be hardto track the key combinations.

We want to create an app to visualize the key layout, so the user can preview the layout with different compile options
and under different layers.

## Goals

A web app showing the keyboard layout and different compile options.

For the keyboard layout:

- Consider using SVG to render
- Show keys from different layers to different corners of the key
- Add extra buttons to highlight certain layers
- When click and holding on thumb keys, highlight the corresponding layer as well.

For compile options:

- When selecting the different options, the keyboard layout should change to reflect the selected layout.
- The compile options should include an option for different firmware (starting with QMK and ZMK) and selecting each can
  show how to apply these options.

## Relevant info

- [Miryoku Reference Manual](https://github.com/manna-harbour/miryoku/blob/master/docs/reference/readme.org) higher
  level explanations
- [Miryoku QMK](https://github.com/manna-harbour/miryoku_qmk/tree/miryoku/users/manna-harbour_miryoku) Miryoku
  implementation and config for QMK firmware
- [Miryoku ZMK](https://github.com/manna-harbour/miryoku_zmk) Miryoku implementation and config for ZMK firmware
