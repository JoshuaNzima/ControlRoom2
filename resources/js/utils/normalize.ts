// Recursive utility to convert object keys from snake_case to camelCase
export function toCamel(s: string): string {
  return s.replace(/[_-][a-z]/g, (match) => match.charAt(1).toUpperCase());
}

export function normalizeObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(normalizeObject);
  if (typeof obj !== 'object') return obj;

  const out: any = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const camelKey = toCamel(key);
    out[camelKey] = normalizeObject(value);
  }
  return out;
}

export default normalizeObject;
