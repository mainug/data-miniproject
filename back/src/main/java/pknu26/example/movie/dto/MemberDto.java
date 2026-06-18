package pknu26.example.movie.dto;

import lombok.Getter;
import lombok.Setter;

public class MemberDto {

    @Getter @Setter
    public static class SignUpRequest {
        private String loginId;
        private String password;
        private String name;
    }

    @Getter @Setter
    public static class LoginRequest {
        private String loginId;
        private String password;
    }
}