type Json = unknown;
const isObj = (x: Json): x is Record<string, Json> => typeof x === "object" && x !== null && !Array.isArray(x);

/** Defaults overlaid with stored overrides. Objects merge key by key, arrays/leaves are replaced. */
export function deepMerge<T>(base: T, override: Json): T {
  if (override === undefined || override === null) return base;
  if (isObj(base) && isObj(override)) {
    const out: Record<string, Json> = { ...base };
    for (const k of Object.keys(override)) out[k] = deepMerge((base as Record<string, Json>)[k], override[k]);
    return out as T;
  }
  return override as T;
}

/** The smallest override that turns `base` into `edited` (undefined when identical). */
export function deepDiff(base: Json, edited: Json): Json {
  if (isObj(base) && isObj(edited)) {
    const out: Record<string, Json> = {};
    for (const k of Object.keys(edited)) {
      const d = deepDiff(base[k], edited[k]);
      if (d !== undefined) out[k] = d;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return JSON.stringify(base) === JSON.stringify(edited) ? undefined : edited;
}
