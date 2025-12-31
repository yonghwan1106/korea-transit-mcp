/**
 * Korea Transit MCP Server - Type Definitions
 *
 * API 응답 및 내부 데이터 구조 타입 정의
 *
 * NOTE: 이 파일의 타입들은 서울 열린데이터광장 API 응답과 직접 매핑됩니다.
 * API 필드명을 그대로 사용하여 추가적인 변환 없이 처리합니다.
 */

// ===== 지하철 관련 타입 =====

/** 지하철 도착 정보 (서울 API 응답) */
export interface SubwayArrival {
  /** 호선 코드 (예: "1002" = 2호선) */
  subwayId: string;
  /** 방향 (상행/하행/외선/내선) */
  updnLine: string;
  /** 행선지 역 이름 */
  bstatnNm: string;
  /** 도착 예정 메시지 */
  arvlMsg2: string;
  /** 현재 위치 메시지 */
  arvlMsg3: string;
  /** 열차 번호 */
  btrainNo: string;
}

/** 지하철 운행상태 정보 */
export interface SubwayStatus {
  /** 호선 이름 (예: "2호선") */
  subwayLine: string;
  /** 운행상태 메시지 */
  subwayStatusMessage: string;
}

// ===== 버스 관련 타입 =====

/** 버스 도착 정보 (공공데이터포털 API 응답) */
export interface BusArrival {
  /** 버스 노선 번호 */
  rtNm: string;
  /** 첫번째 버스 도착 메시지 */
  arrmsg1: string;
  /** 두번째 버스 도착 메시지 */
  arrmsg2: string;
  /** 다음 정류장 */
  nxtStn: string;
  /** 버스 유형 코드 (1:일반, 2:좌석, ...) */
  routeType: string;
  /** 정류장 이름 */
  stNm?: string;
  /** 방향 */
  adirection?: string;
}

/** 버스 정류장 정보 (서울 API 응답) */
export interface BusStation {
  /** 정류장명 */
  stNm: string;
  /** 정류장 번호 (5자리) */
  arsId: string;
  /** 다음 정류장 */
  nxtStn?: string;
  /** 주요 노선 */
  busRouteAbrv?: string;
  /** 정류장 유형 */
  STOPS_TYPE?: string;
  /** 정류장 이름 (대체 필드) */
  STOPS_NM?: string;
  /** 정류장 번호 (대체 필드) */
  STOPS_NO?: string;
}

// ===== 따릉이 관련 타입 =====

/** 따릉이 대여소 정보 (서울 API 응답) */
export interface BikeStation {
  /** 대여소명 */
  stationName: string;
  /** 대여소 ID */
  stationId: string;
  /** 대여 가능 자전거 수 */
  parkingBikeTotCnt: number;
  /** 총 거치대 수 */
  rackTotCnt: number;
  /** 공유율 */
  shared?: number;
  /** 위도 */
  stationLatitude?: string;
  /** 경도 */
  stationLongitude?: string;
}

// ===== 페이지네이션 타입 =====

/** 페이지네이션 결과 */
export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  returnedCount: number;
}

// ===== 통합 교통정보 타입 =====

/** 통합 교통정보 응답 */
export interface CombinedTransitResponse {
  location: string;
  subway?: {
    station: string;
    arrivals: SubwayArrival[];
  };
  busStations?: BusStation[];
  bikeStations?: BikeStation[];
}
