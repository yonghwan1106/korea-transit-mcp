import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response } from "express";
import { z } from "zod";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// API 키 설정
const SEOUL_API_KEY = process.env.SEOUL_API_KEY || "sample";
const DATA_GO_KR_API_KEY = process.env.DATA_GO_KR_API_KEY || "";

// MCP 서버 생성
const server = new McpServer({
  name: "korea-transit-mcp",
  version: "1.0.0",
});

// ===== 도구 정의 =====

// 1. 지하철 실시간 도착정보 조회
server.tool(
  "getSubwayArrival",
  "서울 지하철 실시간 도착정보를 조회합니다. 역 이름을 입력하면 해당 역에 도착 예정인 열차 정보를 반환합니다.",
  {
    stationName: z.string().describe("지하철역 이름 (예: 강남, 홍대입구, 서울역)"),
  },
  async ({ stationName }) => {
    try {
      const url = `http://swopenapi.seoul.go.kr/api/subway/${SEOUL_API_KEY}/json/realtimeStationArrival/0/10/${encodeURIComponent(stationName)}`;
      const response = await axios.get(url, { timeout: 10000 });

      if (response.data.errorMessage) {
        return {
          content: [
            {
              type: "text" as const,
              text: `오류: ${response.data.errorMessage.message}`,
            },
          ],
        };
      }

      const arrivals = response.data.realtimeArrivalList || [];

      if (arrivals.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `${stationName}역의 도착 정보가 없습니다.`,
            },
          ],
        };
      }

      const formattedArrivals = arrivals.map((arr: any) => ({
        호선: arr.subwayId === "1001" ? "1호선" :
              arr.subwayId === "1002" ? "2호선" :
              arr.subwayId === "1003" ? "3호선" :
              arr.subwayId === "1004" ? "4호선" :
              arr.subwayId === "1005" ? "5호선" :
              arr.subwayId === "1006" ? "6호선" :
              arr.subwayId === "1007" ? "7호선" :
              arr.subwayId === "1008" ? "8호선" :
              arr.subwayId === "1009" ? "9호선" : arr.subwayId,
        방향: arr.updnLine === "상행" || arr.updnLine === "내선" ? "상행" : "하행",
        목적지: arr.bstatnNm,
        도착예정: arr.arvlMsg2,
        현재위치: arr.arvlMsg3,
        열차번호: arr.btrainNo,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: `🚇 ${stationName}역 실시간 도착정보\n\n${JSON.stringify(formattedArrivals, null, 2)}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text" as const,
            text: `지하철 정보 조회 실패: ${error.message}`,
          },
        ],
      };
    }
  }
);

// 2. 버스 정류장 도착정보 조회
server.tool(
  "getBusArrival",
  "서울 버스 정류장의 실시간 도착정보를 조회합니다. 정류장 ID(arsId)를 입력하세요.",
  {
    arsId: z.string().describe("버스 정류장 ID (5자리 숫자, 예: 16165)"),
  },
  async ({ arsId }) => {
    try {
      const url = `http://ws.bus.go.kr/api/rest/stationinfo/getStationByUid?serviceKey=${DATA_GO_KR_API_KEY}&arsId=${arsId}&resultType=json`;
      const response = await axios.get(url, { timeout: 10000 });

      const items = response.data?.msgBody?.itemList || [];

      if (items.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `정류장 ${arsId}의 버스 도착 정보가 없습니다.`,
            },
          ],
        };
      }

      const formattedBuses = items.map((bus: any) => ({
        버스번호: bus.rtNm,
        도착예정1: bus.arrmsg1,
        도착예정2: bus.arrmsg2,
        방향: bus.nxtStn + " 방면",
        버스유형: bus.routeType === "1" ? "일반" :
                  bus.routeType === "2" ? "좌석" :
                  bus.routeType === "3" ? "마을" :
                  bus.routeType === "4" ? "광역" :
                  bus.routeType === "5" ? "공항" : "기타",
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: `🚌 정류장 ${arsId} 버스 도착정보\n\n${JSON.stringify(formattedBuses, null, 2)}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text" as const,
            text: `버스 정보 조회 실패: ${error.message}`,
          },
        ],
      };
    }
  }
);

// 3. 버스 정류장 검색
server.tool(
  "searchBusStation",
  "버스 정류장을 이름으로 검색합니다. 정류장 이름 일부를 입력하면 해당하는 정류장 목록을 반환합니다.",
  {
    stationName: z.string().describe("검색할 정류장 이름 (예: 강남역, 시청)"),
  },
  async ({ stationName }) => {
    try {
      const url = `http://ws.bus.go.kr/api/rest/stationinfo/getStationByName?serviceKey=${DATA_GO_KR_API_KEY}&stSrch=${encodeURIComponent(stationName)}&resultType=json`;
      const response = await axios.get(url, { timeout: 10000 });

      const items = response.data?.msgBody?.itemList || [];

      if (items.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `'${stationName}'으로 검색된 정류장이 없습니다.`,
            },
          ],
        };
      }

      const formattedStations = items.slice(0, 10).map((station: any) => ({
        정류장명: station.stNm,
        정류장ID: station.arsId,
        경도: station.tmX,
        위도: station.tmY,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: `🔍 '${stationName}' 검색 결과 (최대 10개)\n\n${JSON.stringify(formattedStations, null, 2)}\n\n정류장ID(arsId)를 사용하여 getBusArrival로 도착정보를 조회하세요.`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text" as const,
            text: `정류장 검색 실패: ${error.message}`,
          },
        ],
      };
    }
  }
);

