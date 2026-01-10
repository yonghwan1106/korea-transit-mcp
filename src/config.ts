/**
 * Korea Transit MCP Server - Configuration
 *
 * 환경 변수 검증 및 설정 관리
 */

export interface EnvConfig {
  SEOUL_API_KEY: string;
  DATA_GO_KR_API_KEY: string;
  NODE_ENV: string;
  PORT: number;
}

/**
 * 필수 환경 변수 검증
 * 서버 시작 시 호출하여 필수 환경 변수가 설정되었는지 확인
 */
export function validateEnvironment(): EnvConfig {
  const errors: string[] = [];

  // 필수 환경 변수 확인
  if (!process.env.SEOUL_API_KEY) {
    errors.push("SEOUL_API_KEY");
  }

  // 선택적 환경 변수 경고 (에러는 아님)
  if (!process.env.DATA_GO_KR_API_KEY) {
    console.warn("⚠️ DATA_GO_KR_API_KEY가 설정되지 않았습니다. 버스 도착정보 기능이 제한됩니다.");
  }

  // 필수 환경 변수 누락 시 에러
  if (errors.length > 0) {
    throw new Error(
      `필수 환경 변수가 설정되지 않았습니다: ${errors.join(", ")}\n` +
      `.env 파일을 확인하거나 환경 변수를 설정해주세요.`
    );
  }

  return {
    SEOUL_API_KEY: process.env.SEOUL_API_KEY!,
    DATA_GO_KR_API_KEY: process.env.DATA_GO_KR_API_KEY || "",
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: parseInt(process.env.PORT || "3000", 10),
  };
}

/**
 * 개발 환경 여부 확인
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV !== "production";
}

/**
 * 프로덕션 환경 여부 확인
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
