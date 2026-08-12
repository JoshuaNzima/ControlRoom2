/**
 * Eliminates safe-value boilerplate by returning a default when the
 * provided value is null/undefined, or the value itself.
 *
 * Usage:
 *   const name = useDefaults(props.name, 'Unnamed');
 *   const { counters } = useDefaults(page.props, {});
 */
export function useDefaults<T>(value: T | null | undefined, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  return value;
}

/**
 * Deep-merge a nullable value with defaults — returns value with missing
 * keys filled from defaults. Both must be plain objects.
 */
export function useDefaultsDeep<T extends Record<string, any>>(
  value: T | null | undefined,
  defaults: T,
): T {
  if (!value) return { ...defaults };
  const result: Record<string, any> = { ...defaults, ...value };
  for (const key of Object.keys(value)) {
    const v = value[key];
    const d = defaults[key];
    if (v !== null && v !== undefined && typeof v === 'object' && !Array.isArray(v) && typeof d === 'object' && !Array.isArray(d)) {
      result[key] = useDefaultsDeep(v as any, d as any);
    }
  }
  return result as T;
}

/**
 * useDefaults wrapper for counters – avoids repeated `?? {}` or `?? 0` patterns.
 */
export function useCounter(key: string, counters?: Record<string, any>): number {
  return counters?.[key] ?? 0;
}

export default useDefaults;
