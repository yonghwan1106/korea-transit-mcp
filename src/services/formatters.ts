/**
 * Korea Transit MCP Server - Formatters
 *
 * 응답 포맷팅 유틸리티 (Markdown/JSON)
 */

import { SUBWAY_LINE_MAP, BUS_TYPE_MAP } from "../constants.js";
import { ResponseFormat } from "../schemas/common.js";
import type {
  SubwayArrival,
  SubwayStatus,
  BusArrival,
  BusStation,
  BikeStation
} from "../types.js";

// ===== 호선/버스 매핑 =====

/**
 * 지하철 호선 코드를 이름으로 변환
 */
export function getSubwayLineName(lineCode: string): string {
  return SUBWAY_LINE_MAP[lineCode] || lineCode;
}

/**
 * 버스 유형 코드를 이름으로 변환
 */
export function getBusTypeName(typeCode: string): string {
  return BUS_TYPE_MAP[typeCode] || "기타";
}

// ===== 지하철 포맷터 =====

/**
 * 지하철 도착정보 포맷팅
 */
export function formatSubwayArrivals(
  arrivals: SubwayArrival[],
  stationName: string,
  format: ResponseFormat
): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify({
      station: stationName,
      count: arrivals.length,
      arrivals: arrivals.map((arr) => ({
        line: getSubwayLineName(arr.subwayId),
        destination: arr.bstatnNm,
        message: arr.arvlMsg2,
        direction: arr.updnLine,
        trainNumber: arr.btrainNo
      }))
    }, null, 2);
  }

  // Markdown 형식
  if (arrivals.length === 0) {
    return `## 🚇 ${stationName}역 도착정보\n\n현재 도착 예정 열차가 없습니다.`;
  }

  let md = `## 🚇 ${stationName}역 실시간 도착정보\n\n`;
  md += `> 총 ${arrivals.length}개의 열차 정보\n\n`;

  arrivals.forEach((arr, idx) => {
    const lineName = getSubwayLineName(arr.subwayId);
    md += `### ${idx + 1}. ${lineName} - ${arr.bstatnNm}행\n`;
    md += `- **도착**: ${arr.arvlMsg2}\n`;
    md += `- **방향**: ${arr.updnLine === "상행" ? "⬆️ 상행" : "⬇️ 하행"}\n`;
    if (arr.btrainNo) {
      md += `- **열차번호**: ${arr.btrainNo}\n`;
    }
    md += "\n";
  });

  return md;
}

/**
 * 지하철 운행상태 포맷팅
 */
export function formatSubwayStatus(
  statuses: SubwayStatus[],
  line: string | undefined,
  format: ResponseFormat
): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify({
      filter: line ? `${line}호선` : "전체",
      count: statuses.length,
      statuses: statuses.map((s) => ({
        line: s.subwayLine,
        status: s.subwayStatusMessage
      }))
    }, null, 2);
  }

  // Markdown 형식
  const title = line ? `${line}호선` : "전체 호선";
  let md = `## 🚇 지하철 운행상태 (${title})\n\n`;

  if (statuses.length === 0) {
    md += "운행상태 정보가 없습니다.";
    return md;
  }

  statuses.forEach((s) => {
    const statusEmoji = s.subwayStatusMessage.includes("정상") ? "✅" : "⚠️";
    md += `- **${s.subwayLine}**: ${statusEmoji} ${s.subwayStatusMessage}\n`;
  });

  return md;
}

// ===== 버스 포맷터 =====

/**
 * 버스 도착정보 포맷팅
 */
export function formatBusArrivals(
  arrivals: BusArrival[],
  stationName: string,
  arsId: string,
  format: ResponseFormat
): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify({
      station: stationName,
      arsId,
      count: arrivals.length,
      arrivals: arrivals.map((arr) => ({
        busNumber: arr.rtNm,
        type: getBusTypeName(arr.routeType),
        message1: arr.arrmsg1,
        message2: arr.arrmsg2,
        destination: arr.adirection
      }))
    }, null, 2);
  }

  // Markdown 형식
  if (arrivals.length === 0) {
    return `## 🚌 ${stationName} 정류장 (${arsId})\n\n현재 도착 예정 버스가 없습니다.`;
  }

  let md = `## 🚌 ${stationName} 정류장\n\n`;
  md += `> 정류장 번호: ${arsId} | 총 ${arrivals.length}개 노선\n\n`;

  arrivals.forEach((arr, idx) => {
    const busType = getBusTypeName(arr.routeType);
    md += `### ${idx + 1}. ${arr.rtNm}번 (${busType})\n`;
    md += `- **첫 번째 버스**: ${arr.arrmsg1}\n`;
    md += `- **두 번째 버스**: ${arr.arrmsg2}\n`;
    md += `- **종점**: ${arr.adirection}\n\n`;
  });

  return md;
}

/**
 * 버스 정류장 검색 결과 포맷팅
 */
