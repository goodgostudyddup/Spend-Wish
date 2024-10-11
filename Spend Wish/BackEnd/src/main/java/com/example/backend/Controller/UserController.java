package com.example.backend.Controller;

import com.example.backend.Bean.User;
import com.example.backend.Service.UserService;
import com.example.backend.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "http://127.0.0.1:5500")
@RestController
@RequestMapping("/users")
public class UserController {
    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {
        User existingUser = userService.findByUsername(user.getUsername());
        if (existingUser != null && existingUser.getPassword().equals(user.getPassword())) {
            String token = jwtUtil.generateToken(user.getUsername());
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("message", "Login successful");
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body("{\"message\": \"Invalid username or password\"}");
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        User existingUser = userService.findByUsername(user.getUsername());
        if (existingUser != null) {
            return ResponseEntity.badRequest().body("{\"message\": \"Username already exists\"}");
        }
        userService.register(user);
        return ResponseEntity.ok().body("{\"message\": \"Registration successful\"}");
    }

    @GetMapping("/validate-token")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String token) {
        try {
            String jwtToken = token.substring(7); // Remove "Bearer " prefix
            String username = jwtUtil.getUsernameFromToken(jwtToken);
            if (username != null && jwtUtil.validateToken(jwtToken)) {
                return ResponseEntity.ok().body("{\"message\": \"Token is valid\"}");
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("{\"message\": \"Invalid token\"}");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("{\"message\": \"Invalid token\"}");
        }
    }

    @GetMapping("/wallet")
    public ResponseEntity<?> getWallet(@RequestHeader("Authorization") String token) {
        try {
            String username = jwtUtil.getUsernameFromToken(token.substring(7));
            User user = userService.findByUsername(username);
            if (user != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("wallet", user.getWallet());
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("{\"message\": \"User not found\"}");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("{\"message\": \"Invalid token\"}");
        }
    }

    @GetMapping("/balance")
    public ResponseEntity<?> getBalance(@RequestHeader("Authorization") String token) {
        try {
            String username = jwtUtil.getUsernameFromToken(token.substring(7));
            BigDecimal balance = userService.getWalletBalance(username);
            return ResponseEntity.ok().body(Map.of("balance", balance));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid token"));
        }
    }
}