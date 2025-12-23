# Korea Transit MCP Server

한국 실시간 대중교통 정보 MCP 서버입니다. 서울 지하철, 버스, 따릉이 정보를 AI 에이전트에서 사용할 수 있습니다.

## 주요 기능

| 도구 | 설명 |
|------|------|
| `getSubwayArrival` | 서울 지하철 실시간 도착정보 조회 |
| `getBusArrival` | 버스 정류장 실시간 도착정보 조회 |
| `searchBusStation` | 버스 정류장 이름 검색 |
| `getBikeStation` | 따릉이 대여소 현황 조회 |
| `getSubwayStatus` | 지하철 운행 상태 조회 |
| `getTransitInfo` | 통합 교통정보 조회 |

## 사용 예시

```
"강남역 지하철 언제 와?"
"시청 근처 버스정류장 찾아줘"
"여의도 따릉이 대여소 현황 알려줘"
```

## 설치 및 실행

```bash
npm install
npm run build
npm start
```

## 환경변수

```
SEOUL_API_KEY=서울열린데이터광장_API_키
DATA_GO_KR_API_KEY=공공데이터포털_API_키
PORT=3000
```

## API 출처

- [서울 열린데이터광장](https://data.seoul.go.kr)
- [공공데이터포털](https://www.data.go.kr)

## 라이선스

MIT
