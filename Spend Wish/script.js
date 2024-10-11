// 检查 jQuery 是否正确加载
if (typeof $ === 'undefined') {
    console.error('jQuery is not loaded. Make sure you have included jQuery in your HTML file.');
    // 尝试动态加载 jQuery
    var script = document.createElement('script');
    script.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
    script.onload = function() {
        console.log('jQuery has been dynamically loaded');
        init(); // 重新调用初始化函数
    };
    script.onerror = function() {
        console.error('Failed to dynamically load jQuery');
    };
    document.head.appendChild(script);
} else {
    console.log('jQuery is loaded successfully');
}

// 如果 API_BASE_URL 还没有被定义，才定义它
if (typeof API_BASE_URL === 'undefined') {
    const API_BASE_URL = 'http://localhost:8080';
}

// 在文件开头添加这个函数
function getAuthHeader() {
    const token = localStorage.getItem('token');
    console.log('Current token:', token);
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// 从后端获取账单数据
function fetchBills() {
    console.log('Fetching bills...');
    return fetch(`${API_BASE_URL}/bills/queryall`, {
        method: 'GET',
        headers: getAuthHeader()
    })
    .then(response => {
        console.log('Fetch bills response:', response);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Fetched bills:', data);
        return data;
    })
    .catch(error => {
        console.error('Error fetching bills:', error);
        throw error;
    });
}

// 渲染账单列表
function renderBills() {
    return new Promise((resolve, reject) => {
        fetchBills().then(function(bills) {
            const billList = document.getElementById('billList');
            billList.innerHTML = '';

            console.log('Bills to render:', bills);

            if (!Array.isArray(bills) || bills.length === 0) {
                billList.innerHTML = '<p>暂无账单数据</p>';
                resolve();
                return;
            }

            // 对账单按日期降序排序
            bills.sort((a, b) => new Date(b.bill_date) - new Date(a.bill_date));

            let currentDate = '';
            bills.forEach(bill => {
                console.log('Processing bill:', bill);

                const billDate = new Date(bill.bill_date).toLocaleDateString('zh-CN');
                if (billDate !== currentDate) {
                    currentDate = billDate;
                    billList.innerHTML += `<h5 class="mt-3 text-secondary">${currentDate}</h5>`;
                }

                let sourceIcon = '';
                switch(bill.bill_source) {
                    case '微信':
                        sourceIcon = '<i class="fab fa-weixin text-success me-2"></i>';
                        break;
                    case '支付宝':
                        sourceIcon = '<i class="fab fa-alipay text-primary me-2"></i>';
                        break;
                    case '现金':
                        sourceIcon = '<i class="fas fa-money-bill-wave text-warning me-2"></i>';
                        break;
                    case '银行卡':
                        sourceIcon = '<i class="fas fa-credit-card text-info me-2"></i>';
                        break;
                    default:
                        sourceIcon = '<i class="fas fa-question-circle text-secondary me-2"></i>';
                }

                const billElement = document.createElement('div');
                billElement.className = 'card mb-2';
                billElement.innerHTML = `
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 class="card-title">${sourceIcon}${bill.bill_type === 'in' ? '收入' : '支出'}</h5>
                                <h6 class="card-subtitle mb-2 ${bill.bill_type === 'in' ? 'text-success' : 'text-danger'}">
                                    ${bill.bill_type === 'in' ? '+' : '-'}${Number(bill.bill_price).toFixed(2)} 元
                                </h6>
                                <p class="card-text text-muted">${bill.bill_remark || '无备注'}</p>
                            </div>
                            <div>
                                <button class="btn btn-sm btn-outline-primary me-2 edit-btn" data-id="${bill.bill_id}">修改</button>
                                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${bill.bill_id}">删除</button>
                            </div>
                        </div>
                    </div>
                `;
                billList.appendChild(billElement);
            });

            console.log('Rendered bills:', billList.innerHTML);

            // 添加事件监听器
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', editBill);
            });
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', deleteBill);
            });

            calculateExpenses();
            resolve();
        }).catch(function(error) {
            console.error('Error rendering bills:', error);
            document.getElementById('billList').innerHTML = '<p>获取账单数据失败，请稍后再试</p>';
            reject(error);
        });
    });
}

