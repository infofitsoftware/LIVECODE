document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            window.location.href = '/editor';
        } else {
            alert('Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed. Please try again.');
    }
}); 