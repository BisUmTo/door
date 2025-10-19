import { Link } from "react-router-dom";
import { getDoorTypeDefinitions } from "@/data/doorTypes";
import {
  adjustHexColor,
  doorBaseColors,
  getReadableTextColor
} from "@/theme/doorColors";

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

const toRgba = (hexColor: string, alpha: number) => {
  const { r, g, b } = hexToRgb(hexColor);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

const contrastRatio = (foreground: string, background: string) => {
  const fg = normalizeHex(foreground);
  const bg = normalizeHex(background);
  const lum1 = relativeLuminance(fg);
  const lum2 = relativeLuminance(bg);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
};

const mixHexColor = (source: string, target: string, weight: number) => {
  const start = hexToRgb(source);
  const end = hexToRgb(target);
  const mix = (channelStart: number, channelEnd: number) =>
    Math.round(channelStart + (channelEnd - channelStart) * weight);
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(mix(start.r, end.r))}${toHex(mix(start.g, end.g))}${toHex(
    mix(start.b, end.b)
  )}`;
};

const ensureReadableForeground = (
  foreground: string,
  background: string,
  preference: "auto" | "lighter" | "darker" = "auto",
  minRatio = 4.5
) => {
  const baseBackground = normalizeHex(background);
  const bgLum = relativeLuminance(baseBackground);
  const normalizedForeground = normalizeHex(foreground);
  const resolveTarget = () => {
    if (preference === "lighter") return "#ffffff";
    if (preference === "darker") return "#000000";
    return bgLum > 0.5 ? "#000000" : "#ffffff";
  };

  if (contrastRatio(normalizedForeground, baseBackground) >= minRatio) {
    return normalizedForeground;
  }

  const target = resolveTarget();
  for (let step = 0.15; step <= 1; step += 0.1) {
    const candidate = mixHexColor(normalizedForeground, target, step);
    if (contrastRatio(candidate, baseBackground) >= minRatio) {
      return candidate;
    }
  }
  return target;
};

const buildCardPalette = (doorType: keyof typeof doorBaseColors) => {
  const base = doorBaseColors[doorType];
  const backgroundStart = normalizeHex(adjustHexColor(base, 0.18));
  const backgroundEnd = normalizeHex(adjustHexColor(base, -0.35));
  const borderColor = normalizeHex(adjustHexColor(base, -0.5));

  const primaryBase = getReadableTextColor(backgroundEnd);
  const primaryText = ensureReadableForeground(primaryBase, backgroundEnd, "auto", 5);
  const isDarkBackground = primaryText === "#f8fafc";

  const secondaryBase = adjustHexColor(primaryText, isDarkBackground ? -0.25 : -0.4);
  const secondaryText = ensureReadableForeground(
    secondaryBase,
    backgroundEnd,
    isDarkBackground ? "lighter" : "darker",
    4.2
  );

  const subtleBase = adjustHexColor(primaryText, isDarkBackground ? -0.4 : -0.55);
  const subtleText = ensureReadableForeground(
    subtleBase,
    backgroundEnd,
    isDarkBackground ? "lighter" : "darker",
    3.6
  );

  const pillBackground = normalizeHex(adjustHexColor(base, isDarkBackground ? -0.2 : 0.28));
  const pillText = ensureReadableForeground(getReadableTextColor(pillBackground), pillBackground);
  const pillBorder = normalizeHex(adjustHexColor(pillBackground, -0.3));

  const panelBackground = normalizeHex(adjustHexColor(base, isDarkBackground ? -0.65 : 0.42));
  const panelBorder = normalizeHex(adjustHexColor(panelBackground, -0.22));
  const panelText = ensureReadableForeground(
    adjustHexColor(primaryText, isDarkBackground ? -0.18 : -0.3),
    panelBackground,
    isDarkBackground ? "lighter" : "darker",
    4.5
  );
  const panelLabel = ensureReadableForeground(
    adjustHexColor(primaryText, isDarkBackground ? -0.35 : -0.5),
    panelBackground,
    isDarkBackground ? "lighter" : "darker",
    3.8
  );

  return {
    backgroundStart,
    backgroundEnd,
    borderColor,
    shadow: toRgba(base, 0.35),
    primaryText,
    secondaryText,
    subtleText,
    pillBackground,
    pillText,
    pillBorder,
    panelBackground,
    panelBorder,
    panelText,
    panelLabel
  };
};

const DoorTypesRoute = () => {
  const definitions = getDoorTypeDefinitions();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0c10] via-[#101321] to-[#050608] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-8 px-6 py-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <h1 className="text-4xl font-display uppercase tracking-[0.5em] text-white/80">
              Tipologia Porte
            </h1>
            <p className="mt-2 text-sm text-white/60">
              Ogni porta offre ricompense uniche e può bloccarne temporaneamente altre.
            </p>
          </div>
          <Link
            to="/lobby"
            className="rounded-full border border-white/30 px-5 py-2 text-xs uppercase tracking-[0.35em] text-white/70 transition hover:border-accent hover:text-accent"
          >
            Torna alla lobby
          </Link>
        </header>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur lg:grid-cols-2">
          {definitions.map((definition) => {
            const palette = buildCardPalette(definition.type);
            return (
              <article
                key={definition.type}
                className="flex h-full flex-col gap-4 rounded-3xl border p-5 shadow-lg transition-transform duration-200 hover:-translate-y-1"
                style={{
                  background: `linear-gradient(135deg, ${palette.backgroundStart}, ${palette.backgroundEnd})`,
                  borderColor: palette.borderColor,
                  color: palette.primaryText,
                  boxShadow: `0 18px 28px ${palette.shadow}`
                }}
              >
                <header className="flex items-baseline justify-between gap-3">
                  <h2
                    className="text-xl font-semibold uppercase tracking-[0.35em]"
                    style={{ color: palette.primaryText }}
                  >
                    {definition.name}
                  </h2>
                  <span
                    className="rounded-full border px-3 py-1 text-xs uppercase tracking-[0.35em]"
                    style={{
                      backgroundColor: palette.pillBackground,
                      borderColor: palette.pillBorder,
                      color: palette.pillText
                    }}
                  >
                    {definition.type}
                  </span>
                </header>
                <p className="text-sm" style={{ color: palette.secondaryText }}>
                  {definition.summary}
                </p>
                <div>
                  <h3
                    className="text-xs uppercase tracking-[0.35em]"
                    style={{ color: palette.subtleText }}
                  >
                    Ricompense
                  </h3>
                  <ul
                    className="mt-2 list-disc space-y-1 pl-5 text-sm"
                    style={{ color: palette.secondaryText }}
                  >
                    {definition.uniqueRewards.map((reward) => (
                      <li key={reward}>{reward}</li>
                    ))}
                  </ul>
                </div>
                <div
                  className="mt-auto rounded-2xl border p-3 text-xs"
                  style={{
                    backgroundColor: palette.panelBackground,
                    borderColor: palette.panelBorder,
                    color: palette.panelText
                  }}
                >
                  <span
                    className="block uppercase tracking-[0.35em]"
                    style={{ color: palette.panelLabel }}
                  >
                    Contrasti
                  </span>
                  <p className="mt-1 text-sm" style={{ color: palette.panelText }}>
                    {definition.conflicts}
                  </p>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
};

export default DoorTypesRoute;
