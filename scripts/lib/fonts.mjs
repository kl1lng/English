// Lifts font sizes under 12px to the smallest type token (--fs-xs, 12px).
export function raiseFontSizes(css) {
  let changed = 0;
  const out = css.replace(/(font-size:\s*)(\d+(?:\.\d+)?)px/g, (whole, head, size) => {
    if (Number(size) >= 12) return whole;
    changed += 1;
    return `${head}var(--fs-xs)`;
  });
  return { css: out, changed };
}
