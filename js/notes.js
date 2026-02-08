// Notes page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const userData = getUserData();
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize notes
    let notes = loadNotes();
    let currentEditingNote = null;
    let voiceRecognition = null;
    let voiceActive = false;
    let focusedNoteIndex = 0;

    // Event listeners
    document.getElementById('newNoteBtn').addEventListener('click', createNewNote);
    document.getElementById('saveNoteBtn').addEventListener('click', saveNote);
    document.getElementById('shareNoteBtn').addEventListener('click', shareNote);
    document.getElementById('cancelEditBtn').addEventListener('click', cancelEdit);
    document.getElementById('importNoteBtn').addEventListener('click', importNote);
    const syncBtn = document.getElementById('syncNotesBtn');
    const syncStatus = document.getElementById('syncStatus');
    if (syncBtn) {
        syncBtn.addEventListener('click', syncNotesToCloud);
    }
    const voiceBtn = document.getElementById('voiceNotesBtn');
    if (voiceBtn) {
        voiceBtn.addEventListener('click', toggleVoiceGuide);
    }
    
    // Modal event listeners
    document.getElementById('closeShareModal').addEventListener('click', closeShareModal);
    document.getElementById('copyLinkBtn').addEventListener('click', copyShareLink);
    document.getElementById('qrCodeBtn').addEventListener('click', generateQRCode);
    document.getElementById('downloadBtn').addEventListener('click', downloadNote);

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('edubridge_user');
        sessionStorage.removeItem('edubridge_user');
        window.location.href = 'index.html';
    });

    // Check for shared note in URL
    checkForSharedNote();

    // Display notes
    displayNotes();

    function getUserData() {
        const userData = localStorage.getItem('edubridge_user') || sessionStorage.getItem('edubridge_user');
        return userData ? JSON.parse(userData) : null;
    }

    function loadNotes() {
        const userData = getUserData();
        return userData.notes || [];
    }

    function saveNotes(notesArray) {
        const userData = getUserData();
        userData.notes = notesArray;
        userData.notesCreated = notesArray.length;
        
        persistUserData(userData);
    }

    function persistUserData(userData) {
        if (localStorage.getItem('edubridge_user')) {
            localStorage.setItem('edubridge_user', JSON.stringify(userData));
        } else {
            sessionStorage.setItem('edubridge_user', JSON.stringify(userData));
        }
    }

    function createNewNote() {
        currentEditingNote = null;
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        document.getElementById('noteEditor').style.display = 'block';
        document.getElementById('noteTitle').focus();
    }

    function saveNote() {
        const title = document.getElementById('noteTitle').value.trim();
        const content = document.getElementById('noteContent').value.trim();

        if (!title && !content) {
            showMessage('Please enter a title or content', 'error');
            return;
        }

        const note = {
            id: currentEditingNote ? currentEditingNote.id : Date.now().toString(),
            title: title || 'Untitled Note',
            content: content,
            createdAt: currentEditingNote ? currentEditingNote.createdAt : Date.now(),
            updatedAt: Date.now()
        };

        if (currentEditingNote) {
            // Update existing note
            const index = notes.findIndex(n => n.id === currentEditingNote.id);
            if (index !== -1) {
                notes[index] = note;
            }
        } else {
            // Add new note
            notes.unshift(note);
        }

        saveNotes(notes);
        displayNotes();
        cancelEdit();
        showMessage('Note saved successfully!', 'success');
    }

    function shareNote() {
        const title = document.getElementById('noteTitle').value.trim();
        const content = document.getElementById('noteContent').value.trim();

        if (!title && !content) {
            showMessage('Please enter a title or content to share', 'error');
            return;
        }

        const note = {
            id: 'temp',
            title: title || 'Untitled Note',
            content: content,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        showShareModal(note);
    }

    function cancelEdit() {
        currentEditingNote = null;
        document.getElementById('noteEditor').style.display = 'none';
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
    }

    function displayNotes() {
        const notesList = document.getElementById('notesList');
        
        if (notes.length === 0) {
            notesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <h3>No notes yet</h3>
                    <p>Create your first note to get started!</p>
                    <button class="btn btn-primary" onclick="document.getElementById('newNoteBtn').click()">Create Note</button>
                </div>
            `;
            return;
        }

        notesList.innerHTML = notes.map(note => `
            <div class="note-card" data-note-id="${note.id}">
                <div class="note-header">
                    <div>
                        <div class="note-title">${note.title}</div>
                        <div class="note-date">${formatDate(note.updatedAt)}</div>
                    </div>
                </div>
                <div class="note-content">${note.content}</div>
                <div class="note-actions">
                    <button class="btn btn-secondary" onclick="editNote('${note.id}')">Edit</button>
                    <button class="btn btn-secondary" onclick="shareNoteById('${note.id}')">Share</button>
                    <button class="btn btn-primary" onclick="deleteNote('${note.id}')">Delete</button>
                </div>
            </div>
        `).join('');

        // reset focus to the first note after render
        focusedNoteIndex = 0;
    }

    function editNote(noteId) {
        const note = notes.find(n => n.id === noteId);
        if (note) {
            currentEditingNote = note;
            document.getElementById('noteTitle').value = note.title;
            document.getElementById('noteContent').value = note.content;
            document.getElementById('noteEditor').style.display = 'block';
            document.getElementById('noteTitle').focus();
        }
    }

    function deleteNote(noteId) {
        if (confirm('Are you sure you want to delete this note?')) {
            notes = notes.filter(n => n.id !== noteId);
            saveNotes(notes);
            displayNotes();
            showMessage('Note deleted successfully!', 'success');
        }
    }

    function shareNoteById(noteId) {
        const note = notes.find(n => n.id === noteId);
        if (note) {
            showShareModal(note);
        }
    }

    function showShareModal(note) {
        const modal = document.getElementById('shareModal');
        modal.classList.add('show');
        
        // Store current note for sharing
        modal.dataset.currentNote = JSON.stringify(note);
    }

    function closeShareModal() {
        const modal = document.getElementById('shareModal');
        modal.classList.remove('show');
        document.getElementById('shareLink').style.display = 'none';
    }

    function copyShareLink() {
        const modal = document.getElementById('shareModal');
        const note = JSON.parse(modal.dataset.currentNote);
        const shareLink = generateShareLink(note);
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareLink).then(() => {
                showMessage('Share link copied to clipboard!', 'success');
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = shareLink;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showMessage('Share link copied to clipboard!', 'success');
        }
        
        // Show the link input
        document.getElementById('shareLink').style.display = 'block';
        document.getElementById('shareLinkInput').value = shareLink;
    }

    function generateQRCode() {
        const modal = document.getElementById('shareModal');
        const note = JSON.parse(modal.dataset.currentNote);
        const shareLink = generateShareLink(note);
        
        // Open QR code generator in new tab
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareLink)}`;
        window.open(qrUrl, '_blank');
        
        showMessage('QR code opened in new tab!', 'success');
    }

    function downloadNote() {
        const modal = document.getElementById('shareModal');
        const note = JSON.parse(modal.dataset.currentNote);
        
        const content = `Title: ${note.title}\n\n${note.content}`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showMessage('Note downloaded successfully!', 'success');
    }

    function generateShareLink(note) {
        const noteData = {
            title: note.title,
            content: note.content
        };
        
        const encodedData = btoa(JSON.stringify(noteData));
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?shared_note=${encodedData}`;
    }

    function checkForSharedNote() {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedNoteData = urlParams.get('shared_note');
        
        if (sharedNoteData) {
            try {
                const noteData = JSON.parse(atob(sharedNoteData));
                const note = {
                    id: Date.now().toString(),
                    title: noteData.title,
                    content: noteData.content,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };
                
                notes.unshift(note);
                saveNotes(notes);
                displayNotes();
                
                showMessage(`Imported shared note: ${note.title}`, 'success');
                
                // Clean URL
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            } catch (error) {
                showMessage('Invalid shared note data', 'error');
            }
        }
    }

    function importNote() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt';
        
        input.onchange = function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const content = e.target.result;
                    const lines = content.split('\n');
                    const title = lines[0].replace('Title: ', '') || 'Imported Note';
                    const noteContent = lines.slice(2).join('\n');
                    
                    const note = {
                        id: Date.now().toString(),
                        title: title,
                        content: noteContent,
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    };
                    
                    notes.unshift(note);
                    saveNotes(notes);
                    displayNotes();
                    
                    showMessage(`Imported note: ${note.title}`, 'success');
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }

    function syncNotesToCloud() {
        if (!syncStatus) return;

        const userData = getUserData();
        const lastSync = new Date().toISOString();

        // Simulate cloud sync payload
        const payload = {
            userId: userData.username || userData.email || 'guest',
            notesCount: notes.length,
            notesPreview: notes.slice(0, 3).map(n => ({ id: n.id, title: n.title })),
            lastUpdatedAt: notes[0]?.updatedAt || null,
            syncedAt: lastSync
        };

        try {
            localStorage.setItem('edubridge_notes_cloud_backup', JSON.stringify(payload));
            userData.notesLastSyncedAt = lastSync;
            persistUserData(userData);

            syncStatus.textContent = 'Last synced: just now';
            showMessage('Notes synced to cloud backup (device storage).', 'success');
        } catch (error) {
            console.error('Sync failed:', error);
            showMessage('Failed to sync notes. Please try again.', 'error');
        }
    }

    function formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
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

    function toggleVoiceGuide() {
        if (voiceActive) {
            stopVoiceGuide();
            return;
        }

        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            showMessage('Voice recognition not supported in this browser', 'error');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        voiceRecognition = new SpeechRecognition();
        voiceRecognition.lang = 'en-US';
        voiceRecognition.continuous = true;
        voiceRecognition.interimResults = false;

        voiceRecognition.onstart = () => {
            voiceActive = true;
            updateVoiceStatus('Voice guide listening. Say: "new note", "read note", "next", "save note", "delete note", "sync notes".');
            document.getElementById('voiceNotesBtn').textContent = '🛑 Stop Voice';
        };

        voiceRecognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
            handleVoiceCommand(transcript);
        };

        voiceRecognition.onerror = () => {
            stopVoiceGuide();
            showMessage('Voice guide error. Restarting…', 'error');
        };

        voiceRecognition.onend = () => {
            if (voiceActive) voiceRecognition.start();
        };

        voiceRecognition.start();
    }

    function stopVoiceGuide() {
        voiceActive = false;
        if (voiceRecognition) {
            voiceRecognition.onend = null;
            voiceRecognition.stop();
        }
        updateVoiceStatus('Voice guide off.');
        const voiceBtn = document.getElementById('voiceNotesBtn');
        if (voiceBtn) voiceBtn.textContent = '🎙️ Voice Guide';
    }

    function handleVoiceCommand(command) {
        if (!command) return;

        if (command.includes('new note')) {
            createNewNote();
            speak('Starting a new note. You can dictate after the beep.');
            startDictationToContent();
            return;
        }

        if (command.includes('save note')) {
            saveNote();
            speak('Note saved.');
            return;
        }

        if (command.includes('delete note')) {
            if (notes[focusedNoteIndex]) {
                deleteNote(notes[focusedNoteIndex].id);
                speak('Note deleted.');
            }
            return;
        }

        if (command.includes('sync notes')) {
            syncNotesToCloud();
            speak('Syncing notes.');
            return;
        }

        if (command.includes('share note')) {
            if (notes[focusedNoteIndex]) {
                shareNoteById(notes[focusedNoteIndex].id);
                speak('Opened share options.');
            }
            return;
        }

        if (command.includes('next')) {
            moveFocus(1);
            return;
        }

        if (command.includes('previous') || command.includes('back')) {
            moveFocus(-1);
            return;
        }

        if (command.includes('read note')) {
            readFocusedNote();
            return;
        }

        if (command.includes('edit note')) {
            if (notes[focusedNoteIndex]) {
                editNote(notes[focusedNoteIndex].id);
                speak('Editing note.');
            }
            return;
        }
    }

    function moveFocus(delta) {
        if (!notes.length) return;
        focusedNoteIndex = (focusedNoteIndex + delta + notes.length) % notes.length;
        const card = document.querySelector(`[data-note-id="${notes[focusedNoteIndex].id}"]`);
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('active-note');
            setTimeout(() => card.classList.remove('active-note'), 1200);
        }
        readFocusedNote();
    }

    function readFocusedNote() {
        if (!('speechSynthesis' in window)) return;
        if (!notes[focusedNoteIndex]) return;
        const note = notes[focusedNoteIndex];
        speak(`Title: ${note.title}. ${note.content}`);
    }

    function speak(text) {
        if (!('speechSynthesis' in window)) return;
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        speechSynthesis.speak(utterance);
    }

    function startDictationToContent() {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const dictation = new SpeechRecognition();
        dictation.lang = 'en-US';
        dictation.continuous = false;
        dictation.interimResults = false;
        dictation.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const contentArea = document.getElementById('noteContent');
            contentArea.value = `${contentArea.value} ${transcript}`.trim();
        };
        dictation.start();
    }

    function updateVoiceStatus(text) {
        const status = document.getElementById('voiceStatus');
        if (status) status.textContent = text;
    }

    // Make functions globally available
    window.editNote = editNote;
    window.deleteNote = deleteNote;
    window.shareNoteById = shareNoteById;
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


