import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()
TMDB_KEY = os.getenv("TMDB_API_KEY")

IMG_BASE = "https://image.tmdb.org/t/p/w500"

# 1) 장르 ID→한글 이름 사전 (백엔드 요구사항 반영)
genre_res = requests.get(
    "https://api.themoviedb.org/3/genre/movie/list",
    params={"api_key": TMDB_KEY, "language": "ko-KR"},
    timeout=10,
).json()
genre_map = {g["id"]: g["name"] for g in genre_res["genres"]}

# 2) 변환 함수: TMDB 응답 → 프론트 더미 모양
def tmdb_to_contract(results, genre_map):
    out = []
    for m in results:
        movie_id = m["id"]
        
        # 💡 DA 추가 작업: 각 영화의 상세 정보를 호출하여 러닝타임 및 시리즈 정보 확보
        detail_res = requests.get(
            f"https://api.themoviedb.org/3/movie/{movie_id}",
            params={"api_key": TMDB_KEY, "language": "ko-KR"},
            timeout=10,
        ).json()
        
        collection = detail_res.get("belongs_to_collection")
        
        out.append({
            "id": movie_id,
            "title": m["title"],
            "release_date": m.get("release_date", ""),
            "vote_average": m["vote_average"],
            "popularity": m["popularity"],
            "revenue": 0,  # 검색/목록엔 없음 → 0으로 두고 디테일에서 채움
            "runtime": detail_res.get("runtime", 0),                                # 추가: 상영 시간
            "collection_name": collection["name"] if collection else None,          # 추가: 세계관(시리즈) 이름
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