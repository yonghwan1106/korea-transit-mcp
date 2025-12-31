/**
 * Korea Transit MCP Server - Bus Tools
 *
 * 버스 관련 MCP 도구 정의
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_ENDPOINTS } from "../constants.js";
import {
  BusArrivalInputSchema,
  BusStationSearchInputSchema
} from "../schemas/index.js";
import {
  fetchPaginatedData,
  encodeSearchQuery,
  formatBusArrivals,
  formatBusStations,
  truncateResponse
} from "../services/index.js";
import type { BusArrival, BusStation } from "../types.js";

/**
 * 버스 관련 도구들을 MCP 서버에 등록
 */
export function registerBusTools(server: McpServer): void {
  // transit_get_bus_arrival
  server.tool(
    "transit_get_bus_arrival",
    "서울 버스 정류장의 실시간 도착정보를 조회합니다. 5자리 정류장 ID(arsId)가 필요하며, 정류장을 모르면 transit_search_bus_station으로 먼저 검색하세요.",
    BusArrivalInputSchema.shape,
    async (params: unknown) => {
      try {
        const input = BusArrivalInputSchema.parse(params);

        const url = `${API_ENDPOINTS.BUS_ARRIVAL}=${input.ars_id}`;

        const result = await fetchPaginatedData<BusArrival>(url, {
          limit: input.limit,
          apiKey: "msgBody"
        });

        // 정류장 이름 추출 (첫 번째 결과에서)
        const stationName = result.items[0]?.stNm || "정류장";

        const formatted = formatBusArrivals(
          result.items,
          stationName,
          input.ars_id,
          input.response_format
        );

        return {
          content: [{ type: "text" as const, text: truncateResponse(formatted) }]
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "알 수 없는 오류";
        return {
          content: [{ type: "text" as const, text: `❌ 버스 정보 조회 실패: ${message}\n\n💡 정류장 번호가 올바른지 확인해 주세요.` }],
          isError: true
        };
      }
    }
  );

  // transit_search_bus_station
  server.tool(
    "transit_search_bus_station",
    "버스 정류장을 이름 또는 번호로 검색합니다. 검색 결과에서 정류장 ID(arsId)를 확인하여 도착정보 조회에 사용할 수 있습니다.",
    BusStationSearchInputSchema.shape,
    async (params: unknown) => {
      try {
        const input = BusStationSearchInputSchema.parse(params);

        const encodedQuery = encodeSearchQuery(input.query);
        const url = `${API_ENDPOINTS.BUS_STATION_SEARCH}/1/1000/`;

        const result = await fetchPaginatedData<BusStation>(url, {
          limit: 1000,
          apiKey: "busStopLocationXyInfo"
        });

        // 검색어로 필터링
        const filtered = result.items.filter((s: BusStation) =>
          (s.STOPS_NM && s.STOPS_NM.includes(input.query)) ||
          s.STOPS_NO === input.query
        ).slice(0, input.limit);

        // BusStation 형식으로 변환
        const stations: BusStation[] = filtered.map((s: BusStation) => ({
          stNm: s.STOPS_NM || "",
          arsId: s.STOPS_NO || "",
          STOPS_NM: s.STOPS_NM,
          STOPS_NO: s.STOPS_NO,
          STOPS_TYPE: s.STOPS_TYPE
        }));

        const formatted = formatBusStations(
          stations,
          input.query,
          input.response_format
        );

        return {
          content: [{ type: "text" as const, text: truncateResponse(formatted) }]
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "알 수 없는 오류";
        return {
          content: [{ type: "text" as const, text: `❌ 정류장 검색 실패: ${message}` }],
          isError: true
        };
      }
    }
  );
}
