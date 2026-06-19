package pknu26.example.movie.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;
import pknu26.example.movie.dto.BoxOfficeEntryDto;
import pknu26.example.movie.entity.*;
import pknu26.example.movie.repository.MovieRepository;
import pknu26.example.movie.service.KobisService;
import pknu26.example.movie.service.TmdbService;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class MovieApiController {

    private final TmdbService tmdbService;
    private final KobisService kobisService;
    private final MovieRepository movieRepository;

    /** 전체 영화 목록 — DB가 비어있으면 TMDB에서 자동 수집 */
    @GetMapping("/movies")
    public List<Movie> getMovies() {
        if (movieRepository.count() == 0) {
            log.info("DB가 비어있어 TMDB에서 영화 데이터를 수집합니다.");
            tmdbService.fetchAndStore();
        }
        return movieRepository.findAll(Sort.by(Sort.Direction.DESC, "voteAverage"));
    }

    /** 영화 데이터 강제 갱신 (기존 삭제 후 재수집) */
    @PostMapping("/movies/refresh")
    public String refreshMovies() {
        movieRepository.deleteAll();
        int count = tmdbService.fetchAndStore();
        return count + "편 갱신 완료";
    }

    /** TMDB 영화 검색 */
    @GetMapping("/movies/search")
    public List<Movie> searchMovies(@RequestParam(name = "query") String query) {
        return tmdbService.searchMovies(query);
    }

    /** KOBIS 일별 박스오피스 — DB에서만 조회 */
    @GetMapping("/boxoffice")
    public List<BoxOfficeEntryDto> getBoxOffice(@RequestParam(name = "date", required = false) String date) {
        return kobisService.getDailyBoxOffice(date);
    }

    /** DB에 저장된 박스오피스 날짜 목록 */
    @GetMapping("/boxoffice/dates")
    public List<String> getBoxOfficeDates() {
        return kobisService.getAvailableDates();
    }

    /** 주간/주말 박스오피스 조회 (weekGb: 0=주간, 1=주말) */
    @GetMapping("/boxoffice/weekly")
    public List<WeeklyBoxOffice> getWeeklyBoxOffice(
            @RequestParam(name = "range") String range,
            @RequestParam(name = "weekGb", defaultValue = "0") String weekGb) {
        return kobisService.getWeeklyBoxOffice(range, weekGb);
    }

    /** 주간/주말 박스오피스 조회 가능 기간 목록 */
    @GetMapping("/boxoffice/weekly/ranges")
    public List<String> getWeeklyRanges(@RequestParam(name = "weekGb", defaultValue = "0") String weekGb) {
        return kobisService.getWeeklyRanges(weekGb);
    }

    /** KOFIC 공통코드 조회 */
    @GetMapping("/kobis/codes")
    public List<KobisCode> getCodes(@RequestParam(name = "comCode") String comCode) {
        return kobisService.getCodes(comCode);
    }

    /** KOFIC 영화목록 전체 조회 */
    @GetMapping("/kobis/movies")
    public List<KobisMovie> getKobisMovies() {
        return kobisService.getKobisMovies();
    }

    /** KOFIC 영화 상세정보 조회 */
    @GetMapping("/kobis/movies/{movieCd}")
    public KobisMovie getKobisMovie(@PathVariable String movieCd) {
        return kobisService.getKobisMovie(movieCd).orElse(null);
    }

    /** 전체 KOFIC 데이터 수동 수집 트리거 */
    @PostMapping("/kobis/collect")
    public Map<String, Integer> collectAll() {
        return kobisService.manualCollectAll();
    }
}
