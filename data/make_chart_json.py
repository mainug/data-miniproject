import json
from collections import Counter
from fetch_movies import fetch_kobis, fetch_tmdb

# ===== 1. 박스오피스 Top 10 관객수 (KOFIC) =====
box = sorted(fetch_kobis(), key=lambda x: x["audiCnt"], reverse=True)  # 큰 값부터
boxoffice_chart = {
    "title": "박스오피스 Top 10 관객수",
    "labels": [m["movieNm"] for m in box],
    "values": [m["audiCnt"] for m in box],
}

# ===== 2. 장르 분포 (TMDB) =====
counter = Counter()
for m in fetch_tmdb():
    counter.update(m["genres"])
genre_sorted = counter.most_common()        # [('Action', 8), ('Fantasy', 6), ...]
genre_chart = {
    "title": "인기 영화 장르 분포",
    "labels": [g[0] for g in genre_sorted],
    "values": [g[1] for g in genre_sorted],
}

# ===== 하나의 JSON으로 묶어서 저장 =====
charts = {
    "boxofficeAudience": boxoffice_chart,
    "genreDistribution": genre_chart,
}

with open("chart_data.json", "w", encoding="utf-8") as f:
    json.dump(charts, f, ensure_ascii=False, indent=2)

print("저장 완료 → chart_data.json")
print(json.dumps(charts, ensure_ascii=False, indent=2))