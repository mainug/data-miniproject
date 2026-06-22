package pknu26.example.movie.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;

@Controller
public class BoardLoginController {

    @GetMapping("/board/login")
    public ModelAndView login(@RequestParam(name = "mode", defaultValue = "login") String mode) {
        ModelAndView mv = new ModelAndView("board/login");
        mv.addObject("mode", "signup".equals(mode) ? "signup" : "login");
        return mv;
    }
}
