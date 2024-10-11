document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        login(username, password);
    });

    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            alert('两次输入的密码不一致');
            return;
        }
        
        register(username, password);
    });

    function login(username, password) {
        fetch('http://localhost:8080/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', username);
                window.location.href = 'index.html';
            } else {
                alert('登录失败：' + data.message);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('登录失败，请重试');
        });
    }

    function register(username, password) {
        fetch('http://localhost:8080/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === "Registration successful") {
                alert('注册成功，请登录');
                document.getElementById('login-tab').click();
            } else {
                alert('注册失败：' + data.message);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('注册失败，请重试');
        });
    }
});