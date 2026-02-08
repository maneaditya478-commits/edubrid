// Profile page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const userData = getUserData();
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize profile
    loadProfileData(userData);
    loadBadges(userData);
    loadStatistics(userData);

    // Event listeners
    document.getElementById('profileForm').addEventListener('submit', updateProfile);
    document.getElementById('changeAvatarBtn').addEventListener('click', changeAvatar);
    
    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('edubridge_user');
        sessionStorage.removeItem('edubridge_user');
        window.location.href = 'index.html';
    });

    function getUserData() {
        const userData = localStorage.getItem('edubridge_user') || sessionStorage.getItem('edubridge_user');
        return userData ? JSON.parse(userData) : null;
    }

    function loadProfileData(userData) {
        // Update profile header
        document.getElementById('userFullName').textContent = `${userData.firstName} ${userData.lastName}`;
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('userGrade').textContent = `Grade ${userData.grade}`;
        
        // Update avatar
        const avatar = document.getElementById('userAvatar');
        avatar.textContent = userData.firstName ? userData.firstName.charAt(0).toUpperCase() : '👤';
        
        // Update stats
        document.getElementById('totalPoints').textContent = userData.points || 0;
        document.getElementById('xpTotal').textContent = userData.xp || 0;
        document.getElementById('currentLevel').textContent = userData.level || 1;
        document.getElementById('badgeCount').textContent = (userData.badges || []).length;

        // Update XP progress visuals
        const progress = calculateLevel(userData);
        updateXpWidgets(progress);
        
        // Load form data
        document.getElementById('firstName').value = userData.firstName || '';
        document.getElementById('lastName').value = userData.lastName || '';
        document.getElementById('email').value = userData.email || '';
        document.getElementById('grade').value = userData.grade || '';
        document.getElementById('language').value = userData.language || 'en';
    }

    function loadBadges(userData) {
        const badgesGrid = document.getElementById('badgesGrid');
        const badges = userData.badges || [];
        
        if (badges.length === 0) {
            badgesGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🏆</div>
                    <h3>No badges yet</h3>
                    <p>Complete quizzes and lessons to earn badges!</p>
                </div>
            `;
            return;
        }

        badgesGrid.innerHTML = badges.map(badge => `
            <div class="badge-item">
                ${getBadgeIcon(badge)}
                <span>${badge}</span>
            </div>
        `).join('');
    }

    function getBadgeIcon(badgeName) {
        const badgeIcons = {
            'Quiz Master': '🧠',
            'Perfect Score': '⭐',
            'Quick Learner': '⚡',
            'Note Taker': '📝',
            'Voice Learner': '🎙️',
            'Mentor Seeker': '🤝',
            'Level Up': '📈',
            'Streak Master': '🔥'
        };
        
        return badgeIcons[badgeName] || '🏆';
    }

    function loadStatistics(userData) {
        // Update learning statistics
        document.getElementById('lessonsCompleted').textContent = userData.lessonsCompleted || 0;
        document.getElementById('quizzesTaken').textContent = userData.quizzesTaken || 0;
        document.getElementById('notesCreated').textContent = userData.notesCreated || 0;
        document.getElementById('studyStreak').textContent = userData.studyStreak || 0;
        
        // Update progress bars
        updateProgressBars(userData);
    }

    function updateProgressBars(userData) {
        const progressItems = document.querySelectorAll('.progress-item');
        
        progressItems.forEach(item => {
            const subject = item.querySelector('span:first-child').textContent.toLowerCase();
            let progress = 0;
            
            switch (subject) {
                case 'mathematics':
                    progress = Math.min(100, (userData.mathProgress || 0) * 10);
                    break;
                case 'science':
                    progress = Math.min(100, (userData.scienceProgress || 0) * 10);
                    break;
                case 'english':
                    progress = Math.min(100, (userData.englishProgress || 0) * 10);
                    break;
            }
            
            const progressFill = item.querySelector('.progress-fill');
            const progressText = item.querySelector('span:last-child');
            
            if (progressFill) {
                progressFill.style.width = `${progress}%`;
            }
            if (progressText) {
                progressText.textContent = `${progress}%`;
            }
        });
    }

    function calculateLevel(userData) {
        const xp = userData.xp || 0;
        let level = 1;
        let requiredForNext = 100;
        let xpIntoLevel = xp;

        while (xpIntoLevel >= requiredForNext) {
            xpIntoLevel -= requiredForNext;
            level += 1;
            requiredForNext = Math.round(requiredForNext * 1.2 + 20);
        }

        const xpToNext = requiredForNext - xpIntoLevel;
        const progress = Math.min(100, (xpIntoLevel / requiredForNext) * 100);

        return {
            xp,
            level,
            xpIntoLevel,
            requiredForNext,
            xpToNext,
            progress,
            nextLevel: level + 1
        };
    }

    function updateXpWidgets(progress) {
        const xpFill = document.getElementById('xpProgressProfile');
        const xpRange = document.getElementById('xpRange');
        const xpLevelLabel = document.getElementById('xpLevelLabel');
        const xpNextLevelLabel = document.getElementById('xpNextLevelLabel');
        const xpPill = document.getElementById('xpPill');
        const xpBadgeHint = document.getElementById('xpBadgeHint');

        if (xpFill) xpFill.style.width = `${progress.progress}%`;
        if (xpRange) xpRange.textContent = `${progress.xpIntoLevel} / ${progress.requiredForNext} XP`;
        if (xpLevelLabel) xpLevelLabel.textContent = `Level ${progress.level}`;
        if (xpNextLevelLabel) xpNextLevelLabel.textContent = `Level ${progress.nextLevel}`;
        if (xpPill) xpPill.textContent = describeTier(progress.level);
        if (xpBadgeHint) xpBadgeHint.textContent = `Next badge: ${nextBadge(progress.level)}`;
    }

    function describeTier(level) {
        if (level >= 10) return 'Legend';
        if (level >= 7) return 'Pro';
        if (level >= 4) return 'Advanced';
        return 'Beginner';
    }

    function nextBadge(level) {
        if (level < 4) return 'Rising Star (Lv 4)';
        if (level < 7) return 'Trailblazer (Lv 7)';
        if (level < 10) return 'Champion (Lv 10)';
        return 'All badges unlocked';
    }

    function updateProfile(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const updatedData = {
            firstName: formData.get('firstName').trim(),
            lastName: formData.get('lastName').trim(),
            email: formData.get('email').trim(),
            grade: formData.get('grade'),
            language: formData.get('language')
        };

        // Validation
        if (!updatedData.firstName || !updatedData.lastName || !updatedData.email) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updatedData.email)) {
            showMessage('Please enter a valid email address', 'error');
            return;
        }

        // Update user data
        const userData = getUserData();
        Object.assign(userData, updatedData);
        
        // Save updated data
        if (localStorage.getItem('edubridge_user')) {
            localStorage.setItem('edubridge_user', JSON.stringify(userData));
        } else {
            sessionStorage.setItem('edubridge_user', JSON.stringify(userData));
        }
        
        // Update display
        loadProfileData(userData);
        
        showMessage('Profile updated successfully!', 'success');
    }

    function changeAvatar() {
        const avatars = ['👤', '👨', '👩', '🧑', '👦', '👧', '👨‍🎓', '👩‍🎓'];
        const currentAvatar = document.getElementById('userAvatar');
        const currentIndex = avatars.indexOf(currentAvatar.textContent);
        const nextIndex = (currentIndex + 1) % avatars.length;
        
        currentAvatar.textContent = avatars[nextIndex];
        
        // Save avatar preference
        const userData = getUserData();
        userData.avatar = avatars[nextIndex];
        
        if (localStorage.getItem('edubridge_user')) {
            localStorage.setItem('edubridge_user', JSON.stringify(userData));
        } else {
            sessionStorage.setItem('edubridge_user', JSON.stringify(userData));
        }
        
        showMessage('Avatar updated!', 'success');
    }

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
            right: 20px;
            padding: 1rem 2rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease;
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
});

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);


