package pknu26.example.movie.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;
import pknu26.example.movie.dto.BoxOfficeEntryDto;
import pknu26.example.movie.entity.Movie;
import pknu26.example.movie.repository.MovieRepository;
import pknu26.example.movie.service.KobisService;
import pknu26.example.movie.service.TmdbService;

import java.util.List;

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

    /** KOBIS 일별 박스오피스 — date 파라미터 없으면 어제 날짜 */
    @GetMapping("/boxoffice")
    public List<BoxOfficeEntryDto> getBoxOffice(@RequestParam(name = "date", required = false) String date) {
        return kobisService.getDailyBoxOffice(date);
    }
}
