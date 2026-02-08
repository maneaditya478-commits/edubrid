// Mentor page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const userData = getUserData();
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize mentorship
    let mentorshipRequests = loadMentorshipRequests();
    const mentorsCatalog = [
        {
            id: 'mentor-rajesh',
            name: 'Dr. Rajesh Kumar',
            subject: 'Mathematics',
            avatar: '👨‍🏫',
            nextSlots: ['10:00', '14:00', '19:00']
        },
        {
            id: 'mentor-priya',
            name: 'Priya Sharma',
            subject: 'Science',
            avatar: '👩‍🔬',
            nextSlots: ['09:00', '13:30', '18:30']
        },
        {
            id: 'mentor-amit',
            name: 'Amit Patel',
            subject: 'Computer Science',
            avatar: '👨‍💻',
            nextSlots: ['11:00', '16:00', '20:00']
        }
    ];
    let selectedSlot = null;

    // Event listeners
    document.getElementById('mentorForm').addEventListener('submit', submitMentorshipRequest);
    const refreshBtn = document.getElementById('refreshSlotsBtn');
    const bookSlotBtn = document.getElementById('bookSlotBtn');
    const mentorSelect = document.getElementById('mentorSelect');
    if (refreshBtn) refreshBtn.addEventListener('click', renderAvailabilityCalendar);
    if (bookSlotBtn) bookSlotBtn.addEventListener('click', attachSlotToForm);
    if (mentorSelect) mentorSelect.addEventListener('change', renderAvailabilityCalendar);
    
    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('edubridge_user');
        sessionStorage.removeItem('edubridge_user');
        window.location.href = 'index.html';
    });

    // Display mentorship requests
    displayMentorshipRequests();
    populateMentorSelect();
    renderAvailabilityCalendar();

    function getUserData() {
        const userData = localStorage.getItem('edubridge_user') || sessionStorage.getItem('edubridge_user');
        return userData ? JSON.parse(userData) : null;
    }

    function loadMentorshipRequests() {
        const userData = getUserData();
        return userData.mentorshipRequests || [];
    }

    function saveMentorshipRequests(requests) {
        const userData = getUserData();
        userData.mentorshipRequests = requests;
        
        if (localStorage.getItem('edubridge_user')) {
            localStorage.setItem('edubridge_user', JSON.stringify(userData));
        } else {
            sessionStorage.setItem('edubridge_user', JSON.stringify(userData));
        }
    }

    function submitMentorshipRequest(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const requestData = {
            id: Date.now().toString(),
            studentName: formData.get('studentName').trim(),
            grade: formData.get('grade'),
            subject: formData.get('subject'),
            phone: formData.get('phone').trim(),
            message: formData.get('message').trim(),
            preferredTime: formData.get('preferredTime'),
            slot: selectedSlot,
            status: 'pending',
            submittedAt: Date.now()
        };

        // Validation
        if (!requestData.studentName || !requestData.grade || !requestData.subject || !requestData.message) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }

        // Add request to list
        mentorshipRequests.unshift(requestData);
        saveMentorshipRequests(mentorshipRequests);
        
        // Reset form
        e.target.reset();
        
        // Update display
        displayMentorshipRequests();
        
        showMessage('Mentorship request submitted successfully!', 'success');
    }

    function attachSlotToForm() {
        if (!selectedSlot) {
            showMessage('Please pick a slot from the calendar first.', 'error');
            return;
        }
        const preferredTime = document.getElementById('preferredTime');
        if (preferredTime) {
            if (selectedSlot.time.includes('09') || selectedSlot.time.includes('10') || selectedSlot.time.includes('11')) {
                preferredTime.value = 'morning';
            } else if (selectedSlot.time.includes('12') || selectedSlot.time.includes('13') || selectedSlot.time.includes('14') || selectedSlot.time.includes('15')) {
                preferredTime.value = 'afternoon';
            } else {
                preferredTime.value = 'evening';
            }
        }
        const selectedSlotText = document.getElementById('selectedSlot');
        if (selectedSlotText) {
            selectedSlotText.textContent = `Selected ${selectedSlot.dayLabel} at ${selectedSlot.time} with ${selectedSlot.mentorName}`;
        }
        showMessage('Slot attached to the request form.', 'success');
    }

    function displayMentorshipRequests() {
        const requestsList = document.getElementById('requestsList');
        
        if (mentorshipRequests.length === 0) {
            requestsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🤝</div>
                    <h3>No mentorship requests yet</h3>
                    <p>Submit your first request to get started!</p>
                </div>
            `;
            return;
        }

        requestsList.innerHTML = mentorshipRequests.map(request => `
            <div class="request-item">
                <div class="request-header">
                    <div class="request-subject">${request.subject}</div>
                    <div class="request-status ${request.status}">${request.status}</div>
                </div>
                <div class="request-details">
                    <p><strong>Grade:</strong> ${request.grade}</p>
                    <p><strong>Message:</strong> ${request.message}</p>
                    ${request.phone ? `<p><strong>Phone:</strong> ${request.phone}</p>` : ''}
                    ${request.preferredTime ? `<p><strong>Preferred Time:</strong> ${request.preferredTime}</p>` : ''}
                    ${request.slot ? `<p><strong>Slot:</strong> ${request.slot.dayLabel} at ${request.slot.time} with ${request.slot.mentorName}</p>` : ''}
                    <p><strong>Submitted:</strong> ${formatDate(request.submittedAt)}</p>
                </div>
                <div class="request-actions">
                    ${request.status === 'pending' ? `
                        <button class="btn btn-secondary" onclick="cancelRequest('${request.id}')">Cancel</button>
                    ` : ''}
                    ${request.status === 'approved' ? `
                        <button class="btn btn-primary" onclick="contactMentor('${request.id}')">Contact Mentor</button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    function populateMentorSelect() {
        const select = document.getElementById('mentorSelect');
        if (!select) return;
        select.innerHTML = mentorsCatalog.map(m => `<option value="${m.id}">${m.name} • ${m.subject}</option>`).join('');
    }

    function renderAvailabilityCalendar() {
        const grid = document.getElementById('availabilityGrid');
        const select = document.getElementById('mentorSelect');
        if (!grid || !select) return;

        const mentorId = select.value || mentorsCatalog[0].id;
        const mentor = mentorsCatalog.find(m => m.id === mentorId) || mentorsCatalog[0];
        const today = new Date();
        const days = Array.from({ length: 7 }).map((_, index) => {
            const date = new Date(today);
            date.setDate(today.getDate() + index);
            return {
                date,
                label: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
            };
        });

        grid.innerHTML = days.map(day => `
            <div class="availability-day">
                <div class="day-label">${day.label}</div>
                <div class="slot-row">
                    ${mentor.nextSlots.map(time => `
                        <button class="slot-btn" data-time="${time}" data-day="${day.label}" data-mentor="${mentor.name}">
                            ${time}
                        </button>
                    `).join('')}
                </div>
            </div>
        `).join('');

        const slots = grid.querySelectorAll('.slot-btn');
        slots.forEach(btn => {
            btn.addEventListener('click', () => selectSlot(btn));
        });
    }

    function selectSlot(button) {
        const grid = document.getElementById('availabilityGrid');
        grid.querySelectorAll('.slot-btn').forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        selectedSlot = {
            time: button.dataset.time,
            dayLabel: button.dataset.day,
            mentorName: button.dataset.mentor
        };

        const selectedSlotText = document.getElementById('selectedSlot');
        if (selectedSlotText) {
            selectedSlotText.textContent = `Selected ${selectedSlot.dayLabel} at ${selectedSlot.time} with ${selectedSlot.mentorName}`;
        }
    }

    function cancelRequest(requestId) {
        if (confirm('Are you sure you want to cancel this request?')) {
            mentorshipRequests = mentorshipRequests.filter(r => r.id !== requestId);
            saveMentorshipRequests(mentorshipRequests);
            displayMentorshipRequests();
            showMessage('Request cancelled successfully!', 'success');
        }
    }

    function contactMentor(requestId) {
        const request = mentorshipRequests.find(r => r.id === requestId);
        if (request) {
            // Simulate mentor contact
            showMessage('Mentor contact information will be sent to your email!', 'success');
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

    // Make functions globally available
    window.cancelRequest = cancelRequest;
    window.contactMentor = contactMentor;
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


