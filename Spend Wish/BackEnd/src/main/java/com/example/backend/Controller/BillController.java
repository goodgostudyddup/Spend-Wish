package com.example.backend.Controller;

import com.example.backend.Bean.Bill;
import com.example.backend.Service.BillService;
import com.example.backend.Service.UserService;
import com.example.backend.util.JwtUtil;
import jakarta.annotation.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;

@CrossOrigin(origins = "http://127.0.0.1:5500")
@RestController
@RequestMapping(value = {"/bills"})
public class BillController {
    @Resource
    private BillService billService;
    @Resource
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping(value = {"/queryall"})
    public ResponseEntity<List<Bill>> queryall(@RequestHeader("Authorization") String token) {
        try {
            String username = jwtUtil.getUsernameFromToken(token.substring(7));
            List<Bill> bills = billService.queryAllByUsername(username);
            return ResponseEntity.ok(bills);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping(value = {"/add"})
    public ResponseEntity<?> add(@RequestBody Bill bill, @RequestHeader("Authorization") String token) {
        try {
            String username = jwtUtil.getUsernameFromToken(token.substring(7));
            bill.setBill_user(username);
            billService.add(bill);
            BigDecimal newBalance = userService.findByUsername(username).getWallet();
            return ResponseEntity.ok().body(Map.of("message", "Bill added successfully", "newBalance", newBalance));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @RequestMapping(value = {"/delete"})
    private void delete(@RequestParam Integer bill_id, @RequestHeader("Authorization") String token){
        String username = jwtUtil.getUsernameFromToken(token.substring(7));
        billService.delete(bill_id, username);
    }

    @GetMapping("/{id}")
    public Bill getBill(@PathVariable("id") Integer billId, @RequestHeader("Authorization") String token) {
        String username = jwtUtil.getUsernameFromToken(token.substring(7));
        return billService.getBillById(billId, username);
    }

    @PutMapping("/update")
    public ResponseEntity<?> update(@RequestBody Bill bill, @RequestHeader("Authorization") String token) {
        try {
            String username = jwtUtil.getUsernameFromToken(token.substring(7));
            bill.setBill_user(username);
            billService.update(bill);
            BigDecimal newBalance = userService.findByUsername(username).getWallet();
            return ResponseEntity.ok().body(Map.of("message", "Bill updated successfully", "newBalance", newBalance));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/search")
    public List<Bill> searchBills(@RequestBody Map<String, String> searchParams, @RequestHeader("Authorization") String token) {
        String term = searchParams.get("term");
        String username = jwtUtil.getUsernameFromToken(token.substring(7));
        return billService.searchBills(term, username);
    }

    @PostMapping("/expenses")
    public Map<String, BigDecimal> getExpenses(@RequestHeader("Authorization") String token) {
        String username = jwtUtil.getUsernameFromToken(token.substring(7));
        return billService.calculateExpenses(username);
    }

    @GetMapping("/report")
    public Map<String, Object> getReportData(@RequestHeader("Authorization") String token) {
        String username = jwtUtil.getUsernameFromToken(token.substring(7));
        return billService.getReportData(username);
    }

    @GetMapping("/report/category")
    public Map<String, BigDecimal> getCategoryReport(@RequestHeader("Authorization") String token) {
        String username = jwtUtil.getUsernameFromToken(token.substring(7));
        return billService.getCategoryReport(username);
    }

    @GetMapping("/report/trend")
    public Map<String, BigDecimal> getTrendReport(@RequestHeader("Authorization") String token) {
        String username = jwtUtil.getUsernameFromToken(token.substring(7));
        return billService.getTrendReport(username);
    }
}
