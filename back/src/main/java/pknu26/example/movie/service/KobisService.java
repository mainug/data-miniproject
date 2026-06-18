package pknu26.example.movie.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${kobis.api.key}")
    private String apiKey;

    private final DailyBoxOfficeRepository boxOfficeRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Transactional
    public List<BoxOfficeEntryDto> getDailyBoxOffice(String date) {
        String targetDate = resolveDate(date);

        // DB 캐시 확인 — 같은 날짜가 이미 있으면 API 호출 생략
        if (boxOfficeRepository.existsByDate(targetDate)) {
            log.info("KOBIS 캐시 사용: {}", targetDate);
            return boxOfficeRepository.findByDateOrderByRankAsc(targetDate)
                    .stream().map(this::toDto).collect(Collectors.toList());
        }

        // API 호출 후 DB 저장
        log.info("KOBIS API 호출: {}", targetDate);
        List<DailyBoxOffice> entities = fetchFromApi(targetDate);
        if (!entities.isEmpty()) {
            boxOfficeRepository.saveAll(entities);
        }
        return entities.stream().map(this::toDto).collect(Collectors.toList());
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
                : LocalDate.now().minusDays(1).format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
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
