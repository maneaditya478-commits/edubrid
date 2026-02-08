// Simple front-end demo for Group Study Room

document.addEventListener('DOMContentLoaded', () => {
    let user = getUserData();
    // If not logged in, use a simple guest user so the page still works
    if (!user) {
        user = { firstName: 'Guest' };
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('edubridge_user');
            sessionStorage.removeItem('edubridge_user');
            window.location.href = 'index.html';
        });
    }

    const roomNameInput = document.getElementById('roomName');
    const roomSubjectSelect = document.getElementById('roomSubject');
    const createRoomBtn = document.getElementById('createRoomBtn');
    const currentRoomBox = document.getElementById('currentRoomBox');
    const currentRoomName = document.getElementById('currentRoomName');
    const currentRoomSubject = document.getElementById('currentRoomSubject');
    const currentRoomCode = document.getElementById('currentRoomCode');
    const notesArea = document.getElementById('notesArea');
    const saveNotesBtn = document.getElementById('saveNotesBtn');
    const shareNotesBtn = document.getElementById('shareNotesBtn');
    const shareLinkInput = document.getElementById('shareLink');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const qrCanvas = document.getElementById('qrCanvas');
    const participantsList = document.getElementById('participantsList');
    const participantCount = document.getElementById('participantCount');
    const chatBox = document.getElementById('chatBox');
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');

    const NOTES_KEY = 'edubridge_group_notes';
    let qrInstance = null;
    let currentRoom = null;

    // Load saved notes
    const savedNotes = localStorage.getItem(NOTES_KEY);
    if (savedNotes && notesArea) {
        notesArea.value = savedNotes;
    }

    // Load shared notes from URL (if present)
    const params = new URLSearchParams(window.location.search);
    const sharedNotes = params.get('notes');
    if (sharedNotes && notesArea) {
        try {
            notesArea.value = decodeURIComponent(sharedNotes);
            showToast('Loaded notes from shared link');
        } catch (e) {
            // ignore decoding errors
        }
    }

    if (saveNotesBtn) {
        saveNotesBtn.addEventListener('click', () => {
            localStorage.setItem(NOTES_KEY, notesArea.value || '');
            showToast('Notes saved on this device');
        });
    }

    if (shareNotesBtn && notesArea) {
        shareNotesBtn.addEventListener('click', () => {
            const text = notesArea.value || '';
            const baseUrl = window.location.origin + window.location.pathname;
            const url = `${baseUrl}?notes=${encodeURIComponent(text)}`;

            if (shareLinkInput) {
                shareLinkInput.value = url;
            }

            if (window.QRious && qrCanvas) {
                if (!qrInstance) {
                    qrInstance = new QRious({
                        element: qrCanvas,
                        size: 140,
                        value: url
                    });
                } else {
                    qrInstance.value = url;
                }
            }

            showToast('Share link and QR updated');
        });
    }

    if (copyLinkBtn && shareLinkInput) {
        copyLinkBtn.addEventListener('click', () => {
            const value = shareLinkInput.value;
            if (!value) {
                showToast('Generate a link first');
                return;
            }

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(value).then(() => {
                    showToast('Link copied to clipboard');
                }).catch(() => {
                    fallbackCopy();
                });
            } else {
                fallbackCopy();
            }

            function fallbackCopy() {
                shareLinkInput.select();
                document.execCommand('copy');
                showToast('Link copied to clipboard');
            }
        });
    }

    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', () => {
            const name = (roomNameInput.value || '').trim() || 'Study Room';
            const subject = roomSubjectSelect.value || 'General';
            const code = generateCode(name, user.firstName || 'EDU');

            currentRoom = { name, subject, code };
            if (currentRoomBox) currentRoomBox.style.display = 'block';
            currentRoomName.textContent = name;
            currentRoomSubject.textContent = subject;
            currentRoomCode.textContent = code;

            populateParticipants(user);
            addSystemMessage(`Room "${name}" created. Share code ${code} with friends (demo only).`);
        });
    }

    if (sendChatBtn && chatInput) {
        const send = () => {
            const text = chatInput.value.trim();
            if (!text) return;
            addChatMessage(user.firstName || 'You', text);
            chatInput.value = '';
        };

        sendChatBtn.addEventListener('click', send);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                send();
            }
        });
    }

    // Initial demo content
    populateParticipants(user, false);
    addSystemMessage('Welcome to the group study room demo!');

    function getUserData() {
        const data = localStorage.getItem('edubridge_user') || sessionStorage.getItem('edubridge_user');
        return data ? JSON.parse(data) : null;
    }

    function populateParticipants(user, isHost = false) {
        if (!participantsList) return;
        const meRole = isHost ? 'Host' : 'Student';
        const demo = [
            { name: user.firstName || 'You', role: meRole },
            { name: 'Aarav', role: 'Student' },
            { name: 'Sita', role: 'Student' }
        ];

        participantsList.innerHTML = demo.map(p => `
            <li>
                <div class="avatar-circle-sm">${p.name.charAt(0).toUpperCase()}</div>
                <span>${p.name}</span>
                <span class="role-pill">${p.role}</span>
            </li>
        `).join('');

        if (participantCount) {
            participantCount.textContent = demo.length;
        }
    }

    function addChatMessage(sender, text) {
        if (!chatBox) return;
        const time = new Date();
        const msg = document.createElement('div');
        msg.className = 'chat-message';
        msg.innerHTML = `
            <div class="chat-meta">${sender} • ${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}</div>
            <div class="chat-text">${text}</div>
        `;
        chatBox.appendChild(msg);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function addSystemMessage(text) {
        addChatMessage('System', text);
    }

    function generateCode(name, seed) {
        const base = (name + seed).toUpperCase().replace(/[^A-Z0-9]/g, '');
        return (base.slice(0, 3) || 'EDU') + '-' + Math.floor(100 + Math.random() * 900);
    }

    function showToast(message) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const div = document.createElement('div');
        div.className = 'toast';
        div.textContent = message;
        div.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 0.8rem 1.5rem;
            background: #22c55e;
            color: white;
            border-radius: 8px;
            font-weight: 600;
            z-index: 1000;
        `;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 2500);
    }
});


