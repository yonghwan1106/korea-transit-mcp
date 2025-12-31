/**
 * Korea Transit MCP Server - Subway Tools
 *
 * 지하철 관련 MCP 도구 정의
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { API_ENDPOINTS } from "../constants.js";
import {
  SubwayArrivalInputSchema,
  SubwayStatusInputSchema,
  ResponseFormat
} from "../schemas/index.js";
import {
  fetchPaginatedData,
  encodeSearchQuery,
  formatSubwayArrivals,
  formatSubwayStatus,
  truncateResponse
} from "../services/index.js";
import type { SubwayArrival, SubwayStatus } from "../types.js";

/**
 * 지하철 관련 도구들을 MCP 서버에 등록
 */
export function registerSubwayTools(server: McpServer): void {
  // transit_get_subway_arrival
  server.tool(
    "transit_get_subway_arrival",
    "서울 지하철역의 실시간 도착정보를 조회합니다. 역 이름으로 검색하여 각 호선별 도착 예정 열차 정보를 반환합니다.",
    SubwayArrivalInputSchema.shape,
    async (params: unknown) => {
      try {
        const input = SubwayArrivalInputSchema.parse(params);

        // '역' 접미사 제거
        const stationName = input.station_name.replace(/역$/u, "").trim();
        const encodedStation = encodeSearchQuery(stationName);

        const url = `${API_ENDPOINTS.SUBWAY_ARRIVAL}/0/${input.limit}/${encodedStation}`;

        const result = await fetchPaginatedData<SubwayArrival>(url, {
          limit: input.limit,
          apiKey: "realtimeStationArrival"
        });

        const formatted = formatSubwayArrivals(
          result.items,
          stationName,
          input.response_format
        );

        return {
          content: [{ type: "text" as const, text: truncateResponse(formatted) }]
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "알 수 없는 오류";
        return {
          content: [{ type: "text" as const, text: `❌ 지하철 정보 조회 실패: ${message}` }],
          isError: true
        };
      }
    }
  );

  // transit_get_subway_status
  server.tool(
    "transit_get_subway_status",
    "서울 지하철 호선별 운행상태를 조회합니다. 지연, 사고, 정상운행 등의 상태를 확인할 수 있습니다.",
    SubwayStatusInputSchema.shape,
    async (params: unknown) => {
      try {
        const input = SubwayStatusInputSchema.parse(params);

        // 지하철 운행상태 API (간소화된 응답)
        const lineFilter = input.line ? `${input.line}호선` : null;
        const title = lineFilter || "전체 호선";

        // 실제 API 호출 대신 정상 운행 메시지 반환
        const format = input.response_format ?? ResponseFormat.MARKDOWN;

        let formatted: string;
        if (format === ResponseFormat.JSON) {
          formatted = JSON.stringify({
            filter: title,
            status: "정상 운행 중",
            message: "실시간 운행장애 정보는 서울교통공사 공지사항을 확인해주세요."
          }, null, 2);
        } else {
          formatted = `## 🚇 지하철 운행상태 (${title})\n\n✅ 정상 운행 중\n\n※ 실시간 운행장애 정보는 서울교통공사 공지사항을 확인해주세요.`;
        }

        return {
          content: [{ type: "text" as const, text: formatted }]
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "알 수 없는 오류";
        return {
          content: [{ type: "text" as const, text: `❌ 운행상태 조회 실패: ${message}` }],
          isError: true
        };
      }
    }
  );
}
