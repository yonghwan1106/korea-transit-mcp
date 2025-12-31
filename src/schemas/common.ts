/**
 * Korea Transit MCP Server - Common Schemas
 *
 * 공통으로 사용되는 Zod 스키마 정의
 */

import { z } from "zod";
import { PAGINATION } from "../constants.js";

// ===== 응답 형식 Enum =====

/** 응답 형식 */
export enum ResponseFormat {
  /** Markdown 형식 (사람이 읽기 좋은 형태) */
  MARKDOWN = "markdown",
  /** JSON 형식 (구조화된 데이터) */
  JSON = "json"
}

// ===== 공통 스키마 =====

/** 응답 형식 스키마 */
export const ResponseFormatSchema = z.nativeEnum(ResponseFormat)
  .default(ResponseFormat.MARKDOWN)
  .describe("출력 형식: 'markdown'은 사람이 읽기 좋은 형태, 'json'은 구조화된 데이터");

/** 조회 개수 제한 스키마 */
export const LimitSchema = z.number()
  .int("정수만 입력 가능합니다")
  .min(1, "최소 1개 이상 조회해야 합니다")
  .max(PAGINATION.MAX_LIMIT, `최대 ${PAGINATION.MAX_LIMIT}개까지 조회 가능합니다`)
  .default(PAGINATION.DEFAULT_LIMIT)
  .describe(`조회할 최대 결과 수 (1-${PAGINATION.MAX_LIMIT}, 기본값: ${PAGINATION.DEFAULT_LIMIT})`);

/** 오프셋 스키마 */
export const OffsetSchema = z.number()
  .int("정수만 입력 가능합니다")
  .min(0, "offset은 0 이상이어야 합니다")
  .default(0)
  .describe("건너뛸 결과 수 (페이지네이션용)");

// ===== 타입 추출 =====

export type ResponseFormatType = z.infer<typeof ResponseFormatSchema>;
