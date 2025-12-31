/**
 * Korea Transit MCP Server - Constants
 *
 * API URLs, 응답 제한, 매핑 테이블 등 공통 상수 정의
 */

// ===== 서버 정보 =====
export const SERVER_INFO = {
  NAME: "korea-transit-mcp",
  VERSION: "1.0.0"
} as const;

// ===== API Base URLs =====
export const API_URLS = {
  /** 서울 열린데이터광장 지하철 API */
  SEOUL_SUBWAY: "http://swopenapi.seoul.go.kr/api/subway",
  /** 서울 열린데이터광장 일반 API */
  SEOUL_DATA: "http://openapi.seoul.go.kr:8088",
  /** 공공데이터포털 버스 API */
  BUS_API: "http://ws.bus.go.kr/api/rest"
} as const;

// ===== API 엔드포인트 (환경변수 기반) =====
const SEOUL_API_KEY = process.env.SEOUL_API_KEY || "sample";
const DATA_GO_KR_API_KEY = process.env.DATA_GO_KR_API_KEY || "";

export const API_ENDPOINTS = {
  SUBWAY_ARRIVAL: `${API_URLS.SEOUL_SUBWAY}/${SEOUL_API_KEY}/json/realtimeStationArrival`,
  SUBWAY_STATUS: `${API_URLS.SEOUL_DATA}/${SEOUL_API_KEY}/json/subwayStatus/1/20`,
  BUS_ARRIVAL: `${API_URLS.BUS_API}/stationinfo/getStationByUid?serviceKey=${DATA_GO_KR_API_KEY}&resultType=json&arsId`,
  BUS_STATION_SEARCH: `${API_URLS.SEOUL_DATA}/${SEOUL_API_KEY}/json/busStopLocationXyInfo`,
  BIKE_STATION: `${API_URLS.SEOUL_DATA}/${SEOUL_API_KEY}/json/bikeList`
} as const;

// ===== 응답 제한 =====
/** 최대 응답 문자 수 (초과 시 truncation) */
export const CHARACTER_LIMIT = 25000;

/** API 요청 기본 타임아웃 (ms) */
export const DEFAULT_TIMEOUT = 10000;

/** 지하철 API 타임아웃 (ms) - 응답이 느려서 더 길게 설정 */
export const SUBWAY_TIMEOUT = 15000;

// ===== 지하철 호선 매핑 =====
export const SUBWAY_LINE_MAP: Record<string, string> = {
  "1001": "1호선",
  "1002": "2호선",
  "1003": "3호선",
  "1004": "4호선",
  "1005": "5호선",
  "1006": "6호선",
  "1007": "7호선",
  "1008": "8호선",
  "1009": "9호선",
  "1063": "경의중앙선",
  "1065": "공항철도",
  "1067": "경춘선",
  "1069": "수인분당선",
  "1071": "신림선",
  "1077": "신분당선",
  "1092": "우이신설선"
} as const;

// ===== 버스 유형 매핑 =====
export const BUS_TYPE_MAP: Record<string, string> = {
  "1": "일반",
  "2": "좌석",
  "3": "마을",
  "4": "광역",
  "5": "공항",
  "6": "간선",
  "7": "지선"
} as const;

// ===== 페이지네이션 기본값 =====
export const PAGINATION = {
  /** 기본 조회 개수 */
  DEFAULT_LIMIT: 10,
  /** 최대 조회 개수 */
  MAX_LIMIT: 20,
  /** 페이지 크기 (alias) */
  PAGE_SIZE: 1000,
  /** 서울 API 페이지 크기 */
  SEOUL_API_PAGE_SIZE: 1000,
  /** 최대 페이지 수 (API 부하 방지) */
  MAX_PAGES: 12
} as const;
