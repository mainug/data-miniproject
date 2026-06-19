package pknu26.example.movie.repository;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pknu26.example.movie.dto.GenreStatResponse;
import pknu26.example.movie.entity.Movie;

import java.util.List;

public interface MovieRepository extends JpaRepository<Movie, Long> {
    
    List<Movie> findByTitleContainingIgnoreCase(String keyword);

    // ✅ 트렌드/분석용: 연도 범위 필터링 기능 (개봉일의 앞 4자리가 연도이므로 이를 비교)
    @Query("SELECT m FROM Movie m WHERE SUBSTRING(m.releaseDate, 1, 4) BETWEEN :startYear AND :endYear")
    List<Movie> findMoviesByYearRange(@Param("startYear") String startYear, @Param("endYear") String endYear, Sort sort);

    // ✅ 장르 대시보드용: @ElementCollection(genres)과 조인하여 장르별 통계 데이터 추출
    @Query("SELECT new pknu26.example.movie.dto.GenreStatResponse(g, COUNT(m), ROUND(AVG(m.voteAverage), 2)) " +
           "FROM Movie m JOIN m.genres g " +
           "GROUP BY g " +
           "ORDER BY COUNT(m) DESC")
    List<GenreStatResponse> getGenreStatistics();
}