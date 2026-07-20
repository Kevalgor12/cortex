// Ref callback that writes CSS custom properties onto an element. Reach for it
// when a value is generated at runtime - a live fraction, a random colour, a
// computed position - and so cannot live in a static stylesheet. The stylesheet
// still owns the actual declaration (background, transform, ...); this only
// feeds it the value.
export function cssVars(vars: Record<string, string | number>) {
  return (el: HTMLElement | SVGElement | null) => {
    if (!el) return;
    for (const name in vars) el.style.setProperty(name, String(vars[name]));
  };
}
