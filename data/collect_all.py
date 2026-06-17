"""
영화 데이터 통합 수집 파이프라인
─────────────────────────────────
1) KOBIS  : N일치 일별 박스오피스 (기본 30일)
2) TMDB   : popular / now_playing / top_rated / trending 영화 목록
3) TMDB   : 각 영화의 상세정보 (credits, revenue, budget, runtime …)

실행:  python collect_all.py            # 기본 30일
       python collect_all.py --days 7   # 최근 7일만
"""

import os
import sys
import json
import time
import argparse
import requests
import pandas as pd
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

sys.stdout.reconfigure(encoding="utf-8")

KOBIS_KEY = os.getenv("KOBIS_API_KEY")
TMDB_KEY = os.getenv("TMDB_API_KEY")

KOBIS_URL = "https://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json"
TMDB_BASE = "https://api.themoviedb.org/3"
IMG_BASE = "https://image.tmdb.org/t/p/w500"

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

TMDB_CALL_COUNT = 0
TMDB_WINDOW_START = time.time()


def tmdb_get(path, params=None):
    """TMDB API 호출 + 간단한 rate-limit (40 req / 10s)."""
    global TMDB_CALL_COUNT, TMDB_WINDOW_START
    TMDB_CALL_COUNT += 1
    if TMDB_CALL_COUNT % 35 == 0:
        elapsed = time.time() - TMDB_WINDOW_START
        if elapsed < 10:
            time.sleep(10 - elapsed)
        TMDB_WINDOW_START = time.time()

    base_params = {"api_key": TMDB_KEY, "language": "ko-KR"}
    if params:
        base_params.update(params)
    resp = requests.get(f"{TMDB_BASE}{path}", params=base_params, timeout=15)
    resp.raise_for_status()
    return resp.json()


def clean_movie_name(name: str) -> str:
    """KOBIS movieNm에 줄거리가 포함된 경우 제목만 추출."""
    if len(name) <= 50:
        return name
    for sep in [" : ", " - "]:
        if sep in name:
            return name.split(sep)[0].strip()
    return name[:50].strip()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1. KOBIS 다일 박스오피스
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def collect_kobis(days: int) -> pd.DataFrame:
    """최근 N일치 일별 박스오피스를 수집하여 DataFrame으로 반환."""
    print(f"\n[KOBIS] 최근 {days}일 박스오피스 수집 시작")
    rows = []
    for i in range(1, days + 1):
        dt = datetime.now() - timedelta(days=i)
        dt_str = dt.strftime("%Y%m%d")
        try:
            raw = requests.get(
                KOBIS_URL,
                params={"key": KOBIS_KEY, "targetDt": dt_str},
                timeout=10,
            ).json()
            r = raw["boxOfficeResult"]
            show_range = r["showRange"][:8]
            date = f"{show_range[:4]}-{show_range[4:6]}-{show_range[6:]}"
            for m in r["dailyBoxOfficeList"]:
                rows.append({
                    "date": date,
                    "rank": int(m["rank"]),
                    "movieCd": m["movieCd"],
                    "movieNm": clean_movie_name(m["movieNm"]),
                    "openDt": m["openDt"],
                    "salesAmt": int(m["salesAmt"]),
                    "salesShare": float(m["salesShare"]),
                    "audiCnt": int(m["audiCnt"]),
                    "audiAcc": int(m["audiAcc"]),
                    "scrnCnt": int(m["scrnCnt"]),
                    "showCnt": int(m["showCnt"]),
                })
            print(f"  {date} — {len(r['dailyBoxOfficeList'])}편")
        except Exception as e:
            print(f"  {dt_str} 수집 실패: {e}")
        time.sleep(0.3)

    df = pd.DataFrame(rows)
    print(f"[KOBIS] 총 {len(df)}건 수집 완료")
    return df


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 2. TMDB 영화 목록 (multi-source)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TMDB_SOURCES = [
    ("movie/popular", "/movie/popular", 5),
    ("movie/now_playing", "/movie/now_playing", 3),
    ("movie/top_rated", "/movie/top_rated", 5),
    ("trending/movie/week", "/trending/movie/week", 3),
]


def fetch_genre_map() -> dict:
    """TMDB 장르 ID → 한글 이름 사전."""
    data = tmdb_get("/genre/movie/list")
    return {g["id"]: g["name"] for g in data["genres"]}


