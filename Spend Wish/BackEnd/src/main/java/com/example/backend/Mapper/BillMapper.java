package com.example.backend.Mapper;

import org.apache.ibatis.annotations.*;
import com.example.backend.Bean.Bill;

import java.util.List;

@Mapper
public interface BillMapper {
    @Select("SELECT * FROM bills WHERE bill_user = #{username}")
    List<Bill> queryAllByUsername(String username);

    @Insert("INSERT INTO bills (bill_price, bill_date, bill_type, bill_remark, bill_user, bill_source) " +
            "VALUES (#{bill_price}, #{bill_date}, #{bill_type}, #{bill_remark}, #{bill_user}, #{bill_source})")
    void add(Bill bill);

    @Update("UPDATE bills SET bill_price = #{bill_price}, bill_date = #{bill_date}, " +
            "bill_type = #{bill_type}, bill_remark = #{bill_remark}, bill_source = #{bill_source} " +
            "WHERE bill_id = #{bill_id} AND bill_user = #{bill_user}")
    void update(Bill bill);

    @Select("SELECT * FROM bills WHERE bill_id = #{billId} AND bill_user = #{username}")
    Bill getBillById(Integer billId, String username);

    @Select("SELECT * FROM bills WHERE bill_user = #{username} AND " +
            "(CAST(bill_price AS CHAR) LIKE CONCAT('%', #{term}, '%') OR " +
            "bill_date LIKE CONCAT('%', #{term}, '%') OR " +
            "bill_type LIKE CONCAT('%', #{term}, '%') OR " +
            "bill_remark LIKE CONCAT('%', #{term}, '%') OR " +
            "bill_source LIKE CONCAT('%', #{term}, '%'))")
    List<Bill> searchBills(String term, String username);

    @Delete("DELETE FROM bills WHERE bill_id = #{bill_id} AND bill_user = #{username}")
    void delete(@Param("bill_id") Integer bill_id, @Param("username") String username);
}
