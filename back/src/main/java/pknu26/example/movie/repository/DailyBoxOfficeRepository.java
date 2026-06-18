package pknu26.example.movie.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pknu26.example.movie.entity.DailyBoxOffice;

import java.util.List;

public interface DailyBoxOfficeRepository extends JpaRepository<DailyBoxOffice, Long> {
    List<DailyBoxOffice> findByDateOrderByRankAsc(String date);
    boolean existsByDate(String date);
}
