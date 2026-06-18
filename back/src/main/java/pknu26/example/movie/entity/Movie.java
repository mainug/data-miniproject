package pknu26.example.movie.entity;

import jakarta.persistence.*;
import lombok.*;
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
@Setter
// @NoDoubleSubmit // 필요시 커스텀 어노테이션 유지
@NoArgsConstructor
@AllArgsConstructor
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "original_title", length = 200)
    private String originalTitle;

    @JsonProperty("original_title")
    @Column(name = "original_title")
    private String originalTitle;

    @Column(columnDefinition = "TEXT")
    private String overview;

    @JsonProperty("release_date")
    @Column(name = "release_date")
    private String releaseDate; // JSON의 release_date와 매핑

    @Column(name = "vote_average")
    private Double voteAverage; // JSON의 vote_average와 매핑

    private Double popularity;

    private Long revenue;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "movie_genres", joinColumns = @JoinColumn(name = "movie_id"))
    @Column(name = "genre")
    private List<String> genres; // 장르 배열 처리

    @Column(name = "poster_path")
    private String posterPath; // JSON의 poster_path와 매핑
}
