import os
import json
import requests
import pandas as pd
from dotenv import load_dotenv

# 기존 데이터 수집/변환 함수들을 재사용합니다.
from fetch_movies import fetch_tmdb, fetch_kobis
from fetch_similar_movies import fetch_similar_movies

# .env 파일에서 환경 변수 로드
load_dotenv()
BACKEND_URL = os.getenv("BACKEND_API_URL")  # 예: http://localhost:8080
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL")


def send_slack_notification(message: str):
    """에러 발생 시 슬랙(Slack) 웹훅으로 알림을 전송합니다."""
    if not SLACK_WEBHOOK_URL:
        return
    try:
        payload = {"text": message}
        requests.post(SLACK_WEBHOOK_URL, json=payload, timeout=10)
    except Exception as e:
        print(f"⚠️ 슬랙 알림 전송에 실패했습니다: {e}")


def push_data_to_backend(data, endpoint: str):
    """
    가공된 데이터(리스트 또는 데이터프레임)를 백엔드 API로 PUSH합니다.
    """
    if not BACKEND_URL:
        print("🛑 에러: .env 파일에 BACKEND_API_URL이 설정되지 않았습니다.")
        return

    # 데이터프레임인 경우, 백엔드가 요구하는 JSON 형식(레코드 배열)으로 변환
    if isinstance(data, pd.DataFrame):
        json_data = data.to_json(orient="records", force_ascii=False)
    # 리스트인 경우, 바로 JSON으로 변환
    else:
        json_data = json.dumps(data, ensure_ascii=False)

    api_url = f"{BACKEND_URL}{endpoint}"
    headers = {"Content-Type": "application/json; charset=utf-8"}

    print(f"🚀 {api_url} 로 데이터를 전송합니다...")

    try:
        response = requests.post(api_url, data=json_data.encode("utf-8"), headers=headers, timeout=30)

        # 요청 성공 여부 확인
        if 200 <= response.status_code < 300:
            print(f"✅ 성공: 데이터가 성공적으로 전송되었습니다. (상태 코드: {response.status_code})")
            # print("응답:", response.json()) # 백엔드 응답이 있다면 출력
            send_slack_notification(f"✅ *[데이터 파이프라인 성공]* 백엔드 전송 완료\n*엔드포인트:* `{api_url}`\n*상태 코드:* `{response.status_code}`")
        else:
            print(f"❌ 실패: 데이터 전송에 실패했습니다. (상태 코드: {response.status_code})")
            print("에러 메시지:", response.text)
            send_slack_notification(f"❌ *[데이터 파이프라인 에러]* 백엔드 전송 실패\n*엔드포인트:* `{api_url}`\n*상태 코드:* `{response.status_code}`\n*에러 메시지:* {response.text}")

    except requests.exceptions.RequestException as e:
        print(f"🔥 네트워크 에러: 백엔드 서버({BACKEND_URL})에 연결할 수 없습니다.")
        send_slack_notification(f"🔥 *[네트워크 에러]* 백엔드 서버 연결 실패\n*엔드포인트:* `{api_url}`\n*상세 에러:* {e}")


if __name__ == "__main__":
    # 1. TMDB에서 영화 데이터 수집 후 데이터프레임으로 변환
    movie_list = fetch_tmdb()
    movie_df = pd.DataFrame(movie_list)

    # 2. 백엔드의 Bulk API로 데이터 PUSH
    push_data_to_backend(movie_df, "/api/movies/bulk")