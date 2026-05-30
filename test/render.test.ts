import { test, expect } from "bun:test";
import { FG, center, clip, color, padTo, paint, visibleWidth } from "../arcade/render.ts";

test("visibleWidth ignores ANSI escape sequences", () => {
  expect(visibleWidth(color("ABCDE", FG.red))).toBe(5);
  expect(visibleWidth("plain")).toBe(5);
});

test("clip truncates to visible columns and keeps colors intact", () => {
  const clipped = clip(color("ABCDEFGH", FG.green), 3);
  expect(visibleWidth(clipped)).toBe(3);
  // The leading color escape must still be present so nothing leaks uncolored.
  expect(clipped.startsWith("\x1b[")).toBe(true);
});

test("clip never exceeds the limit even with many escapes", () => {
  const styled = color("X", FG.red) + color("Y", FG.green) + color("Z", FG.blue);
  expect(visibleWidth(clip(styled, 2))).toBe(2);
});

test("padTo and center extend to the requested width", () => {
  expect(visibleWidth(padTo("ab", 6))).toBe(6);
  expect(visibleWidth(center("ab", 6))).toBe(4); // left pad only (2) + content (2)
  expect(center("ab", 6).startsWith("  ")).toBe(true);
});

test("paint positions every line and clears below", () => {
  const out = paint(["line one", "line two"], { cols: 20, rows: 10 });
  expect(out).toContain("\x1b[1;1H");
  expect(out).toContain("\x1b[2;1H");
  expect(out.endsWith("\x1b[J")).toBe(true);
  // Each line is cleared to end-of-line to avoid leftover characters.
  expect(out).toContain("\x1b[K");
});

test("paint clips lines wider than the viewport", () => {
  const wide = "x".repeat(100);
  const out = paint([wide], { cols: 10, rows: 5 });
  const body = out.split("\x1b[1;1H")[1].split("\x1b[")[0];
  expect(body.length).toBe(10);
});
