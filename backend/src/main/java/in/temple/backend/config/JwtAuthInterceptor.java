package in.temple.backend.config;

import in.temple.backend.model.User;
import in.temple.backend.service.JwtContextService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class JwtAuthInterceptor implements HandlerInterceptor {

    private final JwtContextService jwtContextService;

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler
    ) {

        String path = request.getRequestURI();

        // Allow login without token
        if (path.startsWith("/api/auth/login")) {
            return true;
        }

        String authHeader = request.getHeader("Authorization");

        User user = jwtContextService.getUserFromAuthHeader(authHeader);

        request.setAttribute("loggedInUser", user);

        return true;
    }
}
