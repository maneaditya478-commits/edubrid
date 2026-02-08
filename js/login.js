// Login page functionality
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('remember');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');

    // Real-time validation
    emailInput.addEventListener('blur', function() {
        validateEmail();
    });

    emailInput.addEventListener('input', function() {
        if (this.classList.contains('invalid')) {
            validateEmail();
        }
    });

    passwordInput.addEventListener('blur', function() {
        validatePassword();
    });

    passwordInput.addEventListener('input', function() {
        if (this.classList.contains('invalid')) {
            validatePassword();
        }
    });

    // Validation functions
    function validateEmail() {
        const email = emailInput.value.trim();
        if (!email) {
            showFieldError(emailInput, emailError, 'Email or username is required');
            return false;
        }
        if (email.length < 3) {
            showFieldError(emailInput, emailError, 'Email or username must be at least 3 characters');
            return false;
        }
        showFieldSuccess(emailInput, emailError);
        return true;
    }

    function validatePassword() {
        const password = passwordInput.value;
        if (!password) {
            showFieldError(passwordInput, passwordError, 'Password is required');
            return false;
        }
        if (password.length < 6) {
            showFieldError(passwordInput, passwordError, 'Password must be at least 6 characters');
            return false;
        }
        showFieldSuccess(passwordInput, passwordError);
        return true;
    }

    function showFieldError(input, errorElement, message) {
        input.classList.remove('valid');
        input.classList.add('invalid');
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    function showFieldSuccess(input, errorElement) {
        input.classList.remove('invalid');
        input.classList.add('valid');
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }

    // Form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const remember = rememberCheckbox.checked;

        // Validate all fields
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();

        if (!isEmailValid || !isPasswordValid) {
            showMessage('Please fix the errors in the form', 'error');
            return;
        }

        // Simulate login process
        showMessage('Logging in...', 'info');
        
        // Check if user exists in localStorage (demo purposes)
        const users = JSON.parse(localStorage.getItem('edubridge_users') || '[]');
        const user = users.find(u => (u.email === email || u.username === email) && u.password === password);
        
        if (user) {
            // Store user session
            const sessionData = {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                username: user.username,
                grade: user.grade,
                language: user.language,
                loginTime: Date.now()
            };
            
            if (remember) {
                localStorage.setItem('edubridge_user', JSON.stringify(sessionData));
            } else {
                sessionStorage.setItem('edubridge_user', JSON.stringify(sessionData));
            }
            
            showMessage('Login successful! Redirecting...', 'success');
            
            // Redirect to home page
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1500);
        } else {
            showMessage('Invalid email/username or password', 'error');
        }
    });

    // Show message function
    function showMessage(message, type) {
        // Remove existing messages
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        // Style the message
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 1rem 2rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideDown 0.3s ease;
        `;
        
        // Set background color based on type
        switch (type) {
            case 'success':
                messageDiv.style.background = '#22c55e';
                break;
            case 'error':
                messageDiv.style.background = '#ef4444';
                break;
            case 'info':
                messageDiv.style.background = '#3b82f6';
                break;
        }
        
        document.body.appendChild(messageDiv);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
});
