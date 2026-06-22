// Stub exports — Types are sourced from Prisma via @cddas/database
export type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginationQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};
