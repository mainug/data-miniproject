# 데이터 스펙 (Data → Backend)

> 데이터 담당이 실시간 오픈API(KOBIS / TMDB)를 받아 **아래 모양으로 가공해서** 백엔드에 전달합니다.
> 백엔드는 이 스펙대로 JPA 엔티티를 만들어 저장 후 프론트에 제공하면 됩니다.

---

## 1. 개요

| 구분 | 데이터 | 출처 API | 용도(페이지) |
|------|--------|----------|--------------|
| 박스오피스 | 일별 흥행 순위·관객수 | KOBIS (영화진흥위원회) | 박스오피스 페이지 |
| 영화 | 제목·장르·평점·포스터 | TMDB | TMDB(영화) 페이지 |

- 두 데이터는 **서로 독립**입니다(현재 매칭하지 않음).
- 모든 숫자는 가공 단계에서 **문자열 → 숫자로 변환 완료** 후 전달합니다.
- 전달 형태: JSON 배열.

---

## 2. 박스오피스 (KOFIC)

일별 박스오피스 1건 = 영화 1편의 그날 흥행 기록. 보통 10편씩 들어옵니다.

| 필드 | JSON 타입 | 추천 Java 타입 | 예시 | Null | 설명 |
|------|-----------|----------------|------|------|------|
| `rank` | number | `int` | `1` | N | 그날 박스오피스 순위 |
| `movieNm` | string | `String` | `"군체"` | N | 영화명(국문) |
| `openDt` | string | `String` / `LocalDate` | `"2026-05-21"` | N | 개봉일 (YYYY-MM-DD) |
| `salesAmt` | number | **`long`** | `324208640` | N | 해당일 매출액(원) |
| `salesShare` | number | `double` | `31.8` | N | 매출 점유율(%) |
| `audiCnt` | number | `int` | `32022` | N | 해당일 관객수 |
| `audiAcc` | number | **`long`** | `5278726` | N | 누적 관객수 |
| `scrnCnt` | number | `int` | `1146` | N | 상영 스크린수 |
| `showCnt` | number | `int` | `3973` | N | 상영 횟수 |
| `date` | string | `String` / `LocalDate` | `"2026-06-16"` | N | 집계 기준일 (YYYY-MM-DD) |

### ⚠️ 백엔드와 협의 필요 — PK(기본키)
현재 박스오피스 항목에는 **영화 고유코드가 없습니다**(프론트 더미 기준). DB 저장 시 `movieNm`(영화명)을 키로 쓰면 동명 영화·표기 변경에 취약합니다.
→ 필요하면 가공 단계에서 KOBIS의 **`movieCd`(영화 대표코드, 예: `"20252402"`)** 를 추가로 넣어드릴 수 있습니다. **(movieCd + date)** 조합을 복합 키로 쓰는 걸 권장. 백엔드에서 필요 여부 회신 요망.

---

## 3. 영화 (TMDB)

영화 1편의 메타데이터. 인기/검색 목록 단위로 들어옵니다.

| 필드 | JSON 타입 | 추천 Java 타입 | 예시 | Null | 설명 |
|------|-----------|----------------|------|------|------|
| `id` | number | `long` (PK) | `1339713` | N | TMDB 영화 ID (고유키) |
| `title` | string | `String` | `"옵세션"` | N | 영화 제목 (**국문으로 전달**) |
| `release_date` | string | `String` / `LocalDate` | `"2026-05-13"` | Y | 개봉일. 미정 시 `""` |
| `vote_average` | number | `double` | `7.91` | N | TMDB 평점(0~10) |
| `popularity` | number | `double` | `718.2` | N | TMDB 인기 지수 |
| `revenue` | number | `long` | `0` | N | 매출. **목록에선 항상 0** (아래 참고) |
| `genres` | array(string) | `List<String>` | `["Horror"]` | N | 장르명 배열 (**아래 참고**) |
| `poster_path` | string | `String` | `"https://image.tmdb.org/t/p/w500/..."` | Y | 포스터 전체 URL. 없으면 `null` |

### 참고 사항
- **`genres` 언어**: 현재 **영어**(`"Horror"`)로 전달합니다. 한글 전환은 **백엔드에서 가공**하기로 협의됨. 데이터 쪽에서 한글로 줄지(`"공포"`), 장르 ID 배열로 줄지(`[27]`)는 백엔드 편한 쪽으로 맞출 수 있음 → **회신 요망**.
- **`revenue`**: 목록 API엔 매출 정보가 없어 `0`으로 채웁니다. 실제 값은 **상세 페이지에서 영화 ID로 별도 호출** 시 채워집니다. 디테일 페이지에서만 필요하면 그때 제공.
- **`poster_path`**: 이미 전체 URL로 조립해서 전달(프론트가 그대로 `<img src>`에 사용 가능). 원본이 없는 영화는 `null`.

---

## 4. 전달 샘플 (JSON)

### 박스오피스
```json
[
  {
    "rank": 1,
    "movieNm": "군체",
    "openDt": "2026-05-21",
    "salesAmt": 324208640,
    "salesShare": 31.8,
    "audiCnt": 32022,
    "audiAcc": 5278726,
    "scrnCnt": 1146,
    "showCnt": 3973,
    "date": "2026-06-16"
  }
]
```

### 영화
```json
[
  {
    "id": 1339713,
    "title": "옵세션",
    "release_date": "2026-05-13",
    "vote_average": 7.91,
    "popularity": 718.2,
    "revenue": 0,
    "genres": ["Horror"],
    "poster_path": "https://image.tmdb.org/t/p/w500/bRwnj8WEKBCvmfeUNOukJPwB43K.jpg"
  }
]
```

---

## 5. 백엔드에 회신 부탁할 항목 (요약)

1. **박스오피스 PK** — `movieCd`를 추가로 넣어드릴까요? (movieCd + date 복합키 권장)
2. **장르 형태** — `genres`를 영어 문자열 / 한글 문자열 / ID 배열 중 무엇으로 드릴까요?
3. **revenue** — 목록에선 0, 상세에서 채우는 방식으로 진행해도 될까요?
4. **전달 방식** — JSON 파일 전달 / 데이터 쪽이 직접 호출 코드 제공 / 기타 중 무엇이 편한가요?
5. **갱신 주기** — 박스오피스는 매일 갱신(전일 데이터)인데, 수집·전달 주기를 어떻게 맞출까요?

---

## 6. 데이터 타입 주의 (JPA 엔티티 설계용)

- `salesAmt`, `audiAcc`, `revenue`는 값이 커서 **`int` 범위(약 21억)를 초과**할 수 있습니다 → **`long`** 권장.
- `salesShare`, `vote_average`, `popularity`는 소수 → `double`.
- 날짜 필드(`openDt`, `date`, `release_date`)는 문자열로 전달하나, JPA에서 `LocalDate`로 받아도 무방(형식 `YYYY-MM-DD`).
