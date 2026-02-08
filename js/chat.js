// OpenAI API Configuration
// You can set keys in two ways:
// 1) Add a global window.EDUBRIDGE_OPENAI_CONFIG = { apiKey }
// 2) Save JSON in localStorage under "edubridge_openai_config"
const OPENAI_CONFIG = (() => {
    let storedConfig = null;
    try {
        storedConfig = JSON.parse(localStorage.getItem('edubridge_openai_config') || 'null');
    } catch (e) {
        // ignore malformed localStorage values
    }
    const runtimeConfig = typeof window !== 'undefined' ? window.EDUBRIDGE_OPENAI_CONFIG : null;
    const cfg = runtimeConfig || storedConfig || {};
    return {
        apiKey: cfg.apiKey || '',
        useFallback: cfg.useFallback !== undefined ? cfg.useFallback : true
    };
})();

let currentChatId = 'default';
let conversations = {};
let isTyping = false;

// Chat functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const userData = getUserData();
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }

    initializeChat();
    loadChatHistory();
    setupEventListeners();
    setupModal();
});

function getUserData() {
    const userData = localStorage.getItem('edubridge_user') || sessionStorage.getItem('edubridge_user');
    return userData ? JSON.parse(userData) : null;
}

function initializeChat() {
    // Load conversations from localStorage
    const stored = localStorage.getItem('edubridge_chat_conversations');
    if (stored) {
        try {
            conversations = JSON.parse(stored);
        } catch (e) {
            console.error('Failed to load conversations:', e);
            conversations = {};
        }
    }

    // Initialize default conversation if not exists
    if (!conversations[currentChatId]) {
        conversations[currentChatId] = {
            id: currentChatId,
            title: 'New Chat',
            messages: [],
            createdAt: Date.now()
        };
        saveConversations();
    }
}

function setupEventListeners() {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const newChatBtn = document.getElementById('newChatBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const apiConfigBtn = document.getElementById('apiConfigBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // Send message
    sendBtn.addEventListener('click', sendMessage);
    
    // Enter to send, Shift+Enter for new line
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 200) + 'px';
    });

    // New chat
    newChatBtn.addEventListener('click', createNewChat);

    // Clear history
    clearHistoryBtn.addEventListener('click', clearChatHistory);

    // API config
    apiConfigBtn.addEventListener('click', showApiModal);

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('edubridge_user');
            sessionStorage.removeItem('edubridge_user');
            window.location.href = 'index.html';
        });
    }

    // Suggestion chips
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            const suggestion = this.getAttribute('data-suggestion');
            chatInput.value = suggestion;
            chatInput.focus();
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 200) + 'px';
        });
    });
}

function setupModal() {
    const modal = document.getElementById('apiConfigModal');
    const closeBtn = document.getElementById('closeApiModal');
    const saveBtn = document.getElementById('saveApiKeyBtn');
    const cancelBtn = document.getElementById('cancelApiBtn');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const useFallbackCheckbox = document.getElementById('useFallbackCheckbox');

    // Load current config
    apiKeyInput.value = OPENAI_CONFIG.apiKey || '';
    useFallbackCheckbox.checked = OPENAI_CONFIG.useFallback;

    closeBtn.addEventListener('click', hideApiModal);
    cancelBtn.addEventListener('click', hideApiModal);
    
    saveBtn.addEventListener('click', function() {
        const apiKey = apiKeyInput.value.trim();
        const useFallback = useFallbackCheckbox.checked;
        
        const config = {
            apiKey: apiKey,
            useFallback: useFallback
        };
        
        localStorage.setItem('edubridge_openai_config', JSON.stringify(config));
        
        // Update global config
        OPENAI_CONFIG.apiKey = apiKey;
        OPENAI_CONFIG.useFallback = useFallback;
        
        hideApiModal();
        showMessage('API configuration saved!', 'success');
    });

    // Close on backdrop click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            hideApiModal();
        }
    });
}

function showApiModal() {
    const modal = document.getElementById('apiConfigModal');
    modal.classList.add('show');
}

function hideApiModal() {
    const modal = document.getElementById('apiConfigModal');
    modal.classList.remove('show');
}

async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();

    if (!message || isTyping) return;

    // Hide welcome message if visible
    const welcomeMessage = document.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    // Add user message
    addMessage('user', message);
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Save to conversation
    if (!conversations[currentChatId]) {
        conversations[currentChatId] = {
            id: currentChatId,
            title: message.substring(0, 50),
            messages: [],
            createdAt: Date.now()
        };
    }

    conversations[currentChatId].messages.push({
        role: 'user',
        content: message,
        timestamp: Date.now()
    });

    // Update conversation title if it's the first message
    if (conversations[currentChatId].messages.length === 1) {
        conversations[currentChatId].title = message.substring(0, 50);
        updateChatHistory();
    }

    saveConversations();

    // Show typing indicator
    showTypingIndicator();

    // Get AI response
    try {
        const response = await getAIResponse(message);
        hideTypingIndicator();
        addMessage('assistant', response);

        // Save AI response
        conversations[currentChatId].messages.push({
            role: 'assistant',
            content: response,
            timestamp: Date.now()
        });
        saveConversations();
    } catch (error) {
        hideTypingIndicator();
        console.error('Error getting AI response:', error);
        const errorMessage = 'Sorry, I encountered an error. Please try again or check your API configuration.';
        addMessage('assistant', errorMessage);
    }
}