// 编辑账单
function editBill(e) {
    const billId = e.target.getAttribute('data-id');
    $.ajax({
        url: `${API_BASE_URL}/bills/${billId}`,
        method: 'GET',
        headers: getAuthHeader(),
        dataType: 'json'
    }).done(function(bill) {
        document.getElementById('amount').value = Number(bill.bill_price).toFixed(2);
        document.getElementById('category').value = bill.bill_type;
        document.getElementById('date').value = bill.bill_date;
        document.getElementById('description').value = bill.bill_remark;
        
        const modal = new bootstrap.Modal(document.getElementById('addBillModal'));
        modal.show();
        
        // 添加毛玻璃效果
        document.body.classList.add('modal-open-blur');
        
        // 更改保存按钮的行为
        const saveBtn = document.getElementById('saveBillBtn');
        saveBtn.textContent = '更新';
        saveBtn.onclick = function() {
            updateBill(billId);
        };
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error('Error fetching bill:', textStatus, errorThrown);
        console.log('Response:', jqXHR.responseText);
        alert('获取账单信息失败，请重试。');
    });
}

// 更新账单
function updateBill(billId) {
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const source = document.getElementById('source').value;
    const date = document.getElementById('date').value;
    const description = document.getElementById('description').value;

    if (!amount || !category || !source || !date) {
        alert('请填写所有必填字段');
        return;
    }

    const billData = {
        bill_id: billId,
        bill_price: amount,
        bill_date: date,
        bill_type: category,
        bill_remark: description,
        bill_source: source
    };

    $.ajax({
        url: `${API_BASE_URL}/bills/update`,
        method: 'PUT',
        headers: getAuthHeader(),
        contentType: 'application/json',
        data: JSON.stringify(billData)
    }).done(function(response) {
        console.log('Update response:', response);
        renderBills();
        if (response.newBalance !== undefined) {
            updateWalletBalance(response.newBalance);
        } else {
            getWalletBalance();
        }

        const modal = bootstrap.Modal.getInstance(document.getElementById('addBillModal'));
        modal.hide();

        document.getElementById('addBillForm').reset();
        const saveBtn = document.getElementById('saveBillBtn');
        saveBtn.textContent = '保存';
        saveBtn.onclick = saveBill;

        alert('账单更新成功！');
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error('Error updating bill:', textStatus, errorThrown);
        alert('更新账单失败，请重试。');
    });
}

// 删除账单
function deleteBill(e) {
    const billId = e.target.getAttribute('data-id');
    if (confirm('确定要删除这条账单吗？')) {
        $.ajax({
            url: `${API_BASE_URL}/bills/delete`,
            method: 'POST',
            headers: getAuthHeader(),
            data: { bill_id: billId }
        }).done(function(response) {
            console.log('Delete response:', response);
            renderBills();
            getWalletBalance(); // 刷新钱包余额
            alert('账单删除成功！');
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error('Error deleting bill:', textStatus, errorThrown);
            console.log('Response:', jqXHR.responseText);
            alert('删除账单失败，请重试。');
        });
    }
}

// 计算收支
function calculateExpenses() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: `${API_BASE_URL}/bills/expenses`,
            method: 'POST',
            headers: getAuthHeader(),
            dataType: 'json'
        }).done(function(expenses) {
            document.getElementById('todayExpense').textContent = `支出：${Number(expenses.todayExpense).toFixed(2)} 元`;
            document.getElementById('todayIncome').textContent = `收入：${Number(expenses.todayIncome).toFixed(2)} 元`;
            document.getElementById('yesterdayExpense').textContent = `支出：${Number(expenses.yesterdayExpense).toFixed(2)} 元`;
            document.getElementById('yesterdayIncome').textContent = `收入：${Number(expenses.yesterdayIncome).toFixed(2)} 元`;
            document.getElementById('monthExpense').textContent = `支出：${Number(expenses.monthExpense).toFixed(2)} 元`;
            document.getElementById('monthIncome').textContent = `收入：${Number(expenses.monthIncome).toFixed(2)} 元`;
            resolve();
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error('Error calculating expenses:', textStatus, errorThrown);
            console.log('Response:', jqXHR.responseText);
            reject(new Error('Failed to calculate expenses'));
        });
    });
}