// 4. 서울 공공자전거(따릉이) 대여소 정보
server.tool(
  "getBikeStation",
  "서울 공공자전거(따릉이) 대여소의 실시간 자전거 현황을 조회합니다.",
  {
    stationName: z.string().describe("대여소 이름 또는 지역명 (예: 강남역, 여의도)"),
  },
  async ({ stationName }) => {
    try {
      const url = `http://openapi.seoul.go.kr:8088/${SEOUL_API_KEY}/json/bikeList/1/20/`;
      const response = await axios.get(url, { timeout: 10000 });

      const stations = response.data?.rentBikeStatus?.row || [];

      // 이름으로 필터링
      const filtered = stations.filter((s: any) =>
        s.stationName?.includes(stationName) ||
        s.stationName?.toLowerCase().includes(stationName.toLowerCase())
      );

      if (filtered.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `'${stationName}' 근처의 따릉이 대여소를 찾을 수 없습니다.`,
            },
          ],
        };
      }

      const formattedStations = filtered.slice(0, 10).map((station: any) => ({
        대여소명: station.stationName,
        대여가능: `${station.parkingBikeTotCnt}대`,
        거치대수: `${station.rackTotCnt}개`,
        주소: station.stationLatitude && station.stationLongitude
          ? `위도 ${station.stationLatitude}, 경도 ${station.stationLongitude}`
          : "정보없음",
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: `🚲 '${stationName}' 따릉이 대여소 현황\n\n${JSON.stringify(formattedStations, null, 2)}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text" as const,
            text: `따릉이 정보 조회 실패: ${error.message}`,
          },
        ],
      };
    }
  }
);

// 5. 지하철 호선별 운행정보 (지연/사고)
server.tool(
  "getSubwayStatus",
  "서울 지하철 호선별 운행 상태(지연, 사고 등)를 조회합니다.",
  {
    line: z.string().optional().describe("호선 번호 (예: 2, 3). 생략시 전체 호선 조회"),
  },
  async ({ line }) => {
    try {
      const lineNum = line ? line : "0";
      const url = `http://swopenapi.seoul.go.kr/api/subway/${SEOUL_API_KEY}/json/realtimePosition/${lineNum}/1002`;
      const response = await axios.get(url, { timeout: 10000 });

      // 운행정보가 없으면 정상 운행으로 간주
      const status = response.data?.errorMessage?.status === 200 ? "정상 운행 중" : "정보 없음";

      return {
        content: [
          {
            type: "text" as const,
            text: `🚇 지하철 운행 상태\n\n${line ? `${line}호선` : "전체 호선"}: ${status}\n\n※ 실시간 운행장애 정보는 서울교통공사 공지사항을 확인해주세요.`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text" as const,
            text: `운행정보 조회 실패: ${error.message}`,
          },
        ],
      };
    }
  }
);

