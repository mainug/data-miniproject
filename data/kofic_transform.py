import os
import json
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()
KOBIS_KEY = os.getenv("KOBIS_API_KEY")

KOBIS_URL = "https://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json"

# 변환 함수: KOBIS 응답 → 프론트 더미 모양
def kobis_to_contract(api_response):
    r = api_response["boxOfficeResult"]
    raw = r["showRange"][:8]                          # "20231217"
    date = f"{raw[:4]}-{raw[4:6]}-{raw[6:]}"          # "2023-12-17"
    out = []
    for m in r["dailyBoxOfficeList"]:
        out.append({
            "rank": int(m["rank"]),
            "movieNm": m["movieNm"],
            "openDt": m["openDt"],
            "salesAmt": int(m["salesAmt"]),
            "salesShare": float(m["salesShare"]),
            "audiCnt": int(m["audiCnt"]),
            "audiAcc": int(m["audiAcc"]),
            "scrnCnt": int(m["scrnCnt"]),
            "showCnt": int(m["showCnt"]),
            "date": date,
        })
    return out

# 어제 날짜로 박스오피스 받아서 변환
yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y%m%d")
raw = requests.get(KOBIS_URL, params={"key": KOBIS_KEY, "targetDt": yesterday}, timeout=10).json()

result = kobis_to_contract(raw)

print(f"변환 완료: {len(result)}편\n")
print(json.dumps(result[:3], ensure_ascii=False, indent=2))  # 앞 3편만 출력