# DB 스키마 제안서 (Data → Backend)

> **작성일**: 2026-06-17  
> **작성자**: 데이터 분석 담당  
> **목적**: 수집된 영화 데이터 기반으로 JPA 엔티티 설계에 필요한 테이블 구조를 제안합니다.  
> **참고**: 기존 [DATA_SPEC.md](DATA_SPEC.md)의 합의 사항을 기반으로 확장한 문서입니다.

---

## 1. 전체 ERD 개요

```
┌──────────────────┐       ┌──────────────────────┐
│   box_office     │       │       movie          │
│──────────────────│       │──────────────────────│
│ id (PK, auto)    │       │ id (PK, TMDB ID)     │
│ movie_cd (UK)    │       │ title                │
│ date (UK)        │       │ original_title       │
│ rank             │       │ release_date         │
│ movie_nm         │       │ vote_average         │
│ open_dt          │       │ vote_count           │
│ sales_amt        │       │ popularity           │
│ sales_share      │       │ revenue              │
│ audi_cnt         │       │ budget               │
│ audi_acc         │       │ runtime              │
│ scrn_cnt         │       │ poster_path          │
│ show_cnt         │       │ overview             │
└──────────────────┘       │ tagline              │
                           │ status               │
┌──────────────────┐       │ director             │
│  similar_movie   │       │ cast_top3            │
│──────────────────│       │ collection_name      │
│ id (PK, auto)    │       │ production_countries │
│ movie_id (FK)    │──────>│ source               │
│ similar_id       │       └──────┬───────────────┘
└──────────────────┘              │ 1:N
                           ┌──────┴───────────────┐
                           │    movie_genre        │
                           │──────────────────────│
                           │ id (PK, auto)         │
                           │ movie_id (FK)         │
                           │ genre (String)        │
                           └──────────────────────┘
```

---

## 2. 테이블 상세

### 2-1. `box_office` — KOBIS 일별 박스오피스

> 매일 10편씩, 30일 기준 약 300건. 매일 새벽 자동 수집.

| 컬럼          | DB 타입          | Java 타입    | Null | 설명                   | 예시              |
|---------------|------------------|-------------|------|------------------------|-------------------|
| `id`          | BIGINT AUTO_INCR | `Long` (PK) | N    | 자동 증가 기본키       | `1`               |
| `movie_cd`    | VARCHAR(20)      | `String`     | N    | KOBIS 영화 코드        | `"20252402"`      |
| `date`        | DATE             | `LocalDate`  | N    | 집계 기준일            | `2026-06-16`      |
| `rank`        | INT              | `int`        | N    | 그날 순위 (1~10)       | `1`               |
| `movie_nm`    | VARCHAR(100)     | `String`     | N    | 영화명 (국문)          | `"군체"`          |
| `open_dt`     | DATE             | `LocalDate`  | N    | 개봉일                 | `2026-05-21`      |
| `sales_amt`   | BIGINT           | `long`       | N    | 당일 매출액 (원)       | `6,423,873,700`   |
| `sales_share` | DOUBLE           | `double`     | N    | 매출 점유율 (%)        | `31.8`            |
| `audi_cnt`    | INT              | `int`        | N    | 당일 관객수            | `32,022`          |
| `audi_acc`    | BIGINT           | `long`       | N    | 누적 관객수            | `16,891,136`      |
| `scrn_cnt`    | INT              | `int`        | N    | 상영 스크린수          | `1,146`           |
| `show_cnt`    | INT              | `int`        | N    | 상영 횟수              | `3,973`           |

**제약조건**:
- PK: `id` (AUTO_INCREMENT)
- UNIQUE: `(movie_cd, date)` — 같은 영화의 같은 날짜 중복 방지
- INDEX: `date` — 날짜별 조회 빈번

**데이터 타입 근거**:
- `sales_amt`: 최대값 64억 → `int` 범위(21억) 초과 → **`BIGINT`** 필수
- `audi_acc`: 최대값 1,689만 → `int`로 충분하나 향후 대비 **`BIGINT`** 권장

---

### 2-2. `movie` — TMDB 영화 메타데이터

> 현재 231편 수집. popular/now_playing/top_rated/trending 4개 소스에서 중복 제거.

