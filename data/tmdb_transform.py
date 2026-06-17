import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()
TMDB_KEY = os.getenv("TMDB_API_KEY")

IMG_BASE = "https://image.tmdb.org/t/p/w500"

# 1) 장르 ID→이름 사전 (일단 영어로 받음 — 프론트 더미가 영어라서)
genre_res = requests.get(
    "https://api.themoviedb.org/3/genre/movie/list",
    params={"api_key": TMDB_KEY, "language": "en-US"},
    timeout=10,
).json()
genre_map = {g["id"]: g["name"] for g in genre_res["genres"]}

# 2) 변환 함수: TMDB 응답 → 프론트 더미 모양
def tmdb_to_contract(results, genre_map):
    out = []
    for m in results:
        out.append({
            "id": m["id"],
            "title": m["title"],
            "release_date": m.get("release_date", ""),
            "vote_average": m["vote_average"],
            "popularity": m["popularity"],
            "revenue": 0,  # 검색/목록엔 없음 → 0으로 두고 디테일에서 채움
            "genres": [genre_map.get(g, "기타") for g in m["genre_ids"]],
            "poster_path": (IMG_BASE + m["poster_path"]) if m.get("poster_path") else None,
        })
    return out

# 3) 인기 영화 목록 받아서 변환
popular = requests.get(
    "https://api.themoviedb.org/3/movie/popular",
    params={"api_key": TMDB_KEY, "language": "ko-KR", "page": 1},
    timeout=10,
).json()["results"]

result = tmdb_to_contract(popular, genre_map)

print(f"변환 완료: {len(result)}편\n")
print(json.dumps(result[:3], ensure_ascii=False, indent=2))  # 앞 3편만 출력