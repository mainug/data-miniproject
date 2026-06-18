package pknu26.example.movie.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pknu26.example.movie.dto.GenreStatResponse;
import pknu26.example.movie.entity.Movie;
import pknu26.example.movie.repository.MovieRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoardService {

    private final MovieRepository movieRepository;

    public List<Movie> getAllMovies() {
        return movieRepository.findAll();
    }

    // ✅ 연도 범위 + 정렬 기준 처리 비즈니스 로직 추가
    public List<Movie> getFilteredMovies(String startYear, String endYear, String sortBy, int limit) {
        // 프론트엔드가 보내주는 정렬 기준 문자열을 DB 컬럼명과 매핑
        String sortProperty = "id"; 
        if ("평점".equals(sortBy) || "voteAverage".equals(sortBy)) sortProperty = "voteAverage";
        else if ("인기도".equals(sortBy) || "popularity".equals(sortBy)) sortProperty = "popularity";
        else if ("흥행 수익".equals(sortBy) || "revenue".equals(sortBy)) sortProperty = "revenue";
        else if ("최신순".equals(sortBy) || "releaseDate".equals(sortBy)) sortProperty = "releaseDate";

        // 내림차순 정렬 생성
        Sort sort = Sort.by(Sort.Direction.DESC, sortProperty);
        
        List<Movie> movies = movieRepository.findMoviesByYearRange(startYear, endYear, sort);
        
        // TOP N (limit) 만큼 자르기
        if (movies.size() > limit) {
            return movies.subList(0, limit);
        }
        return movies;
    }

    // ✅ 장르별 통계 데이터 조회 로직 추가
    public List<GenreStatResponse> getGenreStats() {
        return movieRepository.getGenreStatistics();
    }

    public Movie getMovie(Long id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 영화를 찾을 수 없습니다. id=" + id));
    }

    public List<Movie> searchMovies(String keyword) {
        return movieRepository.findByTitleContainingIgnoreCase(keyword);
    }

    @Transactional
    public void saveMovie(Movie movie) {
        movieRepository.save(movie);
    }

    @Transactional
    public void deleteMovie(Long id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 영화가 존재하지 않습니다. id=" + id));
        movieRepository.delete(movie);
    }
}