| 컬럼                   | DB 타입          | Java 타입    | Null | 설명                        | 예시                              |
|------------------------|------------------|-------------|------|-----------------------------|------------------------------------|
| `id`                   | BIGINT           | `Long` (PK) | N    | TMDB 영화 ID (고유키)       | `1339713`                          |
| `title`                | VARCHAR(200)     | `String`     | N    | 영화 제목 (국문)            | `"옵세션"`                         |
| `original_title`       | VARCHAR(200)     | `String`     | Y    | 원제                        | `"Obsession"`                      |
| `release_date`         | DATE             | `LocalDate`  | Y    | 개봉일                      | `2026-05-13`                       |
| `vote_average`         | DOUBLE           | `double`     | N    | TMDB 평점 (0~10)            | `7.917`                            |
| `vote_count`           | INT              | `int`        | N    | 투표 수                     | `800`                              |
| `popularity`           | DOUBLE           | `double`     | N    | TMDB 인기 지수              | `669.55`                           |
| `revenue`              | BIGINT           | `long`       | N    | 글로벌 수익 ($), 없으면 0   | `290,347,910`                      |
| `budget`               | BIGINT           | `long`       | N    | 제작비 ($), 없으면 0        | `750,000`                          |
| `runtime`              | INT              | `int`        | Y    | 상영 시간 (분), 없으면 0    | `108`                              |
| `poster_path`          | VARCHAR(500)     | `String`     | Y    | 포스터 전체 URL             | `"https://image.tmdb.org/...jpg"`  |
| `overview`             | TEXT             | `String`     | Y    | 줄거리                      | `"음반점 직원 베어(마이클..."`     |
| `tagline`              | VARCHAR(300)     | `String`     | Y    | 태그라인                    | `"전설이 된 황제, 그 위대한 시작"` |
| `status`               | VARCHAR(20)      | `String`     | Y    | 상태                        | `"Released"`                       |
| `director`             | VARCHAR(100)     | `String`     | Y    | 감독명                      | `"커리 바커"`                      |
| `cast_top3`            | VARCHAR(300)     | `String`     | Y    | 주연 배우 Top 3 (쉼표 구분) | `"마이클 존스턴, 인디 네버레티"`   |
| `collection_name`      | VARCHAR(200)     | `String`     | Y    | 시리즈/세계관 이름          | `"모탈 컴뱃 리부트 시리즈"`        |
| `production_countries` | VARCHAR(500)     | `String`     | Y    | 제작 국가 (쉼표 구분)       | `"United States of America"`       |
| `source`               | VARCHAR(30)      | `String`     | N    | 수집 소스                   | `"movie/popular"`                  |

**제약조건**:
- PK: `id` (TMDB ID, 자동 증가 아님)
- INDEX: `release_date`, `vote_average`, `popularity`

**기존 DATA_SPEC 대비 신규 필드** (6개):

| 신규 필드              | 근거                                          |
|------------------------|-----------------------------------------------|
| `original_title`       | 원제 검색, 다국어 지원                        |
| `budget`               | ROI 분석 (수익성 = revenue/budget)            |
| `overview`             | 영화 상세 페이지 줄거리 표시                  |
| `director`             | 감독별 분석 차트                              |
| `cast_top3`            | 배우 정보 표시                                |
| `production_countries` | 제작국가별 분석 차트                          |

---

### 2-3. `movie_genre` — 영화-장르 매핑 (1:N)

> 한 영화에 장르 여러 개. `genres` 배열을 정규화하여 별도 테이블로 분리.

| 컬럼       | DB 타입          | Java 타입    | Null | 설명                | 예시       |
|------------|------------------|-------------|------|---------------------|------------|
| `id`       | BIGINT AUTO_INCR | `Long` (PK) | N    | 자동 증가 기본키    | `1`        |
| `movie_id` | BIGINT           | `Long` (FK) | N    | movie.id 참조       | `1339713`  |
| `genre`    | VARCHAR(30)      | `String`     | N    | 장르명 (한글)       | `"공포"`   |

**제약조건**:
- FK: `movie_id` → `movie(id)`
- UNIQUE: `(movie_id, genre)` — 같은 영화에 같은 장르 중복 방지
- INDEX: `genre` — 장르별 조회

**대안**: `movie` 테이블에 `genres` 컬럼을 `"공포|액션"` 문자열로 저장하는 방식도 가능하지만, 장르별 집계 쿼리 성능을 위해 **정규화 권장**.

---

### 2-4. `similar_movie` — 유사 영화 매핑

> 영화 상세 페이지에서 "비슷한 콘텐츠" 추천에 사용.

| 컬럼         | DB 타입          | Java 타입    | Null | 설명                       | 예시       |
|-------------|------------------|-------------|------|----------------------------|------------|
| `id`        | BIGINT AUTO_INCR | `Long` (PK) | N    | 자동 증가 기본키           | `1`        |
| `movie_id`  | BIGINT           | `Long` (FK) | N    | 기준 영화 TMDB ID          | `1339713`  |
| `similar_id`| BIGINT           | `Long`       | N    | 유사 영화 TMDB ID          | `1022789`  |

**제약조건**:
- FK: `movie_id` → `movie(id)`
- UNIQUE: `(movie_id, similar_id)`

---

## 3. 데이터 전달 → API 매핑

기존 합의 사항: 벌크 REST API로 전달.

| 엔드포인트                    | Method | 설명                        | Body                        |
|------------------------------|--------|-----------------------------|-----------------------------|
| `/api/boxoffice/bulk`        | POST   | 박스오피스 일괄 등록        | `BoxOfficeEntry[]`          |
| `/api/movies/bulk`           | POST   | 영화 일괄 등록              | `Movie[]` (genres 배열 포함)|
| `/api/similar-movies/bulk`   | POST   | 유사 영화 일괄 등록 (신규)  | `SimilarMovie[]`            |

### 전달 JSON 샘플 (확장 버전)

