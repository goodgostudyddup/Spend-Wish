package com.example.backend.interceptor;

import com.example.backend.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

// 这个拦截器用于验证JWT令牌
@Component
public class JwtInterceptor implements HandlerInterceptor {

    // 注入JWT工具类，用于验证令牌
    @Autowired
    private JwtUtil jwtUtil;

    // 在请求处理之前进行调用
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        System.out.println("Request URL: " + request.getRequestURL());
        System.out.println("Request Method: " + request.getMethod());

        // 对于 OPTIONS 请求，直接放行
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return true;
        }

        // 从请求头中获取Authorization字段
        String token = request.getHeader("Authorization");
        System.out.println("Received token: " + token);  // 打印接收到的令牌，用于调试

        // 检查令牌是否存在且以"Bearer "开头
        if (token != null && token.startsWith("Bearer ")) {
            // 去掉"Bearer "前缀
            token = token.substring(7);
            // 验证令牌
            if (jwtUtil.validateToken(token)) {
                System.out.println("Token is valid");  // 如果令牌有效，打印信息
                return true;  // 允许请求继续
            }
        }

        // 如果没有令牌或令牌无效
        System.out.println("Token is invalid or not present");  // 打印错误信息
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);  // 设置响应状态为401（未授权）
        return false;  // 拒绝请求
    }
}