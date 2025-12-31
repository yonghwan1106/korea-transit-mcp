/**
 * Korea Transit MCP Server - Tools Index
 *
 * 모든 도구 등록 함수 통합
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSubwayTools } from "./subway.js";
import { registerBusTools } from "./bus.js";
import { registerBikeTools } from "./bike.js";

/**
 * 모든 MCP 도구를 서버에 등록
 *
 * 등록되는 도구:
 * - transit_get_subway_arrival: 지하철 실시간 도착정보
 * - transit_get_subway_status: 지하철 운행상태
 * - transit_get_bus_arrival: 버스 실시간 도착정보
 * - transit_search_bus_station: 버스 정류장 검색
 * - transit_get_bike_station: 따릉이 대여소 검색
 * - transit_get_combined_info: 통합 교통정보 조회
 */
export function registerAllTools(server: McpServer): void {
  registerSubwayTools(server);
  registerBusTools(server);
  registerBikeTools(server);
}

// 개별 등록 함수도 export
export { registerSubwayTools } from "./subway.js";
export { registerBusTools } from "./bus.js";
export { registerBikeTools } from "./bike.js";
