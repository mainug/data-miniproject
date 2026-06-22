package pknu26.example.movie.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

public class BulkDto {

    @Getter @Setter
    public static class MovieBulkRequest {
        private Long id;
        private String title;
        private String original_title;
        private String release_date;
        private double vote_average;
        private int vote_count;
        private double popularity;
        private long revenue;
        private long budget;
        private int runtime;
        private List<String> genres;
        private String poster_path;
        private String overview;
        private String tagline;
        private String status;
        private String director;
        private String cast_top3;
        private String collection_name;
        private String production_countries;
        private String source;
    }

    @Getter @Setter
    public static class SimilarBulkRequest {
        private Long movie_id;
        private List<Long> similar_ids;
    }
}