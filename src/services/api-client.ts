/**
 * Korea Transit MCP Server - API Client
 *
 * 공통 API 요청 및 에러 처리 유틸리티
 */

import { DEFAULT_TIMEOUT, CHARACTER_LIMIT } from "../constants.js";

// ===== 에러 타입 =====

/** API 에러 클래스 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly endpoint?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** 타임아웃 에러 클래스 */
export class TimeoutError extends Error {
  constructor(message: string, public readonly timeout: number) {
    super(message);
    this.name = "TimeoutError";
  }
}

// ===== API 요청 함수 =====

/** API 요청 옵션 */
export interface FetchOptions {
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * 타임아웃이 적용된 fetch 요청
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, headers = {} } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        ...headers
      }
    });

    if (!response.ok) {
      throw new ApiError(
        `API 요청 실패: ${response.status} ${response.statusText}`,
        response.status,
        url
      );
    }

    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new TimeoutError(`요청 시간 초과 (${timeout}ms)`, timeout);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * JSON 응답을 가져오는 fetch 요청
 */
export async function fetchJson<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await fetchWithTimeout(url, options);
  return response.json() as Promise<T>;
}

// ===== 응답 처리 유틸리티 =====

/**
 * 문자열 길이 제한 및 truncation
 */
export function truncateResponse(
  content: string,
  limit: number = CHARACTER_LIMIT
): string {
  if (content.length <= limit) {
    return content;
  }

  const truncated = content.slice(0, limit - 100);
  return `${truncated}\n\n... (응답이 ${limit.toLocaleString()}자 제한으로 잘렸습니다)`;
}

/**
 * 에러를 사용자 친화적인 메시지로 변환
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.statusCode === 404) {
      return "요청한 데이터를 찾을 수 없습니다.";
    }
    if (error.statusCode === 429) {
      return "API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
    }
    if (error.statusCode && error.statusCode >= 500) {
      return "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    }
    return error.message;
  }

  if (error instanceof TimeoutError) {
    return "요청 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.";
  }

  if (error instanceof Error) {
    return `오류 발생: ${error.message}`;
  }

  return "알 수 없는 오류가 발생했습니다.";
}

/**
 * MCP 도구 응답 생성
 */
export function createToolResponse(
  content: string,
  isError: boolean = false
): { content: Array<{ type: "text"; text: string }>; isError: boolean } {
  const truncatedContent = truncateResponse(content);

  return {
    content: [{ type: "text" as const, text: truncatedContent }],
    isError
  };
}

/**
 * 에러 응답 생성
 */
export function createErrorResponse(error: unknown): {
  content: Array<{ type: "text"; text: string }>;
  isError: boolean;
} {
  const message = formatErrorMessage(error);
  return createToolResponse(`❌ ${message}`, true);
}
