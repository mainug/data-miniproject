"""
영화 데이터 분석 스크립트
────────────────────────
수집된 movies_enriched / kobis_boxoffice 데이터를 읽어
프론트 대시보드에 필요한 분석 결과를 JSON으로 출력합니다.

분석 항목:
  1) 흥행 vs 평점 상관관계 (scatter + 상관계수)
  2) 연도별 트렌드 (개봉작수, 평균평점, 평균수익)
  3) 장르별 심화 분석 (영화수, 평균평점, 평균수익, 총수익)
  4) KOBIS 박스오피스 추세 (일별 총관객수 · 총매출)

실행:  python analyze.py
"""

import os
import sys
import json
import math
import pandas as pd

sys.stdout.reconfigure(encoding="utf-8")

DATA_DIR = os.path.join(os.path.dirname(__file__), "output")
FRONT_PUBLIC = os.path.join(os.path.dirname(__file__), "..", "front", "public")


def load_movies() -> pd.DataFrame:
    path = os.path.join(DATA_DIR, "movies_enriched.csv")
    df = pd.read_csv(path, encoding="utf-8-sig")
    df["genres_list"] = df["genres"].fillna("").str.split("|")
    df["year"] = pd.to_numeric(df["release_date"].str[:4], errors="coerce")
    return df


def load_kobis() -> pd.DataFrame:
    path = os.path.join(DATA_DIR, "kobis_boxoffice_30d.csv")
    return pd.read_csv(path, encoding="utf-8-sig")


