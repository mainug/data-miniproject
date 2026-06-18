package pknu26.example.movie.controller;

import java.util.List;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pknu26.example.movie.entity.Movie;
import pknu26.example.movie.entity.NoDoubleSubmit; // 👈 우리가 만든 어노테이션 임포트!
import pknu26.example.movie.service.BoardService;

@RestController
@RequestMapping("/board")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173") // Vite 프론트엔드 허용
public class BoardController {

    private final BoardService boardService;

    // ✅ 목록 및 검색 조회
    @GetMapping
    public List<Movie> list(@RequestParam(name = "keyword", required = false) String keyword) {
        if (keyword != null && !keyword.isEmpty()) {
            return boardService.searchMovies(keyword);
        } else {
            return boardService.getAllMovies();
        }
    }

    // ✅ 상세 조회
    @GetMapping("/{id}")
    public Movie detail(@PathVariable("id") Long id) {
        return boardService.getMovie(id);
    }

    // ✅ 등록 처리 (⭐️중복 제출 방지 적용!)
    @PostMapping("/add")
    @NoDoubleSubmit // 👈 여기에 추가되었습니다! 프론트 연타 및 중복 등록을 자동으로 차단합니다.
    public String add(@RequestBody Movie movie) {
        boardService.saveMovie(movie);
        return "Success";
    }

    // ✅ 수정 처리 (⭐️수정할 때도 연타를 막고 싶다면 추가 가능)
    @PostMapping("/edit/{id}")
    @NoDoubleSubmit 
    public String edit(@PathVariable("id") Long id, @RequestBody Movie movie) {
        movie.setId(id);
        boardService.saveMovie(movie);
        return "Success";
    }

    // ✅ 삭제 처리
    @PostMapping("/delete/{id}")
    public String delete(@PathVariable("id") Long id) {
        boardService.deleteMovie(id);
        return "Success";
    }
}