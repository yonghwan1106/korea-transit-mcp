/**
 * Korea Transit MCP Server - Bus Schemas
 *
 * 버스 관련 도구의 입력 스키마 정의
 */

import { z } from "zod";
import { ResponseFormatSchema, LimitSchema } from "./common.js";

// ===== transit_get_bus_arrival 스키마 =====

/** 버스 도착정보 조회 입력 스키마 */
export const BusArrivalInputSchema = z.object({
  /** 버스 정류장 ID (5자리) */
  ars_id: z.string()
    .regex(/^\d{5}$/, "정류장 ID는 5자리 숫자여야 합니다 (예: '16165')")
    .describe("버스 정류장 ID (5자리 숫자, 예: '16165'). 정류장 ID를 모르면 transit_search_bus_station으로 검색하세요."),

  /** 최대 버스 수 */
  limit: LimitSchema,

  /** 응답 형식 */
  response_format: ResponseFormatSchema
}).strict();

/** 버스 도착정보 조회 입력 타입 */
export type BusArrivalInput = z.infer<typeof BusArrivalInputSchema>;

// ===== transit_search_bus_station 스키마 =====

/** 버스 정류장 검색 입력 스키마 */
export const BusStationSearchInputSchema = z.object({
  /** 검색어 (정류장 이름 또는 번호) */
  query: z.string()
    .min(2, "검색어는 최소 2자 이상이어야 합니다")
    .max(100, "검색어는 100자를 초과할 수 없습니다")
    .describe("검색할 정류장 이름 또는 5자리 정류장 번호 (예: '강남역', '16165')"),

  /** 최대 결과 수 */
  limit: LimitSchema,

  /** 응답 형식 */
  response_format: ResponseFormatSchema
}).strict();

/** 버스 정류장 검색 입력 타입 */
export type BusStationSearchInput = z.infer<typeof BusStationSearchInputSchema>;
