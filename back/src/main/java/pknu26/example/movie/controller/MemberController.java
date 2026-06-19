package pknu26.example.movie.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pknu26.example.movie.dto.MemberDto.*;
import pknu26.example.movie.entity.Member;
import pknu26.example.movie.entity.NoDoubleSubmit;
import pknu26.example.movie.service.MemberService;

import java.util.Map;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class MemberController {

    private static final String LOGIN_MEMBER_ID = "LOGIN_MEMBER_ID";

    private final MemberService memberService;

    @PostMapping("/signup")
    @NoDoubleSubmit
    public ResponseEntity<MemberResponse> signUp(@RequestBody SignUpRequest request) {
        Long id = memberService.signUp(request);
        MemberResponse response = new MemberResponse(id, request.getLoginId(), request.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public MemberResponse login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        Member member = memberService.login(request);
        HttpSession session = httpRequest.getSession();
        session.setAttribute(LOGIN_MEMBER_ID, member.getId());
        return MemberResponse.from(member);
    }

    @PostMapping("/logout")
    public void logout(HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }

    @GetMapping("/me")
    public ResponseEntity<MemberResponse> me(HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        Long memberId = session == null ? null : (Long) session.getAttribute(LOGIN_MEMBER_ID);
        if (memberId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(MemberResponse.from(memberService.getMember(memberId)));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
}
