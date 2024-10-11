package com.example.backend.Bean;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Bill {
    private Integer bill_id;//账单id
    private BigDecimal bill_price; //
    private String bill_date;//账单日期
    private String bill_type;//账单类型 in /out
    private String bill_remark;//账单备注
    private String bill_user;//账单用户
    private String bill_source; // 确保这行存在
}
