"""KOBIS / TMDB API 응답을 프론트·백엔드가 쓸 모양으로 변환하는 함수 모음."""

IMG_BASE = "https://image.tmdb.org/t/p/w500"


def kobis_to_contract(api_response):
    """KOBIS 일별 박스오피스 응답 → 박스오피스 리스트."""
    r = api_response["boxOfficeResult"]
    raw = r["showRange"][:8]                       # "20231217"
    date = f"{raw[:4]}-{raw[4:6]}-{raw[6:]}"       # "2023-12-17"
    return [
        {
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
        }
        for m in r["dailyBoxOfficeList"]
    ]


def tmdb_to_contract(results, genre_map):
    """TMDB 영화 목록 + 장르사전 → 영화 리스트."""
    return [
        {
            "id": m["id"],
            "title": m["title"],
            "release_date": m.get("release_date", ""),
            "vote_average": m["vote_average"],
            "popularity": m["popularity"],
            "revenue": 0,                          # 목록엔 없음 → 디테일에서 채움
            "genres": [genre_map.get(g, "기타") for g in m["genre_ids"]],
            "poster_path": (IMG_BASE + m["poster_path"]) if m.get("poster_path") else None,
        }
        for m in results
    ]