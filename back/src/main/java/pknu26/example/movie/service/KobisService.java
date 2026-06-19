package pknu26.example.movie.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import pknu26.example.movie.dto.*;
import pknu26.example.movie.entity.*;
import pknu26.example.movie.repository.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class KobisService {

    private static final String DAILY_URL =
            "http://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json";
    private static final String WEEKLY_URL =
            "http://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchWeeklyBoxOfficeList.json";
    private static final String CODE_URL =
            "http://www.kobis.or.kr/kobisopenapi/webservice/rest/code/searchCodeList.json";
    private static final String MOVIE_LIST_URL =
            "http://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieList.json";
    private static final String MOVIE_INFO_URL =
            "http://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieInfo.json";

    private static final int RETENTION_DAYS = 365;
    private static final LocalDate DATA_START_DATE = LocalDate.of(2025, 6, 19);
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter COMPACT = DateTimeFormatter.ofPattern("yyyyMMdd");

    private static final String[] CODE_CATEGORIES = {"2105", "2101", "2201"};

    @Value("${kobis.api.key}")
    private String apiKey;

    private final DailyBoxOfficeRepository dailyRepo;
    private final WeeklyBoxOfficeRepository weeklyRepo;
    private final KobisMovieRepository movieRepo;
    private final KobisCodeRepository codeRepo;
    private final RestTemplate restTemplate = new RestTemplate();

    // ══════════════════════════════════════════════
    // 일별 박스오피스 (기존)
    // ══════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<BoxOfficeEntryDto> getDailyBoxOffice(String date) {
        String targetDate = resolveDate(date);
        return dailyRepo.findByDateOrderByRankAsc(targetDate)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<String> getAvailableDates() {
        return dailyRepo.findDistinctDatesDesc();
    }

    // ══════════════════════════════════════════════
    // 주간/주말 박스오피스 조회
    // ══════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<WeeklyBoxOffice> getWeeklyBoxOffice(String showRange, String weekGb) {
        return weeklyRepo.findByShowRangeAndWeekGbOrderByRankAsc(showRange, weekGb);
    }

    @Transactional(readOnly = true)
    public List<String> getWeeklyRanges(String weekGb) {
        return weeklyRepo.findDistinctShowRangesByWeekGb(weekGb);
    }

    // ══════════════════════════════════════════════
    // 주간 박스오피스 트렌드 분석
    // ══════════════════════════════════════════════

    @Transactional(readOnly = true)
    public TrendAnalysisDto getWeeklyTrends() {
        List<WeeklyBoxOffice> all = weeklyRepo.findAll().stream()
                .filter(w -> "0".equals(w.getWeekGb()))
                .collect(Collectors.toList());

        return TrendAnalysisDto.builder()
                .monthly(aggregateByMonth(all))
                .seasonal(aggregateBySeason(all))
                .build();
    }

    private List<WeeklyTrendDto> aggregateByMonth(List<WeeklyBoxOffice> data) {
        Map<String, List<WeeklyBoxOffice>> grouped = new TreeMap<>();
        for (WeeklyBoxOffice w : data) {
            String month = extractMonth(w.getShowRange());
            if (month != null) {
                grouped.computeIfAbsent(month, k -> new ArrayList<>()).add(w);
            }
        }
        return grouped.entrySet().stream()
                .map(e -> buildTrend(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
    }

    private List<WeeklyTrendDto> aggregateBySeason(List<WeeklyBoxOffice> data) {
        Map<String, List<WeeklyBoxOffice>> grouped = new TreeMap<>();
        for (WeeklyBoxOffice w : data) {
            String season = extractSeason(w.getShowRange());
            if (season != null) {
                grouped.computeIfAbsent(season, k -> new ArrayList<>()).add(w);
            }
        }
        return grouped.entrySet().stream()
                .map(e -> buildTrend(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
    }

    private WeeklyTrendDto buildTrend(String period, List<WeeklyBoxOffice> items) {
        long totalSales = items.stream().mapToLong(WeeklyBoxOffice::getSalesAmt).sum();
        long totalAudi = items.stream().mapToLong(WeeklyBoxOffice::getAudiCnt).sum();
        long avgScreens = items.isEmpty() ? 0 : items.stream().mapToLong(WeeklyBoxOffice::getScrnCnt).sum() / items.size();
        long movieCount = items.stream().map(WeeklyBoxOffice::getMovieNm).distinct().count();

        String topMovie = items.stream()
                .collect(Collectors.groupingBy(WeeklyBoxOffice::getMovieNm, Collectors.summingLong(WeeklyBoxOffice::getAudiCnt)))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey).orElse("");

        return WeeklyTrendDto.builder()
                .period(period)
                .totalSales(totalSales)
                .totalAudience(totalAudi)
                .movieCount((int) movieCount)
                .topMovie(topMovie)
                .avgScreens(avgScreens)
                .build();
    }

    private String extractMonth(String showRange) {
        if (showRange == null || showRange.length() < 8) return null;
        String start = showRange.substring(0, 8);
        return start.substring(0, 4) + "-" + start.substring(4, 6);
    }

    private String extractSeason(String showRange) {
        if (showRange == null || showRange.length() < 8) return null;
        String start = showRange.substring(0, 8);
        String year = start.substring(0, 4);
        int month = Integer.parseInt(start.substring(4, 6));
        if (month >= 3 && month <= 5) return year + " 봄";
        if (month >= 6 && month <= 8) return year + " 여름";
        if (month >= 9 && month <= 11) return year + " 가을";
        return year + " 겨울";
    }

    // ══════════════════════════════════════════════
    // 공통코드 조회
    // ══════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<KobisCode> getCodes(String comCode) {
        return codeRepo.findByComCode(comCode);
    }

    // ══════════════════════════════════════════════
    // 영화목록/상세 조회
    // ══════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<KobisMovie> getKobisMovies() {
        return movieRepo.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<KobisMovie> getKobisMovie(String movieCd) {
        return movieRepo.findById(movieCd);
    }

    // ══════════════════════════════════════════════
    // 스케줄러 & 백필
    // ══════════════════════════════════════════════

    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void scheduledCollect() {
        log.info("[스케줄러] 일별 박스오피스 수집 시작");
        String yesterday = LocalDate.now().minusDays(1).format(FMT);
        collectDailySingle(yesterday);
        purgeOldData();
        log.info("[스케줄러] 수집 완료");
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void backfillOnStartup() {
        log.info("[백필] 전체 데이터 수집 시작 ({}~)", DATA_START_DATE);
        backfillDaily();
        backfillWeekly();
        collectCodes();
        collectMovieList();
        log.info("[백필] 전체 데이터 수집 완료");
    }

    @Transactional
    public Map<String, Integer> manualCollectAll() {
        Map<String, Integer> result = new LinkedHashMap<>();
        result.put("daily", backfillDaily());
        result.put("weekly", backfillWeekly());
        result.put("codes", collectCodes());
        result.put("movies", collectMovieList());
        purgeOldData();
        return result;
    }

    // ── 일별 백필 ──

    private int backfillDaily() {
        int collected = 0;
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDate cursor = DATA_START_DATE;
        while (!cursor.isAfter(yesterday)) {
            String date = cursor.format(FMT);
            if (!dailyRepo.existsByDate(date)) {
                collectDailySingle(date);
                collected++;
            }
            cursor = cursor.plusDays(1);
        }
        if (collected > 0) log.info("[백필] 일별 {}일치 수집", collected);
        return collected;
    }

    private void collectDailySingle(String targetDate) {
        if (dailyRepo.existsByDate(targetDate)) return;
        try {
            String url = DAILY_URL + "?key=" + apiKey + "&targetDt=" + targetDate.replace("-", "");
            KobisBoxOfficeResponse resp = restTemplate.getForObject(url, KobisBoxOfficeResponse.class);
            if (resp == null || resp.getBoxOfficeResult() == null
                    || resp.getBoxOfficeResult().getDailyBoxOfficeList() == null) return;

            List<DailyBoxOffice> entities = resp.getBoxOfficeResult().getDailyBoxOfficeList().stream()
                    .map(item -> DailyBoxOffice.builder()
                            .date(targetDate)
                            .rank(parsInt(item.getRank()))
                            .rankInten(parsInt(item.getRankInten()))
                            .rankOldAndNew(item.getRankOldAndNew())
                            .movieNm(item.getMovieNm())
                            .openDt(item.getOpenDt())
                            .salesAmt(parsLong(item.getSalesAmt()))
                            .salesShare(parsDouble(item.getSalesShare()))
                            .salesInten(parsLong(item.getSalesInten()))
                            .salesChange(parsDouble(item.getSalesChange()))
                            .salesAcc(parsLong(item.getSalesAcc()))
                            .audiCnt(parsLong(item.getAudiCnt()))
                            .audiInten(parsLong(item.getAudiInten()))
                            .audiChange(parsDouble(item.getAudiChange()))
                            .audiAcc(parsLong(item.getAudiAcc()))
                            .scrnCnt(parsLong(item.getScrnCnt()))
                            .showCnt(parsLong(item.getShowCnt()))
                            .build())
                    .collect(Collectors.toList());
            if (!entities.isEmpty()) {
                dailyRepo.saveAll(entities);
                log.info("  일별 {} — {}편", targetDate, entities.size());
            }
            Thread.sleep(300);
        } catch (Exception e) {
            log.warn("  일별 {} 실패: {}", targetDate, e.getMessage());
        }
    }

    // ── 주간/주말 백필 ──

    private int backfillWeekly() {
        int collected = 0;
        LocalDate start = DATA_START_DATE.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDate lastSunday = yesterday.with(TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY));

        LocalDate monday = start;
        while (!monday.isAfter(lastSunday)) {
            String targetDt = monday.format(COMPACT);
            String showRange = monday.format(COMPACT) + "~" + monday.plusDays(6).format(COMPACT);

            for (String weekGb : new String[]{"0", "1"}) {
                if (!weeklyRepo.existsByShowRangeAndWeekGb(showRange, weekGb)) {
                    collected += collectWeeklySingle(targetDt, weekGb, showRange);
                }
            }
            monday = monday.plusWeeks(1);
        }
        if (collected > 0) log.info("[백필] 주간/주말 {}건 수집", collected);
        return collected;
    }

    private int collectWeeklySingle(String targetDt, String weekGb, String showRange) {
        try {
            String url = WEEKLY_URL + "?key=" + apiKey + "&targetDt=" + targetDt + "&weekGb=" + weekGb;
            KobisWeeklyResponse resp = restTemplate.getForObject(url, KobisWeeklyResponse.class);
            if (resp == null || resp.getBoxOfficeResult() == null
                    || resp.getBoxOfficeResult().getWeeklyBoxOfficeList() == null) return 0;

            String actualRange = resp.getBoxOfficeResult().getShowRange();
            if (actualRange == null) actualRange = showRange;

            String finalRange = actualRange;
            List<WeeklyBoxOffice> entities = resp.getBoxOfficeResult().getWeeklyBoxOfficeList().stream()
                    .map(item -> WeeklyBoxOffice.builder()
                            .showRange(finalRange)
                            .weekGb(weekGb)
                            .rank(parsInt(item.getRank()))
                            .movieCd(item.getMovieCd())
                            .movieNm(item.getMovieNm())
                            .openDt(item.getOpenDt())
                            .salesAmt(parsLong(item.getSalesAmt()))
                            .salesShare(parsDouble(item.getSalesShare()))
                            .salesAcc(parsLong(item.getSalesAcc()))
                            .audiCnt(parsLong(item.getAudiCnt()))
                            .audiAcc(parsLong(item.getAudiAcc()))
                            .scrnCnt(parsLong(item.getScrnCnt()))
                            .showCnt(parsLong(item.getShowCnt()))
                            .build())
                    .collect(Collectors.toList());

            if (!entities.isEmpty()) {
                weeklyRepo.saveAll(entities);
                String label = weekGb.equals("0") ? "주간" : "주말";
                log.info("  {} {} — {}편", label, finalRange, entities.size());
            }
            Thread.sleep(300);
            return entities.size();
        } catch (Exception e) {
            log.warn("  주간 {} (weekGb={}) 실패: {}", targetDt, weekGb, e.getMessage());
            return 0;
        }
    }

    // ── 공통코드 수집 ──

    private int collectCodes() {
        if (codeRepo.count() > 0) {
            log.info("[코드] 이미 존재 — 건너뜀");
            return 0;
        }
        int total = 0;
        for (String comCode : CODE_CATEGORIES) {
            try {
                String url = CODE_URL + "?key=" + apiKey + "&comCode=" + comCode;
                KobisCodeResponse resp = restTemplate.getForObject(url, KobisCodeResponse.class);
                if (resp == null || resp.getCodes() == null) continue;

                List<KobisCode> entities = resp.getCodes().stream()
                        .map(item -> KobisCode.builder()
                                .comCode(comCode)
                                .fullCd(item.getFullCd())
                                .korNm(item.getKorNm())
                                .build())
                        .collect(Collectors.toList());
                codeRepo.saveAll(entities);
                total += entities.size();
                log.info("  코드 {} — {}건", comCode, entities.size());
                Thread.sleep(300);
            } catch (Exception e) {
                log.warn("  코드 {} 실패: {}", comCode, e.getMessage());
            }
        }
        return total;
    }

    // ── 영화목록 + 상세정보 수집 ──

    private int collectMovieList() {
        int prdtStartYear = DATA_START_DATE.getYear() - 1;
        int prdtEndYear = LocalDate.now().getYear();
        int totalCollected = 0;

        try {
            int totalPages = Integer.MAX_VALUE;
            for (int page = 1; page <= totalPages; page++) {
                String url = MOVIE_LIST_URL + "?key=" + apiKey
                        + "&prdtStartYear=" + prdtStartYear + "&prdtEndYear=" + prdtEndYear
                        + "&curPage=" + page + "&itemPerPage=100";
                KobisMovieListResponse resp = restTemplate.getForObject(url, KobisMovieListResponse.class);
                if (resp == null || resp.getMovieListResult() == null
                        || resp.getMovieListResult().getMovieList() == null) break;

                if (page == 1) {
                    int totCnt = resp.getMovieListResult().getTotCnt();
                    totalPages = (totCnt + 99) / 100;
                    log.info("[영화목록] 총 {}편, {}페이지 수집 시작 ({}~{}년)",
                            totCnt, totalPages, prdtStartYear, prdtEndYear);
                }

                List<KobisMovieListResponse.MovieItem> items = resp.getMovieListResult().getMovieList();
                if (items.isEmpty()) break;

                for (KobisMovieListResponse.MovieItem item : items) {
                    if (movieRepo.existsById(item.getMovieCd())) continue;

                    KobisMovie movie = KobisMovie.builder()
                            .movieCd(item.getMovieCd())
                            .movieNm(item.getMovieNm())
                            .movieNmEn(item.getMovieNmEn())
                            .prdtYear(item.getPrdtYear())
                            .openDt(item.getOpenDt())
                            .typeNm(item.getTypeNm())
                            .prdtStatNm(item.getPrdtStatNm())
                            .nationAlt(item.getNationAlt())
                            .genreAlt(item.getGenreAlt())
                            .build();

                    enrichWithDetail(movie);
                    movieRepo.save(movie);
                    totalCollected++;
                    Thread.sleep(300);
                }

                log.info("  영화목록 페이지 {}/{} — 누적 {}편", page, totalPages, totalCollected);

                if (items.size() < 100) break;
                Thread.sleep(300);
            }
        } catch (Exception e) {
            log.warn("  영화목록 수집 실패: {}", e.getMessage());
        }

        if (totalCollected > 0) log.info("[백필] 영화 {}편 수집 (상세정보 포함)", totalCollected);
        return totalCollected;
    }

    private void enrichWithDetail(KobisMovie movie) {
        try {
            String url = MOVIE_INFO_URL + "?key=" + apiKey + "&movieCd=" + movie.getMovieCd();
            KobisMovieInfoResponse resp = restTemplate.getForObject(url, KobisMovieInfoResponse.class);
            if (resp == null || resp.getMovieInfoResult() == null
                    || resp.getMovieInfoResult().getMovieInfo() == null) return;

            KobisMovieInfoResponse.MovieInfo info = resp.getMovieInfoResult().getMovieInfo();
            movie.setShowTm(parsIntOrNull(info.getShowTm()));

            if (info.getDirectors() != null) {
                movie.setDirectors(info.getDirectors().stream()
                        .map(KobisMovieInfoResponse.Director::getPeopleNm)
                        .collect(Collectors.joining(", ")));
            }
            if (info.getActors() != null) {
                movie.setActors(info.getActors().stream()
                        .limit(5)
                        .map(a -> a.getPeopleNm() + (a.getCast() != null ? "(" + a.getCast() + ")" : ""))
                        .collect(Collectors.joining(", ")));
            }
            if (info.getCompanys() != null) {
                movie.setCompanys(info.getCompanys().stream()
                        .map(KobisMovieInfoResponse.Company::getCompanyNm)
                        .collect(Collectors.joining(", ")));
            }
            if (info.getAudits() != null && !info.getAudits().isEmpty()) {
                movie.setWatchGradeNm(info.getAudits().get(0).getWatchGradeNm());
            }
        } catch (Exception e) {
            log.warn("  상세 {} 실패: {}", movie.getMovieCd(), e.getMessage());
        }
    }

    // ── 삭제 ──

    private void purgeOldData() {
        String cutoff = LocalDate.now().minusDays(RETENTION_DAYS + 1).format(FMT);
        int deleted = dailyRepo.deleteByDateBefore(cutoff);
        if (deleted > 0) log.info("  {}일 이전 일별 데이터 {}건 삭제", RETENTION_DAYS, deleted);
    }

    // ── 변환 ──

    private BoxOfficeEntryDto toDto(DailyBoxOffice e) {
        return BoxOfficeEntryDto.builder()
                .rank(e.getRank()).rankInten(e.getRankInten()).rankOldAndNew(e.getRankOldAndNew())
                .movieNm(e.getMovieNm()).openDt(e.getOpenDt())
                .salesAmt(e.getSalesAmt()).salesShare(e.getSalesShare())
                .salesInten(e.getSalesInten()).salesChange(e.getSalesChange()).salesAcc(e.getSalesAcc())
                .audiCnt(e.getAudiCnt()).audiInten(e.getAudiInten())
                .audiChange(e.getAudiChange()).audiAcc(e.getAudiAcc())
                .scrnCnt(e.getScrnCnt()).showCnt(e.getShowCnt()).date(e.getDate())
                .build();
    }

    private String resolveDate(String date) {
        return (date != null && !date.isEmpty()) ? date : LocalDate.now().minusDays(1).format(FMT);
    }

    private int parsInt(String s) { try { return Integer.parseInt(s); } catch (Exception e) { return 0; } }
    private long parsLong(String s) { try { return Long.parseLong(s); } catch (Exception e) { return 0L; } }
    private double parsDouble(String s) { try { return Double.parseDouble(s); } catch (Exception e) { return 0.0; } }
    private Integer parsIntOrNull(String s) { try { return Integer.parseInt(s); } catch (Exception e) { return null; } }
}
