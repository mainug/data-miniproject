package pknu26.example.movie.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pknu26.example.movie.entity.Member;
import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {
    Optional<Member> findByLoginId(String loginId);
    boolean existsByLoginId(String loginId);
}