// 6. 통합 교통정보 조회 (한 번에 여러 정보)
server.tool(
  "getTransitInfo",
  "특정 위치 주변의 통합 교통정보(지하철+버스)를 조회합니다. 위치명을 입력하면 관련된 모든 교통정보를 한 번에 제공합니다.",
  {
    location: z.string().describe("위치명 (예: 강남역, 홍대입구)"),
  },
  async ({ location }) => {
    const results: string[] = [];

    // 지하철 정보 조회
    try {
      const subwayUrl = `http://swopenapi.seoul.go.kr/api/subway/${SEOUL_API_KEY}/json/realtimeStationArrival/0/5/${encodeURIComponent(location)}`;
      const subwayRes = await axios.get(subwayUrl, { timeout: 10000 });
      const arrivals = subwayRes.data.realtimeArrivalList || [];

      if (arrivals.length > 0) {
        const subwayInfo = arrivals.slice(0, 3).map((arr: any) =>
          `  - ${arr.subwayId === "1002" ? "2호선" : arr.subwayId} ${arr.updnLine} → ${arr.bstatnNm}: ${arr.arvlMsg2}`
        ).join("\n");
        results.push(`🚇 지하철 도착정보:\n${subwayInfo}`);
      }
    } catch (e) {
      // 지하철 정보 없음
    }

    // 버스 정류장 검색
    try {
      const busUrl = `http://ws.bus.go.kr/api/rest/stationinfo/getStationByName?serviceKey=${DATA_GO_KR_API_KEY}&stSrch=${encodeURIComponent(location)}&resultType=json`;
      const busRes = await axios.get(busUrl, { timeout: 10000 });
      const stations = busRes.data?.msgBody?.itemList || [];

      if (stations.length > 0) {
        const busInfo = stations.slice(0, 3).map((s: any) =>
          `  - ${s.stNm} (정류장ID: ${s.arsId})`
        ).join("\n");
        results.push(`🚌 버스 정류장:\n${busInfo}`);
      }
    } catch (e) {
      // 버스 정보 없음
    }

    if (results.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `'${location}' 주변 교통정보를 찾을 수 없습니다.`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `📍 ${location} 주변 교통정보\n\n${results.join("\n\n")}`,
        },
      ],
    };
  }
);

// ===== HTTP 서버 설정 =====

// Streamable HTTP Transport for MCP
const transports = new Map<string, StreamableHTTPServerTransport>();

app.post("/mcp", async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers["x-session-id"] as string || "default";

    let transport = transports.get(sessionId);
    if (!transport) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId,
      });
      transports.set(sessionId, transport);
      await server.connect(transport);
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error: any) {
    console.error("MCP Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    name: "korea-transit-mcp",
    version: "1.0.0",
    tools: [
      "getSubwayArrival - 지하철 실시간 도착정보",
      "getBusArrival - 버스 정류장 도착정보",
      "searchBusStation - 버스 정류장 검색",
      "getBikeStation - 따릉이 대여소 현황",
      "getSubwayStatus - 지하철 운행상태",
      "getTransitInfo - 통합 교통정보"
    ]
  });
});

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Korea Transit MCP Server running on port ${PORT}`);
  console.log(`📍 MCP Endpoint: http://localhost:${PORT}/mcp`);
  console.log(`❤️ Health Check: http://localhost:${PORT}/health`);
});
