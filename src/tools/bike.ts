/**
 * Korea Transit MCP Server - Bike & Combined Tools
 *
 * 따릉이 및 통합 교통정보 MCP 도구 정의
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_ENDPOINTS } from "../constants.js";
import {
  BikeStationInputSchema,
  CombinedTransitInputSchema
} from "../schemas/index.js";
import {
  fetchPaginatedData,
  encodeSearchQuery,
  formatBikeStations,
  formatCombinedTransit,
  truncateResponse
} from "../services/index.js";
import type {
  BikeStation,
  SubwayArrival,
  BusStation,
  BusArrival
} from "../types.js";

/**
 * 따릉이 및 통합 교통정보 도구들을 MCP 서버에 등록
 */
export function registerBikeTools(server: McpServer): void {
  // transit_get_bike_station
  server.tool(
    "transit_get_bike_station",
    "서울 따릉이(공공자전거) 대여소를 검색하고 실시간 자전거 이용가능 현황을 조회합니다.",
    BikeStationInputSchema.shape,
    async (params: unknown) => {
      try {
        const input = BikeStationInputSchema.parse(params);

        const url = `${API_ENDPOINTS.BIKE_STATION}/1/1000/`;

        // 따릉이 API는 전체 조회 후 필터링 필요
        const result = await fetchPaginatedData<BikeStation>(url, {
          limit: 1000,
          apiKey: "rentBikeStatus"
        });

        // 검색어로 필터링
        const filtered = result.items.filter((s: BikeStation) =>
          s.stationName && s.stationName.toLowerCase().includes(input.query.toLowerCase())
        ).slice(0, input.limit);

        const formatted = formatBikeStations(
          filtered,
          input.query,
          input.response_format
        );

        return {
          content: [{ type: "text" as const, text: truncateResponse(formatted) }]
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "알 수 없는 오류";
        return {
          content: [{ type: "text" as const, text: `❌ 따릉이 대여소 검색 실패: ${message}` }],
          isError: true
        };
      }
    }
  );

  // transit_get_combined_info
  server.tool(
    "transit_get_combined_info",
    "특정 위치 주변의 지하철, 버스, 따릉이 정보를 통합 조회합니다. 위치명을 입력하면 주변의 모든 대중교통 정보를 한번에 확인할 수 있습니다.",
    CombinedTransitInputSchema.shape,
    async (params: unknown) => {
      try {
        const input = CombinedTransitInputSchema.parse(params);

        const location = input.location.replace(/역$/u, "").trim();
        const encodedLocation = encodeSearchQuery(location);

        // 병렬로 모든 API 호출
        const [subwayResult, busStationResult, bikeResult] = await Promise.allSettled([
          // 지하철 도착정보
          fetchPaginatedData<SubwayArrival>(
            `${API_ENDPOINTS.SUBWAY_ARRIVAL}/0/10/${encodedLocation}`,
            { limit: 10, apiKey: "realtimeStationArrival" }
          ),
          // 버스 정류장 검색
          fetchPaginatedData<BusStation>(
            `${API_ENDPOINTS.BUS_STATION_SEARCH}/1/100/`,
            { limit: 100, apiKey: "busStopLocationXyInfo" }
          ),
          // 따릉이 대여소 (전체 조회 후 필터링)
          fetchPaginatedData<BikeStation>(
            `${API_ENDPOINTS.BIKE_STATION}/1/1000/`,
            { limit: 1000, apiKey: "rentBikeStatus" }
          )
        ]);

        // 지하철 결과
        const subwayArrivals = subwayResult.status === "fulfilled"
          ? subwayResult.value.items
          : [];

        // 버스 결과 필터링
        const allBusStations = busStationResult.status === "fulfilled"
          ? busStationResult.value.items
          : [];
        const filteredBusStations = allBusStations.filter((s: BusStation) =>
          s.STOPS_NM && s.STOPS_NM.includes(location)
        ).slice(0, 3).map((s: BusStation) => ({
          ...s,
          stNm: s.STOPS_NM || "",
          arsId: s.STOPS_NO || ""
        }));

        // 버스 도착정보는 생략 (추가 API 호출 필요)
        const busArrivals = new Map<string, BusArrival[]>();

        // 따릉이 결과 (필터링)
        const allBikeStations = bikeResult.status === "fulfilled"
          ? bikeResult.value.items
          : [];
        const filteredBikeStations = allBikeStations.filter((s: BikeStation) =>
          s.stationName && s.stationName.toLowerCase().includes(location.toLowerCase())
        ).slice(0, 5);

        const formatted = formatCombinedTransit(
          input.location,
          subwayArrivals,
          { stations: filteredBusStations, arrivals: busArrivals },
          filteredBikeStations,
          input.response_format
        );

        return {
          content: [{ type: "text" as const, text: truncateResponse(formatted) }]
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "알 수 없는 오류";
        return {
          content: [{ type: "text" as const, text: `❌ 통합 교통정보 조회 실패: ${message}` }],
          isError: true
        };
      }
    }
  );
}
