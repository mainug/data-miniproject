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
import pknu26.example.movie.dto.BoxOfficeEntryDto;
import pknu26.example.movie.dto.KobisBoxOfficeResponse;
import pknu26.example.movie.entity.DailyBoxOffice;
import pknu26.example.movie.repository.DailyBoxOfficeRepository;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class KobisService {

    private static final String BASE =
            "http://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json";
    private static final int RETENTION_DAYS = 30;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Value("${kobis.api.key}")
    private String apiKey;

    private final DailyBoxOfficeRepository boxOfficeRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    /** API 조회: DB에서만 읽기 (KOBIS API 호출 없음) */
    @Transactional(readOnly = true)
    public List<BoxOfficeEntryDto> getDailyBoxOffice(String date) {
        String targetDate = resolveDate(date);
        return boxOfficeRepository.findByDateOrderByRankAsc(targetDate)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    /** DB에 저장된 날짜 목록 조회 */
    @Transactional(readOnly = true)
    public List<String> getAvailableDates() {
        return boxOfficeRepository.findDistinctDatesDesc();
    }

    /** 매일 새벽 2시 실행: 어제 데이터 수집 + 30일 초과 삭제 */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void scheduledCollect() {
        log.info("[스케줄러] 일별 박스오피스 수집 시작");
        String yesterday = LocalDate.now().minusDays(1).format(FMT);
        collectSingleDay(yesterday);
        purgeOldData();
        log.info("[스케줄러] 수집 완료");
    }

    /** 서버 최초 기동 시 30일 백필 */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void backfillOnStartup() {
        long count = boxOfficeRepository.count();
        if (count > 0) {
            log.info("[백필] DB에 이미 {}건 존재 — 빈 날짜만 보충", count);
        }
        int collected = 0;
        LocalDate today = LocalDate.now();
        for (int i = 1; i <= RETENTION_DAYS; i++) {
            String date = today.minusDays(i).format(FMT);
            if (!boxOfficeRepository.existsByDate(date)) {
                collectSingleDay(date);
                collected++;
            }
        }
        if (collected > 0) {
            log.info("[백필] {}일치 데이터 수집 완료", collected);
        }
    }

    /** 수동 트리거용: 지정 일수만큼 백필 */
    @Transactional
    public int manualCollect(int days) {
        int collected = 0;
        LocalDate today = LocalDate.now();
        for (int i = 1; i <= days; i++) {
            String date = today.minusDays(i).format(FMT);
            if (!boxOfficeRepository.existsByDate(date)) {
                collectSingleDay(date);
                collected++;
            }
        }
        purgeOldData();
        return collected;
    }

    // ── 내부 메서드 ──

    private void collectSingleDay(String targetDate) {
        if (boxOfficeRepository.existsByDate(targetDate)) {
            return;
        }
        try {
            List<DailyBoxOffice> entities = fetchFromApi(targetDate);
            if (!entities.isEmpty()) {
                boxOfficeRepository.saveAll(entities);
                log.info("  {} — {}편 저장", targetDate, entities.size());
            }
            Thread.sleep(300);
        } catch (Exception e) {
            log.warn("  {} 수집 실패: {}", targetDate, e.getMessage());
        }
    }

    private void purgeOldData() {
        String cutoff = LocalDate.now().minusDays(RETENTION_DAYS + 1).format(FMT);
        int deleted = boxOfficeRepository.deleteByDateBefore(cutoff);
        if (deleted > 0) {
            log.info("  {}일 이전 데이터 {}건 삭제", RETENTION_DAYS, deleted);
        }
    }

    private List<DailyBoxOffice> fetchFromApi(String targetDate) {
        String compact = targetDate.replace("-", "");
        String url = BASE + "?key=" + apiKey + "&targetDt=" + compact;

        KobisBoxOfficeResponse resp = restTemplate.getForObject(url, KobisBoxOfficeResponse.class);

        if (resp == null || resp.getBoxOfficeResult() == null
                || resp.getBoxOfficeResult().getDailyBoxOfficeList() == null) {
            return List.of();
        }

        return resp.getBoxOfficeResult().getDailyBoxOfficeList().stream()
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
    }

    private BoxOfficeEntryDto toDto(DailyBoxOffice e) {
        return BoxOfficeEntryDto.builder()
                .rank(e.getRank())
                .rankInten(e.getRankInten())
                .rankOldAndNew(e.getRankOldAndNew())
                .movieNm(e.getMovieNm())
                .openDt(e.getOpenDt())
                .salesAmt(e.getSalesAmt())
                .salesShare(e.getSalesShare())
                .salesInten(e.getSalesInten())
                .salesChange(e.getSalesChange())
                .salesAcc(e.getSalesAcc())
                .audiCnt(e.getAudiCnt())
                .audiInten(e.getAudiInten())
                .audiChange(e.getAudiChange())
                .audiAcc(e.getAudiAcc())
                .scrnCnt(e.getScrnCnt())
                .showCnt(e.getShowCnt())
                .date(e.getDate())
                .build();
    }

    private String resolveDate(String date) {
        return (date != null && !date.isEmpty())
                ? date
                : LocalDate.now().minusDays(1).format(FMT);
    }

    private int parsInt(String s) {
        try { return Integer.parseInt(s); } catch (Exception e) { return 0; }
    }

    private long parsLong(String s) {
        try { return Long.parseLong(s); } catch (Exception e) { return 0L; }
    }

    private double parsDouble(String s) {
        try { return Double.parseDouble(s); } catch (Exception e) { return 0.0; }
    }
}
