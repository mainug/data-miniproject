import matplotlib.pyplot as plt
from collections import Counter
from fetch_movies import fetch_kobis, fetch_tmdb   # 앞서 만든 함수 재사용

# ★★ 한글 폰트 설정 (이거 없으면 영화 제목이 □□□로 깨짐) ★★
plt.rcParams["font.family"] = "Malgun Gothic"   # 윈도우 기본 한글 폰트
plt.rcParams["axes.unicode_minus"] = False       # 마이너스 부호 깨짐 방지

# ===== 1. 박스오피스 Top 10 관객수 (KOFIC) =====
box = sorted(fetch_kobis(), key=lambda x: x["audiCnt"])   # 가로막대용: 작은 값이 아래
names = [m["movieNm"] for m in box]
audi = [m["audiCnt"] for m in box]

plt.figure(figsize=(9, 6))
bars = plt.barh(names, audi, color="#1D9E75")
plt.bar_label(bars, fmt="{:,.0f}", padding=4, fontsize=9)   # 막대 끝에 숫자 표시
plt.title("박스오피스 Top 10 — 일일 관객수")
plt.xlabel("관객수 (명)")
plt.tight_layout()
plt.savefig("chart_boxoffice.png", dpi=120)
print("저장 완료 → chart_boxoffice.png")

# ===== 2. 장르 분포 (TMDB) =====
counter = Counter()
for m in fetch_tmdb():
    counter.update(m["genres"])          # 영화마다 장르 여러 개 → 모두 카운트
genres = counter.most_common()
g_names = [g[0] for g in genres]
g_counts = [g[1] for g in genres]

plt.figure(figsize=(9, 6))
plt.bar(g_names, g_counts, color="#378ADD")
plt.title("인기 영화 장르 분포 (TMDB)")
plt.ylabel("영화 수")
plt.xticks(rotation=45, ha="right")
plt.tight_layout()
plt.savefig("chart_genre.png", dpi=120)
print("저장 완료 → chart_genre.png")

plt.show()