package pknu26.example.movie.service;

public class BCryptPasswordEncoder {

    private final org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder delegate =
            new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();

    public String encode(String password) {
        return delegate.encode(password);
    }

    public boolean matches(String password, String encodedPassword) {
        return delegate.matches(password, encodedPassword);
    }

}
