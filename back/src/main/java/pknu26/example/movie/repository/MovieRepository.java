package pknu26.example.movie.repository;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pknu26.example.movie.dto.GenreStatResponse;
import pknu26.example.movie.entity.Movie;
import java.util.List;

public interface MovieRepository extends JpaRepository<Movie, Long> {

    // 1. 연도별 범위 조회 쿼리
    @Query("SELECT m FROM Movie m WHERE SUBSTRING(m.releaseDate, 1, 4) BETWEEN :startYear AND :endYear")
    List<Movie> findMoviesByYearRange(
        @Param("startYear") String startYear, 
        @Param("endYear") String endYear, 
        Sort sort
    );

    // 2. ⚠️ MySQL 표준 및 ONLY_FULL_GROUP_BY 모드에 맞춘 안전한 장르별 통계 쿼리
    // MovieGenre(g)를 기준으로 Movie(m)를 조인하여 그룹화 에러를 완벽히 방지합니다.
    @Query("SELECT new pknu26.example.movie.dto.GenreStatResponse(g.genre, COUNT(g), AVG(m.voteAverage)) " +
           "FROM MovieGenre g JOIN g.movie m " +
           "GROUP BY g.genre")
    List<GenreStatResponse> getGenreStatistics();

    // 3. 제목 키워드 검색 (JPA Query Method)
    List<Movie> findByTitleContainingIgnoreCase(String keyword);
}