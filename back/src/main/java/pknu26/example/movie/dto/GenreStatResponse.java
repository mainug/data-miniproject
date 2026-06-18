package pknu26.example.movie.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class GenreStatResponse {

    private String genre;     
    private Long movieCount;  
    private Double averageVote; 

    // 직접 생성자를 선언하는 경우 아래와 같이 타입을 일치시켜 줍니다.
    public GenreStatResponse(String genre, Long movieCount, Double averageVote) {
        this.genre = genre;
        this.movieCount = movieCount;
        this.averageVote = averageVote;
    }
}