export function formatBusStations(
  stations: BusStation[],
  query: string,
  format: ResponseFormat
): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify({
      query,
      count: stations.length,
      stations: stations.map((s) => ({
        name: s.stNm,
        arsId: s.arsId,
        nextStation: s.nxtStn,
        direction: s.busRouteAbrv
      }))
    }, null, 2);
  }

  // Markdown 형식
  if (stations.length === 0) {
    return `## 🔍 버스 정류장 검색: "${query}"\n\n검색 결과가 없습니다.`;
  }

  let md = `## 🔍 버스 정류장 검색: "${query}"\n\n`;
  md += `> ${stations.length}개 정류장 발견\n\n`;

  stations.forEach((s, idx) => {
    md += `### ${idx + 1}. ${s.stNm}\n`;
    md += `- **정류장 번호**: \`${s.arsId}\`\n`;
    if (s.nxtStn) {
      md += `- **다음 정류장**: ${s.nxtStn}\n`;
    }
    if (s.busRouteAbrv) {
      md += `- **주요 노선**: ${s.busRouteAbrv}\n`;
    }
    md += "\n";
  });

  md += "---\n";
  md += "> 💡 **Tip**: 도착정보 조회 시 정류장 번호(arsId)를 사용하세요.\n";

  return md;
}

// ===== 따릉이 포맷터 =====

/**
 * 따릉이 대여소 정보 포맷팅
 */
export function formatBikeStations(
  stations: BikeStation[],
  query: string,
  format: ResponseFormat
): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify({
      query,
      count: stations.length,
      stations: stations.map((s) => ({
        name: s.stationName,
        id: s.stationId,
        available: s.parkingBikeTotCnt,
        rackTotal: s.rackTotCnt,
        shared: s.shared
      }))
    }, null, 2);
  }

  // Markdown 형식
  if (stations.length === 0) {
    return `## 🚲 따릉이 대여소 검색: "${query}"\n\n검색 결과가 없습니다.`;
  }

  let md = `## 🚲 따릉이 대여소 검색: "${query}"\n\n`;
  md += `> ${stations.length}개 대여소 발견\n\n`;

  stations.forEach((s, idx) => {
    const availRate = s.rackTotCnt > 0
      ? Math.round((s.parkingBikeTotCnt / s.rackTotCnt) * 100)
      : 0;
    const availEmoji = availRate >= 50 ? "🟢" : availRate >= 20 ? "🟡" : "🔴";

    md += `### ${idx + 1}. ${s.stationName}\n`;
    md += `- **대여 가능**: ${availEmoji} ${s.parkingBikeTotCnt}대 / ${s.rackTotCnt}대 (${availRate}%)\n`;
    md += `- **대여소 ID**: ${s.stationId}\n`;
    if (s.shared !== undefined) {
      md += `- **공유율**: ${s.shared}%\n`;
    }
    md += "\n";
  });

  return md;
}

// ===== 통합 포맷터 =====

/**
 * 통합 교통정보 포맷팅
 */
export function formatCombinedTransit(
  location: string,
  subway: SubwayArrival[],
  bus: { stations: BusStation[]; arrivals: Map<string, BusArrival[]> },
  bike: BikeStation[],
  format: ResponseFormat
): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify({
      location,
      subway: {
        count: subway.length,
        arrivals: subway.slice(0, 5).map((arr) => ({
          line: getSubwayLineName(arr.subwayId),
          destination: arr.bstatnNm,
          message: arr.arvlMsg2
        }))
      },
      bus: {
        stationCount: bus.stations.length,
        stations: bus.stations.slice(0, 3).map((s) => ({
          name: s.stNm,
          arsId: s.arsId,
          arrivals: (bus.arrivals.get(s.arsId) || []).slice(0, 3).map((arr) => ({
            busNumber: arr.rtNm,
            message: arr.arrmsg1
          }))
        }))
      },
      bike: {
        count: bike.length,
        stations: bike.slice(0, 3).map((s) => ({
          name: s.stationName,
          available: s.parkingBikeTotCnt,
          total: s.rackTotCnt
        }))
      }
    }, null, 2);
  }

  // Markdown 형식
  let md = `# 📍 ${location} 주변 교통정보\n\n`;

  // 지하철
  md += `## 🚇 지하철 도착정보\n\n`;
  if (subway.length === 0) {
    md += "주변 지하철역 정보가 없습니다.\n\n";
  } else {
    subway.slice(0, 5).forEach((arr) => {
      const lineName = getSubwayLineName(arr.subwayId);
      md += `- **${lineName}** ${arr.bstatnNm}행: ${arr.arvlMsg2}\n`;
    });
    md += "\n";
  }

  // 버스
  md += `## 🚌 버스 도착정보\n\n`;
  if (bus.stations.length === 0) {
    md += "주변 버스 정류장 정보가 없습니다.\n\n";
  } else {
    bus.stations.slice(0, 3).forEach((station) => {
      md += `### ${station.stNm} (${station.arsId})\n`;
      const arrivals = bus.arrivals.get(station.arsId) || [];
      if (arrivals.length === 0) {
        md += "도착 예정 버스 없음\n\n";
      } else {
        arrivals.slice(0, 3).forEach((arr) => {
          md += `- **${arr.rtNm}번**: ${arr.arrmsg1}\n`;
        });
        md += "\n";
      }
    });
  }

  // 따릉이
  md += `## 🚲 따릉이 대여소\n\n`;
  if (bike.length === 0) {
    md += "주변 따릉이 대여소 정보가 없습니다.\n";
  } else {
    bike.slice(0, 3).forEach((s) => {
      const availRate = s.rackTotCnt > 0
        ? Math.round((s.parkingBikeTotCnt / s.rackTotCnt) * 100)
        : 0;
      const emoji = availRate >= 50 ? "🟢" : availRate >= 20 ? "🟡" : "🔴";
      md += `- **${s.stationName}**: ${emoji} ${s.parkingBikeTotCnt}대 이용가능\n`;
    });
  }

  return md;
}
