/**
 * API 请求/响应相关类型定义
 */

// 成功响应
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: ApiMeta;
}

// 分页元数据
export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
}

// 错误响应
export interface ApiError {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, string[]>;
  };
}

// 错误代码
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

// 统一响应类型
export type ApiResult<T> = ApiResponse<T> | ApiError;

// 分页请求参数
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// 排序参数
export interface SortParams<T extends string = string> {
  sortBy?: T;
  sortOrder?: 'asc' | 'desc';
}

// 类型守卫
export function isApiError(result: ApiResult<unknown>): result is ApiError {
  return result.success === false;
}

export function isApiSuccess<T>(result: ApiResult<T>): result is ApiResponse<T> {
  return result.success === true;
}

// 创建成功响应
export function createSuccessResponse<T>(data: T, meta?: ApiMeta): ApiResponse<T> {
  return { success: true, data, meta };
}

// 创建错误响应
export function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, string[]>
): ApiError {
  return {
    success: false,
    error: { code, message, details },
  };
}
