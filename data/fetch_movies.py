import os
import json
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

from transform import kobis_to_contract, tmdb_to_contract   # ★ ①에서 만든 함수 가져오기

load_dotenv()
KOBIS_KEY = os.getenv("KOBIS_API_KEY")
TMDB_KEY = os.getenv("TMDB_API_KEY")

KOBIS_URL = "https://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json"
TMDB_BASE = "https://api.themoviedb.org/3"


def fetch_kobis():
    """어제 박스오피스를 받아 변환해서 반환."""
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y%m%d")
    raw = requests.get(KOBIS_URL, params={"key": KOBIS_KEY, "targetDt": yesterday}, timeout=10).json()
    return kobis_to_contract(raw)


def fetch_tmdb():
    """인기 영화를 받아 변환해서 반환."""
    genre_res = requests.get(
        f"{TMDB_BASE}/genre/movie/list",
        params={"api_key": TMDB_KEY, "language": "ko-KR"},   # 장르 언어 (데이터단에서 한글로 변환)
        timeout=10,
    ).json()
    genre_map = {g["id"]: g["name"] for g in genre_res["genres"]}

    results = requests.get(
        f"{TMDB_BASE}/movie/popular",
        params={"api_key": TMDB_KEY, "language": "ko-KR", "page": 1},   # 제목은 한글
        timeout=10,
    ).json()["results"]
    return tmdb_to_contract(results, genre_map)


if __name__ == "__main__":
    boxoffice = fetch_kobis()
    movies = fetch_tmdb()

    print(f"박스오피스 {len(boxoffice)}편 / 영화 {len(movies)}편 변환 완료\n")
    print("=== 박스오피스 샘플 ===")
    print(json.dumps(boxoffice[0], ensure_ascii=False, indent=2))
    print("\n=== 영화 샘플 ===")
    print(json.dumps(movies[0], ensure_ascii=False, indent=2))