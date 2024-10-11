package com.example.backend.Service;

import com.example.backend.Bean.User;
import com.example.backend.Mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class UserService {
    @Autowired
    private UserMapper userMapper;

    public User findByUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username cannot be empty");
        }
        return userMapper.findByUsername(username);
    }

    public void register(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }
        if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
            throw new IllegalArgumentException("Username cannot be empty");
        }
        if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Password cannot be empty");
        }
        if (user.getWallet() == null) {
            user.setWallet(BigDecimal.ZERO);
        }
        userMapper.insert(user);
    }

    public void updateWallet(String username, BigDecimal amount) {
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username cannot be empty");
        }
        if (amount == null) {
            throw new IllegalArgumentException("Amount cannot be null");
        }
        User user = findByUsername(username);
        if (user != null) {
            BigDecimal newWallet = user.getWallet().add(amount);
            if (newWallet.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalStateException("Wallet balance cannot be negative");
            }
            userMapper.updateWallet(username, newWallet);
        } else {
            throw new IllegalArgumentException("User not found");
        }
    }

    public BigDecimal getWalletBalance(String username) {
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username cannot be empty");
        }
        User user = findByUsername(username);
        return user != null ? user.getWallet() : BigDecimal.ZERO;
    }
}