import { palette } from "./palette";

export const colors = palette;

/** A palette colour at the given opacity, e.g. tint(colors.primary, 0.14) for icon backgrounds. */
export function tint(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
