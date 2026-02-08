// EmailJS configuration
// You can set keys in two ways:
// 1) Add a global window.EDUBRIDGE_EMAILJS_CONFIG = { serviceId, templateId, publicKey }
// 2) Save JSON in localStorage under "edubridge_emailjs_config"
const EMAILJS_CONFIG = (() => {
    let storedConfig = null;
    try {
        storedConfig = JSON.parse(localStorage.getItem('edubridge_emailjs_config') || 'null');
    } catch (e) {
        // ignore malformed localStorage values
    }
    const runtimeConfig = typeof window !== 'undefined' ? window.EDUBRIDGE_EMAILJS_CONFIG : null;
    const cfg = runtimeConfig || storedConfig || {};
    return {
        serviceId: cfg.serviceId || 'YOUR_SERVICE_ID',
        templateId: cfg.templateId || 'YOUR_TEMPLATE_ID',
        publicKey: cfg.publicKey || 'YOUR_PUBLIC_KEY'
    };
})();

const EMAILJS_SERVICE_ID = EMAILJS_CONFIG.serviceId;
const EMAILJS_TEMPLATE_ID = EMAILJS_CONFIG.templateId;
const EMAILJS_PUBLIC_KEY = EMAILJS_CONFIG.publicKey;

function isEmailJsConfigured() {
    return EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID' &&
        EMAILJS_TEMPLATE_ID !== 'YOUR_TEMPLATE_ID' &&
        EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY';
}

// Contact page functionality
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');

    // Initialize EmailJS if configured
    if (window.emailjs && isEmailJsConfigured()) {
        try {
            emailjs.init(EMAILJS_PUBLIC_KEY);
        } catch (e) {
            console.error('EmailJS init failed:', e);
        }
    }

    // Form submission
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const contactData = {
            id: Date.now().toString(),
            firstName: formData.get('firstName').trim(),
            lastName: formData.get('lastName').trim(),
            email: formData.get('email').trim(),
            phone: formData.get('phone').trim(),
            subject: formData.get('subject'),
            message: formData.get('message').trim(),
            timestamp: new Date().toISOString()
        };

        // Validation
        if (!validateForm(contactData)) {
            return;
        }

        // Save contact message to localStorage
        const messages = JSON.parse(localStorage.getItem('edubridge_contact_messages') || '[]');
        messages.push(contactData);
        localStorage.setItem('edubridge_contact_messages', JSON.stringify(messages));

        // Prepare EmailJS payload
        const templateParams = {
            firstName: contactData.firstName,
            lastName: contactData.lastName,
            email: contactData.email,
            phone: contactData.phone || 'N/A',
            subject: contactData.subject,
            message: contactData.message,
            submitted_at: contactData.timestamp
        };

        // Send via EmailJS if configured; otherwise just show success
        if (window.emailjs && isEmailJsConfigured()) {

            emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
                .then(() => {
                    showMessage('Thank you for your message! We will get back to you soon.', 'success');
                    contactForm.reset();
                })
                .catch((error) => {
                    console.error('EmailJS send failed:', error);
                    showMessage('We saved your message locally, but email sending failed. Please try again later.', 'error');
                    contactForm.reset();
                });
        } else {
            showMessage('Thank you for your message! (EmailJS not configured yet.) Add keys via EDUBRIDGE_EMAILJS_CONFIG or localStorage.', 'success');
            contactForm.reset();
        }
    });

    // Form validation
    function validateForm(data) {
        // Check required fields
        if (!data.firstName || !data.lastName || !data.email || !data.subject || !data.message) {
            showMessage('Please fill in all required fields', 'error');
            return false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            showMessage('Please enter a valid email address', 'error');
            return false;
        }

        // Message length validation
        if (data.message.length < 10) {
            showMessage('Message must be at least 10 characters long', 'error');
            return false;
        }

        // Phone validation (if provided)
        if (data.phone && data.phone.trim() !== '') {
            const phoneRegex = /^[\d\s\+\-\(\)]+$/;
            if (!phoneRegex.test(data.phone)) {
                showMessage('Please enter a valid phone number', 'error');
                return false;
            }
        }

        return true;
    }

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
            max-width: 90%;
            text-align: center;
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
        
        // Remove message after 4 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 4000);
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

