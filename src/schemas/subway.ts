/**
 * Korea Transit MCP Server - Subway Schemas
 *
 * 지하철 관련 도구의 입력 스키마 정의
 */

import { z } from "zod";
import { ResponseFormatSchema, LimitSchema } from "./common.js";

// ===== transit_get_subway_arrival 스키마 =====

/** 지하철 도착정보 조회 입력 스키마 */
export const SubwayArrivalInputSchema = z.object({
  /** 지하철역 이름 */
  station_name: z.string()
    .min(1, "역 이름은 필수입니다")
    .max(50, "역 이름은 50자를 초과할 수 없습니다")
    .describe("지하철역 이름 (예: '강남', '홍대입구', '서울역'). '역' 접미사는 자동 제거됩니다."),

  /** 최대 도착정보 수 */
  limit: LimitSchema,

  /** 응답 형식 */
  response_format: ResponseFormatSchema
}).strict();

/** 지하철 도착정보 조회 입력 타입 */
export type SubwayArrivalInput = z.infer<typeof SubwayArrivalInputSchema>;

// ===== transit_get_subway_status 스키마 =====

/** 지하철 운행상태 조회 입력 스키마 */
export const SubwayStatusInputSchema = z.object({
  /** 호선 번호 (선택) */
  line: z.string()
    .regex(/^[1-9]$/, "호선 번호는 1-9 사이의 숫자여야 합니다")
    .optional()
    .describe("호선 번호 (1-9). 생략시 전체 호선 조회"),

  /** 응답 형식 */
  response_format: ResponseFormatSchema
}).strict();

/** 지하철 운행상태 조회 입력 타입 */
export type SubwayStatusInput = z.infer<typeof SubwayStatusInputSchema>;
