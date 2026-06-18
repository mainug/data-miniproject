package pknu26.example.movie.entity;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "movie")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Movie {

    @Id
    private Long id; // TMDB ID (자동 증가 아님)

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

    @Column(columnDefinition = "TEXT") // 줄거리가 길어도 안 깨지도록 TEXT 설정
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

    @Builder.Default
    @OneToMany(mappedBy = "movie", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MovieGenre> genres = new ArrayList<>(); // 1:N 장르 정규화 매핑

    public void setId(Long id2) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'setId'");
    }

    public void setTitle(String movieNm) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'setTitle'");
    }
}