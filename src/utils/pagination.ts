export interface PaginationParams {
  page: number;
  pageSize: number;
  offset: number;
  limit: number; // last row index (inclusive), for supabase .range()
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
  const rawPageSize = parseInt(String(query.pageSize ?? DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(Math.max(1, rawPageSize), MAX_PAGE_SIZE);
  const offset = (page - 1) * pageSize;
  const limit = offset + pageSize - 1;
  return { page, pageSize, offset, limit };
}

export function buildPaginatedResponse<T>(
  data: T[],
  count: number | null,
  pagination: PaginationParams
) {
  const total = count ?? data.length;
  return {
    data,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      totalPages: Math.ceil(total / pagination.pageSize),
    },
  };
}