// Register page functionality
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const usernameInput = document.getElementById('username');
    const gradeInput = document.getElementById('grade');
    const languageInput = document.getElementById('language');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const termsCheckbox = document.getElementById('terms');

    // Get error elements
    const firstNameError = document.getElementById('firstNameError');
    const lastNameError = document.getElementById('lastNameError');
    const emailError = document.getElementById('emailError');
    const usernameError = document.getElementById('usernameError');
    const gradeError = document.getElementById('gradeError');
    const languageError = document.getElementById('languageError');
    const passwordError = document.getElementById('passwordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');

    // Real-time validation on blur
    firstNameInput.addEventListener('blur', () => validateFirstName());
    lastNameInput.addEventListener('blur', () => validateLastName());
    emailInput.addEventListener('blur', () => validateEmail());
    usernameInput.addEventListener('blur', () => validateUsername());
    gradeInput.addEventListener('change', () => validateGrade());
    languageInput.addEventListener('change', () => validateLanguage());
    passwordInput.addEventListener('blur', () => validatePassword());
    confirmPasswordInput.addEventListener('blur', () => validateConfirmPassword());

    // Real-time validation on input (for fields with errors)
    firstNameInput.addEventListener('input', function() {
        if (this.classList.contains('invalid')) validateFirstName();
    });
    lastNameInput.addEventListener('input', function() {
        if (this.classList.contains('invalid')) validateLastName();
    });
    emailInput.addEventListener('input', function() {
        if (this.classList.contains('invalid')) validateEmail();
    });
    usernameInput.addEventListener('input', function() {
        if (this.classList.contains('invalid')) validateUsername();
    });
    passwordInput.addEventListener('input', function() {
        if (this.classList.contains('invalid')) validatePassword();
        if (confirmPasswordInput.value) validateConfirmPassword();
    });
    confirmPasswordInput.addEventListener('input', function() {
        if (this.classList.contains('invalid')) validateConfirmPassword();
    });

    // Validation functions
    function validateFirstName() {
        const firstName = firstNameInput.value.trim();
        if (!firstName) {
            showFieldError(firstNameInput, firstNameError, 'First name is required');
            return false;
        }
        if (firstName.length < 2) {
            showFieldError(firstNameInput, firstNameError, 'First name must be at least 2 characters');
            return false;
        }
        if (!/^[a-zA-Z\s]+$/.test(firstName)) {
            showFieldError(firstNameInput, firstNameError, 'First name can only contain letters');
            return false;
        }
        showFieldSuccess(firstNameInput, firstNameError);
        return true;
    }

    function validateLastName() {
        const lastName = lastNameInput.value.trim();
        if (!lastName) {
            showFieldError(lastNameInput, lastNameError, 'Last name is required');
            return false;
        }
        if (lastName.length < 2) {
            showFieldError(lastNameInput, lastNameError, 'Last name must be at least 2 characters');
            return false;
        }
        if (!/^[a-zA-Z\s]+$/.test(lastName)) {
            showFieldError(lastNameInput, lastNameError, 'Last name can only contain letters');
            return false;
        }
        showFieldSuccess(lastNameInput, lastNameError);
        return true;
    }

    function validateEmail() {
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            showFieldError(emailInput, emailError, 'Email is required');
            return false;
        }
        if (!emailRegex.test(email)) {
            showFieldError(emailInput, emailError, 'Please enter a valid email address');
            return false;
        }
        showFieldSuccess(emailInput, emailError);
        return true;
    }

    function validateUsername() {
        const username = usernameInput.value.trim();
        if (!username) {
            showFieldError(usernameInput, usernameError, 'Username is required');
            return false;
        }
        if (username.length < 3) {
            showFieldError(usernameInput, usernameError, 'Username must be at least 3 characters');
            return false;
        }
        if (username.length > 20) {
            showFieldError(usernameInput, usernameError, 'Username must be less than 20 characters');
            return false;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            showFieldError(usernameInput, usernameError, 'Username can only contain letters, numbers, and underscores');
            return false;
        }
        showFieldSuccess(usernameInput, usernameError);
        return true;
    }

    function validateGrade() {
        const grade = gradeInput.value;
        if (!grade) {
            showFieldError(gradeInput, gradeError, 'Please select a grade');
            return false;
        }
        showFieldSuccess(gradeInput, gradeError);
        return true;
    }

    function validateLanguage() {
        const language = languageInput.value;
        if (!language) {
            showFieldError(languageInput, languageError, 'Please select a language');
            return false;
        }
        showFieldSuccess(languageInput, languageError);
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
        if (password.length > 50) {
            showFieldError(passwordInput, passwordError, 'Password must be less than 50 characters');
            return false;
        }
        showFieldSuccess(passwordInput, passwordError);
        return true;
    }

    function validateConfirmPassword() {
        const confirmPassword = confirmPasswordInput.value;
        const password = passwordInput.value;
        if (!confirmPassword) {
            showFieldError(confirmPasswordInput, confirmPasswordError, 'Please confirm your password');
            return false;
        }
        if (confirmPassword !== password) {
            showFieldError(confirmPasswordInput, confirmPasswordError, 'Passwords do not match');
            return false;
        }
        showFieldSuccess(confirmPasswordInput, confirmPasswordError);
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
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(registerForm);
        const userData = {
            id: Date.now().toString(),
            firstName: formData.get('firstName').trim(),
            lastName: formData.get('lastName').trim(),
            email: formData.get('email').trim(),
            username: formData.get('username').trim(),
            grade: formData.get('grade'),
            language: formData.get('language'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
            terms: formData.get('terms')
        };

        // Validate all fields
        const isValid = 
            validateFirstName() &&
            validateLastName() &&
            validateEmail() &&
            validateUsername() &&
            validateGrade() &&
            validateLanguage() &&
            validatePassword() &&
            validateConfirmPassword();

        if (!isValid) {
            showMessage('Please fix the errors in the form', 'error');
            return;
        }

        // Check terms acceptance
        if (!termsCheckbox.checked) {
            showMessage('Please accept the terms and conditions', 'error');
            return;
        }

        // Check if user already exists
        const users = JSON.parse(localStorage.getItem('edubridge_users') || '[]');
        const existingUser = users.find(u => u.email === userData.email || u.username === userData.username);
        
        if (existingUser) {
            if (existingUser.email === userData.email) {
                showFieldError(emailInput, emailError, 'This email is already registered');
            }
            if (existingUser.username === userData.username) {
                showFieldError(usernameInput, usernameError, 'This username is already taken');
            }
            showMessage('User with this email or username already exists', 'error');
            return;
        }

        // Create user account
        const newUser = {
            id: userData.id,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            username: userData.username,
            grade: userData.grade,
            language: userData.language,
            password: userData.password,
            createdAt: Date.now(),
            points: 0,
            level: 1,
            badges: [],
            lessonsCompleted: 0,
            quizzesTaken: 0,
            notesCreated: 0,
            studyStreak: 0
        };

        users.push(newUser);
        localStorage.setItem('edubridge_users', JSON.stringify(users));

        showMessage('Account created successfully! Redirecting to login...', 'success');
        
        // Redirect to login page
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
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
