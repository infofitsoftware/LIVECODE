let classroomId = window.location.pathname.split('/').pop();
let pollInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    initializeViewer();
});

function initializeViewer() {
    const viewer = document.getElementById('note-viewer');
    
    // Start polling for updates
    pollInterval = setInterval(fetchNotes, 2000);
    
    // Initial fetch
    fetchNotes();
}

async function fetchNotes() {
    try {
        const response = await fetch(`/api/notes/${classroomId}`);
        const data = await response.json();
        
        if (data.content !== undefined) {
            document.getElementById('note-viewer').value = data.content;
            document.getElementById('connection-status').className = 'alert alert-success';
            document.getElementById('connection-status').textContent = 'Connected - Live Updates Active';
        }
    } catch (error) {
        console.error('Failed to fetch notes:', error);
        document.getElementById('connection-status').className = 'alert alert-danger';
        document.getElementById('connection-status').textContent = 'Connection Error - Retrying...';
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (pollInterval) {
        clearInterval(pollInterval);
    }
}); 