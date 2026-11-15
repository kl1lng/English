// Replaces raw hex colours in CSS with design tokens, by property and by lightness.
// Gradients, images, shadows, filters and colours with alpha are left alone.
const SKIP_PROPS = /^(box-shadow|text-shadow|filter|backdrop-filter|fill|stroke|mask|-webkit-mask)/;
const HEX = /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b(?![0-9a-fA-F])/g;

function parse(hex) {
  let h = hex.slice(1).toLowerCase();
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let hue = 0;
  if (d) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue = (hue * 60 + 360) % 360;
  }
  return { hex: `#${h}`, l, s, hue };
}

const isBorder = (p) => /^(border|outline)(-(top|right|bottom|left))?(-color)?$/.test(p);

function tokenFor(prop, hex, single) {
  const c = parse(hex);
  if (c.hex === "#4d8be8") return "var(--primary)";
  if (c.hex === "#2f6bc4") return "var(--primary-strong)";
  if (c.hex === "#f69a62") return "var(--accent)";
  if (c.hex === "#4eb69b") return "var(--success)";
  if (prop === "color") {
    if (c.hex === "#ffffff") return "var(--on-primary)";
    if (c.hex === "#9a4b12") return "var(--warn-text)";
    if (c.hex === "#2f7f6a") return "var(--success-strong)";
    // Only the blue-grey family used for text (hue ~195-235). Green, purple and warm greys stay.
    if (c.s >= 0.35 || c.hue < 195 || c.hue > 235) return null;
    if (c.l < 0.2) return "var(--text-strong)";
    if (c.l < 0.3) return "var(--text)";
    if (c.l < 0.39) return "var(--text-soft)";
    if (c.l < 0.5) return "var(--text-muted)";
    if (c.l < 0.75) return "var(--muted)";
    return null;
  }
  if (single && (prop === "background" || prop === "background-color")) {
    if (c.hex === "#ffffff") return "var(--surface)";
    if (c.hex === "#f5f8fc") return "var(--bg)";
    if (c.hex === "#edf5ff") return "var(--surface-2)";
    if (c.hex === "#eaf7f3") return "var(--success-bg)";
    if (c.hex === "#fff3ea") return "var(--warn-bg)";
    if (c.l >= 0.975 && c.s < 0.6) return "var(--surface)";
    if (c.l >= 0.93 && c.l < 0.975 && c.hue >= 200 && c.hue <= 235) return "var(--surface-2)";
    return null;
  }
  if (isBorder(prop)) {
    if (c.hex === "#edf0f4") return "var(--border)";
    if (c.l >= 0.85 && c.s < 0.5 && c.hex !== "#ffffff") return "var(--border)";
  }
  return null;
}

export function tokenizeCss(css) {
  let replaced = 0;
  const out = css.replace(/([a-zA-Z-]+)\s*:\s*([^;{}]*)/g, (whole, prop, value) => {
    const p = prop.toLowerCase();
    if (SKIP_PROPS.test(p) || /gradient|url\(|var\(--[a-z-]+\)\s*$/.test(value) && !HEX.test(value)) {
      HEX.lastIndex = 0;
      return whole;
    }
    HEX.lastIndex = 0;
    const hexes = value.match(HEX);
    HEX.lastIndex = 0;
    if (!hexes || /gradient|url\(/.test(value)) return whole;
    const single = hexes.length === 1 && value.trim() === hexes[0];
    const next = value.replace(HEX, (hex) => {
      const token = tokenFor(p, hex, single);
      if (!token) return hex;
      replaced += 1;
      return token;
    });
    return whole.slice(0, whole.length - value.length) + next;
  });
  const remaining = (out.match(HEX) || []).length;
  HEX.lastIndex = 0;
  return { css: out, replaced, remaining };
}
