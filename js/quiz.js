// Quiz page functionality
document.addEventListener('DOMContentLoaded', function() {
    const QUIZ_DATA_URL = 'data/quizzes.json';

    const DEFAULT_QUESTIONS = [
        {
            id: 1,
            question: "What is 2 + 3?",
            answer: "5",
            difficulty: "Easy",
            points: 5,
            domain: "math"
        },
        {
            id: 2,
            question: "How many sides does a triangle have?",
            answer: "3",
            difficulty: "Easy",
            points: 5,
            domain: "math"
        },
        {
            id: 3,
            question: "What is the capital of India?",
            answer: "New Delhi",
            difficulty: "Medium",
            points: 7,
            domain: "geography"
        },
        {
            id: 4,
            question: "What do plants need to make food?",
            answer: "Sunlight",
            difficulty: "Easy",
            points: 5,
            domain: "science"
        },
        {
            id: 5,
            question: "What is 10 - 4?",
            answer: "6",
            difficulty: "Easy",
            points: 5,
            domain: "math"
        },
        {
            id: 6,
            question: "What is the largest planet in our solar system?",
            answer: "Jupiter",
            difficulty: "Medium",
            points: 7,
            domain: "science"
        },
        {
            id: 7,
            question: "What is the opposite of 'hot'?",
            answer: "Cold",
            difficulty: "Easy",
            points: 5,
            domain: "english"
        },
        {
            id: 8,
            question: "How many days are in a week?",
            answer: "7",
            difficulty: "Easy",
            points: 5,
            domain: "general"
        },
        {
            id: 9,
            question: "What is 5 × 3?",
            answer: "15",
            difficulty: "Medium",
            points: 7,
            domain: "math"
        },
        {
            id: 10,
            question: "What is the chemical symbol for water?",
            answer: "H2O",
            difficulty: "Hard",
            points: 10,
            domain: "science"
        }
    ];

    // Check if user is logged in
    const userData = getUserData();
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize quiz
    const startQuizBtn = document.getElementById('startQuizBtn');
    const skipBtn = document.getElementById('skipBtn');
    const quizStatus = document.getElementById('quizStatus');
    const voiceCoachBtn = document.getElementById('voiceCoachBtn');
    let questionBank = [];
    let currentQuiz = null;
    let currentQuestionIndex = 0;
    let score = 0;
    let correctAnswers = 0;
    let totalQuestions = 10;
    let voiceCoachRecognition = null;
    let voiceCoachActive = false;
    let autoReadQuestions = false;

    // Load quiz bank from JSON backend
    loadQuestionBank();

    // Update stats display
    updateStatsDisplay(userData);

    // Event listeners
    startQuizBtn.addEventListener('click', startQuiz);
    document.getElementById('submitBtn').addEventListener('click', submitAnswer);
    document.getElementById('voiceAnswerBtn').addEventListener('click', startVoiceInput);
    document.getElementById('retakeBtn').addEventListener('click', startQuiz);
    skipBtn.addEventListener('click', skipQuestion);
    if (voiceCoachBtn) {
        voiceCoachBtn.addEventListener('click', toggleVoiceCoach);
    }

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

    function updateStatsDisplay(userData) {
        const progress = calculateLevel(userData);
        document.getElementById('currentLevel').textContent = progress.level;
        document.getElementById('totalPoints').textContent = userData.points || 0;
        document.getElementById('streak').textContent = userData.studyStreak || 0;
        updateVoiceHint(progress.level);
    }

    async function loadQuestionBank() {
        setStatus('Loading questions...');
        startQuizBtn.disabled = true;

        try {
            const response = await fetch(QUIZ_DATA_URL, { cache: 'no-store' });

            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }

            const payload = await response.json();
            const fetchedQuestions = Array.isArray(payload?.questions) ? payload.questions : Array.isArray(payload) ? payload : [];

            if (!fetchedQuestions.length) {
                throw new Error('No questions returned');
            }

            questionBank = fetchedQuestions;
            totalQuestions = Math.min(10, questionBank.length);
            setStatus(`Ready: ${questionBank.length} questions loaded`);
        } catch (error) {
            questionBank = DEFAULT_QUESTIONS;
            totalQuestions = Math.min(10, questionBank.length);
            setStatus('Using built-in questions (offline mode)');
            showMessage('Could not load quiz data. Using local questions.', 'error');
            console.error('Quiz data load failed:', error);
        } finally {
            startQuizBtn.disabled = false;
        }
    }

    function setStatus(message) {
        if (quizStatus) {
            quizStatus.textContent = message;
        }
    }

    function startQuiz() {
        if (!questionBank.length) {
            showMessage('Questions are still loading. Please try again.', 'error');
            return;
        }

        // Reset quiz state
        currentQuestionIndex = 0;
        score = 0;
        correctAnswers = 0;
        currentQuiz = generateQuiz();

        // Hide start button and show quiz
        startQuizBtn.style.display = 'none';
        document.getElementById('quizCard').style.display = 'block';
        skipBtn.style.display = 'inline-block';
        document.getElementById('quizResults').style.display = 'none';

        // Show first question
        showQuestion();
    }

    function generateQuiz() {
        // Shuffle questions and take first 10
        const source = questionBank.length ? questionBank : DEFAULT_QUESTIONS;
        const shuffled = [...source].sort(() => Math.random() - 0.5);
        const quizSize = Math.min(totalQuestions, shuffled.length);
        return shuffled.slice(0, quizSize);
    }

    function showQuestion() {
        const question = currentQuiz[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

        // Update question display
        document.getElementById('questionText').textContent = question.question;
        document.getElementById('questionDifficulty').textContent = question.difficulty;
        document.getElementById('questionPoints').textContent = `+${question.points} points`;

        // Update progress
        document.getElementById('progressFill').style.width = `${progress}%`;
        document.getElementById('progressText').textContent = `${currentQuestionIndex + 1}/${totalQuestions}`;

        // Clear answer input
        document.getElementById('answerInput').value = '';
        document.getElementById('answerInput').focus();

        speakQuestion(question);
    }

    function submitAnswer() {
        const userAnswer = document.getElementById('answerInput').value.trim();
        const question = currentQuiz[currentQuestionIndex];

        if (!userAnswer) {
            showMessage('Please enter an answer', 'error');
            return;
        }

        // Check if answer is correct (case-insensitive)
        const isCorrect = userAnswer.toLowerCase() === question.answer.toLowerCase();
        
        if (isCorrect) {
            score += question.points;
            correctAnswers++;
            showMessage(`Correct! +${question.points} points`, 'success');
        } else {
            showMessage(`Incorrect. The answer is: ${question.answer}`, 'error');
        }

        // Move to next question
        currentQuestionIndex++;
        
        if (currentQuestionIndex < totalQuestions) {
            setTimeout(() => {
                showQuestion();
            }, 2000);
        } else {
            setTimeout(() => {
                finishQuiz();
            }, 2000);
        }
    }

    function skipQuestion() {
        currentQuestionIndex++;
        
        if (currentQuestionIndex < totalQuestions) {
            showQuestion();
        } else {
            finishQuiz();
        }
    }

    function finishQuiz() {
        // Hide quiz card and show results
        document.getElementById('quizCard').style.display = 'none';
        document.getElementById('skipBtn').style.display = 'none';
        document.getElementById('quizResults').style.display = 'block';

        // Update results
        document.getElementById('finalScore').textContent = score;
        document.getElementById('correctAnswers').textContent = correctAnswers;
        document.getElementById('pointsEarned').textContent = score;

        // Update user data
        const userData = getUserData();
        const xpEarned = Math.max(score, 10); // guarantee some XP even on low scores

        userData.points = (userData.points || 0) + score;
        userData.xp = (userData.xp || 0) + xpEarned;
        userData.quizzesTaken = (userData.quizzesTaken || 0) + 1;
    updateDailyStreak(userData, Date.now());

        // Check for level up based on XP
        const progress = calculateLevel(userData);
        const previousLevel = userData.level || 1;
        userData.level = progress.level;
        if (progress.level > previousLevel) {
            showMessage(`Level up! You're now level ${progress.level}`, 'success');
        }

        // Check for badges
        checkBadges(userData, correctAnswers, xpEarned);

        // Save updated data
        if (localStorage.getItem('edubridge_user')) {
            localStorage.setItem('edubridge_user', JSON.stringify(userData));
        } else {
            sessionStorage.setItem('edubridge_user', JSON.stringify(userData));
        }

        // Update stats display
        updateStatsDisplay(userData);
    }

    function checkBadges(userData, correctAnswers, xpEarned) {
        const badges = userData.badges || [];
        
        // Quiz Master badge
        if (correctAnswers >= 8 && !badges.includes('Quiz Master')) {
            badges.push('Quiz Master');
            showMessage('New badge earned: Quiz Master!', 'success');
        }
        
        // Perfect Score badge
        if (correctAnswers === totalQuestions && !badges.includes('Perfect Score')) {
            badges.push('Perfect Score');
            showMessage('New badge earned: Perfect Score!', 'success');
        }
        
        // Quick Learner badge
        if (userData.quizzesTaken >= 5 && !badges.includes('Quick Learner')) {
            badges.push('Quick Learner');
            showMessage('New badge earned: Quick Learner!', 'success');
        }

        // Level Up badge
        if (userData.level >= 4 && !badges.includes('Level Up')) {
            badges.push('Level Up');
            showMessage('New badge earned: Level Up!', 'success');
        }

        // Streak Master badge
        if (userData.studyStreak >= 7 && !badges.includes('Streak Master')) {
            badges.push('Streak Master');
            showMessage('New badge earned: Streak Master!', 'success');
        }

        // XP Grinder badge
        if (userData.xp >= 500 && !badges.includes('XP Grinder')) {
            badges.push('XP Grinder');
            showMessage('New badge earned: XP Grinder!', 'success');
        }

        // Voice badge
        if (xpEarned > 0 && voiceCoachActive && !badges.includes('Voice Quizzer')) {
            badges.push('Voice Quizzer');
            showMessage('New badge earned: Voice Quizzer!', 'success');
        }

        userData.badges = badges;
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

        const progress = Math.min(100, (xpIntoLevel / requiredForNext) * 100);

        return {
            xp,
            level,
            xpIntoLevel,
            requiredForNext,
            progress,
            nextLevel: level + 1
        };
    }

function updateDailyStreak(userData, activityTimestamp = Date.now()) {
    const today = startOfDay(activityTimestamp);
    const lastStudyAt = userData.lastStudyAt ? startOfDay(userData.lastStudyAt) : null;

    if (lastStudyAt === null) {
        userData.studyStreak = 1;
    } else if (today === lastStudyAt) {
        userData.studyStreak = userData.studyStreak || 1; // same day, keep streak
    } else if (today - lastStudyAt === 86400000) {
        userData.studyStreak = (userData.studyStreak || 0) + 1; // consecutive day
    } else {
        userData.studyStreak = 1; // missed a day, reset streak
    }

    userData.lastStudyAt = activityTimestamp;
    return userData.studyStreak;
}

function startOfDay(timestamp) {
    const d = new Date(timestamp);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

    function speakQuestion(question) {
        if (!autoReadQuestions || !('speechSynthesis' in window)) return;
        const utterance = new SpeechSynthesisUtterance(`${question.question}. Difficulty ${question.difficulty}.`);
        utterance.rate = 0.95;
        utterance.pitch = 1;
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
    }

    function updateVoiceHint(level) {
        const hint = document.getElementById('quizVoiceHint');
        if (!hint) return;
        hint.textContent = level >= 4 
            ? 'Voice unlocked: say “repeat question”, “skip question”, or “answer is ...”'
            : 'Voice tips: say “start quiz” or “answer is ...” to play hands-free';
    }

    function getSpeechLang(user) {
        const lang = (user && user.language) || 'en';
        const map = { en: 'en-US', hi: 'hi-IN', mr: 'mr-IN' };
        return map[lang] || 'en-US';
    }

    function startVoiceInput() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            const user = getUserData();
            
            recognition.lang = getSpeechLang(user);
            recognition.continuous = false;
            recognition.interimResults = false;
            
            recognition.onstart = function() {
                showMessage('Listening... Speak your answer', 'info');
            };
            
            recognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                document.getElementById('answerInput').value = transcript;
            };
            
            recognition.onerror = function(event) {
                showMessage('Voice recognition error. Please try again.', 'error');
            };
            
            recognition.start();
        } else {
            showMessage('Voice recognition not supported in this browser', 'error');
        }
    }

    function toggleVoiceCoach() {
        if (voiceCoachActive) {
            stopVoiceCoach();
            return;
        }

        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            showMessage('Voice recognition not supported in this browser', 'error');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        voiceCoachRecognition = new SpeechRecognition();
        const user = getUserData();
        voiceCoachRecognition.lang = getSpeechLang(user);
        voiceCoachRecognition.continuous = true;
        voiceCoachRecognition.interimResults = false;

        voiceCoachRecognition.onstart = () => {
            voiceCoachActive = true;
            autoReadQuestions = true;
            voiceCoachBtn.textContent = '🛑 Stop Voice Coach';
            showMessage('Voice coach active. Say “start quiz”, “repeat question”, “answer is ...”.', 'info');
        };

        voiceCoachRecognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
            handleVoiceCommand(transcript);
        };

        voiceCoachRecognition.onerror = () => {
            stopVoiceCoach();
            showMessage('Voice coach error. Restarting…', 'error');
        };

        voiceCoachRecognition.onend = () => {
            if (voiceCoachActive) {
                voiceCoachRecognition.start();
            }
        };

        voiceCoachRecognition.start();
    }

    function stopVoiceCoach() {
        voiceCoachActive = false;
        autoReadQuestions = false;
        if (voiceCoachRecognition) {
            voiceCoachRecognition.onend = null;
            voiceCoachRecognition.stop();
        }
        if (voiceCoachBtn) {
            voiceCoachBtn.textContent = '🎧 Voice Coach';
        }
        showMessage('Voice coach stopped.', 'info');
    }

    function handleVoiceCommand(transcript) {
        if (!transcript) return;
        const answerInput = document.getElementById('answerInput');

        if (transcript.includes('start quiz')) {
            startQuiz();
            return;
        }

        if (transcript.includes('repeat question')) {
            if (currentQuiz) {
                speakQuestion(currentQuiz[currentQuestionIndex]);
            }
            return;
        }

        if (transcript.includes('skip question') || transcript.includes('next question')) {
            skipQuestion();
            return;
        }

        if (transcript.includes('submit')) {
            submitAnswer();
            return;
        }

        if (transcript.includes('answer is')) {
            const spokenAnswer = transcript.split('answer is')[1]?.trim();
            if (spokenAnswer) {
                answerInput.value = spokenAnswer;
                submitAnswer();
            }
        }
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