async function getAIResponse(userMessage) {
    // Check if we should use fallback
    if (OPENAI_CONFIG.useFallback || !OPENAI_CONFIG.apiKey) {
        return getFallbackResponse(userMessage);
    }

    // Use OpenAI API
    try {
        const messages = [
            {
                role: 'system',
                content: 'You are a helpful AI tutor for EduBridge, an educational platform for rural students. Provide clear, simple explanations and be encouraging. Respond in a friendly and supportive manner.'
            },
            ...conversations[currentChatId].messages.slice(-10).map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            {
                role: 'user',
                content: userMessage
            }
        ];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: messages,
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI API error:', error);
        // Fallback to rule-based responses on API error
        return getFallbackResponse(userMessage);
    }
}

function getFallbackResponse(userMessage) {
    const message = userMessage.toLowerCase();

    // Educational responses
    if (message.includes('photosynthesis')) {
        return `Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce glucose (sugar) and oxygen. Here's how it works:

1. **Light Absorption**: Plants absorb sunlight through chlorophyll in their leaves.
2. **Water Intake**: Plants absorb water through their roots.
3. **Carbon Dioxide**: Plants take in CO₂ from the air through small openings called stomata.
4. **Process**: Using the energy from sunlight, plants convert water and CO₂ into glucose and oxygen.
5. **Output**: Glucose is used as food for the plant, and oxygen is released into the air.

The chemical equation is: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂

This process is essential for life on Earth as it produces the oxygen we breathe! 🌱`;
    }

    if (message.includes('quadratic') || message.includes('quadratic equation')) {
        return `A quadratic equation is a polynomial equation of degree 2, in the form: ax² + bx + c = 0

**To solve quadratic equations, you can use:**

1. **Factoring**: If the equation factors nicely.
   Example: x² - 5x + 6 = 0 factors to (x-2)(x-3) = 0, so x = 2 or x = 3

2. **Quadratic Formula**: x = (-b ± √(b² - 4ac)) / 2a
   This works for any quadratic equation!

3. **Completing the Square**: Rearrange the equation to create a perfect square.

**Example using the formula:**
For x² + 5x + 6 = 0:
- a = 1, b = 5, c = 6
- x = (-5 ± √(25 - 24)) / 2 = (-5 ± 1) / 2
- So x = -2 or x = -3

Would you like me to help you solve a specific quadratic equation? 📐`;
    }

    if (message.includes('fraction')) {
        return `Fractions represent parts of a whole. They're written as a/b where:
- **Numerator (top)**: How many parts you have
- **Denominator (bottom)**: Total number of equal parts

**Key Concepts:**

1. **Adding/Subtracting**: Need same denominator
   - 1/4 + 1/4 = 2/4 = 1/2
   - 1/2 + 1/4 = 2/4 + 1/4 = 3/4 (convert to common denominator first)

2. **Multiplying**: Multiply numerators and denominators
   - 1/2 × 1/3 = (1×1)/(2×3) = 1/6

3. **Dividing**: Flip the second fraction and multiply
   - 1/2 ÷ 1/3 = 1/2 × 3/1 = 3/2 = 1.5

4. **Simplifying**: Divide both by their greatest common divisor
   - 4/8 = 1/2 (both divisible by 4)

**Visual example**: If you have a pizza cut into 8 slices and eat 3, you've eaten 3/8 of the pizza! 🍕

Want help with a specific fraction problem?`;
    }

    if (message.includes('study') || message.includes('study habit')) {
        return `Here are some effective study habits:

📚 **Create a Study Schedule**
- Set aside specific times each day for studying
- Break study sessions into manageable chunks (25-30 minutes)

🎯 **Set Clear Goals**
- Know what you want to achieve in each study session
- Write down your goals

📝 **Take Good Notes**
- Write key points in your own words
- Use diagrams and visual aids
- Review notes regularly

💪 **Practice Active Learning**
- Don't just read - summarize, question, and teach the material
- Solve practice problems
- Test yourself regularly

🔄 **Review Regularly**
- Review material within 24 hours of learning
- Space out review sessions (spaced repetition)
- Review older material along with new

💤 **Take Breaks**
- Take short breaks every 25-30 minutes
- Get enough sleep (8-9 hours)
- Exercise and eat well

🎯 **Find Your Learning Style**
- Visual: Use diagrams, charts, colors
- Auditory: Read aloud, listen to recordings
- Kinesthetic: Hands-on practice, movement

Remember: Consistency is key! Small daily study sessions are better than cramming. 🌟`;
    }

    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
        return `Hello! 👋 I'm EduBridge AI Assistant, your learning companion. I'm here to help you with your studies, answer questions, explain concepts, and guide you through your learning journey.

What would you like to learn about today? I can help with:
- 📚 Subject explanations
- 🧮 Math problem solving
- 🔬 Science concepts
- 📝 Study tips
- 💡 General questions

Just ask me anything! 😊`;
    }

    if (message.includes('help') || message.includes('what can you do')) {
        return `I'm here to help you learn! Here's what I can do:

📖 **Explain Concepts**: I can explain topics from various subjects like math, science, English, and more.

🧮 **Solve Problems**: I can help you understand how to solve math problems step by step.

📚 **Study Guidance**: I can provide study tips, learning strategies, and help you plan your studies.

💡 **Answer Questions**: Feel free to ask me any academic questions or seek clarification on topics you're learning.

🎯 **Learning Support**: I'm here to support your educational journey at EduBridge!

**To get started:**
- Ask me to explain a concept (e.g., "Explain photosynthesis")
- Ask for help with a problem (e.g., "How do I solve quadratic equations?")
- Request study tips
- Ask any question you have

Remember: I'm here to help you understand and learn, so don't hesitate to ask for clarification or more examples! 🌟`;
    }

    // Default response
    const responses = [
        `I understand you're asking about "${userMessage}". I'm a learning assistant designed to help students like you! 

To provide you with the most accurate and helpful response, I recommend:
- Being specific about what you'd like to learn
- Asking about concepts from subjects like Math, Science, English, etc.
- Requesting step-by-step explanations

Would you like me to explain a specific topic or help you with a particular subject? 📚`,

        `That's an interesting question! As your learning assistant, I'm here to help you understand concepts and solve problems.

Could you provide a bit more detail? For example:
- Which subject is this related to?
- What specific aspect would you like to learn about?
- Do you need help with a particular problem or concept?

I'm ready to help once I understand what you'd like to explore! 💡`,

        `Great question! I'm EduBridge AI Assistant, and I'm designed to help you with your learning.

While I can assist with many topics, I work best when you:
- Ask specific questions about subjects (Math, Science, English, etc.)
- Request explanations of concepts
- Ask for study tips or learning strategies
- Need help understanding course materials

What specific topic or question can I help you with today? 🎓`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
}

