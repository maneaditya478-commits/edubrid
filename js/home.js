// Home page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const userData = getUserData();
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }

    // Update user information
    updateUserInfo(userData);
    updateStats(userData);
    loadRecentActivity();

    // Listen for language changes
    document.addEventListener('languageChanged', function(event) {
        updateUserInfo(userData);
        loadRecentActivity();
    });

    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('edubridge_user');
        sessionStorage.removeItem('edubridge_user');
        window.location.href = 'index.html';
    });

    // Voice lesson functionality
    const voiceLessonBtn = document.getElementById('voiceLesson');
    voiceLessonBtn.addEventListener('click', function() {
        startVoiceLesson(userData.language || 'en');
    });

    // Update stats periodically
    setInterval(() => {
        updateStats(getUserData());
    }, 30000); // Update every 30 seconds
});

function getUserData() {
    const userData = localStorage.getItem('edubridge_user') || sessionStorage.getItem('edubridge_user');
    return userData ? JSON.parse(userData) : null;
}

function updateUserInfo(userData) {
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = userData.firstName || 'Student';
    }
    
    // Update welcome message with current language
    const welcomeElement = document.querySelector('[data-translate="home.welcome"]');
    if (welcomeElement && window.languageManager) {
        const translatedText = window.languageManager.translate('home.welcome', { name: userData.firstName || 'Student' });
        welcomeElement.textContent = translatedText;
    }
}

function updateStats(userData) {
    // Update points
    const totalPointsElement = document.getElementById('totalPoints');
    if (totalPointsElement) {
        totalPointsElement.textContent = userData.points || 0;
    }

    // Update badges
    const badgeCountElement = document.getElementById('badgeCount');
    if (badgeCountElement) {
        badgeCountElement.textContent = (userData.badges || []).length;
    }

    // Update lessons completed
    const lessonsCompletedElement = document.getElementById('lessonsCompleted');
    if (lessonsCompletedElement) {
        lessonsCompletedElement.textContent = userData.lessonsCompleted || 0;
    }

    // Update current level and XP widgets
    const currentLevelElement = document.getElementById('currentLevel');
    const progress = calculateLevel(userData);
    if (currentLevelElement) {
        currentLevelElement.textContent = progress.level;
    }
    updateLevelWidgets(progress);
}

function loadRecentActivity() {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;

    const userData = getUserData();
    const activities = userData.activities || [
        {
            type: 'welcome',
            message: 'Welcome to EduBridge!',
            timestamp: Date.now(),
            icon: '🎉'
        }
    ];

    // Add recent activities
    if (userData.lessonsCompleted > 0) {
        activities.unshift({
            type: 'lesson',
            message: `Completed ${userData.lessonsCompleted} lesson(s)`,
            timestamp: Date.now() - 3600000, // 1 hour ago
            icon: '📚'
        });
    }

    if (userData.quizzesTaken > 0) {
        activities.unshift({
            type: 'quiz',
            message: `Took ${userData.quizzesTaken} quiz(es)`,
            timestamp: Date.now() - 7200000, // 2 hours ago
            icon: '🧠'
        });
    }

    if ((userData.badges || []).length > 0) {
        activities.unshift({
            type: 'badge',
            message: `Earned ${(userData.badges || []).length} badge(s)`,
            timestamp: Date.now() - 10800000, // 3 hours ago
            icon: '🏆'
        });
    }

    // Display activities
    activityList.innerHTML = activities.slice(0, 5).map(activity => `
        <div class="activity-item">
            <div class="activity-icon">${activity.icon}</div>
            <div class="activity-content">
                <p>${activity.message}</p>
                <small>${formatTime(activity.timestamp)}</small>
            </div>
        </div>
    `).join('');
}

function startVoiceLesson(language) {
    const userData = getUserData();
    const currentLanguage = language || userData.language || window.languageManager.currentLanguage;
    const lessonText = getLessonText(currentLanguage);
    
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(lessonText);
        utterance.lang = getLanguageCode(currentLanguage);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        
        speechSynthesis.speak(utterance);
        
        // Update user stats
        userData.lessonsCompleted = (userData.lessonsCompleted || 0) + 1;
        userData.points = (userData.points || 0) + 5;
        userData.xp = (userData.xp || 0) + 8;
        if (!userData.badges) userData.badges = [];
        if (!userData.badges.includes('Voice Learner')) {
            userData.badges.push('Voice Learner');
        }
        
        // Save updated data
        if (localStorage.getItem('edubridge_user')) {
            localStorage.setItem('edubridge_user', JSON.stringify(userData));
        } else {
            sessionStorage.setItem('edubridge_user', JSON.stringify(userData));
        }
        
        // Update display
        updateStats(userData);
        loadRecentActivity();
        
        const message = window.languageManager ? 
            window.languageManager.translate('home.voiceLessonStarted', { points: 5 }) : 
            'Voice lesson started! +5 points earned';
        showMessage(message, 'success');
    } else {
        const message = window.languageManager ? 
            window.languageManager.translate('home.voiceNotSupported') : 
            'Voice synthesis not supported in this browser';
        showMessage(message, 'error');
    }
}

function getLessonText(language) {
    const lessons = {
        en: "Welcome to EduBridge! Today we'll learn about basic mathematics. Let's start with counting from one to ten. One, two, three, four, five, six, seven, eight, nine, ten. Great job!",
        hi: "EduBridge में आपका स्वागत है! आज हम बुनियादी गणित के बारे में सीखेंगे। आइए एक से दस तक गिनती से शुरू करते हैं। एक, दो, तीन, चार, पांच, छह, सात, आठ, नौ, दस। बहुत बढ़िया!",
        mr: "EduBridge मध्ये आपले स्वागत आहे! आज आपण मूलभूत गणित शिकू. एक ते दहा मोजणीपासून सुरुवात करूया. एक, दोन, तीन, चार, पाच, सहा, सात, आठ, नऊ, दहा. छान!",
    };
    
    return lessons[language] || lessons.en;
}

function getLanguageCode(language) {
    const codes = {
        en: 'en-US',
        hi: 'hi-IN',
        mr: 'mr-IN'
    };
    
    return codes[language] || 'en-US';
}

function formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) { // Less than 1 minute
        return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
        const minutes = Math.floor(diff / 60000);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diff < 86400000) { // Less than 1 day
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
        const days = Math.floor(diff / 86400000);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
}

// Level + XP helpers reused across pages
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

function updateLevelWidgets(progress) {
    const xpFill = document.getElementById('xpProgressFill');
    const xpToNext = document.getElementById('xpToNext');
    const levelLabel = document.getElementById('levelLabel');
    const nextLevelLabel = document.getElementById('nextLevelLabel');
    const badgeHint = document.getElementById('nextBadgeHint');
    const badgePill = document.getElementById('currentBadge');

    if (xpFill) xpFill.style.width = `${progress.progress}%`;
    if (xpToNext) xpToNext.textContent = `${progress.xpIntoLevel} / ${progress.requiredForNext} XP`;
    if (levelLabel) levelLabel.textContent = `Level ${progress.level}`;
    if (nextLevelLabel) nextLevelLabel.textContent = `Level ${progress.nextLevel}`;
    if (badgePill) badgePill.textContent = describeTier(progress.level);
    if (badgeHint) badgeHint.textContent = `Next badge: ${nextBadge(progress.level)}`;
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
