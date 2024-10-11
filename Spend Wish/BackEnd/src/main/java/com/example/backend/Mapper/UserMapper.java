package com.example.backend.Mapper;

import org.apache.ibatis.annotations.*;
import com.example.backend.Bean.User;

import java.math.BigDecimal;

@Mapper
public interface UserMapper {
    @Select("SELECT * FROM users WHERE username = #{username}")
    User findByUsername(String username);

    @Insert("INSERT INTO users (username, password, wallet) VALUES (#{username}, #{password}, #{wallet})")
    void insert(User user);

    @Update("UPDATE users SET wallet = #{wallet} WHERE username = #{username}")
    void updateWallet(@Param("username") String username, @Param("wallet") BigDecimal wallet);
}