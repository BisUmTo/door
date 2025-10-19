import type { CSSProperties } from "react";
import type { DoorType } from "@/game/types";

export const doorBaseColors: Record<DoorType, string> = {
  white: "#e5e5e5",
  black: "#1f2937",
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#facc15",
  purple: "#a855f7",
  blue: "#3b82f6",
  lightBlue: "#22d3ee",
  brown: "#92400e",
  lime: "#84cc16",
  green: "#059669",
  neutral: "#9ca3af"
};

const normalizeHex = (hexColor: string) => {
  const value = hexColor.trim();
  if (!value.startsWith("#")) {
    return normalizeHex(`#${value}`);
  }
  if (value.length === 4) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`.toLowerCase();
  }
  return value.toLowerCase();
};

const hexToRgb = (hexColor: string) => {
  const normalized = normalizeHex(hexColor).replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return { r, g, b };
};

export const adjustHexColor = (hexColor: string, amount: number) => {
  const { r, g, b } = hexToRgb(hexColor);
  const mixTarget = amount >= 0 ? 255 : 0;
  const pct = Math.min(Math.abs(amount), 1);
  const mix = (channel: number) => Math.round(channel + (mixTarget - channel) * pct);
  const channels =
    amount >= 0
      ? { r: mix(r), g: mix(g), b: mix(b) }
      : {
          r: Math.round(r * (1 - pct)),
          g: Math.round(g * (1 - pct)),
          b: Math.round(b * (1 - pct))
        };
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(channels.r)}${toHex(channels.g)}${toHex(channels.b)}`;
};

const relativeLuminance = (hexColor: string) => {
  const { r, g, b } = hexToRgb(hexColor);
  const toLinear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const rLinear = toLinear(r);
  const gLinear = toLinear(g);
  const bLinear = toLinear(b);
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
};

export const getReadableTextColor = (hexColor: string) => {
  return relativeLuminance(hexColor) > 0.5 ? "#0f172a" : "#f8fafc";
};

const hexToRgba = (hexColor: string, alpha: number) => {
  const { r, g, b } = hexToRgb(hexColor);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export interface DoorBadgeStyleOptions {
  hovered?: boolean;
  backgroundShift?: number;
  borderShift?: number;
  includeShadow?: boolean;
  shadowOpacity?: number;
}

export const getDoorBadgeStyles = (
  doorType: DoorType,
  {
    hovered = false,
    backgroundShift,
    borderShift = -0.35,
    includeShadow,
    shadowOpacity = 0.32
  }: DoorBadgeStyleOptions = {}
): CSSProperties => {
  const baseColor = doorBaseColors[doorType];
  const effectiveBackgroundShift = backgroundShift ?? (hovered ? 0.12 : 0.04);
  const effectiveIncludeShadow = includeShadow ?? hovered;

  const backgroundColor = adjustHexColor(baseColor, effectiveBackgroundShift);
  const color = getReadableTextColor(backgroundColor);
  const borderColor = adjustHexColor(baseColor, borderShift);

  const styles: CSSProperties = {
    backgroundColor,
    color,
    borderColor
  };

  if (effectiveIncludeShadow) {
    styles.boxShadow = `0 10px 22px ${hexToRgba(baseColor, shadowOpacity)}`;
  }

  if (color === "#f8fafc") {
    styles.textShadow = "0 2px 6px rgba(0, 0, 0, 0.35)";
  }

  return styles;
};

