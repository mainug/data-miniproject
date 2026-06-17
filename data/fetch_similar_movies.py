import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()
TMDB_KEY = os.getenv("TMDB_API_KEY")
TMDB_BASE = "https://api.themoviedb.org/3"

def fetch_similar_movies():
    # 1. 인기 영화 목록 가져오기 (예시로 1페이지의 영화 20개를 대상으로 함)
    popular_res = requests.get(
        f"{TMDB_BASE}/movie/popular",
        params={"api_key": TMDB_KEY, "language": "ko-KR", "page": 1},
        timeout=10,
    ).json()
    
    movies = popular_res.get("results", [])
    similar_mapping = []

    print(f"총 {len(movies)}개의 영화에 대한 유사 영화 데이터를 수집합니다...")

    # 2. 각 영화별로 유사 영화 API 호출
    for movie in movies:
        movie_id = movie["id"]
        title = movie["title"]
        
        sim_res = requests.get(
            f"{TMDB_BASE}/movie/{movie_id}/similar",
            params={"api_key": TMDB_KEY, "language": "ko-KR", "page": 1},
            timeout=10,
        ).json()
        
        # 유사 영화들의 ID만 추출
        similar_ids = [sim_movie["id"] for sim_movie in sim_res.get("results", [])]
        
        similar_mapping.append({
            "movie_id": movie_id,
            "title": title,  # 데이터 검증을 위해 제목도 포함
            "similar_movie_ids": similar_ids
        })
        
        print(f" - '{title}' (ID: {movie_id}): 유사 영화 {len(similar_ids)}개 추출 완료")

    # 3. 결과를 JSON 파일로 저장
    output_file = "similar_movies.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(similar_mapping, f, ensure_ascii=False, indent=2)
        
    print(f"\n✅ 수집 완료! 데이터가 '{output_file}' 파일로 저장되었습니다.")

if __name__ == "__main__":
    fetch_similar_movies()