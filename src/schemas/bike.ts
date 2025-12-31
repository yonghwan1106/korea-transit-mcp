/**
 * Korea Transit MCP Server - Bike Schemas
 *
 * 따릉이(공공자전거) 및 통합 교통정보 도구의 입력 스키마 정의
 */

import { z } from "zod";
import { ResponseFormatSchema, LimitSchema } from "./common.js";

// ===== transit_get_bike_station 스키마 =====

/** 따릉이 대여소 조회 입력 스키마 */
export const BikeStationInputSchema = z.object({
  /** 검색어 (대여소 이름 또는 지역명) */
  query: z.string()
    .min(2, "검색어는 최소 2자 이상이어야 합니다")
    .max(100, "검색어는 100자를 초과할 수 없습니다")
    .describe("대여소 이름 또는 지역명 (예: '강남역', '여의도')"),

  /** 최대 대여소 수 */
  limit: LimitSchema,

  /** 응답 형식 */
  response_format: ResponseFormatSchema
}).strict();

/** 따릉이 대여소 조회 입력 타입 */
export type BikeStationInput = z.infer<typeof BikeStationInputSchema>;

// ===== transit_get_combined_info 스키마 =====

/** 통합 교통정보 조회 입력 스키마 */
export const CombinedTransitInputSchema = z.object({
  /** 위치명 */
  location: z.string()
    .min(2, "위치명은 최소 2자 이상이어야 합니다")
    .max(100, "위치명은 100자를 초과할 수 없습니다")
    .describe("위치명 (예: '강남역', '홍대입구'). 지하철, 버스 정류장, 따릉이 정보를 통합 조회합니다."),

  /** 응답 형식 */
  response_format: ResponseFormatSchema
}).strict();

/** 통합 교통정보 조회 입력 타입 */
export type CombinedTransitInput = z.infer<typeof CombinedTransitInputSchema>;