function addMessage(role, content) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageGroup = document.createElement('div');
    messageGroup.className = 'message-group';

    const message = document.createElement('div');
    message.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? '👤' : '🤖';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    messageText.textContent = content;

    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    messageTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageContent.appendChild(messageText);
    messageContent.appendChild(messageTime);
    message.appendChild(avatar);
    message.appendChild(messageContent);
    messageGroup.appendChild(message);
    messagesContainer.appendChild(messageGroup);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
    isTyping = true;
    const messagesContainer = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
    isTyping = false;
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function createNewChat() {
    const newChatId = 'chat_' + Date.now();
    currentChatId = newChatId;
    
    conversations[newChatId] = {
        id: newChatId,
        title: 'New Chat',
        messages: [],
        createdAt: Date.now()
    };

    saveConversations();
    loadChatHistory();
    loadChat(currentChatId);
}

function loadChatHistory() {
    const historyContainer = document.getElementById('chatHistory');
    const sortedChats = Object.values(conversations).sort((a, b) => b.createdAt - a.createdAt);

    historyContainer.innerHTML = sortedChats.map(chat => `
        <div class="history-item ${chat.id === currentChatId ? 'active' : ''}" data-chat-id="${chat.id}">
            <span class="history-icon">💬</span>
            <span class="history-title">${chat.title}</span>
        </div>
    `).join('');

    // Add click listeners
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', function() {
            const chatId = this.getAttribute('data-chat-id');
            loadChat(chatId);
        });
    });
}

function updateChatHistory() {
    loadChatHistory();
}

function loadChat(chatId) {
    currentChatId = chatId;
    const chat = conversations[chatId];
    
    if (!chat) return;

    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = '';

    if (chat.messages.length === 0) {
        // Show welcome message if no messages
        const welcomeMessage = document.createElement('div');
        welcomeMessage.className = 'welcome-message';
        welcomeMessage.innerHTML = `
            <div class="welcome-icon">🤖</div>
            <h2>Welcome to EduBridge AI Assistant</h2>
            <p>I'm here to help you with your learning journey. Ask me anything!</p>
        `;
        messagesContainer.appendChild(welcomeMessage);
    } else {
        chat.messages.forEach(msg => {
            addMessage(msg.role, msg.content);
        });
    }

    loadChatHistory();
}

function clearChatHistory() {
    if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
        conversations = {};
        currentChatId = 'default';
        conversations[currentChatId] = {
            id: currentChatId,
            title: 'New Chat',
            messages: [],
            createdAt: Date.now()
        };
        saveConversations();
        loadChatHistory();
        loadChat(currentChatId);
        showMessage('Chat history cleared!', 'success');
    }
}

function saveConversations() {
    localStorage.setItem('edubridge_chat_conversations', JSON.stringify(conversations));
}

function showMessage(message, type) {
    // Remove existing messages
    const existingMessage = document.querySelector('.chat-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.style.cssText = `
        position: fixed;
        top: 80px;
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
    
    messageDiv.textContent = message;
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

