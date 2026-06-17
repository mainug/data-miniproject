import os
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()
KOBIS_KEY = os.getenv("KOBIS_API_KEY")
TMDB_KEY = os.getenv("TMDB_API_KEY")

print("키 로딩 확인 →",
      "KOBIS:", "OK" if KOBIS_KEY else "❌ 없음",
      "| TMDB:", "OK" if TMDB_KEY else "❌ 없음")
print("-" * 50)

# ============ KOBIS 작동 확인 ============
yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y%m%d")
kobis_url = "https://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json"

try:
    res = requests.get(kobis_url, params={"key": KOBIS_KEY, "targetDt": yesterday}, timeout=10)
    print(f"KOBIS 응답 코드: {res.status_code} (200이면 정상)")
    data = res.json()
    if "faultInfo" in data:
        print("❌ KOBIS 에러:", data["faultInfo"]["message"])
    else:
        movies = data["boxOfficeResult"]["dailyBoxOfficeList"]
        print(f"✅ KOBIS 정상 — {yesterday} 기준 {len(movies)}편 수신")
        for m in movies[:3]:
            print(f"   {m['rank']}위 {m['movieNm']} / 관객 {int(m['audiCnt']):,}명")
except Exception as e:
    print("❌ KOBIS 호출 실패:", e)

print("-" * 50)

# ============ TMDB 작동 확인 ============
try:
    res = requests.get(
        "https://api.themoviedb.org/3/search/movie",
        params={"api_key": TMDB_KEY, "query": "기생충", "language": "ko-KR"},
        timeout=10,
    )
    print(f"TMDB 응답 코드: {res.status_code} (200이면 정상)")
    data = res.json()
    if res.status_code != 200:
        print("❌ TMDB 에러:", data.get("status_message", data))
    else:
        first = data["results"][0]
        print(f"✅ TMDB 정상 — '{first['title']}' ({first['release_date']}) id={first['id']}")
except Exception as e:
    print("❌ TMDB 호출 실패:", e)