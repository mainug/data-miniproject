package pknu26.example.movie.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "movies")
@Getter
@Setter
// @NoDoubleSubmit // 필요시 커스텀 어노테이션 유지
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

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