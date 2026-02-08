// Language Manager for EduBridge
class LanguageManager {
    constructor() {
        this.currentLanguage = this.getStoredLanguage() || 'en';
        this.translations = {};
        this.loadTranslations();
    }

    async loadTranslations() {
        try {
            const languages = ['en', 'hi', 'mr'];
            const promises = languages.map(lang => 
                fetch(`translations/${lang}.json`)
                    .then(response => response.json())
                    .then(data => {
                        this.translations[lang] = data;
                    })
                    .catch(error => {
                        console.error(`Failed to load ${lang} translations:`, error);
                    })
            );
            
            await Promise.all(promises);
            this.applyLanguage(this.currentLanguage);
        } catch (error) {
            console.error('Failed to load translations:', error);
        }
    }

    getStoredLanguage() {
        return localStorage.getItem('edubridge_language') || 'en';
    }

    setLanguage(language) {
        this.currentLanguage = language;
        localStorage.setItem('edubridge_language', language);
        this.applyLanguage(language);
        
        // Update user data if logged in
        const userData = this.getUserData();
        if (userData) {
            userData.language = language;
            if (localStorage.getItem('edubridge_user')) {
                localStorage.setItem('edubridge_user', JSON.stringify(userData));
            } else {
                sessionStorage.setItem('edubridge_user', JSON.stringify(userData));
            }
        }
    }

    getUserData() {
        const userData = localStorage.getItem('edubridge_user') || sessionStorage.getItem('edubridge_user');
        return userData ? JSON.parse(userData) : null;
    }

    translate(key, params = {}) {
        const keys = key.split('.');
        let translation = this.translations[this.currentLanguage];
        
        for (const k of keys) {
            if (translation && translation[k]) {
                translation = translation[k];
            } else {
                // Fallback to English
                translation = this.translations['en'];
                for (const fallbackKey of keys) {
                    if (translation && translation[fallbackKey]) {
                        translation = translation[fallbackKey];
                    } else {
                        return key; // Return key if translation not found
                    }
                }
                break;
            }
        }
        
        // Replace parameters in translation
        if (typeof translation === 'string') {
            Object.keys(params).forEach(param => {
                translation = translation.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
            });
        }
        
        return translation || key;
    }

    applyLanguage(language) {
        this.currentLanguage = language;
        
        // Update all elements with data-translate attribute
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.translate(key);
            
            if (element.tagName === 'INPUT' && element.type === 'text') {
                element.placeholder = translation;
            } else if (element.tagName === 'INPUT' && element.type === 'email') {
                element.placeholder = translation;
            } else if (element.tagName === 'INPUT' && element.type === 'password') {
                element.placeholder = translation;
            } else if (element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else if (element.tagName === 'SELECT') {
                // Handle select options
                const option = element.querySelector(`option[value="${element.value}"]`);
                if (option) {
                    option.textContent = translation;
                }
            } else {
                element.textContent = translation;
            }
        });

        // Update title attributes
        document.querySelectorAll('[data-translate-title]').forEach(element => {
            const key = element.getAttribute('data-translate-title');
            element.title = this.translate(key);
        });

        // Update alt attributes
        document.querySelectorAll('[data-translate-alt]').forEach(element => {
            const key = element.getAttribute('data-translate-alt');
            element.alt = this.translate(key);
        });

        // Update language selector
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.value = language;
        }

        // Update document title
        const pageTitle = this.getPageTitle();
        if (pageTitle) {
            document.title = `${this.translate(pageTitle)} - EduBridge`;
        }

        // Update HTML lang attribute
        document.documentElement.lang = language;

        // Trigger custom event for page-specific updates
        document.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: language, translations: this.translations[language] }
        }));
    }

    getPageTitle() {
        const path = window.location.pathname;
        const pageTitles = {
            '/index.html': 'index.title',
            '/login.html': 'login.title',
            '/register.html': 'register.title',
            '/home.html': 'home.welcome',
            '/quiz.html': 'quiz.title',
            '/notes.html': 'notes.title',
            '/mentor.html': 'mentor.title',
            '/profile.html': 'profile.title'
        };
        
        return pageTitles[path] || 'index.title';
    }

    createLanguageSelector() {
        const selector = document.createElement('select');
        selector.id = 'languageSelect';
        selector.className = 'language-selector';
        selector.innerHTML = `
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="mr">मराठी</option>
        `;
        
        selector.value = this.currentLanguage;
        selector.addEventListener('change', (e) => {
            this.setLanguage(e.target.value);
        });
        
        return selector;
    }

    // Voice synthesis with language support
    speak(text, language = null) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            const lang = language || this.currentLanguage;
            
            // Set language code
            const languageCodes = {
                'en': 'en-US',
                'hi': 'hi-IN',
                'mr': 'mr-IN'
            };
            
            utterance.lang = languageCodes[lang] || 'en-US';
            utterance.rate = 0.8;
            utterance.pitch = 1;
            
            speechSynthesis.speak(utterance);
        }
    }

    // Speech recognition with language support
    listen(language = null) {
        return new Promise((resolve, reject) => {
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                const recognition = new SpeechRecognition();
                
                const lang = language || this.currentLanguage;
                const languageCodes = {
                    'en': 'en-US',
                    'hi': 'hi-IN',
                    'mr': 'mr-IN'
                };
                
                recognition.lang = languageCodes[lang] || 'en-US';
                recognition.continuous = false;
                recognition.interimResults = false;
                
                recognition.onresult = (event) => {
                    resolve(event.results[0][0].transcript);
                };
                
                recognition.onerror = (event) => {
                    reject(event.error);
                };
                
                recognition.start();
            } else {
                reject('Speech recognition not supported');
            }
        });
    }
}

// Initialize language manager
window.languageManager = new LanguageManager();

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Add language selector to header if it doesn't exist
    const header = document.querySelector('.header .container');
    if (header && !document.getElementById('languageSelect')) {
        const nav = header.querySelector('.nav');
        if (nav) {
            const languageSelector = window.languageManager.createLanguageSelector();
            nav.insertBefore(languageSelector, nav.firstChild);
        }
    }
    
    // Apply initial language
    window.languageManager.applyLanguage(window.languageManager.currentLanguage);
});

// Export for use in other scripts
window.t = (key, params) => window.languageManager.translate(key, params);
