/**
 * Normalize Laravel paginator data regardless of format.
 *
 * Laravel's paginator (via Inertia) can return data in multiple formats:
 * 1. Top-level: { data: [], current_page, last_page, total, per_page, from, to, links }
 * 2. Nested meta: { data: [], meta: { current_page, last_page, ... }, links: [...] }
 * 3. Plain array: [...] (no pagination)
 *
 * This helper normalizes all formats into a consistent shape.
 */

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface NormalizedPagination<T = any> {
  data: T[];
  meta: PaginationMeta;
}

const DEFAULT_PER_PAGE = 20;

export function normalizePagination<T = any>(
  raw: any,
  perPageFallback: number = DEFAULT_PER_PAGE
): NormalizedPagination<T> {
  // Handle null/undefined
  if (!raw) {
    return {
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: perPageFallback, total: 0, from: 0, to: 0 },
    };
  }

  // Handle plain array (no pagination)
  if (Array.isArray(raw)) {
    return {
      data: raw as T[],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: raw.length || perPageFallback,
        total: raw.length,
        from: raw.length > 0 ? 1 : 0,
        to: raw.length,
      },
    };
  }

  const dataArr: T[] = Array.isArray(raw.data) ? raw.data : [];

  // Try nested meta first (Inertia resource format)
  if (raw.meta && typeof raw.meta === 'object' && (raw.meta.current_page || raw.meta.last_page)) {
    const m = raw.meta;
    return {
      data: dataArr,
      meta: {
        current_page: Number(m.current_page ?? 1),
        last_page: Number(m.last_page ?? 1),
        per_page: Number(m.per_page ?? perPageFallback),
        total: Number(m.total ?? dataArr.length),
        from: Number(m.from ?? (dataArr.length > 0 ? 1 : 0)),
        to: Number(m.to ?? dataArr.length),
      },
    };
  }

  // Try top-level keys (Laravel default paginator format)
  if (raw.current_page !== undefined || raw.last_page !== undefined || raw.total !== undefined) {
    const currentPage = Number(raw.current_page ?? 1);
    const perPage = Number(raw.per_page ?? perPageFallback);
    return {
      data: dataArr,
      meta: {
        current_page: currentPage,
        last_page: Number(raw.last_page ?? 1),
        per_page: perPage,
        total: Number(raw.total ?? dataArr.length),
        from: Number(raw.from ?? (dataArr.length > 0 ? (currentPage - 1) * perPage + 1 : 0)),
        to: Number(raw.to ?? (dataArr.length > 0 ? (currentPage - 1) * perPage + dataArr.length : 0)),
      },
    };
  }

  // Fallback: treat as single-page data
  return {
    data: dataArr,
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: perPageFallback,
      total: dataArr.length,
      from: dataArr.length > 0 ? 1 : 0,
      to: dataArr.length,
    },
  };
}
