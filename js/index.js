// Index page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add animation to feature cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe feature cards
    document.querySelectorAll('.feature-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Add click tracking for analytics (placeholder)
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.textContent.trim();
            console.log(`Button clicked: ${action}`);
            // Here you would send analytics data
        });
    });

    // Check if user is already logged in
    const userData = localStorage.getItem('edubridge_user');
    if (userData) {
        // Update navigation to show user is logged in
        const nav = document.querySelector('.nav');
        const loginBtn = nav.querySelector('a[href="login.html"]');
        const registerBtn = nav.querySelector('a[href="register.html"]');
        
        if (loginBtn && registerBtn) {
            loginBtn.textContent = 'Dashboard';
            loginBtn.href = 'home.html';
            registerBtn.style.display = 'none';
        }
    }
});
