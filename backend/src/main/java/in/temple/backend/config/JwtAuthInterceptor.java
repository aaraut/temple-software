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

        // ✅ Allow CORS preflight
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String path = request.getRequestURI();

        if (path.equals("/api/auth/login") ||
                path.equals("/api/auth/forgot-password")) {
            return true;
        }

        String authHeader = request.getHeader("Authorization");
        User user = jwtContextService.getUserFromAuthHeader(authHeader);
        request.setAttribute("loggedInUser", user);

        return true;
    }

}
