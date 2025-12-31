/**
 * Korea Transit MCP Server
 *
 * 서울시 대중교통 실시간 정보를 제공하는 MCP 서버
 *
 * 제공 도구:
 * - transit_get_subway_arrival: 지하철 실시간 도착정보
 * - transit_get_subway_status: 지하철 운행상태
 * - transit_get_bus_arrival: 버스 실시간 도착정보
 * - transit_search_bus_station: 버스 정류장 검색
 * - transit_get_bike_station: 따릉이 대여소 검색
 * - transit_get_combined_info: 통합 교통정보 조회
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express, { Request, Response } from "express";
import dotenv from "dotenv";

import { SERVER_INFO } from "./constants.js";
import { registerAllTools } from "./tools/index.js";

// 환경 변수 로드
dotenv.config();

// ===== MCP 서버 생성 =====

const server = new McpServer({
  name: SERVER_INFO.NAME,
  version: SERVER_INFO.VERSION,
});

// 모든 도구 등록
registerAllTools(server);

// ===== 서버 실행 모드 분기 =====

const isStdioMode = process.argv.includes("--stdio");

if (isStdioMode) {
  // stdio 모드 (로컬 MCP 클라이언트용)
  runStdioServer();
} else {
  // HTTP 모드 (Vercel/원격 서버용)
  runHttpServer();
}

// ===== stdio 서버 =====

async function runStdioServer(): Promise<void> {
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error(`🚀 ${SERVER_INFO.NAME} v${SERVER_INFO.VERSION} (stdio mode)`);

  // 종료 시그널 처리
  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });
}

// ===== HTTP 서버 =====

function runHttpServer(): void {
  const app = express();
  app.use(express.json());

  // 세션별 Transport 관리
  const transports = new Map<string, StreamableHTTPServerTransport>();

  // MCP 엔드포인트
  app.post("/mcp", async (req: Request, res: Response) => {
    try {
      const sessionId = (req.headers["x-session-id"] as string) || "default";

      let transport = transports.get(sessionId);
      if (!transport) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => sessionId,
        });
        transports.set(sessionId, transport);
        await server.connect(transport);
      }

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("MCP Error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  // Health check 엔드포인트
  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      name: SERVER_INFO.NAME,
      version: SERVER_INFO.VERSION,
      tools: [
        "transit_get_subway_arrival - 지하철 실시간 도착정보",
        "transit_get_subway_status - 지하철 운행상태",
        "transit_get_bus_arrival - 버스 정류장 도착정보",
        "transit_search_bus_station - 버스 정류장 검색",
        "transit_get_bike_station - 따릉이 대여소 현황",
        "transit_get_combined_info - 통합 교통정보",
      ],
    });
  });

  // 루트 엔드포인트
  app.get("/", (_req: Request, res: Response) => {
    res.json({
      name: SERVER_INFO.NAME,
      version: SERVER_INFO.VERSION,
      description: "서울시 대중교통 실시간 정보 MCP 서버",
      endpoints: {
        mcp: "POST /mcp",
        health: "GET /health",
      },
    });
  });

  // 서버 시작
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 ${SERVER_INFO.NAME} v${SERVER_INFO.VERSION} running on port ${PORT}`);
    console.log(`📍 MCP Endpoint: http://localhost:${PORT}/mcp`);
    console.log(`❤️ Health Check: http://localhost:${PORT}/health`);
  });
}