// 搜索功能
$('#searchInput').on('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    if (searchTerm.length === 0) {
        renderBills(); // 如果搜索词为空，显示所有账单
        return;
    }
    $.ajax({
        url: `${API_BASE_URL}/bills/search`,
        method: 'POST',
        headers: getAuthHeader(),
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({ term: searchTerm })
    }).done(function(filteredBills) {
        renderFilteredBills(filteredBills);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error('Error searching bills:', textStatus, errorThrown);
        console.log('Response:', jqXHR.responseText);
    });
});

// 渲染过滤后的账单列表
function renderFilteredBills(bills) {
    const billList = document.getElementById('billList');
    billList.innerHTML = '';

    if (!Array.isArray(bills) || bills.length === 0) {
        billList.innerHTML = '<p>没有找到匹配的账单</p>';
        return;
    }

    // 对过滤后的账单按日期降序排序
    bills.sort((a, b) => new Date(b.bill_date) - new Date(a.bill_date));

    let currentDate = '';
    bills.forEach(bill => {
        const billDate = new Date(bill.bill_date).toLocaleDateString('zh-CN');
        if (billDate !== currentDate) {
            currentDate = billDate;
            billList.innerHTML += `<h5 class="mt-3 text-secondary">${currentDate}</h5>`;
        }

        const billElement = document.createElement('div');
        billElement.className = 'card mb-2';
        billElement.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="card-title">${bill.bill_type === 'in' ? '收入' : '支出'}</h5>
                        <h6 class="card-subtitle mb-2 ${bill.bill_type === 'in' ? 'text-success' : 'text-danger'}">
                            ${bill.bill_type === 'in' ? '+' : '-'}${Number(bill.bill_price).toFixed(2)} 元
                        </h6>
                        <p class="card-text text-muted">${bill.bill_remark || '无备注'}</p>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-primary me-2 edit-btn" data-id="${bill.bill_id}">修改</button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${bill.bill_id}">删除</button>
                    </div>
                </div>
            </div>
        `;
        billList.appendChild(billElement);
    });

    // 添加事件监听器
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', editBill);
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', deleteBill);
    });
}

// 保存新账单
function saveBill() {
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const source = document.getElementById('source').value;
    const date = document.getElementById('date').value;
    const description = document.getElementById('description').value;

    if (!amount || !category || !source || !date) {
        alert('请填写所有必填字段');
        return;
    }

    const billData = {
        bill_price: amount,
        bill_date: date,
        bill_type: category,
        bill_remark: description,
        bill_source: source
    };

    $.ajax({
        url: `${API_BASE_URL}/bills/add`,
        method: 'POST',
        headers: getAuthHeader(),
        contentType: 'application/json',
        data: JSON.stringify(billData)
    }).done(function(response) {
        console.log('Save response:', response);
        renderBills();
        if (response.newBalance !== undefined) {
            updateWalletBalance(response.newBalance);
        } else {
            getWalletBalance();
        }

        const modal = bootstrap.Modal.getInstance(document.getElementById('addBillModal'));
        modal.hide();

        document.getElementById('addBillForm').reset();
        alert('新账单添加成功！');
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error('Error saving bill:', textStatus, errorThrown);
        alert('保存账单失败，请重试。');
    });
}

// 添加账单按钮点击事件
document.getElementById('addBillBtn').addEventListener('click', function() {
    const modal = new bootstrap.Modal(document.getElementById('addBillModal'));
    modal.show();
    
    // 添加毛玻璃效果
    document.body.classList.add('modal-open-blur');
    
    // 重置保存按钮
    const saveBtn = document.getElementById('saveBillBtn');
    saveBtn.textContent = '保存';
    saveBtn.onclick = saveBill;

    // 重置表单
    document.getElementById('addBillForm').reset();
    
    // 设置日期为今天
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
});

// 在模态框隐藏时移除毛玻璃效果
$('#addBillModal').on('hidden.bs.modal', function () {
    document.body.classList.remove('modal-open-blur');
});

// 显示主页内容
function showHome() {
    console.log('Showing home content');
    document.getElementById('homeContent').style.display = 'block';
    document.getElementById('reportContent').style.display = 'none';
    document.getElementById('homeLink').classList.add('active');
    document.getElementById('reportLink').classList.remove('active');
    renderBills();
}

// 显示报表内容
function showReport() {
    console.log('Showing report content');
    document.getElementById('homeContent').style.display = 'none';
    document.getElementById('reportContent').style.display = 'block';
    document.getElementById('reportLink').classList.add('active');
    document.getElementById('homeLink').classList.remove('active');
    loadReportContent();
}

// 初始化函数
function init() {
    console.log('Initializing...');
    fetchBills().then(renderBills).then(() => {
        console.log('Bills rendered, calculating expenses...');
        return calculateExpenses();
    }).then(() => {
        console.log('Expenses calculated, getting wallet balance...');
        return getWalletBalance();
    }).then(() => {
        // 添加事件监听器
        const homeLink = document.getElementById('homeLink');
        const reportLink = document.getElementById('reportLink');
        const themeToggle = document.getElementById('themeToggle');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (homeLink) {
            homeLink.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Home link clicked');
                showHome();
            });
        } else {
            console.error('Home link not found');
        }
        
        if (reportLink) {
            reportLink.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Report link clicked');
                showReport();
            });
        } else {
            console.error('Report link not found');
        }
        
        if (themeToggle) {
            initThemeToggle();
        } else {
            console.error('Theme toggle not found');
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Logout button clicked');
                logout();
            });
        } else {
            console.error('Logout button not found');
        }
        
        // 显示用户名
        const username = localStorage.getItem('username');
        if (username) {
            document.getElementById('usernameDisplay').textContent = `欢迎, ${username}`;
        }

        // 默认显示主页
        showHome();
    }).catch(function(error) {
        console.error('Error during initialization:', error);
    });
}

// 在页面加载完成后调用初始化函数
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM content loaded, calling init...');
    if (await checkLogin()) {
        init();
    } else {
        console.log('User not logged in, redirecting to login page');
        window.location.href = 'login.html';
    }
});

// 主题切换功能
function initThemeToggle() {
    console.log('Initializing theme toggle');
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    const icon = themeToggle.querySelector('i');
    const text = themeToggle.lastChild;

    themeToggle.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Theme toggle clicked');
        body.classList.toggle('dark-mode');
        
        if (body.classList.contains('dark-mode')) {
            icon.classList.replace('fa-moon', 'fa-sun');
            text.nodeValue = ' 白天模式';
            localStorage.setItem('theme', 'dark');
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
            text.nodeValue = ' 夜间模式';
            localStorage.setItem('theme', 'light');
        }
        console.log('New theme:', body.classList.contains('dark-mode') ? 'dark' : 'light');
    });
}

// 在页面加载时应用正确的主题
document.addEventListener('DOMContentLoaded', function() {
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
});

// 登出功能
function logout() {
    console.log('Logout function called');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

function getWalletBalance() {
    fetch(`${API_BASE_URL}/users/wallet`, {
        method: 'GET',
        headers: getAuthHeader()
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('walletBalance').textContent = `钱包余额: ${data.wallet.toFixed(2)} 元`;
    })
    .catch(error => console.error('Error:', error));
}

function updateWalletBalance(balance) {
    document.getElementById('walletBalance').textContent = `钱包余额: ${Number(balance).toFixed(2)} 元`;
}