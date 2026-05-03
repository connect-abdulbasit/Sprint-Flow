export type PaginationInput = {
  page: number;
  pageSize: number;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export function parsePaginationParams(
  searchParams: URLSearchParams,
  options?: {
    defaultPage?: number;
    defaultPageSize?: number;
    maxPageSize?: number;
  }
): PaginationInput {
  const defaultPage = options?.defaultPage ?? 1;
  const defaultPageSize = options?.defaultPageSize ?? 20;
  const maxPageSize = options?.maxPageSize ?? 100;

  const pageParam = Number.parseInt(searchParams.get("page") ?? String(defaultPage), 10);
  const pageSizeParam = Number.parseInt(searchParams.get("limit") ?? String(defaultPageSize), 10);

  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : defaultPage;
  const pageSize =
    Number.isFinite(pageSizeParam) && pageSizeParam > 0
      ? Math.min(pageSizeParam, maxPageSize)
      : defaultPageSize;

  return { page, pageSize };
}

export function buildPaginationMeta(pagination: PaginationInput, total: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));
  return {
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    totalPages,
    hasPreviousPage: pagination.page > 1,
    hasNextPage: pagination.page < totalPages,
  };
}

export function paginateArray<T>(items: T[], pagination: PaginationInput) {
  const start = (pagination.page - 1) * pagination.pageSize;
  const pagedItems = items.slice(start, start + pagination.pageSize);
  return {
    items: pagedItems,
    pagination: buildPaginationMeta(pagination, items.length),
  };
}
