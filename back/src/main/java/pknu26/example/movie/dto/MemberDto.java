package pknu26.example.movie.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import pknu26.example.movie.entity.Member;

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

    @Getter
    @AllArgsConstructor
    public static class MemberResponse {
        private Long id;
        private String loginId;
        private String name;

        public static MemberResponse from(Member member) {
            return new MemberResponse(member.getId(), member.getLoginId(), member.getName());
        }
    }
}