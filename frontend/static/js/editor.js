let currentClassId = null;
let saveTimeout = null;
let classesMap = new Map();

// Initialize editor page
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadClassList();
});

function initializeEventListeners() {
    document.getElementById('create-class-btn').addEventListener('click', createNewClass);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('share-btn').addEventListener('click', showShareModal);
    document.getElementById('copy-btn').addEventListener('click', copyShareUrl);
    document.getElementById('modal-copy-btn').addEventListener('click', copyModalShareUrl);
    initializeEditor();
}

// Load existing classes
async function loadClassList() {
    try {
        const response = await fetch('/api/classes');
        const classes = await response.json();
        
        const classListElement = document.getElementById('class-list');
        classListElement.innerHTML = ''; // Clear existing list
        
        classes.forEach(classItem => {
            classesMap.set(classItem.classroom_id, classItem);
            addClassToList(classItem);
        });
    } catch (error) {
        console.error('Failed to load classes:', error);
    }
}

// Add class to the list
function addClassToList(classItem) {
    const classListElement = document.getElementById('class-list');
    const listItem = document.createElement('li');
    listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
    
    // Format the date for display
    const lastUpdated = new Date(classItem.last_updated).toLocaleString();
    
    listItem.innerHTML = `
        <div class="class-info" onclick="selectClass('${classItem.classroom_id}')">
            <div class="class-name">Class ${classItem.classroom_id.split('-')[1]}</div>
            <small class="text-muted">Last updated: ${lastUpdated}</small>
        </div>
    `;
    classListElement.appendChild(listItem);
}

// Create new class
async function createNewClass() {
    const classId = 'class-' + Date.now();
    const newClass = {
        classroom_id: classId,
        content: '',
        last_updated: new Date().toISOString()
    };
    
    try {
        // Save the new class to the database first
        const response = await fetch(`/api/notes/${classId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: '' })
        });
        
        if (response.ok) {
            classesMap.set(classId, newClass);
            addClassToList(newClass);
            selectClass(classId);
        }
    } catch (error) {
        console.error('Failed to create new class:', error);
    }
}

// Select class
async function selectClass(classId) {
    currentClassId = classId;
    document.getElementById('current-class-title').textContent = `Class: ${classId}`;
    document.getElementById('note-editor').disabled = false;
    document.querySelector('.share-section').style.display = 'block';
    
    try {
        const response = await fetch(`/api/notes/${classId}`);
        const data = await response.json();
        document.getElementById('note-editor').value = data.content || '';
    } catch (error) {
        console.error('Failed to fetch notes:', error);
    }
}

// Initialize editor
function initializeEditor() {
    const editor = document.getElementById('note-editor');
    
    editor.addEventListener('input', () => {
        if (saveTimeout) clearTimeout(saveTimeout);
        document.getElementById('save-status').textContent = 'Typing...';
        
        saveTimeout = setTimeout(async () => {
            if (currentClassId) {
                await updateNotes();
            }
        }, 1000);
    });
}

// Update notes
async function updateNotes() {
    if (!currentClassId) return;
    
    const content = document.getElementById('note-editor').value;
    try {
        const response = await fetch(`/api/notes/${currentClassId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content })
        });
        
        if (response.ok) {
            document.getElementById('save-status').textContent = 'Saved!';
            // Update last modified time in the list
            const classItem = classesMap.get(currentClassId);
            if (classItem) {
                classItem.last_updated = new Date().toISOString();
                await loadClassList(); // Reload the entire list to get fresh data
            }
        }
    } catch (error) {
        console.error('Failed to save:', error);
        document.getElementById('save-status').textContent = 'Failed to save!';
    }
}

// Show share modal
function showShareModal() {
    if (!currentClassId) {
        alert('Please select a class first!');
        return;
    }
    
    const shareUrl = `${window.location.origin}/view/${currentClassId}`;
    document.getElementById('modal-share-url').value = shareUrl;
    
    // Generate QR code
    const qrContainer = document.querySelector('.qr-code-container');
    qrContainer.innerHTML = '';
    QRCode.toCanvas(qrContainer, shareUrl, { width: 200 }, function (error) {
        if (error) console.error(error);
    });
    
    const modal = new bootstrap.Modal(document.getElementById('shareModal'));
    modal.show();
}

// Copy share URL
function copyShareUrl() {
    const shareUrl = document.getElementById('share-url');
    copyToClipboard(shareUrl);
}

// Copy modal share URL
function copyModalShareUrl() {
    const modalShareUrl = document.getElementById('modal-share-url');
    copyToClipboard(modalShareUrl);
}

// Copy to clipboard helper
function copyToClipboard(element) {
    element.select();
    document.execCommand('copy');
    
    const button = element.nextElementSibling;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="bi bi-check"></i> Copied!';
    setTimeout(() => {
        button.innerHTML = originalText;
    }, 2000);
}

// Handle logout
function handleLogout() {
    window.location.href = '/login';
}

function handleError(error) {
    console.error('Error:', error);
    // Show error to user
    alert('An error occurred. Please try again.');
}

async function login() {
    try {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        if (data.status === 'success') {
            window.location.href = '/editor';
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        handleError(error);
    }
} 