def collect_tmdb_lists(genre_map: dict) -> pd.DataFrame:
    """여러 TMDB 엔드포인트에서 영화 목록을 수집, 중복 제거 후 반환."""
    print("\n[TMDB] 영화 목록 수집 시작")
    seen_ids = set()
    rows = []

    for source_name, path, pages in TMDB_SOURCES:
        count = 0
        for page in range(1, pages + 1):
            data = tmdb_get(path, {"page": page})
            for m in data.get("results", []):
                mid = m["id"]
                if mid in seen_ids:
                    continue
                seen_ids.add(mid)
                genres = [genre_map.get(g, str(g)) for g in m.get("genre_ids", [])]
                rows.append({
                    "id": mid,
                    "title": m.get("title", ""),
                    "original_title": m.get("original_title", ""),
                    "release_date": m.get("release_date", ""),
                    "vote_average": m.get("vote_average", 0),
                    "vote_count": m.get("vote_count", 0),
                    "popularity": m.get("popularity", 0),
                    "genres": "|".join(genres),
                    "poster_path": (IMG_BASE + m["poster_path"]) if m.get("poster_path") else None,
                    "overview": m.get("overview", ""),
                    "source": source_name,
                })
                count += 1
        print(f"  {source_name} — {count}편 (신규)")

    df = pd.DataFrame(rows)
    print(f"[TMDB] 총 {len(df)}편 (중복 제거 후)")
    return df


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 3. TMDB 상세정보 보강
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def enrich_movie(movie_id: int) -> dict:
    """영화 1편의 상세 + 크레딧 정보를 가져와 dict로 반환."""
    detail = tmdb_get(f"/movie/{movie_id}")
    credits = tmdb_get(f"/movie/{movie_id}/credits")

    directors = [c["name"] for c in credits.get("crew", []) if c["job"] == "Director"]
    cast_top3 = [c["name"] for c in credits.get("cast", [])[:3]]
    collection = detail.get("belongs_to_collection")
    countries = [c["name"] for c in detail.get("production_countries", [])]

    return {
        "runtime": detail.get("runtime") or 0,
        "budget": detail.get("budget") or 0,
        "revenue": detail.get("revenue") or 0,
        "status": detail.get("status", ""),
        "tagline": detail.get("tagline", ""),
        "director": ", ".join(directors),
        "cast_top3": ", ".join(cast_top3),
        "collection_name": collection["name"] if collection else None,
        "production_countries": ", ".join(countries),
    }


def collect_tmdb_details(movies_df: pd.DataFrame) -> pd.DataFrame:
    """목록 DataFrame의 모든 영화에 상세정보를 붙여 enriched DataFrame 반환."""
    print(f"\n[TMDB] {len(movies_df)}편 상세정보 수집 시작")
    details = []
    total = len(movies_df)
    for idx, row in movies_df.iterrows():
        mid = int(row["id"])
        try:
            info = enrich_movie(mid)
            details.append(info)
            if (idx + 1) % 20 == 0 or idx + 1 == total:
                print(f"  진행: {idx + 1}/{total}")
        except Exception as e:
            print(f"  ID {mid} ({row['title']}) 실패: {e}")
            details.append({
                "runtime": 0, "budget": 0, "revenue": 0, "status": "",
                "tagline": "", "director": "", "cast_top3": "",
                "collection_name": None, "production_countries": "",
            })

    details_df = pd.DataFrame(details)
    enriched = pd.concat([movies_df.reset_index(drop=True), details_df], axis=1)
    print(f"[TMDB] 상세정보 보강 완료")
    return enriched


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 저장
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def save(df: pd.DataFrame, name: str):
    """DataFrame을 CSV + JSON으로 저장."""
    csv_path = os.path.join(OUTPUT_DIR, f"{name}.csv")
    json_path = os.path.join(OUTPUT_DIR, f"{name}.json")
    df.to_csv(csv_path, index=False, encoding="utf-8-sig")
    df.to_json(json_path, orient="records", force_ascii=False, indent=2)
    print(f"  -> {csv_path}")
    print(f"  -> {json_path}")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 메인
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def main():
    parser = argparse.ArgumentParser(description="영화 데이터 통합 수집")
    parser.add_argument("--days", type=int, default=30, help="KOBIS 수집 일수 (기본 30)")
    parser.add_argument("--skip-kobis", action="store_true", help="KOBIS 수집 건너뛰기")
    parser.add_argument("--skip-tmdb", action="store_true", help="TMDB 수집 건너뛰기")
    parser.add_argument("--skip-details", action="store_true", help="TMDB 상세정보 건너뛰기")
    args = parser.parse_args()

    print("=" * 55)
    print("  영화 데이터 통합 수집 파이프라인")
    print(f"  실행 시각: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 55)

    # 1) KOBIS
    if not args.skip_kobis:
        kobis_df = collect_kobis(args.days)
        if not kobis_df.empty:
            save(kobis_df, f"kobis_boxoffice_{args.days}d")
    else:
        print("\n[KOBIS] 건너뜀 (--skip-kobis)")

    # 2) TMDB 목록
    if not args.skip_tmdb:
        genre_map = fetch_genre_map()
        tmdb_df = collect_tmdb_lists(genre_map)
        save(tmdb_df, "tmdb_movies")

        # 3) TMDB 상세
        if not args.skip_details:
            enriched_df = collect_tmdb_details(tmdb_df)
            save(enriched_df, "movies_enriched")
        else:
            print("\n[TMDB] 상세정보 건너뜀 (--skip-details)")
    else:
        print("\n[TMDB] 건너뜀 (--skip-tmdb)")

    print("\n" + "=" * 55)
    print("  수집 완료!")
    print("=" * 55)


if __name__ == "__main__":
    main()
