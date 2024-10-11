package com.example.backend.Service;

import com.example.backend.Bean.Bill;
import com.example.backend.Mapper.BillMapper;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import java.util.*;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.backend.Service.UserService;

@Service
public class BillService {
    @Resource
    private BillMapper billMapper;
    
    @Autowired
    private UserService userService;

    public List<Bill> queryAllByUsername(String username) {
        List<Bill> bills = billMapper.queryAllByUsername(username);
        System.out.println("Fetched bills for user " + username + ": " + bills);
        return bills;
    }

    public void add(Bill bill) {
        // 验证 bill_source 字段
        if (!isValidSource(bill.getBill_source())) {
            throw new IllegalArgumentException("Invalid bill source");
        }
        billMapper.add(bill);
        updateWalletBalance(bill.getBill_user(), bill.getBill_price(), bill.getBill_type());
    }

    public void delete(Integer bill_id, String username) {
        Bill bill = billMapper.getBillById(bill_id, username);
        billMapper.delete(bill_id, username);
        // 撤销被删除账单对钱包的影响
        updateWalletBalance(username, bill.getBill_price(), bill.getBill_type().equals("in") ? "out" : "in");
    }

    public void update(Bill bill) {
        // 验证 bill_source 字段
        if (!isValidSource(bill.getBill_source())) {
            throw new IllegalArgumentException("Invalid bill source");
        }
        Bill oldBill = billMapper.getBillById(bill.getBill_id(), bill.getBill_user());
        billMapper.update(bill);
        
        // 撤销旧账单对钱包的影响
        updateWalletBalance(bill.getBill_user(), oldBill.getBill_price(), oldBill.getBill_type().equals("in") ? "out" : "in");
        // 应用新账单对钱包的影响
        updateWalletBalance(bill.getBill_user(), bill.getBill_price(), bill.getBill_type());
    }

    public Bill getBillById(Integer billId, String username) {
        return billMapper.getBillById(billId, username);
    }

    public List<Bill> searchBills(String term, String username) {
        return billMapper.searchBills(term, username);
    }

    public Map<String, BigDecimal> calculateExpenses(String username) {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        LocalDate firstDayOfMonth = today.withDayOfMonth(1);

        List<Bill> allBills = billMapper.queryAllByUsername(username);

        Map<String, BigDecimal> expenses = new HashMap<>();
        expenses.put("todayExpense", BigDecimal.ZERO);
        expenses.put("todayIncome", BigDecimal.ZERO);
        expenses.put("yesterdayExpense", BigDecimal.ZERO);
        expenses.put("yesterdayIncome", BigDecimal.ZERO);
        expenses.put("monthExpense", BigDecimal.ZERO);
        expenses.put("monthIncome", BigDecimal.ZERO);

        for (Bill bill : allBills) {
            LocalDate billDate = LocalDate.parse(bill.getBill_date());
            BigDecimal amount = bill.getBill_price();

            if (billDate.isEqual(today)) {
                if ("out".equals(bill.getBill_type())) {
                    expenses.put("todayExpense", expenses.get("todayExpense").add(amount));
                } else {
                    expenses.put("todayIncome", expenses.get("todayIncome").add(amount));
                }
            } else if (billDate.isEqual(yesterday)) {
                if ("out".equals(bill.getBill_type())) {
                    expenses.put("yesterdayExpense", expenses.get("yesterdayExpense").add(amount));
                } else {
                    expenses.put("yesterdayIncome", expenses.get("yesterdayIncome").add(amount));
                }
            }

            if (!billDate.isBefore(firstDayOfMonth)) {
                if ("out".equals(bill.getBill_type())) {
                    expenses.put("monthExpense", expenses.get("monthExpense").add(amount));
                } else {
                    expenses.put("monthIncome", expenses.get("monthIncome").add(amount));
                }
            }
        }

        return expenses;
    }

    // 添加一个辅助方法来验证 bill_source
    private boolean isValidSource(String source) {
        return Arrays.asList("微信", "支付宝", "现金", "银行卡").contains(source);
    }

    public Map<String, Object> getReportData(String username) {
        Map<String, Object> reportData = new HashMap<>();
        reportData.put("categoryReport", getCategoryReport(username));
        reportData.put("trendReport", getTrendReport(username));
        return reportData;
    }

    public Map<String, BigDecimal> getCategoryReport(String username) {
        List<Bill> allBills = billMapper.queryAllByUsername(username);
        Map<String, BigDecimal> categoryReport = new HashMap<>();

        for (Bill bill : allBills) {
            if ("out".equals(bill.getBill_type())) {
                String category = bill.getBill_remark();
                BigDecimal amount = bill.getBill_price();
                categoryReport.merge(category, amount, BigDecimal::add);
            }
        }

        return categoryReport;
    }

    public Map<String, BigDecimal> getTrendReport(String username) {
        List<Bill> allBills = billMapper.queryAllByUsername(username);
        Map<String, BigDecimal> trendReport = new TreeMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        for (Bill bill : allBills) {
            LocalDate date = LocalDate.parse(bill.getBill_date());
            String formattedDate = date.format(formatter);
            BigDecimal amount = bill.getBill_price();
            if ("out".equals(bill.getBill_type())) {
                amount = amount.negate();
            }
            trendReport.merge(formattedDate, amount, BigDecimal::add);
        }

        return trendReport;
    }

    private void updateWalletBalance(String username, BigDecimal amount, String type) {
        BigDecimal change = type.equals("in") ? amount : amount.negate();
        userService.updateWallet(username, change);
    }
}
