package in.temple.backend.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Service
public class JwtService {

    private static final String SECRET =
            "temple-app-super-secret-key-should-be-long";

    private static final long EXPIRY = 1000 * 60 * 60 * 8; // 8 hours

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String username, String role) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRY))
                .signWith(getSigningKey())
                .compact();
    }

    public Claims parseToken(String token) {
        Jws<Claims> claimsJws = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token);

        return claimsJws.getBody();
    }

    public String extractUsername(String token) {
        return parseToken(token).getSubject();
    }

    public String extractRole(String token) {
        return parseToken(token).get("role", String.class);
    }
}
