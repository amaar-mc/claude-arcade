// Terminal rendering primitives. Every frame is painted with absolute cursor
// positioning per line + clear-to-end-of-line + clear-below, which structurally
// prevents text overlap and leftover characters when lines shrink.

import type { View } from "./types.ts";

const ESC = "\x1b[";
export const RESET = `${ESC}0m`;
export const BOLD = `${ESC}1m`;
export const DIM = `${ESC}2m`;
export const ITALIC = `${ESC}3m`;
export const INVERSE = `${ESC}7m`;
export const HIDE_CURSOR = `${ESC}?25l`;
export const SHOW_CURSOR = `${ESC}?25h`;
export const CLEAR_SCREEN = `${ESC}2J${ESC}H`;

export const FG = {
  red: `${ESC}91m`,
  green: `${ESC}92m`,
  yellow: `${ESC}93m`,
  blue: `${ESC}94m`,
  magenta: `${ESC}95m`,
  cyan: `${ESC}96m`,
  white: `${ESC}97m`,
  gray: `${ESC}90m`,
} as const;

export const BG = {
  red: `${ESC}41m`,
  green: `${ESC}42m`,
  yellow: `${ESC}43m`,
  blue: `${ESC}44m`,
  magenta: `${ESC}45m`,
  gray: `${ESC}100m`,
} as const;

const ANSI_GLOBAL = /\x1b\[[0-9;?]*[A-Za-z]/g;
const ANSI_HEAD = /^\x1b\[[0-9;?]*[A-Za-z]/;

export function color(text: string, code: string): string {
  return `${code}${text}${RESET}`;
}

// Visible width: ANSI escapes contribute zero columns. The arcade deliberately
// uses only single-column glyphs inside aligned boards, so codepoint count is
// an accurate width here.
export function visibleWidth(text: string): number {
  return [...text.replace(ANSI_GLOBAL, "")].length;
}

// Truncate to at most `max` visible columns, preserving ANSI sequences so colors
// never leak past the cut. Stops content bleeding into the neighbouring pane.
export function clip(text: string, max: number): string {
  let out = "";
  let width = 0;
  let i = 0;
  while (i < text.length) {
    if (text[i] === "\x1b") {
      const m = text.slice(i).match(ANSI_HEAD);
      if (m !== null) {
        out += m[0];
        i += m[0].length;
        continue;
      }
    }
    if (width < max) {
      out += text[i];
      width += 1;
    }
    i += 1;
  }
  return out;
}

export function padTo(text: string, width: number): string {
  const w = visibleWidth(text);
  return w >= width ? text : text + " ".repeat(width - w);
}

export function center(text: string, width: number): string {
  const w = visibleWidth(text);
  if (w >= width) return text;
  return " ".repeat(Math.floor((width - w) / 2)) + text;
}

// Paint a full frame. Each line is positioned at an absolute row/col 1, clipped
// to the viewport width, reset, and cleared to end-of-line; the area below the
// last line is cleared too.
export function paint(lines: readonly string[], view: View): string {
  let out = `${ESC}H`;
  const n = Math.min(lines.length, view.rows);
  for (let i = 0; i < n; i++) {
    out += `${ESC}${i + 1};1H${clip(lines[i], view.cols)}${RESET}${ESC}K`;
  }
  out += `${ESC}J`;
  return out;
}
