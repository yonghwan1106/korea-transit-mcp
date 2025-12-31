/**
 * Korea Transit MCP Server - Pagination
 *
 * 서울 열린데이터광장 API 페이지네이션 유틸리티
 */

import { fetchJson } from "./api-client.js";
import { PAGINATION } from "../constants.js";

// ===== 타입 정의 =====

/** 서울 열린데이터 API 응답 형식 */
export interface SeoulApiResponse<T> {
  [key: string]: {
    list_total_count: number;
    RESULT: {
      CODE: string;
      MESSAGE: string;
    };
    row: T[];
  };
}

/** 페이지네이션 옵션 */
export interface PaginationOptions {
  /** 최대 조회 개수 */
  limit?: number;
  /** API 키 이름 (응답 JSON의 루트 키) */
  apiKey: string;
  /** 요청 타임아웃 (ms) */
  timeout?: number;
}

/** 페이지네이션 결과 */
export interface PaginatedResult<T> {
  /** 조회된 데이터 */
  items: T[];
  /** 총 데이터 개수 */
  totalCount: number;
  /** 실제 반환된 개수 */
  returnedCount: number;
}

// ===== 페이지네이션 함수 =====

/**
 * 서울 열린데이터 API 페이지네이션 조회
 *
 * @param baseUrl - 기본 API URL (start/end 인덱스 전까지)
 * @param options - 페이지네이션 옵션
 * @returns 페이지네이션된 결과
 *
 * @example
 * ```typescript
 * const result = await fetchPaginatedData<SubwayArrival>(
 *   "http://openAPI.seoul.go.kr:8088/API_KEY/json/realtimeStationArrival",
 *   { limit: 10, apiKey: "realtimeStationArrival" }
 * );
 * ```
 */
export async function fetchPaginatedData<T>(
  baseUrl: string,
  options: PaginationOptions
): Promise<PaginatedResult<T>> {
  const { limit = PAGINATION.DEFAULT_LIMIT, apiKey, timeout } = options;
  const effectiveLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

  // 첫 페이지 요청으로 전체 개수 확인
  const firstPageUrl = `${baseUrl}/1/${effectiveLimit}`;
  const response = await fetchJson<SeoulApiResponse<T>>(firstPageUrl, { timeout });

  const apiData = response[apiKey];

  if (!apiData) {
    return { items: [], totalCount: 0, returnedCount: 0 };
  }

  // 에러 응답 처리
  if (apiData.RESULT.CODE !== "INFO-000") {
    // INFO-200: 데이터 없음
    if (apiData.RESULT.CODE === "INFO-200") {
      return { items: [], totalCount: 0, returnedCount: 0 };
    }
    throw new Error(`API 오류: ${apiData.RESULT.MESSAGE}`);
  }

  const items = apiData.row || [];
  const totalCount = apiData.list_total_count;

  return {
    items: items.slice(0, effectiveLimit),
    totalCount,
    returnedCount: Math.min(items.length, effectiveLimit)
  };
}

/**
 * 여러 페이지에 걸쳐 데이터 조회 (대량 데이터용)
 *
 * @param baseUrl - 기본 API URL
 * @param options - 페이지네이션 옵션
 * @param maxPages - 최대 페이지 수 (기본값: 5)
 * @returns 모든 페이지의 데이터
 */
export async function fetchAllPages<T>(
  baseUrl: string,
  options: PaginationOptions,
  maxPages: number = 5
): Promise<PaginatedResult<T>> {
  const { limit = PAGINATION.MAX_LIMIT, apiKey, timeout } = options;
  const pageSize = PAGINATION.PAGE_SIZE;

  const allItems: T[] = [];
  let totalCount = 0;
  let currentPage = 1;

  while (currentPage <= maxPages && allItems.length < limit) {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(start + pageSize - 1, limit);

    const url = `${baseUrl}/${start}/${end}`;
    const response = await fetchJson<SeoulApiResponse<T>>(url, { timeout });
    const apiData = response[apiKey];

    if (!apiData || apiData.RESULT.CODE !== "INFO-000") {
      break;
    }

    totalCount = apiData.list_total_count;
    const items = apiData.row || [];

    if (items.length === 0) {
      break;
    }

    allItems.push(...items);

    // 더 이상 데이터가 없거나 limit에 도달한 경우 중단
    if (items.length < pageSize || allItems.length >= totalCount) {
      break;
    }

    currentPage++;
  }

  const limitedItems = allItems.slice(0, limit);

  return {
    items: limitedItems,
    totalCount,
    returnedCount: limitedItems.length
  };
}

/**
 * 검색어를 URL에 안전하게 인코딩
 */
export function encodeSearchQuery(query: string): string {
  return encodeURIComponent(query.trim());
}
