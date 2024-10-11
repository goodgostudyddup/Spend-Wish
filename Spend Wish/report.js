// 如果 API_BASE_URL 还没有被定义，才定义它
if (typeof API_BASE_URL === 'undefined') {
    const API_BASE_URL = 'http://localhost:8080';
}

// 在文件顶部添加这些变量来存储图表实例
let categoryChart = null;
let trendChart = null;

// 加载报表内容
function loadReportContent() {
    generateReports()
        .then(() => {
            console.log('Reports generated successfully');
        })
        .catch(error => {
            console.error('Failed to generate reports:', error);
            // 显示错误消息给用户
            document.getElementById('reportError').innerHTML = 
                '<p class="text-danger">加载报表数据失败，请稍后重试</p>';
        });
    
    // 加载其他报表数据...
}

// 生成报表
async function generateReports() {
    await generateCategoryChart();
    await generateTrendChart();
}

// 生成类别饼图
async function generateCategoryChart() {
    try {
        document.getElementById('categoryChart').style.opacity = '0.5';
        document.getElementById('categoryChartError').textContent = '';
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No token found');
        }
        const response = await fetch(`${API_BASE_URL}/bills/report/category`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch category data');
        }
        const categoryData = await response.json();

        const ctx = document.getElementById('categoryChart').getContext('2d');
        
        // 如果已存在图表实例，先销毁它
        if (categoryChart) {
            categoryChart.destroy();
        }
        
        // 创建新的图表实例并保存引用
        categoryChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(categoryData),
                datasets: [{
                    data: Object.values(categoryData),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '支出类别分布'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error generating category chart:', error);
        document.getElementById('categoryChartError').textContent = '加载分类数据失败，请稍后重试。';
    } finally {
        document.getElementById('categoryChart').style.opacity = '1';
    }
}

// 生成趋势折线图
async function generateTrendChart() {
    try {
        document.getElementById('trendChart').style.opacity = '0.5';
        document.getElementById('trendChartError').textContent = '';
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No token found');
        }
        const response = await fetch(`${API_BASE_URL}/bills/report/trend`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch trend data');
        }
        const trendData = await response.json();

        const ctx = document.getElementById('trendChart').getContext('2d');
        
        // 如果已存在图表实例，先销毁它
        if (trendChart) {
            trendChart.destroy();
        }
        
        // 创建新的图表实例并保存引用
        trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(trendData),
                datasets: [{
                    label: '每日收支趋势',
                    data: Object.values(trendData),
                    borderColor: '#36A2EB',
                    fill: false
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '收支趋势'
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error generating trend chart:', error);
        document.getElementById('trendChartError').textContent = '加载趋势数据失败，请稍后重试。';
    } finally {
        document.getElementById('trendChart').style.opacity = '1';
    }
}

// 等待 DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    const reportLink = document.getElementById('reportLink');
    const homeLink = document.getElementById('homeLink');
    const homeContent = document.getElementById('homeContent');
    const reportContent = document.getElementById('reportContent');

    if (reportLink && homeLink && homeContent && reportContent) {
        reportLink.addEventListener('click', function(e) {
            e.preventDefault();
            homeContent.style.display = 'none';
            reportContent.style.display = 'block';
            this.classList.add('active');
            homeLink.classList.remove('active');
            loadReportContent();
        });

        homeLink.addEventListener('click', function(e) {
            e.preventDefault();
            reportContent.style.display = 'none';
            homeContent.style.display = 'block';
            this.classList.add('active');
            reportLink.classList.remove('active');
            destroyCharts(); // 在切换到主页时销毁图表
        });
    } else {
        console.error('One or more required elements are missing from the DOM');
    }
});

async function loadReportData() {
    try {
        const response = await fetch(`${API_BASE_URL}/bills/report`, {
            headers: getAuthHeader()
        });
        // ... 其余代码保持不变
    } catch (error) {
        // ... 错误处理
    }
}

function renderTrendChart(trendData) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(trendData),
            datasets: [{
                label: '收支趋势',
                data: Object.values(trendData),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderCategoryChart(categoryData) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(categoryData),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: '支出分类'
                }
            }
        }
    });
}

// 确保在切换到其他页面时销毁图表
function destroyCharts() {
    if (categoryChart) {
        categoryChart.destroy();
        categoryChart = null;
    }
    if (trendChart) {
        trendChart.destroy();
        trendChart = null;
    }
}