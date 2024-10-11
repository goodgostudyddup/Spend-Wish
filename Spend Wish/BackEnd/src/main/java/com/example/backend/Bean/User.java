package com.example.backend.Bean;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private Integer user_id;
    private String username;
    private String password;
    private BigDecimal wallet; // 新增钱包字段
}