def pearson(xs, ys):
    n = len(xs)
    if n < 3:
        return 0
    mx, my = sum(xs) / n, sum(ys) / n
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    dx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    dy = math.sqrt(sum((y - my) ** 2 for y in ys))
    if dx == 0 or dy == 0:
        return 0
    return round(num / (dx * dy), 4)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1. 흥행 vs 평점 상관관계
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def analyze_correlation(df: pd.DataFrame) -> dict:
    has_rev = df[df["revenue"] > 0].copy()

    scatter_data = []
    for _, r in has_rev.iterrows():
        scatter_data.append({
            "title": r["title"],
            "vote_average": round(r["vote_average"], 2),
            "revenue": int(r["revenue"]),
            "popularity": round(r["popularity"], 2),
            "budget": int(r.get("budget", 0)),
        })

    rating_vs_revenue = pearson(
        has_rev["vote_average"].tolist(),
        has_rev["revenue"].tolist(),
    )
    rating_vs_popularity = pearson(
        df["vote_average"].tolist(),
        df["popularity"].tolist(),
    )
    budget_vs_revenue = pearson(
        has_rev[has_rev["budget"] > 0]["budget"].tolist(),
        has_rev[has_rev["budget"] > 0]["revenue"].tolist(),
    )

    print(f"[상관분석] 평점↔수익: {rating_vs_revenue}  평점↔인기도: {rating_vs_popularity}  제작비↔수익: {budget_vs_revenue}")
    return {
        "scatter": scatter_data,
        "coefficients": {
            "rating_vs_revenue": rating_vs_revenue,
            "rating_vs_popularity": rating_vs_popularity,
            "budget_vs_revenue": budget_vs_revenue,
        },
        "sample_size": len(has_rev),
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 2. 연도별 트렌드
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def analyze_year_trend(df: pd.DataFrame) -> list:
    valid = df[df["year"].notna()].copy()
    valid["year"] = valid["year"].astype(int)

    grouped = valid.groupby("year").agg(
        count=("id", "size"),
        avg_rating=("vote_average", "mean"),
        avg_revenue=("revenue", "mean"),
        total_revenue=("revenue", "sum"),
        avg_popularity=("popularity", "mean"),
    ).reset_index()

    result = []
    for _, r in grouped.sort_values("year").iterrows():
        result.append({
            "year": int(r["year"]),
            "count": int(r["count"]),
            "avg_rating": round(r["avg_rating"], 2),
            "avg_revenue": int(r["avg_revenue"]),
            "total_revenue": int(r["total_revenue"]),
            "avg_popularity": round(r["avg_popularity"], 2),
        })
    print(f"[연도트렌드] {len(result)}개 연도")
    return result


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 3. 장르별 심화 분석
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def analyze_genre(df: pd.DataFrame) -> list:
    genre_stats: dict[str, dict] = {}
    for _, row in df.iterrows():
        for g in row["genres_list"]:
            if not g:
                continue
            if g not in genre_stats:
                genre_stats[g] = {
                    "count": 0, "rating_sum": 0, "revenue_sum": 0,
                    "popularity_sum": 0, "budget_sum": 0, "top_movie": ("", 0),
                }
            s = genre_stats[g]
            s["count"] += 1
            s["rating_sum"] += row["vote_average"]
            s["revenue_sum"] += int(row.get("revenue", 0))
            s["popularity_sum"] += row["popularity"]
            s["budget_sum"] += int(row.get("budget", 0))
            if row["vote_average"] > s["top_movie"][1]:
                s["top_movie"] = (row["title"], round(row["vote_average"], 2))

    result = []
    for genre, s in genre_stats.items():
        c = s["count"]
        result.append({
            "genre": genre,
            "count": c,
            "avg_rating": round(s["rating_sum"] / c, 2),
            "avg_revenue": int(s["revenue_sum"] / c) if c else 0,
            "total_revenue": s["revenue_sum"],
            "avg_popularity": round(s["popularity_sum"] / c, 2),
            "avg_budget": int(s["budget_sum"] / c) if c else 0,
            "top_movie": s["top_movie"][0],
            "top_movie_rating": s["top_movie"][1],
        })
    result.sort(key=lambda x: x["count"], reverse=True)
    print(f"[장르분석] {len(result)}개 장르")
    return result


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 4. KOBIS 박스오피스 일별 추세
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def analyze_kobis_trend(kdf: pd.DataFrame) -> list:
    daily = kdf.groupby("date").agg(
        total_audience=("audiCnt", "sum"),
        total_sales=("salesAmt", "sum"),
        top_movie=("movieNm", "first"),
    ).reset_index()
    daily = daily.sort_values("date")

    result = []
    for _, r in daily.iterrows():
        result.append({
            "date": r["date"],
            "total_audience": int(r["total_audience"]),
            "total_sales": int(r["total_sales"]),
            "top_movie": r["top_movie"],
        })
    print(f"[KOBIS추세] {len(result)}일")
    return result


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 5. 감독별 분석
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def analyze_director(df: pd.DataFrame) -> list:
    has_dir = df[df["director"].fillna("").str.len() > 0].copy()
    grouped = has_dir.groupby("director").agg(
        count=("id", "size"),
        avg_rating=("vote_average", "mean"),
        total_revenue=("revenue", "sum"),
        avg_budget=("budget", "mean"),
        titles=("title", lambda x: list(x)),
    ).reset_index()
    grouped = grouped[grouped["count"] >= 2].sort_values("avg_rating", ascending=False)

    result = []
    for _, r in grouped.iterrows():
        result.append({
            "director": r["director"],
            "count": int(r["count"]),
            "avg_rating": round(r["avg_rating"], 2),
            "total_revenue": int(r["total_revenue"]),
            "avg_budget": int(r["avg_budget"]),
            "movies": r["titles"][:5],
        })
    print(f"[감독분석] {len(result)}명 (2편 이상)")
    return result


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 6. 수익성(ROI) 분석
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def analyze_roi(df: pd.DataFrame) -> list:
    valid = df[(df["budget"] > 0) & (df["revenue"] > 0)].copy()
    valid["roi"] = (valid["revenue"] - valid["budget"]) / valid["budget"] * 100

    result = []
    for _, r in valid.sort_values("roi", ascending=False).iterrows():
        result.append({
            "title": r["title"],
            "budget": int(r["budget"]),
            "revenue": int(r["revenue"]),
            "roi": round(r["roi"], 1),
            "vote_average": round(r["vote_average"], 2),
            "genres": r["genres"],
        })
    print(f"[ROI분석] {len(result)}편 (budget>0 & revenue>0)")
    return result


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 7. 제작국가별 분석
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def analyze_country(df: pd.DataFrame) -> list:
    country_stats: dict[str, dict] = {}
    for _, row in df.iterrows():
        countries = str(row.get("production_countries", ""))
        if not countries or countries == "nan":
            continue
        for c in countries.split(", "):
            c = c.strip()
            if not c:
                continue
            if c not in country_stats:
                country_stats[c] = {"count": 0, "rating_sum": 0, "revenue_sum": 0}
            s = country_stats[c]
            s["count"] += 1
            s["rating_sum"] += row["vote_average"]
            s["revenue_sum"] += int(row.get("revenue", 0))

    result = []
    for country, s in country_stats.items():
        c = s["count"]
        result.append({
            "country": country,
            "count": c,
            "avg_rating": round(s["rating_sum"] / c, 2),
            "total_revenue": s["revenue_sum"],
        })
    result.sort(key=lambda x: x["count"], reverse=True)
    print(f"[국가분석] {len(result)}개국")
    return result


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 8. KOBIS 영화별 누적 관객 순위
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def analyze_kobis_ranking(kdf: pd.DataFrame) -> list:
    latest = kdf.sort_values("date").groupby("movieCd").last().reset_index()
    latest = latest.sort_values("audiAcc", ascending=False)

    result = []
    for _, r in latest.iterrows():
        result.append({
            "movieNm": r["movieNm"],
            "audiAcc": int(r["audiAcc"]),
            "salesAmt": int(r["salesAmt"]),
            "openDt": r["openDt"],
            "scrnCnt": int(r["scrnCnt"]),
        })
    print(f"[KOBIS순위] {len(result)}편")
    return result


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 메인
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def main():
    print("=" * 50)
    print("  영화 데이터 분석")
    print("=" * 50)

    movies = load_movies()
    kobis = load_kobis()
    print(f"영화 {len(movies)}편 / KOBIS {len(kobis)}건 로드\n")

    analysis = {
        "correlation": analyze_correlation(movies),
        "yearTrend": analyze_year_trend(movies),
        "genreAnalysis": analyze_genre(movies),
        "kobisTrend": analyze_kobis_trend(kobis),
        "directorAnalysis": analyze_director(movies),
        "roiAnalysis": analyze_roi(movies),
        "countryAnalysis": analyze_country(movies),
        "kobisRanking": analyze_kobis_ranking(kobis),
    }

    # data/output 에 저장
    out_path = os.path.join(DATA_DIR, "analysis.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(analysis, f, ensure_ascii=False, indent=2)
    print(f"\n-> {out_path}")

    # front/public 에도 저장 (프론트에서 바로 사용)
    front_path = os.path.join(FRONT_PUBLIC, "analysis.json")
    with open(front_path, "w", encoding="utf-8") as f:
        json.dump(analysis, f, ensure_ascii=False, indent=2)
    print(f"-> {front_path}")

    print("\n" + "=" * 50)
    print("  분석 완료!")
    print("=" * 50)


if __name__ == "__main__":
    main()