**박스오피스** — 기존 DATA_SPEC과 동일:
```json
{
  "movieCd": "20252402",
  "date": "2026-06-16",
  "rank": 1,
  "movieNm": "군체",
  "openDt": "2026-05-21",
  "salesAmt": 324208640,
  "salesShare": 31.8,
  "audiCnt": 32022,
  "audiAcc": 5278726,
  "scrnCnt": 1146,
  "showCnt": 3973
}
```

**영화** — 신규 필드 포함:
```json
{
  "id": 1339713,
  "title": "옵세션",
  "original_title": "Obsession",
  "release_date": "2026-05-13",
  "vote_average": 7.917,
  "vote_count": 800,
  "popularity": 669.55,
  "revenue": 290347910,
  "budget": 750000,
  "runtime": 108,
  "genres": ["공포"],
  "poster_path": "https://image.tmdb.org/t/p/w500/bRwnj8WEKBCvmfeUNOukJPwB43K.jpg",
  "overview": "음반점 직원 베어는...",
  "tagline": "",
  "status": "Released",
  "director": "커리 바커",
  "cast_top3": "마이클 존스턴, 인디 네버레티, Cooper Tomlinson",
  "collection_name": "Obsession Universe",
  "production_countries": "United States of America, United Kingdom",
  "source": "movie/popular"
}
```

---

## 4. JPA 엔티티 예시 (참고용)

### BoxOffice.java
```java
@Entity
@Table(
    name = "box_office",
    uniqueConstraints = @UniqueConstraint(columnNames = {"movie_cd", "date"})
)
public class BoxOffice {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "movie_cd", nullable = false, length = 20)
    private String movieCd;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private int rank;

    @Column(name = "movie_nm", nullable = false, length = 100)
    private String movieNm;

    @Column(name = "open_dt", nullable = false)
    private LocalDate openDt;

    @Column(name = "sales_amt", nullable = false)
    private long salesAmt;

    @Column(name = "sales_share", nullable = false)
    private double salesShare;

    @Column(name = "audi_cnt", nullable = false)
    private int audiCnt;

    @Column(name = "audi_acc", nullable = false)
    private long audiAcc;

    @Column(name = "scrn_cnt", nullable = false)
    private int scrnCnt;

    @Column(name = "show_cnt", nullable = false)
    private int showCnt;
}
```

### Movie.java
```java
@Entity
@Table(name = "movie")
public class Movie {
    @Id
    private Long id;  // TMDB ID (자동 증가 아님)

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "original_title", length = 200)
    private String originalTitle;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    @Column(name = "vote_average", nullable = false)
    private double voteAverage;

    @Column(name = "vote_count", nullable = false)
    private int voteCount;

    @Column(nullable = false)
    private double popularity;

    @Column(nullable = false)
    private long revenue;

    @Column(nullable = false)
    private long budget;

    @Column
    private int runtime;

    @Column(name = "poster_path", length = 500)
    private String posterPath;

    @Column(columnDefinition = "TEXT")
    private String overview;

    @Column(length = 300)
    private String tagline;

    @Column(length = 20)
    private String status;

    @Column(length = 100)
    private String director;

    @Column(name = "cast_top3", length = 300)
    private String castTop3;

    @Column(name = "collection_name", length = 200)
    private String collectionName;

    @Column(name = "production_countries", length = 500)
    private String productionCountries;

    @Column(nullable = false, length = 30)
    private String source;

    @OneToMany(mappedBy = "movie", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MovieGenre> genres = new ArrayList<>();
}
```

---

## 5. 데이터 현황 (2026-06-17 기준)

| 항목                | 수치     | 비고                              |
|---------------------|----------|-----------------------------------|
| KOBIS 박스오피스    | 300건    | 30일 × 10편, 38개 고유 영화      |
| TMDB 영화           | 231편    | 4개 소스에서 중복 제거            |
| 예산 데이터 보유    | 134/231  | 58%                               |
| 수익 데이터 보유    | 143/231  | 62%                               |
| 감독 정보 보유      | 229/231  | 99%                               |
| 시리즈 정보 보유    | 65/231   | 28%                               |
| 유사 영화 매핑      | 수집 완료 | `fetch_similar_movies.py` 별도 실행 |

---

## 6. 백엔드 확인 요청 사항

| #  | 항목                              | DA 제안                                                      | 백엔드 확인 |
|----|-----------------------------------|--------------------------------------------------------------|-------------|
| 1  | `movie_genre` 별도 테이블 vs 문자열 | 정규화 테이블 권장 (장르별 집계 쿼리 성능)                   | [ ]         |
| 2  | `similar_movie` 벌크 API 신규 개설 | `POST /api/similar-movies/bulk`                              | [ ]         |
| 3  | 신규 6개 필드 수용 가능 여부       | budget, overview, director, cast_top3, production_countries, original_title | [ ]         |
| 4  | `overview` TEXT 타입 적용          | 줄거리 최대 약 500자                                          | [ ]         |
| 5  | `cast_top3` 저장 형태              | 쉼표 구분 문자열 vs 별도 테이블                              | [ ]         |
