package pknu26.example.movie.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
    name = "similar_movie",
    uniqueConstraints = @UniqueConstraint(columnNames = {"movie_id", "similar_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SimilarMovie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    @Column(name = "similar_id", nullable = false)
    private Long similarId;

    public SimilarMovie(Movie movie, Long similarId) {
        this.movie = movie;
        this.similarId = similarId;
    }
}